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
> on maincloud (huddles form, activate, warm, score, and cool/end). The **client is now the
> mobile social-map shell** (`src/App.tsx` + `src/components/**`, raw `mapbox-gl` light 3D):
> browser geolocation streams `heartbeatLocation`, and live users render as merged/solo
> avatars on the map; `tsc`/`vite build` clean and verified live in-browser on maincloud.

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

- **Dead files removed** — `HuddleMap.tsx/.css`, `Profile.tsx/.css`, `App.css`, and the old
  `LiveMap.tsx` (react-map-gl) are deleted; `react-map-gl`/`leaflet`/`react-leaflet`/
  `qrcode.react` uninstalled. The map is now the raw-`mapbox-gl` mobile shell (see below).

## To do ⬜

### Backend — Part 2 huddle engine (`spacetimedb/src/index.ts`) ✅ DONE
- ✅ `runHuddleEngine(roomId)` — clusters fresh users (deterministic union-find within
  `PROXIMITY_RADIUS_METERS`), matches each cluster to a live huddle by Jaccard membership
  overlap, and runs candidate → active → cooling → ended; sets huddle centroid lat/lng,
  warms + scores active huddles.
- ✅ `huddleTick` (drives engine per room), `expireStalePresence` (stale → re-run engine →
  cool), `decayHuddles` (warmth decay). Verified live on maincloud.

### Frontend — client rebuild (`src/App.tsx`) ✅ DONE
- ✅ Join screen → `joinRoom` (name + room code, default `demo`), re-themed.
- ✅ **Geolocation:** `navigator.geolocation.watchPosition` → throttled (~3s)
  `heartbeatLocation(lat,lng)`; falls back to a jittered demo location if GPS is denied.
- ✅ **Live map** — now the **raw `mapbox-gl` mobile shell** with merged/solo avatar markers
  + a server-driven activity heatmap (see "Mobile social-map shell" below).
- ✅ Subscribe (via `useTable`) + room-scoped client filtering.
- ✅ Event feed (Activity lens) + scoreboard (Rankings lens, own row highlighted).
- ✅ "Wave at people nearby" → `pingNearby` (Ping sheet + per-friend Ping buttons).
- Verified: `tsc -b` + `vite build` clean; live browser client streams GPS and renders the
  full mobile map on maincloud (real merged huddle + friend distance observed in-browser).

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

### Frontend (`src/`) — Mobile social-map shell ✅
Ported the `suryanewa/huddle` design skeleton's **mobile shell** in (Tailwind v4 + the
skeleton's oklch brand tokens + Geist/Archivo fonts), dropping its desktop shell, and wired
it to our live SpacetimeDB data. Stack stays Vite + React 18; `@base-ui/react`/`shadcn` were
**not** adopted (Button/Input/Checkbox hand-rolled; flows use a ported `BottomSheet`). `@/`
path alias added. Structure: `src/components/{map,shell,panels,lens,flows,ui}` + `src/hooks`
+ `src/lib`.
- ✅ **Map = raw `mapbox-gl`** (no react-map-gl) with **light 3D `standard`** basemap
  (`lightPreset:'day'`, pitch 60) + **React-portal markers** (`useMapboxMap` /
  `useMapMarkerDefs`). `VITE_MAPBOX_TOKEN`; graceful placeholder if unset.
- ✅ **Heatmap layer** from `heat_cell` (warm ramp on the light basemap, weight-driven,
  refreshed each heartbeat; large radius so cells **fuse** into continuous blobs rather than
  isolated circles). Decay unchanged server-side (`×0.6`/10 s, cap 16).
- ✅ **Pulsing "huddle of heat"** — the **heatmap *under* a huddle pulsates** (not the
  avatar): a second additive `huddle-heat-layer` (`useMapboxMap`) sourced from each merged
  huddle's centroid, its per-point weight throbbed via `requestAnimationFrame`
  (`weight = warmth·k`, `k≈0.5..1.2`, ~2.8 s) so amplitude ∝ `warmth` and it stacks onto any
  existing heat. Bigger magnitude + radius for visibility.
- ✅ **Avatar markers are static** — non-ended `huddle` w/ 2+ active members → one merged
  cluster bubble (count, fixed warm color, no pulse); solo people are `Avatar` discs (hashed
  color + initial — no photos). Verified live in-browser (real "Huddle of 2" + 440 m friend
  distance).
- ✅ **Lenses** (bottom nav island): **Map** (Around-you / Recommended / Active-huddles sheet),
  **Activity** (real `event` feed — `type`→icon/color, `message`, relative time),
  **Friends** (`presence` list w/ status + distance + Ping), **Rankings** (`score` leaderboard).
  Profile lives behind the top-right avatar (real stats + Leave room).
- ✅ **Status chips** ("N friends nearby" / "N huddles forming"), **filter chips**, draggable
  **bottom sheet** (peek/half/full), **Search** (real, client-side over friends + huddles +
  places → recenters the map), **Ping** sheet → `pingNearby()`.
- 🟡 **Places domain (static stubs, no backend):** recommendation cards + place pins
  (anchored to the user via lat/lng offsets in `src/lib/places-data.ts`), **Add-to-map** sheet
  (no-op), category filters. **Saved lens dropped.** TODO: real `recommendation`/places table.
- ⬜ **Wrapped / retrospective screen** — who/where/when/how-long from ended huddles.
- ⬜ **City exploration %** (needs `visited_cell`).

---

## Definition of Done

Two clients join the same room and share their live location · both appear on the map ·
when they're within the radius a candidate → active huddle forms · the huddle warms (live)
· event feed + scoreboard update · moving apart cools then ends it.
