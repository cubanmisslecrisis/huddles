# PROGRESS.md — Huddles Build Status

Status tracker for the build. Legend: ✅ done · 🟡 partial · ⬜ not started.
Model: **live GPS location on a map** (not tap-to-move zones — see the MODEL UPDATE
banners in `PROJECT.md` / `HUDDLE_LOGIC.md` / `TECHNICAL_PLAN.md`).

> **Big picture.** Backend pivoted to **real-time GPS + radius proximity** and is live on
> `huddles-5eq44`: `presence` holds `lat`/`lng`/`has_fix`; movement is
> `heartbeatLocation(lat,lng)`; proximity is haversine `≤ PROXIMITY_RADIUS_METERS` (100 m
> demo); no `zone` table. **Part 1 (location + proximity) reducers are implemented and
> verified on maincloud.** Open: **Part 2 huddle engine** (cluster nearby users → state
> machine — all stubs) and the **client** (browser geolocation → `heartbeatLocation` + a
> live map). `src/App.tsx` is currently **broken** (penguin/zone hybrid, ~18 tsc errors)
> and must be rebuilt to the GPS model.

---

## Done ✅

- **Tooling / env** — `npm install` done; `npm run dev` works.
- **SpacetimeDB connection** — live as `huddles-5eq44`; `.env.local` + `spacetime.json`
  wired; client connects via `SpacetimeDBProvider` in `main.tsx`.
- **Backend schema (live GPS)** — `spacetimedb/src/index.ts`: tables `user`, `room`,
  `presence` (lat/lng/has_fix), `huddle` (lat/lng/warmth/member_count), `huddle_member`,
  `event`, `score` + 3 scheduled timers (`huddle_tick`/`presence_tick`/`decay_tick`).
  Published (`--delete-data`), `init` schedules the 1s/5s/30s ticks (verified).
- **Part 1 reducers (verified on maincloud):** `joinRoom`, `heartbeatLocation(lat,lng)`,
  `leaveRoom`, `pingNearby`, `onConnect`/`onDisconnect`, plus helpers `distanceMeters`
  (haversine), `freshUsersNear` (radius), `emitEvent`. CLI smoke test passed:
  join → heartbeat (sets lat/lng + has_fix) → ping → feed events all correct.
- **Spec docs + conventions** — `PROJECT`/`HUDDLE_LOGIC`/`TECHNICAL_PLAN`/`WORK_SPLIT`/
  `CLAUDE`/`AGENTS` carry the live-GPS MODEL UPDATE; `TECHNICAL_PLAN` has an authoritative
  "Data Model (live GPS)" section.

## In progress / blocked 🟡

- **Part 2 huddle engine is stubbed** — `runHuddleEngine` / `huddleTick` /
  `expireStalePresence` / `decayHuddles` are still `// TODO`, so huddles don't yet
  form/warm/score and `presence` never goes stale. This is the remaining backend work.
- **`src/HuddleMap.tsx` + `src/Profile.tsx`** — leftover penguin components, no longer
  imported (the live map is the new `src/LiveMap.tsx`). Harmless; delete when convenient.

## To do ⬜

### Backend — Part 2 huddle engine (`spacetimedb/src/index.ts`)
- ⬜ `runHuddleEngine(roomId)` — cluster fresh users (within `PROXIMITY_RADIUS_METERS`) →
  candidate → active → cooling → ended (`HUDDLE_LOGIC.md`); set huddle centroid lat/lng,
  warm + score active huddles.
- ⬜ `huddleTick` (drive engine), `expireStalePresence` (stale → cool), `decayHuddles`
  (warmth decay).

### Frontend — client rebuild (`src/App.tsx` + map)
- ⬜ Join screen → `joinRoom`.
- ⬜ **Geolocation:** `navigator.geolocation.watchPosition` → throttled `heartbeatLocation(lat,lng)`.
- ⬜ **Live map:** plot `presence` markers (live) + `huddle` warmth circles at their centroids.
- ⬜ Subscribe to room-scoped tables; status panel (your huddle: forming/active/cooling).
- ⬜ Event feed (newest first) + scoreboard.
- ⬜ "Ping nearby" button → `pingNearby`.

### Demo & polish
- ⬜ Bot mode (simulated movers calling `heartbeatLocation`).
- ⬜ Two-client end-to-end demo (both share a location → huddle forms/warms/cools).
- ⬜ Purge remaining zone/tap-to-move prose from the spec docs (banners cover it for now);
  update README (still says "quickstart-chat").

---

## Definition of Done

Two clients join the same room and share their live location · both appear on the map ·
when they're within the radius a candidate → active huddle forms · the huddle warms (live)
· event feed + scoreboard update · moving apart cools then ends it.
