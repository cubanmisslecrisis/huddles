# Huddles

**Huddles turns physical proximity into a shared social world state.** Users join a room and **stream their live GPS location** (`heartbeatLocation(lat,lng)`); when 2+ users are within `PROXIMITY_RADIUS_METERS` of each other, the *server* forms a huddle that warms and scores its members, shown on a **live map**. The client only reports "here is my location" — SpacetimeDB owns all huddle logic. (Earlier drafts used tap-to-move fake zones; that's been replaced by live location — see the MODEL UPDATE banners in the spec docs.)

**Phase 2 north star — "Proof of Hangout."** The team is building (additively) toward a Zenly/Snap-Map-style **social map**: a Mapbox map with an activity **heatmap**, **city exploration %**, **avatar merging** when people are close, a **recommend/avoid** layer, and a **Wrapped-style retrospective** of who you hung out with, where, when, and for how long. It reuses the Phase-1 engine (an ended `huddle` is already a hangout session; "warmth" → heatmap activity intensity). Phase 1 (territorial huddle MVP) is shipped; see `PROJECT.md` "North Star v2", `TECHNICAL_PLAN.md` "Proof-of-Hangout / Social-Map roadmap", and `PROGRESS.md`.

## Spec Docs — read these first

- **[PROJECT.md](./PROJECT.md)** — product context: what Huddles is, the feel, MVP scope, demo experience, non-goals.
- **[HUDDLE_LOGIC.md](./HUDDLE_LOGIC.md)** — the game rules and `candidate → active → cooling → ended` state machine, constants, warmth/decay, pseudocode, acceptance criteria.
- **[TECHNICAL_PLAN.md](./TECHNICAL_PLAN.md)** — architecture, tables, reducers, scheduling, subscriptions, screens, demo script, definition of done.
- **[PROGRESS.md](./PROGRESS.md)** — build status: what's done, what's starter-only, and the remaining to-do checklist toward the spec.
- **[WORK_SPLIT.md](./WORK_SPLIT.md)** — how the backend is divided for parallel work (Part 1 proximity / Part 2 huddling, split at the `presence` table) + ownership.

When the docs and this file disagree on *mechanics*, the docs win; this section governs *how to write the code*.

## Current state vs target

The committed client (`src/App.tsx`, `src/HuddleMap.tsx`) and module (`spacetimedb/src/index.ts`) are a **starter that does not yet match the spec**:

- `spacetimedb/src/index.ts` is still the SpacetimeDB **chat quickstart** (`user` + `message` tables) — this is what's published to `huddles-5eq44`.
- The client / generated bindings (`src/module_bindings/`) are a **manual** "penguin huddle" app where the *user* taps "Start a huddle" — the opposite of the spec's emergent, server-decided model.

So the client and the live module already diverge today, and both diverge from the target in the docs. Treat the docs as the destination; expect to rewrite both the module and the client to reach the zone-based proximity state machine. Don't assume existing tables/reducers match the spec.

## Code Conventions

- **Module lives in `spacetimedb/src/index.ts`** (one TypeScript file: tables, reducers, lifecycle, scheduled tables). Client is React + Vite in `src/`.
- **Table `name` is snake_case** (`huddle_member`); the `ctx.db` accessor is the camelCase form (`ctx.db.huddleMember`). Make tables `public: true` only when the client must subscribe.
- **Auth is always `ctx.sender`.** Key users/presence/members by Identity. Never accept a `user_id`/identity as a reducer argument and trust it.
- **Determinism.** Time is `ctx.timestamp`; randomness is `ctx.random`. No wall-clock, `Date.now()`, `Math.random()`, network, or filesystem in reducers.
- **Time-based logic uses scheduled reducers**, not client-driven `tick()` calls. Schedule `updateHuddles` / `expireStalePresence` / `decayZones` from `init` via scheduled tables. Movement reducers may also call the state machine inline for instant feedback, but correctness must not depend on a client tick.
- **Index hot lookups.** "Live huddle for a zone" and "fresh users in a zone" should hit a btree index (e.g. multi-column `(room_id, zone_id)`), not a full scan.
- **Reducers don't return data.** Clients read via subscriptions (`useTable`) and row callbacks. The client reports movement and renders state — it never creates or mutates huddles.
- **Regenerate bindings after any schema change:** `npm run spacetime:generate` (writes `src/module_bindings/` — never hand-edit those files).
- **Keep tunable constants** (dwell/cooling/warmth thresholds from `HUDDLE_LOGIC.md`) in one module-level block so demo↔production tuning is a single edit.
- **Map = raw `mapbox-gl` (Phase 2).** The map is the central surface: raw `mapbox-gl` (NOT react-map-gl/leaflet — both removed) with **React-portal markers**, light 3D **`standard`** basemap (`lightPreset:'day'`, pitch 60). Hooks `useMapboxMap` / `useMapMarkerDefs` in `src/hooks`; marker components in `src/components/map/markers.tsx`. Token in `VITE_MAPBOX_TOKEN` (`.env.local`, never hard-coded); graceful placeholder if unset.
- **Client = mobile-only shell, Tailwind v4 + tokens.** Ported from the `suryanewa/huddle` skeleton's mobile shell (desktop shell dropped). Styling is **Tailwind v4** (`@tailwindcss/vite`) with the oklch brand tokens + base layer in `src/index.css`; brand colors via `var(--color-*)` / `lib/theme.ts`. `@/` path alias → `src/` (in `vite.config.ts` + `tsconfig.app.json`). UI primitives (`components/ui/{button,input,checkbox}`) are hand-rolled — do **not** add `@base-ui/react`/`shadcn`. No user photos: `components/Avatar.tsx` (hashed color + initial, `lib/avatar.ts`) stands in everywhere. App derives view-models (`lib/view.ts`) from live tables and passes them to dumb panels; UI structure is `components/{map,shell,panels,lens,flows,ui}`. Static "places" stubs live in `lib/places-data.ts` (no backend yet).
- **Local dev:** `npm run dev` (Vite). Publish: `npm run spacetime:publish` (maincloud) / `:publish:local`. The reference below covers full CLI/SDK usage.

## Keep the context docs current

The Markdown context files are living documents, not write-once artifacts. Treat updating them as part of finishing a task, not an afterthought:

- **`PROGRESS.md`** — update it **as part of every change**. When you start something move it toward 🟡, when you finish move it to ✅, and add/remove ⬜ items as scope shifts. PROGRESS.md should always reflect the *actual* state of the repo at the end of your turn — never leave it stale.
- **`HUDDLE_LOGIC.md` / `TECHNICAL_PLAN.md`** — when the implementation diverges from these (new table, changed reducer signature, different constant, new scheduling approach), update the doc in the same change so it stays the source of truth. If a deliberate deviation is made, record it rather than silently drifting.
- **`PROJECT.md`** — update only when product scope/intent actually changes (rare); it is the product north star, not an implementation log.
- **`CLAUDE.md` / `AGENTS.md`** — when a new convention emerges, add it here. **These two files must stay identical** — after editing one, copy it to the other (`cp CLAUDE.md AGENTS.md`).

Rule of thumb: if a change would make any context doc wrong, fix the doc in the same turn.

## Sync before every change (git)

Multiple people edit the same files (notably `spacetimedb/src/index.ts`, where Part 1 and
Part 2 share one file). To avoid clobbering each other:

- **Pull before you start any fix:** `git pull --rebase` (or pull) so you're working on top
  of everyone else's latest, not a stale copy.
- **Push as soon as the fix is done and builds:** commit + `git push` immediately — don't
  sit on local changes. Small, frequent pushes beat large divergent ones.
- **Re-pull after publishing the module** (`spacetime publish` / `generate`) so regenerated
  `src/module_bindings/` lands for everyone.
- If a teammate's change surprises you (a file looks different than you left it), pull and
  re-read before editing rather than overwriting.

> Note: the repo is not yet under git. Run `git init`, add a remote, and commit the current
> state once so this workflow applies.

---

# SpacetimeDB Core Concepts

SpacetimeDB is a relational database that is also a server. It lets you upload application logic directly into the database via WebAssembly modules, eliminating the traditional web/game server layer entirely.

---

## Critical Rules

1. **Reducers are transactional.** They do not return data to callers. Use subscriptions to read data.
2. **Reducers must be deterministic.** No filesystem, network, timers, or random. All state must come from tables.
3. **Read data via tables/subscriptions**, not reducer return values. Clients get data through subscribed queries.
4. **Auto-increment IDs are not sequential.** Gaps are normal, do not use for ordering. Use timestamps or explicit sequence columns.
5. **`ctx.sender` is the authenticated principal.** Never trust identity passed as arguments.

---

## Feature Implementation Checklist

1. **Backend:** Define table(s) to store the data
2. **Backend:** Define reducer(s) to mutate the data
3. **Client:** Subscribe to the table(s)
4. **Client:** Call the reducer(s) from UI
5. **Client:** Render the data from the table(s)

---

## Debugging Checklist

1. Is SpacetimeDB server running? (`spacetime start`)
2. Is the module published? (`spacetime publish`)
3. Are client bindings generated? (`spacetime generate`)
4. Check server logs for errors (`spacetime logs <db-name>`)
5. Is the reducer actually being called from the client?

---

## Tables

- **Private tables** (default): Only accessible by reducers and the database owner.
- **Public tables**: Exposed for client read access through subscriptions. Writes still require reducers.

Organize data by access pattern, not by entity:

```
Player          PlayerState         PlayerStats
id         <--  player_id           player_id
name            position_x          total_kills
                position_y          total_deaths
                velocity_x          play_time
```

## Reducers

Reducers are transactional functions that modify database state. They run atomically, cannot interact with the outside world, and do not return data to callers. See the language-specific server skills for syntax.

## Event Tables

Event tables broadcast reducer-specific data to clients. Rows are never stored in the client cache (`count()` returns 0, `iter()` yields nothing); only `onInsert` callbacks fire.

## Subscriptions

Subscriptions replicate database rows to clients in real-time.

1. **Subscribe**: Register SQL queries describing needed data
2. **Receive initial data**: All matching rows are sent immediately
3. **Receive updates**: Real-time updates when subscribed rows change
4. **React to changes**: Use callbacks (`onInsert`, `onDelete`, `onUpdate`)

Best practices:
- Group subscriptions by lifetime
- Subscribe before unsubscribing when updating subscriptions
- Avoid overlapping queries
- Use indexes for efficient queries

## Modules

Modules are WebAssembly bundles containing application logic that runs inside the database.

- **Tables**: Define the data schema
- **Reducers**: Define callable functions that modify state
- **Event Tables**: Broadcast reducer-specific data to clients
- **Views**: Read-only functions that expose computed subsets of data to clients
- **Procedures**: (Unstable) Functions that can have side effects (HTTP requests, `ctx.withTx`)

Server-side modules can be written in: Rust, C#, TypeScript, C++

Lifecycle: Write → Compile → Publish (`spacetime publish`) → Hot-swap (republish without disconnecting clients)

## Identity

- **Identity**: A long-lived, globally unique identifier for a user.
- **ConnectionId**: Identifies a specific client connection.
- Always use `ctx.sender` / `ctx.Sender` / `ctx.sender()` for authorization.

SpacetimeDB works with many OIDC providers, including SpacetimeAuth (built-in), Auth0, Clerk, Keycloak, Google, and GitHub.


# SpacetimeDB CLI

Use this skill when the user needs help with the `spacetime` CLI tool - initializing projects, building modules, publishing databases, querying data, managing servers, or troubleshooting CLI issues.

## Quick Reference

### Project Initialization & Development

```bash
# Initialize new project
spacetime init my-project --lang rust|csharp|typescript|cpp
spacetime init my-project --template <template-id>

# Build module
spacetime build                    # release build
spacetime build --debug            # faster iteration, slower runtime

# Dev mode (auto-rebuild, auto-publish, generates bindings)
spacetime dev
spacetime dev --client-lang typescript --module-bindings-path ./client/src/module_bindings

# Generate client bindings
spacetime generate --lang typescript|csharp|rust|unrealcpp --out-dir ./bindings --module-path ./server
```

### Publishing & Deployment

```bash
# Publish to Maincloud (default)
spacetime publish my-database --yes

# Publish to local server
spacetime publish my-database --server local --yes

# Clear database and republish
spacetime publish my-database --delete-data always --yes
```

### Database Interaction

```bash
# SQL queries
spacetime sql my-database "SELECT * FROM users"
spacetime sql my-database --interactive   # REPL mode

# Call reducers (each argument is a separate positional arg)
spacetime call my-database my_reducer '"value"' '123'

# Subscribe to changes
spacetime subscribe my-database "SELECT * FROM users" --num-updates 10

# View logs
spacetime logs my-database -f              # follow logs
spacetime logs my-database -n 100          # up to 100 log lines

# Describe schema
spacetime describe my-database --json
spacetime describe my-database table users --json
spacetime describe my-database reducer my_reducer --json
```

### Database Management

```bash
# List databases
spacetime list

# Delete database
spacetime delete my-database

# Rename database
spacetime rename <database-identity> --to new-name
```

### Server Management

```bash
# List configured servers
spacetime server list

# Add server
spacetime server add local --url http://localhost:3000 --default
spacetime server add myserver --url https://my-spacetime.example.com

# Set default server
spacetime server set-default local

# Test connectivity
spacetime server ping local

# Start local instance
spacetime start

# Clear local data
spacetime server clear
```

### Authentication

```bash
# Login (opens browser)
spacetime login

# Login with token
spacetime login --token <token>

# Show login status
spacetime login show

# Logout
spacetime logout
```

## Default Servers

| Name | URL | Description |
|------|-----|-------------|
| `maincloud` | `https://maincloud.spacetimedb.com` | Production cloud (default) |
| `local` | `http://127.0.0.1:3000` | Local development server |

## Common Flags

| Flag | Short | Description |
|------|-------|-------------|
| `--server` | `-s` | Target server (nickname, hostname, or URL) |
| `--yes` | `-y` | Non-interactive mode (skip confirmations) |
| `--anonymous` | | Use anonymous identity |
| `--module-path` | `-p` | Path to module project |

## Troubleshooting

### "Not logged in"
```bash
spacetime login
# Or use --anonymous for public operations
```

### "Server not responding"
```bash
spacetime server ping <server>
# For local: ensure spacetime start is running
```

### "Schema conflict"
```bash
# Clear data and republish
spacetime publish my-db --delete-data always --yes
```

### "Build failed"
```bash
# Check Rust/C# toolchain
rustup show
# For Rust modules, ensure wasm32-unknown-unknown target
rustup target add wasm32-unknown-unknown
```

## Module Languages

**Server-side (modules):** Rust, C#, TypeScript, C++
**Client SDKs:** TypeScript, C#, Rust, Unreal Engine
**CLI `generate` targets:** TypeScript, C#, Rust, Unreal C++



# SpacetimeDB TypeScript SDK Reference

## Imports

```typescript
import { schema, table, t } from 'spacetimedb/server';
import { SenderError } from 'spacetimedb/server';
import { ScheduleAt } from 'spacetimedb';        // for scheduled tables only
```

## Tables

`table(OPTIONS, COLUMNS)` takes two arguments. The `name` field MUST be snake_case:

```typescript
const entity = table(
  { name: 'entity', public: true },
  {
    identity: t.identity().primaryKey(),
    name: t.string(),
    active: t.bool(),
  }
);
```

Options: `name` (snake_case, recommended), `public: true`, `event: true`, `scheduled: (): any => reducerRef`, `indexes: [...]`

`ctx.db` accessors are the camelCase form of the table's `name` field.

## Column Types

| Builder | JS type | Notes |
|---------|---------|-------|
| `t.u64()` | bigint | Use `0n` literals |
| `t.i64()` | bigint | Use `0n` literals |
| `t.u32()` / `t.i32()` | number | |
| `t.f64()` / `t.f32()` | number | |
| `t.bool()` | boolean | |
| `t.string()` | string | |
| `t.identity()` | Identity | |
| `t.connectionId()` | ConnectionId | |
| `t.timestamp()` | Timestamp | |
| `t.timeDuration()` | TimeDuration | |
| `t.scheduleAt()` | ScheduleAt | |

Modifiers: `.primaryKey()`, `.autoInc()`, `.unique()`, `.index('btree')`

Optional columns: `nickname: t.option(t.string())`

## Indexes

Prefer inline `.index('btree')` for single-column. Use named indexes only for multi-column:

```typescript
// Inline (preferred for single-column):
authorId: t.u64().index('btree'),
// Access: ctx.db.post.authorId.filter(authorId);

// Multi-column (named):
indexes: [{ accessor: 'by_group_user', algorithm: 'btree', columns: ['groupId', 'userId'] }]
// Access: ctx.db.membership.by_group_user.filter([groupId, userId]);
```

When you frequently look up rows by multiple columns, prefer a multi-column index over filtering by one column and looping over the results. Multi-column filter takes an array matching the index column order. You can omit trailing columns to do a prefix scan.

## Schema Export

```typescript
const spacetimedb = schema({ entity, record });  // ONE object, not spread args
export default spacetimedb;
```

## Reducers

Export name becomes the reducer name:

```typescript
export const createEntity = spacetimedb.reducer(
  { name: t.string(), age: t.i32() },
  (ctx, { name, age }) => {
    ctx.db.entity.insert({ identity: ctx.sender, name, age, active: true });
  }
);

// No arguments, just the callback:
export const doReset = spacetimedb.reducer((ctx) => { ... });
```

## DB Operations

```typescript
ctx.db.entity.insert({ id: 0n, name: 'Sample' });          // Insert (0n for autoInc)
ctx.db.entity.id.find(entityId);                           // Find by PK → row | null
ctx.db.entity.identity.find(ctx.sender);                   // Find by unique column
[...ctx.db.item.authorId.filter(authorId)];                // Filter → spread to Array
[...ctx.db.entity.iter()];                                 // All rows → Array
ctx.db.entity.id.update({ ...existing, name: newName });   // Update (spread + override)
ctx.db.entity.id.delete(entityId);                         // Delete by PK
```

Note: `iter()` and `filter()` return iterators. Spread to Array for `.sort()`, `.filter()`, `.map()`.

## Lifecycle Hooks

MUST be `export const`. Bare calls are silently ignored:

```typescript
export const init = spacetimedb.init((ctx) => { ... });
export const onConnect = spacetimedb.clientConnected((ctx) => { ... });
export const onDisconnect = spacetimedb.clientDisconnected((ctx) => { ... });
```

## Reducer Context API

`ReducerContext` is the single source of sender identity, deterministic time, and deterministic randomness inside a reducer. Always go through `ctx` for these. Standard library clocks and random sources are not available in modules.

```typescript
// Auth: ctx.sender is the caller's Identity
if (!row.owner.equals(ctx.sender)) throw new SenderError('unauthorized');

// Server timestamp (deterministic per reducer call)
ctx.db.item.insert({ id: 0n, createdAt: ctx.timestamp });

// Deterministic RNG
const f: number = ctx.random();                          // [0.0, 1.0)
const roll: number = ctx.random.integerInRange(1, 6);    // inclusive
const bytes: Uint8Array = ctx.random.fill(new Uint8Array(16));

// Client: Timestamp → Date
new Date(Number(row.createdAt.microsSinceUnixEpoch / 1000n));
```

## Scheduled Tables

```typescript
const tickTimer = table({
  name: 'tick_timer',
  scheduled: (): any => tick,   // (): any => breaks circular dep
}, {
  scheduled_id: t.u64().primaryKey().autoInc(),
  scheduled_at: t.scheduleAt(),
});

export const tick = spacetimedb.reducer(
  { timer: tickTimer.rowType },
  (ctx, { timer }) => { /* timer row auto-deleted after this runs */ }
);

// One-time: ScheduleAt.time(ctx.timestamp.microsSinceUnixEpoch + delayMicros)
// Repeating: ScheduleAt.interval(60_000_000n)
```

## Custom Types

```typescript
// Product type (struct):
const Position = t.object('Position', { x: t.i32(), y: t.i32() });
const entity = table({ name: 'entity' }, {
  id: t.u64().primaryKey().autoInc(),
  pos: Position,
});

// Sum type (tagged union):
const Shape = t.enum('Shape', {
  circle: t.i32(),
  rectangle: t.object('Rect', { w: t.i32(), h: t.i32() }),
});
// Values: { tag: 'circle', value: 10 }
```

## Views

```typescript
// Anonymous view (same for all clients):
export const activeUsers = spacetimedb.anonymousView(
  { name: 'active_users', public: true },
  t.array(entity.rowType),
  (ctx) => [...ctx.db.entity.iter()].filter(e => e.active)
);

// Per-user view (varies by ctx.sender):
export const myProfile = spacetimedb.view(
  { name: 'my_profile', public: true },
  t.option(entity.rowType),
  (ctx) => ctx.db.entity.identity.find(ctx.sender) ?? undefined
);
```

## Complete Example

```typescript
import { schema, table, t } from 'spacetimedb/server';

const entity = table(
  { name: 'entity', public: true },
  {
    identity: t.identity().primaryKey(),
    name: t.string(),
    active: t.bool(),
  }
);

const record = table(
  {
    name: 'record',
    public: true,
    indexes: [{ accessor: 'by_owner', algorithm: 'btree', columns: ['owner'] }],
  },
  {
    id: t.u64().primaryKey().autoInc(),
    owner: t.identity(),
    value: t.u32(),
  }
);

const spacetimedb = schema({ entity, record });
export default spacetimedb;

export const onConnect = spacetimedb.clientConnected((ctx) => {
  const existing = ctx.db.entity.identity.find(ctx.sender);
  if (existing) ctx.db.entity.identity.update({ ...existing, active: true });
});

export const onDisconnect = spacetimedb.clientDisconnected((ctx) => {
  const existing = ctx.db.entity.identity.find(ctx.sender);
  if (existing) ctx.db.entity.identity.update({ ...existing, active: false });
});

export const createEntity = spacetimedb.reducer(
  { name: t.string() },
  (ctx, { name }) => {
    if (ctx.db.entity.identity.find(ctx.sender)) throw new Error('already exists');
    ctx.db.entity.insert({ identity: ctx.sender, name, active: true });
  }
);

export const addRecord = spacetimedb.reducer(
  { value: t.u32() },
  (ctx, { value }) => {
    if (!ctx.db.entity.identity.find(ctx.sender)) throw new Error('not found');
    ctx.db.record.insert({ id: 0n, owner: ctx.sender, value });
  }
);
```


# SpacetimeDB TypeScript Client

## React: main.tsx

```typescript
import React, { useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { SpacetimeDBProvider } from 'spacetimedb/react';
import { DbConnection } from './module_bindings';
import { MODULE_NAME, SPACETIMEDB_URI } from './config';
import App from './App';

function Root() {
  const connectionBuilder = useMemo(() =>
    DbConnection.builder()
      .withUri(SPACETIMEDB_URI)
      .withDatabaseName(MODULE_NAME)
      .withToken(localStorage.getItem('auth_token') || undefined),
    []
  );
  return (
    <SpacetimeDBProvider connectionBuilder={connectionBuilder}>
      <App />
    </SpacetimeDBProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<Root />);
```

## React: App.tsx

```typescript
import { useTable, useSpacetimeDB } from 'spacetimedb/react';
import { DbConnection, tables } from './module_bindings';

function App() {
  const { isActive, identity: myIdentity, token, getConnection } = useSpacetimeDB();
  const conn = getConnection() as DbConnection | null;

  // Save auth token
  useEffect(() => { if (token) localStorage.setItem('auth_token', token); }, [token]);

  // Subscribe when connected. Prefer typed query builders over raw SQL
  useEffect(() => {
    if (!conn || !isActive) return;
    conn.subscriptionBuilder()
      .onApplied(() => setSubscribed(true))
      .subscribe([tables.entity, tables.record]);
      // Or with filters: tables.entity.where(r => r.active.eq(true))
      // Or raw SQL:      'SELECT * FROM entity'
  }, [conn, isActive]);

  // Reactive data. Returns [rows, isReady]
  const [entities, entitiesReady] = useTable(tables.entity);
  const [records, recordsReady] = useTable(tables.record);

  // useTable with row callbacks
  const [onlineUsers] = useTable(
    tables.entity.where(r => r.active.eq(true)),
    {
      onInsert: (user) => console.log('User connected:', user.name),
      onDelete: (user) => console.log('User disconnected:', user.name),
      onUpdate: (oldUser, newUser) => console.log('Updated:', newUser.name),
    }
  );

  // Call reducers with object syntax
  conn?.reducers.addRecord({ data });

  // Compare identities
  const isMe = row.owner.toHexString() === myIdentity?.toHexString();
}
```

## Vanilla (non-React)

```typescript
import { DbConnection, tables } from './module_bindings';

const conn = DbConnection.builder()
  .withUri('wss://maincloud.spacetimedb.com')
  .withDatabaseName('my_module')
  .onConnect((ctx) => {
    ctx.subscriptionBuilder()
      .onApplied(() => console.log('Ready'))
      .subscribe([tables.user, tables.message]);
  })
  .build();

// Row callbacks
conn.db.user.onInsert((ctx, user) => console.log('Joined:', user.name));
conn.db.user.onDelete((ctx, user) => console.log('Left:', user.name));
conn.db.user.onUpdate((ctx, oldUser, newUser) => console.log('Updated:', newUser.name));
```
