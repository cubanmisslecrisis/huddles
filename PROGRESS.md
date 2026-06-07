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
- **Part 2 huddle engine:** `runHuddleEngine(roomId)` clusters fresh located users by
  distance (deterministic union-find) with **hysteresis** (join `≤ PROXIMITY_RADIUS_METERS`,
  keep an already-grouped pair to `STAY_RADIUS_METERS`), matches each cluster to a live huddle
  by Jaccard membership overlap (member sets computed once per run), and drives
  `candidate → active (after dwell) → cooling → ended` with a **candidate grace** so a one-tick
  GPS bounce doesn't reset dwell — recomputing the centroid each tick, warming + scoring active
  huddles, and decaying warmth. **Single clock:** the 1s `huddleTick` is the only caller of the
  engine; `heartbeatLocation`/`leaveRoom`/disconnect just write `presence`. `expireStalePresence`
  (5s, active→stale) and `decayHuddles` (10s) are scheduled. The base loop was verified on
  maincloud (two co-located users → activate → warm/score → cool/end); the single-clock +
  hysteresis + grace refinement type-checks and is **pending re-publish + live re-verify**.
- **Spec docs + conventions** — `PROJECT`/`HUDDLE_LOGIC`/`TECHNICAL_PLAN`/`WORK_SPLIT`/
  `CLAUDE`/`AGENTS` carry the live-GPS MODEL UPDATE; `TECHNICAL_PLAN` has an authoritative
  "Data Model (live GPS)" section.

## In progress / blocked 🟡

- **Dead files removed** — `HuddleMap.tsx/.css`, `Profile.tsx/.css`, `App.css`, and the old
  `LiveMap.tsx` (react-map-gl) are deleted; `react-map-gl`/`leaflet`/`react-leaflet`/
  `qrcode.react` uninstalled. The map is now the raw-`mapbox-gl` mobile shell (see below).

## To do ⬜

### Backend — Part 2 huddle engine (`spacetimedb/src/index.ts`) ✅ DONE
- ✅ `runHuddleEngine(roomId)` — clusters fresh users (deterministic union-find) with
  hysteresis (join `≤ PROXIMITY_RADIUS_METERS`, stay `≤ STAY_RADIUS_METERS`), matches each
  cluster to a live huddle by Jaccard overlap (member sets memoized per run), and runs
  candidate → active → cooling → ended (with candidate grace); sets huddle centroid lat/lng,
  warms + scores active huddles.
- ✅ `huddleTick` (1s — the single engine clock), `expireStalePresence` (5s, flips
  active→stale; no engine re-run), `decayHuddles` (10s, warmth decay). Base loop verified live
  on maincloud; single-clock/hysteresis/grace refinement pending re-verify.

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
- ✅ **Demo bots + huddle-driven heatmap** (`bot` table + scheduled `botTick` in
  `spacetimedb/src/index.ts`). Auto-spawns in the `demo` room once a real user has a fix
  (anchored to that user's location, NYC fallback comes free via the client): `BOT_GROUP_COUNT`
  **group** clusters (3 members holding a **triangle formation** around a center that **wanders
  organically** — a non-circular meander, never a ring — so the huddle moves and its heat
  spreads/trails while staying member-shaped) + 6 **wanderer** bots (solo, no heat). Bots write only `presence`
  (engine clusters them with **no** special-casing); `botTick` config-refreshes the fleet on a
  publish; despawns when no real user has been seen within the stale window (heat **not** wiped).
- ✅ **Heat is huddle-driven and member-shaped (not circular).** Heat is generated **only** by
  `active` huddles — each tick `addHeat` deposits at the **centroid** (hot middle) and at **each
  member's position** (corners), so a huddle's heat is its footprint: a rounded triangle for 3,
  hottest in the center; a lone heartbeat/solo bot makes none. Cells (~45 m,
  `HEAT_CELL_DEGREES=0.0004`) accumulate (cap `HEAT_MAX=40`), **slow-fade** (`×0.97`/10s, ~4-min
  half-life), **never bulk-cleared**. **Client (`useMapboxMap`):** a single **steady** heatmap
  layer (tight render radius so the shape resolves) — **no pulsing** (the heatmap never animates).
  (Bots walking in perfect circles previously made ring-shaped heat — fixed: groups now hold a
  formation and wander via incommensurate sines, which moves/spreads the heat without a ring.)
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
- ✅ `heat_cell(roomId, cellKey, lat, lng, weight, lastUpdatedAt)` — ~45 m grid activity
  accumulation (index `by_room_cell`). Written **only** by the huddle engine via `addHeat`
  (each `active` huddle deposits at its **centroid + each member position** each tick → a
  member-shaped footprint, clamped to `HEAT_MAX`); `decayHuddles` **slow-fades** it (`×0.97`/10s,
  deletes fully-cold cells), never bulk-cleared. `lastUpdatedAt` (refreshed on deposit, preserved
  by decay) drives the client's live-vs-history pulse. Heat tracks huddles, not raw movement.
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
- ✅ **The heatmap itself pulsates** (not the avatar) — the real `activity-heat` (`heat_cell`)
  layer's opacity throbs via an rAF `heatmapPulse` (`useMapboxMap`), so the pulse comes from
  the heatmap. (An earlier separate warmth-driven `huddle-heat` overlay was removed as
  redundant once the heatmap itself pulses.)
- ✅ **Avatar markers** — non-ended `huddle` w/ 2+ active members → one merged cluster (now a
  **member-photo stack** + count badge over the warmth glow/pulse); solo people are photo discs.
  Verified live in-browser (real "Huddle of 2" + 440 m friend distance).
- ✅ **Visual-polish pass synced from the skeleton's newer cut:** **claymorphism** (`shadow-clay`
  utility + `clay` Button variant + `lib/ui-styles.ts`, no base-ui added) and **demo avatar
  photos** (`photoFor`/`Avatar` over a `public/avatars/` pool, hashed color as ring + fallback;
  current user = `ME_PHOTO`). `tsc -b` + `vite build` clean.
- ✅ **Lenses** (bottom nav island): **Map** (Around-you / Recommended / Active-huddles sheet),
  **Activity** (real `event` feed — `type`→icon/color, `message`, relative time),
  **Friends** (`presence` list w/ status + distance + Ping), **Wrapped** (weekly huddle stats — top friend, hours together, fun facts).
  Profile lives behind the top-right avatar (real stats + Leave room).
- ✅ **Status chips** ("N friends nearby" / "N huddles forming"), **filter chips**, draggable
  **bottom sheet** (peek/half/full), **Search** (real, client-side over friends + huddles +
  places → recenters the map), **Ping** sheet → `pingNearby()`.
- ✅ **Save a place on the map:** `saved_place` table + `savePlace(placeName, note?)` reducer; users can tag locations (café, restaurant, etc.) with an optional note.
- ✅ **Huddle Wrapped / weekly stats:** "Wrapped" tab shows top friend, hours together, huddles formed, fun facts, squad breakdown. Spotify-Wrapped-style visual design.
- 🟡 **Places domain (static stubs, no backend):** category **emoji pins** (🥐 bakery, 🍺 bar,
  ☕ café, 🍜 restaurant, 🌳 park, 🎵 music — `CATEGORY_META` in `src/lib/places-data.ts`),
  anchored to the user via lat/lng offsets. Tapping a pin opens a detail panel with the place's
  **rating + review count** and a **"friends who've been here"** avatar row (both hard-coded
  stubs). Recommendation cards + category filters retained. **Saved lens dropped.** TODO: real
  `recommendation`/places table; derive friends-visited from ended huddles.
- ⬜ **City exploration %** (needs `visited_cell`).

---

## Definition of Done

Two clients join the same room and share their live location · both appear on the map ·
when they're within the radius a candidate → active huddle forms · the huddle warms (live)
· event feed + scoreboard update · moving apart cools then ends it.
