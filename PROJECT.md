# PROJECT.md — Huddles Product Context

> ⚠️ **MODEL UPDATE — live GPS, not tap-to-move.** Huddles uses **real-time location
> tracking on a map**: clients stream their GPS position and the server forms huddles by
> **geographic proximity** (users within `PROXIMITY_RADIUS_METERS` of each other). The
> "fake zones / tap-to-move / avoid GPS for the hackathon" guidance below is **superseded**
> — wherever it says "tap a zone," read "your live location on the map."

## One-Liner

**Huddles is a realtime social proximity app where friends form “huddles” by spending time together, warming up places and creating a visible record of real-world social presence.**

---

## North Star v2 — Proof of Hangout (social map)

> 🧭 **Current product direction.** The sections below describe **Phase 1 (the shipped
> territorial-huddle MVP)**. The team's north star is now **"Proof of Hangout"** — a
> Zenly/Snap-Map-inspired **social map**, built *additively* on the Phase-1 engine.

The map is the app. Inspired by Zenly and Snap Map, Huddles becomes a live social map that
quietly records *who you hung out with, where, when, and for how long* — a
Spotify-Wrapped-on-a-smaller-scale view of your real-world social life.

- **Live social map (Mapbox), home screen.** Room-mates appear as avatars at their live
  location; when people are close they **merge** into one avatar (Snap Map behavior). This
  is exactly a Phase-1 **huddle** (a proximity cluster) — so merging is already modeled.
- **Activity heatmap.** A Snap-Map-style heatmap of overall activity across the map. This
  reinterprets Phase-1 **warmth** as *activity intensity* accumulated per map cell.
- **City exploration.** "How much of the city have you explored?" — distinct places/cells a
  user has visited, shown as an explored-% and unlocked areas.
- **Recommend layer.** Users tag places **recommend / don't-recommend**; a toggleable
  overlay paints the map and heatmap with crowd sentiment.
- **Proof of Hangout / Wrapped.** A retrospective of your hangouts — partners, places,
  times, durations — built from **completed huddle sessions** (an ended huddle is durable
  proof of a hangout) plus per-place dwell.

Why it reuses Phase 1: a huddle already *is* a hangout session (`huddle` = where + when, its
centroid = the place; `huddle_member.joinedAt`/`leftAt` = who + how long). So Phase 2 is new
**presentation + feature layers** (Mapbox, heatmap, exploration, recommendations, Wrapped),
not a rewrite of the engine. Still **room-scoped** for now; a global map + friend graph is a
later step. See `TECHNICAL_PLAN.md` "Proof-of-Hangout / Social-Map roadmap" for the build.

---

## Product Summary  *(Phase 1 — shipped MVP)*

Huddles turns physical proximity into a shared social world state.

When two or more users are in the same place for long enough, the system forms a **huddle**. Active huddles generate **warmth** for that location and points for the people involved. Places cool down over time, so the social map stays temporary, dynamic, and alive.

The app should feel less like location tracking and more like a warm, playful representation of friends actually spending time together.

The emotional goal is:

> “It feels good to show up with friends.”

---

## Core Product Loop

1. Users join a shared room/session.
2. Users move around a map or simulated set of places.
3. When two or more users stay together, a huddle starts forming.
4. After enough time together, the huddle becomes active.
5. Active huddles generate warmth for the location.
6. Users earn points or social credit for huddling.
7. Locations cool down over time.
8. The app creates a lightweight record of where social energy happened.

Simplified loop:

```text
show up together → form huddle → warm place → earn social proof → places cool over time
```

---

## Product Feel

Huddles should feel:

- playful
- cozy
- social
- lightweight
- live
- game-like without feeling like a chore

Use language like:

- huddle
- warmth
- social energy
- zone
- forming
- active
- cooling
- recap

Avoid language that feels creepy or surveillance-heavy:

- tracking
- monitoring
- exact location
- stalking
- ownership forever

The app should never feel like it is exposing someone’s exact location. It should feel like friends are creating soft, temporary social traces.

---

## Hackathon Version

The hackathon version should be a **mobile-first realtime proximity simulation**, not a fully productionized background-location social network.

The goal is to prove the core mechanic:

> clients report movement → SpacetimeDB computes huddles → all clients see the same shared world update live

Use a fake map or zones instead of relying on real GPS.

Example zones:

- Cafe
- Library
- Park
- Dorm
- Gym

A user taps a zone to move there. When two users are in the same zone for long enough, a huddle forms.

This avoids demo problems with GPS permissions, indoor accuracy, and people needing to physically move around.

---

## MVP Features

Build the smallest version that proves the product:

1. Join room screen
2. Fake zone/map screen
3. Tap-to-move user avatar
4. Live presence display
5. Huddle forming/active/cooling states
6. Zone warmth
7. Event feed
8. Scoreboard or recap
9. Optional bot users for demo reliability

---

## Demo Experience

The demo should work in under 30 seconds.

Example flow:

1. User A joins room `demo` as Kevin.
2. User B joins room `demo` as Maya.
3. Kevin moves to `Cafe`.
4. Maya moves to `Library`.
5. No huddle forms.
6. Maya moves to `Cafe`.
7. Both clients show `Huddle forming...`.
8. After 10 seconds, both clients show `🔥 Huddle active`.
9. `Cafe` gains warmth.
10. Event feed updates live.
11. Kevin moves away.
12. Huddle enters `cooling`.
13. Huddle ends and creates a recap/event.

The important demo point:

> The clients do not decide that a huddle exists. They only report where users are. SpacetimeDB decides huddle state, membership, warmth, and scoring.

---

## Product Boundaries

For the MVP, Huddles is not trying to be:

- a full social network
- a dating app
- a production GPS tracker
- a real friend graph
- a permanent territory game
- a Snap Map clone
- an event planning app

It is a realtime social-world simulation around proximity and hanging out.

---

## What SpacetimeDB Should Prove

SpacetimeDB should feel central, not added on.

It should own the shared world state:

- user presence
- huddle formation
- huddle membership
- huddle state transitions
- zone warmth
- scoring
- event feed
- huddle recaps

Clients should be thin:

- join room
- send movement
- render subscribed state

Product framing:

> SpacetimeDB is the realtime social-world engine. The app is just the surface that shows the world changing.

---

## Non-Goals for MVP

Do not prioritize:

- production authentication
- real friend invites
- real background location
- exact GPS map rendering
- push notifications
- anti-cheat
- payments
- complex territory rules
- advanced privacy settings
- App Store readiness

These can come later.

---

## Future Product Directions

> Several of these are now the **active Phase-2 direction** (see "North Star v2" above):
> social heatmaps, named/social places, recap cards → the **Wrapped** retrospective, and
> place recommendations. Friend groups + a global (non-room) map remain genuinely future.

After the hackathon MVP, Huddles could expand into:

- real GPS proximity
- friend groups/squads
- private huddles
- fuzzy location sharing
- campus-specific maps
- huddle streaks
- named social zones
- recap cards
- temporary territory control
- mutual confirmation for anti-cheat
- Bluetooth proximity validation
- event-based huddles
- social heatmaps

---

## Product North Star

The product should answer:

> “Where did my friends actually spend time together?”

The core magic is the feeling that real-world social presence became visible, playful, and
shared. In the Phase-2 north star, the **map carries that feeling** — a living heatmap of
where people hang out, and a personal **proof of hangout**: who you spent time with, where,
when, and for how long.
