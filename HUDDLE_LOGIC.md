# HUDDLE_LOGIC.md — Huddle Rules and State Machine

## Purpose

This document defines the business/game logic for forming, maintaining, scoring, cooling, and ending huddles.

The core rule:

> Clients only report where users are. The server decides whether a huddle exists.

The server is SpacetimeDB reducers operating over shared `presence`, `huddle`, `zone`, and `score` tables. See `TECHNICAL_PLAN.md` for the concrete table/reducer shapes and `PROJECT.md` for product framing.

---

## Core Concept

A **huddle** is created when two or more users stay together in the same place long enough.

A huddle is not instant. It progresses through a state machine:

```text
candidate → active → cooling → ended
```

This prevents accidental or noisy movement from immediately creating or destroying huddles.

---

## State Definitions

### Candidate

A candidate huddle is a possible huddle that is forming.

A candidate huddle starts when:

- 2+ users are in the same room
- those users are in the same zone
- those users have fresh presence updates
- there is no current active/candidate/cooling huddle for that zone

For the MVP:

```text
same zone = close enough
```

For production:

```text
within 50–150 meters = close enough
```

### Active

A candidate becomes active when the users remain together for the dwell threshold.

Hackathon value:

```text
DWELL_THRESHOLD_SECONDS = 10
```

Production value:

```text
DWELL_THRESHOLD_SECONDS = 120–300
```

When a huddle becomes active:

- emit a `huddle_activated` event
- set `activated_at`
- add current members
- begin generating warmth on ticks

### Cooling

An active huddle enters cooling when it may be ending, but should not end immediately.

Cooling starts when:

- fewer than 2 fresh users remain in the zone
- one or more members move away
- one or more members go stale
- the active member count drops below the huddle threshold

Cooling exists because:

- GPS can jitter
- users may briefly move between cells
- demo users may tap wrong places
- brief disconnections should not kill a huddle instantly

Hackathon value:

```text
COOLING_THRESHOLD_SECONDS = 10
```

Production value:

```text
COOLING_THRESHOLD_SECONDS = 60–180
```

If enough users return during cooling, the huddle returns to active (see pseudocode).

### Ended

A huddle ends when:

- it is in cooling
- the cooling period expires
- fewer than 2 users returned before the deadline

When a huddle ends:

- set `ended_at`
- calculate duration
- finalize warmth generated
- update user scores
- emit a recap event

---

## Constants

Use these values for the hackathon demo:

```text
MIN_USERS_FOR_HUDDLE     = 2
DWELL_THRESHOLD_SECONDS  = 10
WARMTH_TICK_SECONDS      = 5
COOLING_THRESHOLD_SECONDS= 10
PRESENCE_STALE_SECONDS   = 15
WARMTH_PER_TICK          = 5
POINTS_PER_TICK          = 5
```

These values are intentionally short so judges can see the full loop during a short demo. Keep them in one module-level constants block so demo↔production tuning is a single edit.

---

## Warmth Logic

Active huddles generate warmth for their zone.

Every warmth tick:

```text
if huddle.status == active:
  zone.warmth          += WARMTH_PER_TICK
  huddle.warmth_generated += WARMTH_PER_TICK
  each active member.score += POINTS_PER_TICK
```

For the hackathon, keep warmth simple.

Optional production formula:

```text
warmth = base_tick * number_of_members * duration_multiplier
```

Avoid overcomplicating scoring in the MVP.

---

## Zone Cooling / Decay

Zones should not stay warm forever. Zone warmth decays over time so the map reflects recent social activity.

Simple decay:

```text
zone.warmth -= DECAY_AMOUNT every DECAY_INTERVAL
zone.warmth  = max(zone.warmth, 0)
```

Hackathon values:

```text
DECAY_INTERVAL_SECONDS = 30
DECAY_AMOUNT           = 1–5
```

Zone decay is optional for the first demo, but useful if the app shows territorial warmth.

---

## Presence Freshness

A user is considered fresh if:

```text
now - presence.last_seen <= PRESENCE_STALE_SECONDS
```

Where `now` is `ctx.timestamp` inside the reducer — never a client-supplied or wall-clock time.

If a user is stale:

- they should not count toward new huddles
- they may be removed from active huddle membership
- any huddle depending on them may enter cooling

For simulated movement, `moveToZone()` refreshes `last_seen`.
For real GPS later, `heartbeatLocation()` refreshes `last_seen`.

---

## Huddle Membership Rules

When a candidate or active huddle exists in a zone:

- fresh users in that zone should be members
- users who leave the zone should get `left_at`
- users who return during cooling may rejoin
- active member count determines whether the huddle stays active

For MVP, huddles are zone-based.

A user should not be in multiple active huddles at the same time.

If a user moves to a new zone:

1. update their presence
2. mark them left from the old huddle if needed
3. evaluate the old zone's huddle
4. evaluate the new zone's huddle

Members are identified by **Identity** (`ctx.sender`), not a client-passed id.

---

## Events

Emit events for important state changes into the persisted `event` table (the feed shows history, so it is a normal public table, not an ephemeral event table).

Suggested event types:

```text
user_joined
user_moved
huddle_forming
huddle_activated
huddle_warmed_zone
huddle_cooling
huddle_ended
zone_cooled
score_updated
bot_moved
```

Example messages:

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

The event feed is important because it makes the realtime state machine visible during the demo.

---

## Main Huddle Update Flow

Conceptual flow:

```text
1. A user moves or sends a heartbeat (moveToZone / heartbeatLocation).
2. Server updates Presence (last_seen = ctx.timestamp).
3. The scheduled update_huddles tick (and/or the movement reducer) runs the state machine.
4. For each zone: check fresh users.
5. If 2+ fresh users are together, create or update a candidate/active huddle.
6. If dwell threshold is met, activate the candidate.
7. If active, generate warmth on tick.
8. Check huddles affected by movement/staleness.
9. Move huddles to cooling or ended when needed.
10. Emit events for visible transitions.
```

The time-based transitions (dwell, warmth tick, cooling expiry, decay, staleness) are
driven by a **scheduled reducer**, not by client-side timers — see "SpacetimeDB
Implementation Notes" below.

---

## Pseudocode

```text
for each room:
  for each zone:
    fresh_users = users in zone where (now - last_seen) <= PRESENCE_STALE_SECONDS

    if fresh_users.count >= MIN_USERS_FOR_HUDDLE:
      huddle = find active/candidate/cooling huddle for this zone

      if no huddle:
        create candidate huddle (candidate_started_at = now)
        add fresh users as members
        emit "Huddle forming" event

      else:
        update huddle members
        update last_seen_in_huddle for fresh users

      if huddle.status == cooling:
        huddle.status = active
        huddle.cooling_started_at = null
        emit "Huddle reactivated" event

      if huddle.status == candidate:
        if now - huddle.candidate_started_at >= DWELL_THRESHOLD_SECONDS:
          huddle.status = active
          huddle.activated_at = now
          emit "Huddle activated" event

      if huddle.status == active:
        if now - huddle.last_warmth_tick_at >= WARMTH_TICK_SECONDS:
          add warmth to zone
          add points to members
          update huddle.warmth_generated
          update huddle.last_warmth_tick_at
          emit "Zone warmed" event

    else:
      huddle = find active/candidate/cooling huddle for this zone

      if huddle exists:
        if huddle.status == active:
          huddle.status = cooling
          huddle.cooling_started_at = now
          emit "Huddle cooling" event

        else if huddle.status == candidate:
          huddle.status = ended
          huddle.ended_at = now
          emit "Candidate huddle cancelled" event

        else if huddle.status == cooling:
          if now - huddle.cooling_started_at >= COOLING_THRESHOLD_SECONDS:
            huddle.status = ended
            huddle.ended_at = now
            emit "Huddle ended" recap event
```

---

## Important Rule

Never let the client directly create a huddle.

Bad:

```text
client: create_huddle(users)
```

Good:

```text
client: moveToZone(zoneId)
server: update presence
server: compute huddle state
clients: subscribe to updated huddles
```

This is the key to making SpacetimeDB meaningful: it is the authoritative shared-world engine, not a location store.

---

## SpacetimeDB Implementation Notes

These tie the rules above to this repo's actual stack (TypeScript module). See
`TECHNICAL_PLAN.md` and the root `CLAUDE.md` for full conventions.

- **Time-driven logic uses scheduled reducers, not client timers.** SpacetimeDB
  TypeScript supports scheduled tables: a `huddle_tick` scheduled table drives
  `update_huddles` on a repeating interval (e.g. every 1–2s). `expire_stale_presence`
  and `decay_zones` are likewise scheduled. The movement reducers may *also* call the
  state-machine logic immediately so transitions feel instant, but correctness does not
  depend on a client calling `tick()`.
- **All time comes from `ctx.timestamp`** (deterministic per reducer call). Never use
  wall-clock or client-supplied timestamps for freshness/dwell/cooling math.
- **Identity is `ctx.sender`.** Users and members are keyed by Identity; never trust a
  `user_id` passed as an argument.
- **Lookups use indexes.** Finding "the live huddle for a zone" or "fresh users in a
  zone" should hit a btree index (e.g. multi-column `(room_id, zone_id)` on `huddle`,
  `(room_id, zone_id)` on `presence`) rather than scanning all rows.
- **Avoid duplicate huddles.** Before creating a candidate, check for an existing
  non-ended huddle for that `(room_id, zone_id)`.
- **Determinism.** No randomness except `ctx.random`; bots move via the same
  `moveToZone` reducer path, seeded deterministically.

---

## MVP Acceptance Criteria

The huddle logic is working when:

- two users in different zones do not form a huddle
- two users in the same zone create a candidate huddle
- candidate becomes active after the dwell threshold
- active huddle warms the zone
- active huddle gives points
- moving one user away starts cooling
- cooling huddle ends after the threshold
- all clients see the same state changes live
