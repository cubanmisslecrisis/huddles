# PROGRESS.md — Huddles Build Status

Status tracker for the build. Legend: ✅ done · 🟡 partial · ⬜ not started.
Model: **live GPS location on a map** (not tap-to-move zones — see the MODEL UPDATE
banners in `PROJECT.md` / `HUDDLE_LOGIC.md` / `TECHNICAL_PLAN.md`).

> **Big picture.** Both Part 1 and Part 2 are now implemented and published to
> `huddles-5eq44`. The huddle engine (`runHuddleEngine`) clusters fresh GPS users by
> haversine radius, drives the `candidate → active → cooling → ended` state machine,
> warms huddles on tick, awards score points, and decays warmth over time. Three
> scheduled reducers (1s / 5s / 30s) run automatically. The client (`src/App.tsx`) is
> already wired to the GPS model. **Remaining work: end-to-end smoke test + demo polish.**

---

## Done ✅

- **Tooling / env** — `npm install` done; `npm run dev` works.
- **SpacetimeDB connection** — live as `huddles-5eq44`; `.env.local` + `spacetime.json`
  wired; client connects via `SpacetimeDBProvider` in `main.tsx`.
- **Backend schema (live GPS)** — tables `user`, `room`, `presence` (lat/lng/has_fix),
  `huddle` (lat/lng/warmth/member_count/status), `huddle_member`, `event`, `score` +
  3 scheduled timers (`huddle_tick` / `presence_tick` / `decay_tick`). Published and live.
- **Part 1 reducers (verified on maincloud):** `joinRoom`, `heartbeatLocation(lat,lng)`,
  `leaveRoom`, `pingNearby`, `onConnect`/`onDisconnect`, helpers `distanceMeters`
  (haversine), `freshUsersNear` (radius), `emitEvent`.
- **Part 2 huddle engine (implemented + published):**
  - `buildClusters` — greedy O(n²) proximity clustering of fresh presence rows
  - `runHuddleEngine(ctx, roomId)` — full state machine: candidate → active → cooling → ended;
    member sync (join/depart/refresh); warmth ticks; score points; event feed emissions
  - `huddleTick` (1s scheduled) — drives engine for every active room
  - `expireStalePresence` (5s scheduled) — marks stale users, triggers engine
  - `decayHuddles` (30s scheduled) — decays huddle warmth toward 0
- **Client (`src/App.tsx`)** — GPS model: `joinRoom` form, `watchPosition` → throttled
  `heartbeatLocation`, presence markers, huddle warmth circles, event feed, scoreboard.
- **`src/LiveMap.tsx`** — Leaflet dark map with user dot markers + huddle glow circles.
- **`src/useGeolocation.ts`** — `watchPosition` hook with Midtown NYC fallback.
- **Spec docs + conventions** — all context docs carry the live-GPS MODEL UPDATE.

## To do ⬜

### Demo & smoke test
- ⬜ Two-client end-to-end smoke test: join same room → share location → candidate forms →
  activates after 10s → warmth ticks → separation cools → ends.
- ⬜ Check `spacetime logs huddles-5eq44 -f` for reducer errors after joining.
- ⬜ Bot mode (simulated movers calling `heartbeatLocation` on an interval).

### Polish
- ⬜ Huddle status panel on client (show "forming…" / "active 🔥" / "cooling ❄️" for
  the huddle the current user is in).
- ⬜ Purge leftover zone/tap-to-move prose from spec docs (MODEL UPDATE banners cover it).
- ⬜ Update README (still says "quickstart-chat").
- ⬜ Delete dead files: `src/HuddleMap.tsx`, `src/Profile.tsx`.

---

## Definition of Done

Two clients join the same room and share their live location · both appear on the map ·
when they're within the radius a candidate → active huddle forms · the huddle warms (live)
· event feed + scoreboard update · moving apart cools then ends it.
