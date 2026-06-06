# PROGRESS.md — Huddles Build Status

Status tracker for the build. Legend: ✅ done · 🟡 partial · ⬜ not started.
Model: **live GPS location on a map** (not tap-to-move zones — see the MODEL UPDATE
banners in `PROJECT.md` / `HUDDLE_LOGIC.md` / `TECHNICAL_PLAN.md`).

> **Big picture.** Backend pivoted to **real-time GPS + radius proximity** and is live on
> `huddles-5eq44`: `presence` holds `lat`/`lng`/`has_fix`; movement is
> `heartbeatLocation(lat,lng)`; proximity is haversine `≤ PROXIMITY_RADIUS_METERS` (100 m
> demo); no `zone` table. **Part 1 (location + proximity) reducers are implemented and
> verified on maincloud.** Open: **Part 2 huddle engine** (cluster nearby users → state
> machine). **Part 2 huddle engine is now implemented** — distance clustering
> (union-find within `PROXIMITY_RADIUS_METERS`) → `candidate→active→cooling→ended`,
> warmth + scoring, with cluster↔huddle matching by membership overlap — and verified
> on maincloud (huddles form, activate, warm, score, and cool/end). The **client is
> rebuilt to the GPS model** (`src/App.tsx` +
> `src/LiveMap.tsx`): browser geolocation streams `heartbeatLocation`, and live users
> render on a react-leaflet map; `tsc`/`vite build` clean and verified live on maincloud.

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
- **Part 2 huddle engine (verified on maincloud):** `runHuddleEngine(roomId)` clusters
  fresh located users by distance (deterministic union-find within
  `PROXIMITY_RADIUS_METERS`), matches each cluster to a live huddle by Jaccard membership
  overlap, and drives `candidate → active (after dwell) → cooling → ended`, recomputing the
  huddle centroid each tick, warming active huddles + scoring members, and decaying warmth.
  `huddleTick` (per-room), `expireStalePresence` (stale → re-run), `decayHuddles` implemented.
  CLI test: two co-located users → huddle activates, `warmth`/`warmth_points`/`huddles_joined`
  tick up, then cools/ends when they go stale.
- **Spec docs + conventions** — `PROJECT`/`HUDDLE_LOGIC`/`TECHNICAL_PLAN`/`WORK_SPLIT`/
  `CLAUDE`/`AGENTS` carry the live-GPS MODEL UPDATE; `TECHNICAL_PLAN` has an authoritative
  "Data Model (live GPS)" section.

## In progress / blocked 🟡

- **`src/HuddleMap.tsx`** — leftover penguin component, no longer imported (the live map is
  the new `src/LiveMap.tsx`). Harmless; delete when convenient. (`Profile.tsx` is still
  imported as a leftover but the new `App.tsx` does not use it either.)

## To do ⬜

### Backend — Part 2 huddle engine (`spacetimedb/src/index.ts`) ✅ DONE
- ✅ `runHuddleEngine(roomId)` — clusters fresh users (deterministic union-find within
  `PROXIMITY_RADIUS_METERS`), matches each cluster to a live huddle by Jaccard membership
  overlap, and runs candidate → active → cooling → ended; sets huddle centroid lat/lng,
  warms + scores active huddles.
- ✅ `huddleTick` (drives engine per room), `expireStalePresence` (stale → re-run engine →
  cool), `decayHuddles` (warmth decay). Verified live on maincloud.

### Frontend — client rebuild (`src/App.tsx` + `src/LiveMap.tsx`) ✅ DONE
- ✅ Join screen → `joinRoom` (name + room code, default `demo`).
- ✅ **Geolocation:** `navigator.geolocation.watchPosition` → throttled (~2s)
  `heartbeatLocation(lat,lng)`; falls back to a jittered demo location if GPS is denied.
- ✅ **Live map** (`LiveMap.tsx`, react-leaflet dark): a marker per active user with a
  fresh fix (own marker highlighted) + huddle warmth glows at their centroids.
- ✅ Subscribe (via `useTable`) + room-scoped client filtering; status panel shows
  location state (locating / live / demo) and nearby count.
- ✅ Event feed (newest first) + scoreboard (own row highlighted).
- ✅ "Wave at people nearby" → `pingNearby`.
- 🟡 Huddle warmth/markers render whatever the engine writes — empty until Part 2 lands.
- Verified: `tsc -b` + `vite build` clean; live browser client streams GPS and appears on
  the map on maincloud.

### Demo & polish
- ⬜ Bot mode (simulated movers calling `heartbeatLocation`).
- ✅ Two-client end-to-end (both share a location → huddle forms/warms/cools): verified via
  CLI + the live browser client (forming → activated → cooling → ended cycles in the feed).
- ⬜ Purge remaining zone/tap-to-move prose from the spec docs (banners cover it for now);
  update README (still says "quickstart-chat").

---

## Definition of Done

Two clients join the same room and share their live location · both appear on the map ·
when they're within the radius a candidate → active huddle forms · the huddle warms (live)
· event feed + scoreboard update · moving apart cools then ends it.
