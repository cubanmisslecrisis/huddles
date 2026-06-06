# Huddles

**Huddles turns physical proximity into a shared social world state.** Users join a room and
**stream their live GPS location**; when 2+ people are within `PROXIMITY_RADIUS_METERS` of
each other, the *server* (a SpacetimeDB module) forms a **huddle** — warming the spot and
scoring its members — all rendered live on a map. The client only reports "here is my
location"; SpacetimeDB owns the world state.

- **Phase 1 (shipped):** the territorial-huddle MVP — live GPS → haversine proximity
  clustering → `candidate → active → cooling → ended` state machine, warmth + scoring, on a
  react-leaflet map. Live on `huddles-5eq44`.
- **Phase 2 (north star): "Proof of Hangout"** — a Zenly/Snap-Map-style social map (Mapbox)
  with an activity **heatmap**, **city exploration %**, **avatar merging**, a
  **recommend/avoid** layer, and a **Wrapped-style retrospective** of who you hung out with,
  where, when, and for how long. Additive — reuses the Phase-1 engine (an ended huddle *is* a
  hangout session).

## Stack

- **Module:** SpacetimeDB TypeScript module — `spacetimedb/src/index.ts` (tables, reducers,
  scheduled ticks, lifecycle).
- **Client:** React 18 + Vite — `src/` (`App.tsx`, `LiveMap.tsx`); generated bindings in
  `src/module_bindings/` (never hand-edited).
- **Server:** maincloud, database `huddles-5eq44`.

## Run it

```bash
npm install
npm run dev            # Vite dev server (client)
```

Module workflow (after editing `spacetimedb/src/index.ts`):

```bash
npm run spacetime:generate    # regenerate src/module_bindings/ to match the schema
spacetime publish huddles-5eq44 --module-path spacetimedb --server maincloud   # add --delete-data for breaking schema changes
npm run build                 # tsc -b && vite build
```

Connection is configured in `src/main.tsx` via `VITE_SPACETIMEDB_HOST` /
`VITE_SPACETIMEDB_DB_NAME` (`.env.local`), defaulting to maincloud + `huddles-5eq44`. The
Phase-2 map will read a Mapbox token from `VITE_MAPBOX_TOKEN`.

## Docs (read these first)

- **[PROJECT.md](./PROJECT.md)** — product context + the "Proof of Hangout" north star.
- **[HUDDLE_LOGIC.md](./HUDDLE_LOGIC.md)** — game rules + the huddle state machine.
- **[TECHNICAL_PLAN.md](./TECHNICAL_PLAN.md)** — architecture, tables, reducers, and the
  Proof-of-Hangout / Social-Map roadmap.
- **[PROGRESS.md](./PROGRESS.md)** — build status (what's shipped vs. planned).
- **[WORK_SPLIT.md](./WORK_SPLIT.md)** — how the work is divided for parallel building.
- **[CLAUDE.md](./CLAUDE.md)** — conventions + SpacetimeDB reference (kept identical to
  `AGENTS.md`).
