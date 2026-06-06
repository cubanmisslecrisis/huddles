# PROGRESS.md — Huddles Build Status

Status tracker for the rebuild toward the spec in `PROJECT.md` / `HUDDLE_LOGIC.md` /
`TECHNICAL_PLAN.md`. Legend: ✅ done · 🟡 partial / starter-only · ⬜ not started.

> **Big picture:** the project scaffold runs and the spec is written, but **no spec
> feature is implemented yet**. The live module is still the chat quickstart and the
> client is the manual "penguin huddle" starter. The work below is the gap to the
> emergent, server-decided huddle model.

---

## Done ✅

- **Tooling / env** — `npm install` complete (Vite 7.3.5 resolves); `npm run dev` works.
- **SpacetimeDB connection** — published to maincloud as `huddles-5eq44`; `.env.local`
  and `spacetime.json` wired; client connects via `SpacetimeDBProvider` in `main.tsx`.
- **Spec docs** — `PROJECT.md` (product), `HUDDLE_LOGIC.md` (state machine, corrected to
  the TS stack), `TECHNICAL_PLAN.md` (architecture/tables/reducers/scheduling, corrected).
- **Conventions** — `CLAUDE.md` + `AGENTS.md` updated with code conventions and pointers
  to the spec docs.

## Partial / starter-only 🟡 (exists, but does NOT match the spec)

- **Module `spacetimedb/src/index.ts`** — still the SpacetimeDB **chat quickstart**
  (`user` + `message`, `set_name` / `send_message`). This is what's published. Must be
  replaced.
- **Client `src/App.tsx` + `src/HuddleMap.tsx`** — a **manual** penguin app where the
  user taps "Start a huddle." Opposite of the spec's server-decided model. Reusable bits:
  React/Vite scaffold, `useTable`/`useReducer` wiring patterns, the leaflet map component
  (adaptable to zone markers), QR/share-link plumbing.
- **Generated bindings `src/module_bindings/`** — describe the penguin
  `player`/`huddle`/`huddle_member` schema, not the spec tables. Will be regenerated.

## To do ⬜ (in TECHNICAL_PLAN priority order)

### Backend — module rewrite (`spacetimedb/src/index.ts`)
- ⬜ Define spec tables: `user`, `room`, `presence`, `zone`, `huddle`, `huddle_member`,
  `event`, `score` (snake_case names; identity-keyed; indexes on `(room_id, zone_id)`).
- ⬜ Tunable constants block (dwell / cooling / warmth / staleness from `HUDDLE_LOGIC.md`).
- ⬜ Scheduled tables + `init` to schedule them: `huddle_tick → updateHuddles`,
  `presence_tick → expireStalePresence`, `decay_tick → decayZones`.
- ⬜ `joinRoom(name, roomCode)` — find/create room, upsert user (`ctx.sender`), seed
  default zones, init score/presence, emit `user_joined`.
- ⬜ `moveToZone(zoneId)` — update presence + `last_seen`, emit `user_moved`, run state
  machine on old + new zones.
- ⬜ `updateHuddles()` — candidate → active → cooling → ended (per pseudocode).
- ⬜ `expireStalePresence()` and `decayZones()`.
- ⬜ `leaveRoom()`; `clientDisconnected` marks presence offline.
- ⬜ (post-MVP) `heartbeatLocation(lat, lng)` for real GPS.
- ⬜ Publish with `--delete-data` (breaking change from chat) + `npm run spacetime:generate`
  to refresh bindings.

### Frontend — client rewrite (`src/`)
- ⬜ Join screen → `joinRoom`.
- ⬜ Zone/map screen (tap-to-move → `moveToZone`); reuse/adapt `HuddleMap.tsx`.
- ⬜ Subscribe to room-scoped tables; render live presence.
- ⬜ Huddle panel (alone / forming / active / cooling + members + warmth).
- ⬜ Event feed (newest first; live via row callbacks).
- ⬜ Scoreboard (warmth points; optionally huddles joined / total time).

### Demo & polish
- ⬜ Bot mode (scheduled `bot_tick` moving bots via `moveToZone`; Spawn/Stop controls).
- ⬜ End-to-end demo verification (two browsers, the `TECHNICAL_PLAN.md` demo script).
- ⬜ Replace remaining penguin-app copy/UI; update README (still says "quickstart-chat").

---

## Definition of Done (from TECHNICAL_PLAN.md)

Two clients join the same room · move between zones · presence updates live · same-zone
pair forms a candidate → active huddle · active huddle warms the zone (live) · event feed
updates live · separation cools/ends the huddle · scoreboard/recap updates.
