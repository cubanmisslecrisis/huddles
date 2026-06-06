# PROGRESS.md — Huddles Build Status

Status tracker for the build. Legend: ✅ done · 🟡 partial · ⬜ not started.
Model: **live GPS location on a map** (not tap-to-move zones — see the MODEL UPDATE
banners in `PROJECT.md` / `HUDDLE_LOGIC.md` / `TECHNICAL_PLAN.md`).

> **Phases.** **Phase 1 — the territorial huddle MVP — is shipped** (everything in
> "Done ✅" below). **Phase 2 north star = "Proof of Hangout"**, a Zenly/Snapmap-style
> social map: a Mapbox map with an activity heatmap, city exploration, avatar merging, a
> recommend/avoid layer, and a Wrapped-style "who you hung out with, where, when, how long"
> retrospective. Phase 2 is **additive and reuses the Phase-1 engine** (an ended huddle is
> already a hangout session; "warmth" becomes heatmap activity intensity). See the new
> "Next phase — Proof of Hangout (planned)" section below, and `PROJECT.md` /
> `TECHNICAL_PLAN.md` for the product + technical detail.

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
- ✅ **Live map** (`LiveMap.tsx`) — now **Mapbox GL** (dark) with merged/solo avatar markers
  + a server-driven activity heatmap. (Originally shipped on react-leaflet; migrated in the
  Phase-2 map slice below.)
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

## Next phase — Proof of Hangout (planned) 🧭

Phase 2 north star (see `PROJECT.md` "North Star v2" and `TECHNICAL_PLAN.md`
"Proof-of-Hangout / Social-Map roadmap"). Room-scoped for now (global map + friend graph
is a later step). Reuses the Phase-1 proximity engine.

### Backend (`spacetimedb/src/index.ts`)
- ✅ `heat_cell(roomId, cellKey, lat, lng, weight, lastUpdatedAt)` — ~200 m grid activity
  accumulation (index `by_room_cell`); `heartbeatLocation` bumps it via `bumpHeat`
  (clamped to `HEAT_MAX`), `decayHuddles` decays it (drops zeroed cells). Published +
  verified on maincloud (weights accumulate per cell, decay on the 30 s tick).
- ⬜ `visited_cell(identity, roomId, cellKey, firstSeenAt, lastSeenAt, count)` — drives the
  "city explored %" metric.
- ⬜ `recommendation(identity, roomId, lat, lng, placeLabel, sentiment, note, createdAt)`
  + `recommendPlace(...)` reducer; emit `place_recommended` events.
- ⬜ Hangout history = existing **ended `huddle` + `huddle_member`** (no new table); add a
  `wrapped` view/query (per-user: partners, places, durations).

### Frontend (`src/`)
- ✅ Migrated the map react-leaflet → **Mapbox GL** (`mapbox-gl@3` + `react-map-gl@7`,
  `VITE_MAPBOX_TOKEN`); map is the home surface. Graceful placeholder if the token is unset.
- ✅ **Heatmap layer** from `heat_cell` (Mapbox `heatmap` layer, weight-driven).
- ✅ **Avatar merging** — a non-ended `huddle` with 2+ active members renders as ONE merged
  avatar at its centroid; everyone else is a solo avatar (computed in `App.tsx`).
- 🟡 **Mapbox token** — needs a public `pk.*` token in `.env.local` (`VITE_MAPBOX_TOKEN`)
  to render; placeholder shown until then. (An `sk.*` secret token must NOT be used.)
- ⬜ **Recommend/avoid overlay** (toggle) — deferred to the next slice.
- ⬜ **Wrapped / retrospective screen** — who/where/when/how-long from ended huddles.
- ⬜ **City exploration %** (needs `visited_cell`).

---

## Definition of Done

Two clients join the same room and share their live location · both appear on the map ·
when they're within the radius a candidate → active huddle forms · the huddle warms (live)
· event feed + scoreboard update · moving apart cools then ends it.
