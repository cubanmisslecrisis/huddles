# TECHNICAL_PLAN.md — Huddles Implementation Plan

## Goal

Build a hackathon-ready realtime app where users move around shared zones, form huddles, warm zones, and see the shared world update live.

The technical goal is to make SpacetimeDB the authoritative realtime simulation engine. See `PROJECT.md` for product framing and `HUDDLE_LOGIC.md` for the huddle state machine.

---

## High-Level Architecture

```text
Web Client (React + Vite, mobile-first)
  - join room
  - tap zone to move
  - render presence/huddles/zones/events
  - subscribe to SpacetimeDB tables
  - call reducers for actions

SpacetimeDB module (TypeScript)
  - canonical world state
  - users, rooms, presence, zones, huddles, members, scores, events
  - reducers for movement
  - scheduled reducers for huddle state transitions / decay / staleness
  - subscriptions for live UI updates
```

The client owns no business logic beyond input and rendering.

---

## Stack (this repo)

```text
Module:   SpacetimeDB TypeScript module  (spacetimedb/src/index.ts)
Client:   React 18 + Vite (mobile web)   (src/)
Bindings: generated TS                    (src/module_bindings/)
Server:   maincloud (db: huddles-5eq44)
Map:      react-leaflet (already a dependency, used by HuddleMap.tsx)
Demo:     fake zones (tap-to-move) instead of real GPS; optional bot mode
```

Mobile web (not Expo/React Native) — fastest to deploy and demo in a browser. Real GPS / native is a post-MVP extension.

---

## Repo Structure (actual)

```text
/
  PROJECT.md
  HUDDLE_LOGIC.md
  TECHNICAL_PLAN.md
  CLAUDE.md                  # conventions + pointers to these docs
  spacetime.json             # dev config (module-path, server, run cmd)
  .env.local                 # VITE_SPACETIMEDB_DB_NAME / _HOST

  spacetimedb/
    src/index.ts             # the entire module: tables, reducers, lifecycle, scheduled
    package.json

  src/                        # React client
    main.tsx                  # SpacetimeDBProvider + connection builder
    App.tsx                   # screens
    HuddleMap.tsx             # leaflet map
    module_bindings/          # generated — DO NOT hand-edit
    *.test.tsx
```

> Note: the structure suggested in early drafts (`spacetime/src/lib.rs`, `spacetime.toml`, separate `app/`) was Rust-oriented and does not apply. This project is a single TypeScript module plus a Vite client.

---

## Data Model

Conceptual tables below; implement with the SpacetimeDB TypeScript `t.` builder. Conventions: `name` is snake_case, `ctx.db` accessor is camelCase, all tables `public: true` so the client can subscribe, identity columns use `t.identity()`.

### user

Represents a participant. Keyed by Identity (`ctx.sender`) — no client-supplied id.

```text
user {
  identity      t.identity().primaryKey()   // = ctx.sender
  name          t.string()
  created_at    t.timestamp()
}
```

- MVP has no auth; the connection's Identity is the user id.
- `name` is set on join.

### room

A multiplayer session.

```text
room {
  id            t.u64().primaryKey().autoInc()
  code          t.string().unique()         // default "demo"
  name          t.string()
  created_at    t.timestamp()
}
```

Rooms isolate concurrent demos so state does not collide.

### presence

Where a user currently is.

```text
presence {
  identity      t.identity().primaryKey()   // = ctx.sender
  room_id       t.u64()
  zone_id       t.u64()
  last_seen     t.timestamp()
  status        t.string()                   // active | stale | offline
  // index: (room_id, zone_id) for "fresh users in a zone"
}
```

### zone

A place on the fake map.

```text
zone {
  id            t.u64().primaryKey().autoInc()
  room_id       t.u64()
  name          t.string()                   // Cafe, Library, Park, Dorm, Gym
  warmth        t.f64()
  last_warmed_at t.timestamp()
}
```

### huddle

Canonical huddle state.

```text
huddle {
  id                  t.u64().primaryKey().autoInc()
  room_id             t.u64()
  zone_id             t.u64()
  status              t.string()             // candidate | active | cooling | ended
  candidate_started_at t.timestamp()
  activated_at        t.option(t.timestamp())
  cooling_started_at  t.option(t.timestamp())
  ended_at            t.option(t.timestamp())
  warmth_generated    t.f64()
  last_warmth_tick_at t.timestamp()
  // index: (room_id, zone_id) to find the live huddle for a zone
}
```

### huddle_member

Huddle participants (keyed by Identity).

```text
huddle_member {
  id                  t.u64().primaryKey().autoInc()
  huddle_id           t.u64()                // index
  identity            t.identity()
  joined_at           t.timestamp()
  last_seen_in_huddle t.timestamp()
  left_at             t.option(t.timestamp())
}
```

### event

The live event feed — a persisted public table (so the feed renders history).

```text
event {
  id          t.u64().primaryKey().autoInc()
  room_id     t.u64()                         // index
  type        t.string()
  message     t.string()
  huddle_id   t.option(t.u64())
  zone_id     t.option(t.u64())
  created_at  t.timestamp()
}
```

### score

Per-user, per-room score.

```text
score {
  identity         t.identity()
  room_id          t.u64()
  warmth_points    t.u32()
  huddles_joined   t.u32()
  total_huddle_time t.u64()                   // micros or seconds
  // index: (room_id, identity)
}
```

---

## Reducers

Identity always comes from `ctx.sender`; time always from `ctx.timestamp`. Clients never pass a `user_id`.

### joinRoom(name, roomCode)

Called when a user enters the demo.

- find or create room by `code`
- create/update `user` for `ctx.sender` (set `name`)
- seed default zones for the room if missing (Cafe, Library, Park, Dorm, Gym)
- initialize `score` row if missing
- initialize `presence` (room_id set, zone_id null/lobby, last_seen = now)
- emit `user_joined` event

### moveToZone(zoneId)

Primary demo movement reducer.

- resolve user/room from `ctx.sender`'s presence
- update presence `zone_id`, refresh `last_seen = ctx.timestamp`, status = active
- emit `user_moved` event
- run huddle update logic for the affected zones (old + new)

### heartbeatLocation(lat, lng)

Optional real-GPS reducer (post-MVP).

- convert lat/lng → zone or map cell
- update presence + refresh `last_seen`
- run huddle update logic

`moveToZone()` is sufficient for MVP.

### updateHuddles() — the state machine

Runs the candidate→active→cooling→ended machine (see `HUDDLE_LOGIC.md` pseudocode):

- find fresh users by zone
- create candidate huddles (2+ fresh users, no existing non-ended huddle for the zone)
- activate after dwell threshold
- keep active huddles alive; generate warmth + points on warmth ticks
- move to cooling when fresh count drops; reactivate if users return
- end after cooling threshold; emit recap; finalize scores
- emit events for visible transitions

Invoked from: the scheduled tick (primary), and optionally inline from `moveToZone` for instant feedback.

### expireStalePresence()

- find presence rows where `now - last_seen > PRESENCE_STALE_SECONDS`
- mark stale/offline; mark left in active huddle membership
- move affected huddles to cooling if needed

### decayZones()

- reduce each zone's `warmth` by `DECAY_AMOUNT` per interval; clamp at 0
- optionally emit `zone_cooled` events

### leaveRoom()

- mark `ctx.sender`'s presence offline; mark left from any huddle; re-evaluate that zone.

---

## Scheduling (the key technical decision)

Time-based transitions run on **scheduled reducers**, the idiomatic SpacetimeDB
mechanism — not client-driven `tick()` calls. Define scheduled tables that target the
reducers:

```text
huddle_tick   → updateHuddles        every ~1–2s
presence_tick → expireStalePresence   every ~5s
decay_tick    → decayZones            every ~30s   (optional for first demo)
```

Schedule them from the `init` lifecycle reducer (repeating interval). This makes the
world advance on its own even when nobody is moving, and keeps all timing deterministic
via `ctx.timestamp`. `moveToZone` may additionally call `updateHuddles` synchronously so
forming/cooling feels instant, but correctness never depends on a client tick.

---

## Client Subscriptions

Subscribe to room-scoped data. Prefer typed query builders; raw SQL equivalents:

```sql
SELECT * FROM presence      WHERE room_id = ?
SELECT * FROM huddle        WHERE room_id = ? AND status != 'ended'
SELECT * FROM huddle_member WHERE huddle_id IN (room's huddles)
SELECT * FROM zone          WHERE room_id = ?
SELECT * FROM event         WHERE room_id = ?     -- render newest first client-side
SELECT * FROM score         WHERE room_id = ?
```

Render with `useTable(...)` and row callbacks (`onInsert`/`onUpdate`) for live updates and feed animation.

---

## Frontend Screens

### Join Screen

```text
Name
Room Code  (default: demo)
Join → call joinRoom(name, roomCode), then route to map
```

### Map / Zone Screen

Display fake zones (Cafe, Library, Park, Dorm, Gym). Each zone card shows:

- zone name
- warmth value
- users currently present
- huddle state if any

Tapping a zone calls `moveToZone(zoneId)`. (`HuddleMap.tsx` already renders a leaflet map and can be reused/adapted for zone markers.)

### Huddle Panel

Shows the current user's zone and huddle state:

```text
Current Zone: Cafe
Status: Huddle forming      // alone | forming | active | cooling
Members: Kevin, Maya
Warmth: +15
```

### Event Feed

Newest events first:

```text
Kevin joined the room
Kevin moved to Cafe
Maya moved to Cafe
Huddle forming at Cafe
🔥 Huddle activated: Kevin + Maya
Cafe warmed +5
Maya left Cafe
Huddle cooling
Huddle ended after 42 seconds
```

### Scoreboard

Rank users by warmth points (MVP), optionally huddles joined / total huddle time.

---

## Bot Mode (optional, for demo reliability)

- create bot `user`/`presence` rows in the same room
- a scheduled `bot_tick` moves bots to random zones every few seconds via the same `moveToZone` path (seed randomness with `ctx.random`)
- bots use no special huddle logic
- UI controls: Spawn Bots / Stop Bots

---

## Demo Plan

Two browser windows (or two devices), same room `demo`:

```text
1. Open as Kevin in room demo.
2. Open as Maya in room demo.
3. Kevin taps Cafe.
4. Maya taps Library → no huddle.
5. Maya taps Cafe → both clients show "Huddle forming".
6. Wait ~10s → both show "🔥 Huddle active".
7. Cafe warmth increases; scores tick up; feed updates.
8. Kevin taps Park → huddle cooling.
9. Wait ~10s → huddle ended + recap event.
```

Fallback: spawn bots; let bots form a huddle; a real user joins it.

---

## Implementation Priority

1. Module skeleton: tables + `init` (seed nothing yet) + schedule tables
2. `joinRoom` + seed default zones
3. `moveToZone` + presence
4. Client: join screen, zone screen, subscribe/render presence
5. `updateHuddles`: candidate creation
6. candidate → active (dwell)
7. warmth ticks (zone warmth + scores)
8. event feed
9. cooling → ended + recap
10. scoreboard
11. bot mode
12. real GPS (`heartbeatLocation`) only if time remains

After every schema change: `npm run spacetime:generate` to refresh `src/module_bindings/`.

---

## Definition of Done

- two clients join the same room
- both can move between zones
- presence updates live across clients
- two users in the same zone create a candidate huddle
- candidate becomes active after the dwell threshold
- active huddle warms the zone; zone warmth updates live
- event feed updates live
- huddle cools/ends when users separate
- scoreboard or recap updates

---

## Key Technical Principle

The client never creates or mutates huddles. The only client actions are:

```text
joinRoom
moveToZone
heartbeatLocation   (post-MVP)
leaveRoom
```

All huddle logic lives in SpacetimeDB reducers. This is what makes the project a meaningful SpacetimeDB use case.

---

## Risks & Mitigations

- **Timing / periodic logic** — solved by scheduled reducers (above). Movement reducers
  also call `updateHuddles` for instant feedback. Do not push timing onto the client.
- **Duplicate huddles** — before creating a candidate, check for an existing non-ended
  huddle for `(room_id, zone_id)` via the index.
- **Stale users** — a user who closes the tab triggers `clientDisconnected` (mark offline)
  and/or is caught by `expireStalePresence` via `last_seen`. They must not stay in a
  huddle forever.
- **Overcomplicated scoring** — keep it to warmth points, huddles joined, total time.

---

## Future Technical Extensions (not MVP)

real GPS geohash cells · background location · Bluetooth proximity validation · push
notifications · auth · real friend graph · privacy/fuzzy location · map provider
integration · anti-cheat · analytics.
