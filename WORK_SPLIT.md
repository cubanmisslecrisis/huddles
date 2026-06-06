# WORK_SPLIT.md — Who Builds What

How the Huddles backend rebuild is divided so two people work in parallel without
colliding. Design lives in `HUDDLE_LOGIC.md` / `TECHNICAL_PLAN.md`; status in `PROGRESS.md`.

> **The seam:** the `presence` table. Part 1 *writes* where everyone is; Part 2 *reads*
> that and decides huddles. It's the only thing that crosses between the two tracks.
>
> One-liner: **Part 1 answers "who is near whom right now?"; Part 2 answers "given that,
> what huddles exist, how warm, who scores?"**

---

## Step 0 — Shared first, together (~15 min, blocks everyone)

1. Lock the **table definitions + reducer signatures** in `spacetimedb/src/index.ts`
   (shapes only, empty bodies) — see the data model in `TECHNICAL_PLAN.md`.
2. Publish once (`npm run spacetime:publish`, `--delete-data` — breaking change from the
   chat starter) and run `npm run spacetime:generate`.
3. Now `src/module_bindings/` has real types → both tracks (and any UI work) build against
   them immediately.

Suggested file layout to avoid merge conflicts:

```
spacetimedb/src/
  index.ts       # schema export + lifecycle; imports the below
  tables.ts      # all table defs + constants block      (Part 1 owns)
  presence.ts    # joinRoom / moveToZone / leaveRoom / freshUsersNear / pingNearby  (Part 1)
  huddle.ts      # updateHuddles + scheduled reducers     (Part 2 owns)
```

---

## Part 1 — Location input + proximity

**"Where is everyone, and who's near whom."** Deterministic; no time-based logic.

**Owns tables:** `user`, `room`, `zone`, `presence`, + the shared **constants block**
(proximity radius, staleness).

**Reducers (client-callable):**
- `joinRoom(name, roomCode)` — create/join room by code, seed the 5 zones, init `user`
  keyed by `ctx.sender`, init `presence`/`score`.
- `moveToZone(zoneId)` — set `presence.zone_id`, refresh `last_seen = ctx.timestamp`;
  calls Part 2's `updateHuddles` at the end for instant feedback.
- `leaveRoom()` / `clientDisconnected` — mark presence offline.
- `heartbeatLocation(lat, lng)` *(post-MVP, real GPS)* — map coords → zone/cell, refresh.
- `pingNearby()` — **the radius-ping feature**: find fresh users near the caller and emit
  a ping event to them.

**Reusable primitive:** `freshUsersNear(roomId, zoneId)` — "fresh = `now − last_seen ≤
PRESENCE_STALE_SECONDS`, same zone (or within radius)." Both huddling and the ping
feature call this.

**Output / contract:** the `presence` table. That's all Part 2 needs.

**Build & test in isolation:** move around, inspect `presence` via `spacetime sql` — no
huddle logic required to verify.

---

## Part 2 — Huddling

**"What that proximity means over time."** The state machine + the clock.

**Owns tables:** `huddle`, `huddle_member`, `score`, `event`; writes `zone.warmth`.

**The engine — `updateHuddles(roomId, zoneId)`:** runs `candidate → active → cooling →
ended` (dwell timer, warmth ticks, cooling grace, recap on end) per `HUDDLE_LOGIC.md`
pseudocode. Reads `presence` (via `freshUsersNear`) **read-only** — never writes it.

**Scheduled reducers (the clock):**
- `huddle_tick → updateHuddles` (~1–2s) — forms/cools huddles on time even if nobody moves.
- `presence_tick → expireStalePresence` (~5s).
- `decay_tick → decayZones` (~30s, optional for first demo).

Scheduled tables are registered from `init`.

**Trigger seam:** `moveToZone` calls `updateHuddles` inline (instant); the scheduled tick
calls it for time-based transitions. So `updateHuddles` is a plain exported function.

**Build & test in isolation:** hand-write `presence` rows and assert huddle transitions —
fully independent of Part 1's reducers working.

---

## The Contract (agree, then go)

1. **`presence` row shape** — `identity, room_id, zone_id, last_seen, status`. Frozen at Step 0.
2. **Who writes what** — Part 1 writes `user`/`room`/`zone`(seed)/`presence`; Part 2 writes
   `huddle`/`huddle_member`/`score`/`zone.warmth` + state-transition events. No overlap.
3. **Trigger** — Part 2 exposes `updateHuddles(roomId, zoneId)`; Part 1 calls it from
   `moveToZone`.

---

## Suggested ownership

| Track | Scope | Suggested owner |
|-------|-------|-----------------|
| Part 1 | location input + proximity (`tables.ts`, `presence.ts`) | — |
| Part 2 | huddling engine + scheduling (`huddle.ts`) | Kevin (+ backend helper) |
| (UI) | React client in `src/` — subscribes + renders, calls reducers, never owns logic | strongest React dev |

If a third person takes UI, this becomes the 3-way split; with two backend people, Parts
1 and 2 above are the division.
