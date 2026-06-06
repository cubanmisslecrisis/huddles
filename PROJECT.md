# PROJECT.md — Huddles Product Context

## One-Liner

**Huddles is a realtime social proximity app where friends form “huddles” by spending time together, warming up places and creating a visible record of real-world social presence.**

---

## Product Summary

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

The core magic is not the map. It is the feeling that real-world social presence became visible, playful, and shared.
