// ─────────────────────────────────────────────────────────────────────────────
// Huddles SpacetimeDB module — LIVE GPS model
//
// Clients stream their real location (`heartbeatLocation(lat,lng)`); the server
// stores it in `presence` and decides huddles by GEOGRAPHIC PROXIMITY (users within
// PROXIMITY_RADIUS_METERS of each other), not by tapping a fixed zone.
//
//   • Part 1 owns the `PART 1` section: user/room/presence + joinRoom /
//     heartbeatLocation / leaveRoom / pingNearby. It WRITES the `presence` table
//     (lat/lng) and exposes the `freshUsersNear` radius primitive.
//   • Part 2 owns the `PART 2` section: huddle/huddle_member/event/score + the
//     scheduled engine (huddleTick / expireStalePresence / decayHuddles). It READS
//     `presence`, clusters nearby users, and runs the huddle state machine.
//
// See HUDDLE_LOGIC.md for the rules and TECHNICAL_PLAN.md for the data model.
// ─────────────────────────────────────────────────────────────────────────────
import { schema, table, t, SenderError } from 'spacetimedb/server';
import { ScheduleAt, Identity } from 'spacetimedb';

// ═════════════════════════════════════════════════════════════════════════════
// CONSTANTS  (hackathon demo values — see HUDDLE_LOGIC.md "Constants")
// ═════════════════════════════════════════════════════════════════════════════
const MIN_USERS_FOR_HUDDLE = 2;
const PROXIMITY_RADIUS_METERS = 100; // JOIN radius: two users this close start counting as "together"
const STAY_RADIUS_METERS = 130; // hysteresis: an already-grouped pair stays linked until they part past this
const DWELL_THRESHOLD_SECONDS = 10;
const WARMTH_TICK_SECONDS = 5;
const COOLING_THRESHOLD_SECONDS = 10;
const CANDIDATE_GRACE_SECONDS = 5; // a forming (candidate) huddle survives this long without its cluster
const PRESENCE_STALE_SECONDS = 300; // 5 min — generous so backgrounded/idle web tabs
// (whose 3s heartbeat gets throttled to ~once/min) keep their presence "active" and stay
// on the map instead of vanishing. Closed/dead tabs still drop after this window.
const WARMTH_PER_TICK = 5;
const POINTS_PER_TICK = 5;
const DECAY_INTERVAL_SECONDS = 10;
const DECAY_AMOUNT = 1; // huddle warmth removed per decay tick (now 10s)

// Phase-2 activity heatmap: server-aggregated weight per ~grid cell. Tuned so a cell
// lights up within seconds of activity and fades within ~1 min once it stops.
const HEAT_CELL_DEGREES = 0.002; // ~200 m grid cell (lat) for the heatmap
const HEAT_PER_HEARTBEAT = 2; // weight added to a cell on each heartbeat
const HEAT_DECAY_FACTOR = 0.6; // multiplicative decay per tick (smooth, snappy fade)
const HEAT_MIN = 0.8; // drop cells below this so the table stays small
const HEAT_MAX = 16; // clamp so a single cell's weight stays bounded

// Scheduled tick cadences, in microseconds.
const HUDDLE_TICK_MICROS = 1_000_000n; // 1s — runs the huddle state machine
const PRESENCE_TICK_MICROS = 5_000_000n; // 5s — expire stale presence
const DECAY_TICK_MICROS = 10_000_000n; // 10s — cool huddle warmth + heatmap

// Phase-2 demo bots: server-simulated movers that make the `demo` room come alive.
// Bots are NOT real clients — they have no connection. A scheduled botTick mints
// synthetic identities, writes their `presence` (lat/lng) + `bumpHeat` exactly like a
// real heartbeat, and the existing huddleTick clusters them with no engine changes.
// Auto-spawn on the first real user's fix; auto-despawn when no real users remain.
const DEMO_ROOM_CODE = 'demo';
const BOT_TICK_MICROS = 1_500_000n; // ~1.5s movement cadence (well inside STALE window)
const BOT_HUDDLER_COUNT = 3; // bots that converge to guarantee a huddle forms
const BOT_WANDERER_COUNT = 6; // ambient movers spread across the area to keep heat alive
const BOT_NAMES = ['Maya', 'Jake', 'Sophie', 'Leo', 'Aria', 'Noah', 'Zoe', 'Kai', 'Ivy'];
const BOT_ORBIT_RADIUS_M = 60; // wanderer drift radius around their home
const BOT_ORBIT_SPEED = 0.25; // wanderer angular speed (radians / second)
const BOT_RENDEZVOUS_RADIUS_M = 30; // huddlers sit this close to the shared rendezvous
const BOT_RENDEZVOUS_OFFSET_M = 35; // rendezvous is this far from the anchor (real user)
const BOT_RENDEZVOUS_HOLD_S = 22; // huddlers cluster (dwell 10s + warmth) → active ...
const BOT_RENDEZVOUS_GAP_S = 18; // ... then scatter past cooling (10s) → ended, then repeat
const BOT_SCATTER_RADIUS_M = 220; // how far huddlers flee during the gap (> STAY_RADIUS)
const BOT_AREA_SPREAD_M = 500; // radius (m) over which wanderer homes are scattered
const BOT_WANDERER_MIN_SPREAD_M = 160; // keep wanderer homes off the rendezvous so they
// read as separate pods around the map rather than merging into one blob with the huddlers
const BOT_AMBIENT_HOTSPOTS = 8; // fixed cells botTick keeps warm so the heatmap stays rich

// ═════════════════════════════════════════════════════════════════════════════
// PART 1 — location input + proximity (Part 1 owner edits below)
// ═════════════════════════════════════════════════════════════════════════════

// A participant. Keyed by Identity (ctx.sender) — never a client-passed id.
const user = table(
  { name: 'user', public: true },
  {
    identity: t.identity().primaryKey(),
    name: t.string(),
    createdAt: t.timestamp(),
  }
);

// A multiplayer session. Default code "demo".
const room = table(
  { name: 'room', public: true },
  {
    id: t.u64().primaryKey().autoInc(),
    code: t.string().unique(),
    name: t.string(),
    createdAt: t.timestamp(),
  }
);

// Where a user currently is — their LIVE GPS fix. THIS is the Part 1 ↔ Part 2
// contract: Part 1 writes it, Part 2 reads it. status ∈ active | stale | offline.
// hasFix is false until the first real geolocation reading arrives.
const presence = table(
  { name: 'presence', public: true },
  {
    identity: t.identity().primaryKey(),
    roomId: t.u64().index('btree'),
    lat: t.f64(),
    lng: t.f64(),
    hasFix: t.bool(),
    lastSeen: t.timestamp(),
    status: t.string(),
  }
);

// Phase-2 activity heatmap: one row per (room, ~200m grid cell), weight accumulated
// by heartbeatLocation and decayed by decayHuddles. Rendered as the Mapbox heatmap.
// lat/lng are the cell center (for rendering). Written by Part 1; read by the client.
const heatCell = table(
  {
    name: 'heat_cell',
    public: true,
    indexes: [{ accessor: 'by_room_cell', algorithm: 'btree', columns: ['roomId', 'cellKey'] }],
  },
  {
    id: t.u64().primaryKey().autoInc(),
    roomId: t.u64().index('btree'),
    cellKey: t.string(),
    lat: t.f64(),
    lng: t.f64(),
    weight: t.f64(),
    lastUpdatedAt: t.timestamp(),
  }
);

// Phase-2 demo bots. One row per simulated mover. Their live position lives in the
// normal `presence` table (so the engine treats them as ordinary users); this table
// only holds the deterministic motion script botTick needs. `kind` ∈ huddler | wanderer.
const bot = table(
  { name: 'bot', public: true },
  {
    identity: t.identity().primaryKey(),
    roomId: t.u64().index('btree'),
    name: t.string(),
    kind: t.string(),
    homeLat: t.f64(), // wanderer: orbit center. huddler: the shared rendezvous point.
    homeLng: t.f64(),
    paramA: t.f64(), // per-bot phase offset (radians), so bots don't move in lockstep
    spawnedAt: t.timestamp(),
  }
);

// ═════════════════════════════════════════════════════════════════════════════
// PART 2 — huddling (Part 2 owner edits below)
// ═════════════════════════════════════════════════════════════════════════════

// Canonical huddle state. Located at the cluster centroid (lat/lng) so the map can
// draw it. status ∈ candidate | active | cooling | ended.
const huddle = table(
  { name: 'huddle', public: true },
  {
    id: t.u64().primaryKey().autoInc(),
    roomId: t.u64().index('btree'),
    lat: t.f64(),
    lng: t.f64(),
    status: t.string(),
    candidateStartedAt: t.timestamp(),
    activatedAt: t.option(t.timestamp()),
    coolingStartedAt: t.option(t.timestamp()),
    endedAt: t.option(t.timestamp()),
    warmth: t.f64(),
    memberCount: t.u32(),
    lastWarmthTickAt: t.timestamp(),
  }
);

// Huddle participants, keyed by Identity.
const huddleMember = table(
  { name: 'huddle_member', public: true },
  {
    id: t.u64().primaryKey().autoInc(),
    huddleId: t.u64().index('btree'),
    identity: t.identity(),
    joinedAt: t.timestamp(),
    lastSeenInHuddle: t.timestamp(),
    leftAt: t.option(t.timestamp()),
  }
);

// The live event feed — persisted (so the UI can render history).
const event = table(
  { name: 'event', public: true },
  {
    id: t.u64().primaryKey().autoInc(),
    roomId: t.u64().index('btree'),
    type: t.string(),
    message: t.string(),
    huddleId: t.option(t.u64()),
    lat: t.option(t.f64()),
    lng: t.option(t.f64()),
    createdAt: t.timestamp(),
  }
);

// Per-user, per-room score.
const score = table(
  {
    name: 'score',
    public: true,
    indexes: [{ accessor: 'by_room_user', algorithm: 'btree', columns: ['roomId', 'identity'] }],
  },
  {
    id: t.u64().primaryKey().autoInc(),
    roomId: t.u64(),
    identity: t.identity(),
    warmthPoints: t.u32(),
    huddlesJoined: t.u32(),
    totalHuddleTime: t.u64(),
  }
);

// User-saved places on the map — location-tagged places with optional notes.
const savedPlace = table(
  {
    name: 'saved_place',
    public: true,
    indexes: [{ accessor: 'by_room', algorithm: 'btree', columns: ['roomId'] }],
  },
  {
    id: t.u64().primaryKey().autoInc(),
    roomId: t.u64(),
    identity: t.identity(),
    placeName: t.string(),
    note: t.option(t.string()),
    lat: t.f64(),
    lng: t.f64(),
    createdAt: t.timestamp(),
  }
);

// Scheduled tables (the clock). Each targets a reducer below via a lazy thunk.
const huddleTickTimer = table(
  { name: 'huddle_tick_timer', scheduled: (): any => huddleTick },
  { scheduledId: t.u64().primaryKey().autoInc(), scheduledAt: t.scheduleAt() }
);

const presenceTickTimer = table(
  { name: 'presence_tick_timer', scheduled: (): any => expireStalePresence },
  { scheduledId: t.u64().primaryKey().autoInc(), scheduledAt: t.scheduleAt() }
);

const decayTickTimer = table(
  { name: 'decay_tick_timer', scheduled: (): any => decayHuddles },
  { scheduledId: t.u64().primaryKey().autoInc(), scheduledAt: t.scheduleAt() }
);

const botTickTimer = table(
  { name: 'bot_tick_timer', scheduled: (): any => botTick },
  { scheduledId: t.u64().primaryKey().autoInc(), scheduledAt: t.scheduleAt() }
);

// ═════════════════════════════════════════════════════════════════════════════
// SCHEMA
// ═════════════════════════════════════════════════════════════════════════════
const spacetimedb = schema({
  // Part 1
  user,
  room,
  presence,
  heatCell,
  bot,
  // Part 2
  huddle,
  huddleMember,
  event,
  score,
  savedPlace,
  // scheduled
  huddleTickTimer,
  presenceTickTimer,
  decayTickTimer,
  botTickTimer,
});
export default spacetimedb;

// ═════════════════════════════════════════════════════════════════════════════
// SHARED HELPERS  (used by Part 1 and Part 2)
// ═════════════════════════════════════════════════════════════════════════════

// A presence is "fresh" if last seen within this many microseconds.
const STALE_MICROS = BigInt(PRESENCE_STALE_SECONDS) * 1_000_000n;

// Deterministic "now" inside a reducer, in micros since the unix epoch.
function nowMicros(ctx: any): bigint {
  return ctx.timestamp.microsSinceUnixEpoch;
}

// Great-circle distance between two lat/lng points, in meters (haversine).
// Math.* is deterministic, so this is reducer-safe.
function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6_371_000; // Earth radius, meters
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// Deterministic ~200m grid cell for the activity heatmap. Math-only → reducer-safe.
function heatCellKey(lat: number, lng: number): string {
  return `${Math.floor(lat / HEAT_CELL_DEGREES)}:${Math.floor(lng / HEAT_CELL_DEGREES)}`;
}
function heatCellCenter(lat: number, lng: number): { lat: number; lng: number } {
  return {
    lat: (Math.floor(lat / HEAT_CELL_DEGREES) + 0.5) * HEAT_CELL_DEGREES,
    lng: (Math.floor(lng / HEAT_CELL_DEGREES) + 0.5) * HEAT_CELL_DEGREES,
  };
}

// Add activity weight to the (room, cell) a heartbeat landed in. Upsert via the
// by_room_cell index; clamp to HEAT_MAX so a stationary user can't run it away.
function bumpHeat(ctx: any, roomId: bigint, lat: number, lng: number): void {
  const key = heatCellKey(lat, lng);
  const existing = [...ctx.db.heatCell.by_room_cell.filter([roomId, key])];
  if (existing.length > 0) {
    const c = existing[0];
    const weight = Math.min(HEAT_MAX, c.weight + HEAT_PER_HEARTBEAT);
    if (weight !== c.weight) ctx.db.heatCell.id.update({ ...c, weight, lastUpdatedAt: ctx.timestamp });
  } else {
    const center = heatCellCenter(lat, lng);
    ctx.db.heatCell.insert({
      id: 0n,
      roomId,
      cellKey: key,
      lat: center.lat,
      lng: center.lng,
      weight: HEAT_PER_HEARTBEAT,
      lastUpdatedAt: ctx.timestamp,
    });
  }
}

// Append one row to the live event feed. `event` is append-only and written by
// both parts; autoInc id means concurrent inserts never conflict.
function emitEvent(
  ctx: any,
  roomId: bigint,
  type: string,
  message: string,
  opts?: { huddleId?: bigint; lat?: number; lng?: number }
): void {
  ctx.db.event.insert({
    id: 0n,
    roomId,
    type,
    message,
    huddleId: opts?.huddleId,
    lat: opts?.lat,
    lng: opts?.lng,
    createdAt: ctx.timestamp,
  });
}

// PART 1 proximity primitive: active users with a fresh GPS fix within
// PROXIMITY_RADIUS_METERS of (lat,lng) in this room. The one query both
// pingNearby and Part 2's huddle engine reuse.
function freshUsersNear(ctx: any, roomId: bigint, lat: number, lng: number): any[] {
  const now = nowMicros(ctx);
  return [...ctx.db.presence.roomId.filter(roomId)].filter(
    (p: any) =>
      p.status === 'active' &&
      p.hasFix &&
      now - p.lastSeen.microsSinceUnixEpoch <= STALE_MICROS &&
      distanceMeters(lat, lng, p.lat, p.lng) <= PROXIMITY_RADIUS_METERS
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// PART 1 REDUCERS — client-callable
// ═════════════════════════════════════════════════════════════════════════════

// Create/join a room, init this user's row + presence + score. Presence starts
// with NO fix (hasFix=false) until the first heartbeatLocation arrives.
export const joinRoom = spacetimedb.reducer(
  { name: t.string(), roomCode: t.string() },
  (ctx, { name, roomCode }) => {
    const displayName = name.trim();
    const code = roomCode.trim();
    if (!displayName) throw new SenderError('Name must not be empty');
    if (!code) throw new SenderError('Room code must not be empty');

    // Room — create the first time this code is used.
    let theRoom = ctx.db.room.code.find(code);
    if (!theRoom) {
      theRoom = ctx.db.room.insert({ id: 0n, code, name: code, createdAt: ctx.timestamp });
    }
    const roomId = theRoom.id;

    // User — upsert by Identity (allow rename on rejoin).
    const existingUser = ctx.db.user.identity.find(ctx.sender);
    if (existingUser) {
      ctx.db.user.identity.update({ ...existingUser, name: displayName });
    } else {
      ctx.db.user.insert({ identity: ctx.sender, name: displayName, createdAt: ctx.timestamp });
    }

    // Score — init once per (room, user).
    if ([...ctx.db.score.by_room_user.filter([roomId, ctx.sender])].length === 0) {
      ctx.db.score.insert({
        id: 0n,
        roomId,
        identity: ctx.sender,
        warmthPoints: 0,
        huddlesJoined: 0,
        totalHuddleTime: 0n,
      });
    }

    // Presence — upsert; no GPS fix yet.
    const presenceRow = {
      identity: ctx.sender,
      roomId,
      lat: 0,
      lng: 0,
      hasFix: false,
      lastSeen: ctx.timestamp,
      status: 'active',
    };
    if (ctx.db.presence.identity.find(ctx.sender)) {
      ctx.db.presence.identity.update(presenceRow);
    } else {
      ctx.db.presence.insert(presenceRow);
    }

    emitEvent(ctx, roomId, 'user_joined', `${displayName} joined`);
  }
);

// Live location stream: the client calls this repeatedly from the browser's
// geolocation watchPosition. Updates the caller's fix, then re-runs the engine.
export const heartbeatLocation = spacetimedb.reducer(
  { lat: t.f64(), lng: t.f64() },
  (ctx, { lat, lng }) => {
    const p = ctx.db.presence.identity.find(ctx.sender);
    if (!p) throw new SenderError('Join a room first');

    ctx.db.presence.identity.update({
      ...p,
      lat,
      lng,
      hasFix: true,
      lastSeen: ctx.timestamp,
      status: 'active',
    });

    // Phase-2 heatmap: bump this grid cell's activity weight.
    bumpHeat(ctx, p.roomId, lat, lng);

    // No inline engine call — the 1s huddleTick is the single clock that advances every
    // room's huddle state. Heartbeat only writes presence + heat (see HUDDLE_LOGIC.md).
  }
);

// Leave: mark the caller offline. Part 2's engine detaches them from any huddle.
export const leaveRoom = spacetimedb.reducer((ctx) => {
  const p = ctx.db.presence.identity.find(ctx.sender);
  if (!p) return;
  ctx.db.presence.identity.update({ ...p, status: 'offline', lastSeen: ctx.timestamp });

  const who = ctx.db.user.identity.find(ctx.sender)?.name ?? 'Someone';
  emitEvent(ctx, p.roomId, 'user_left', `${who} left`);
  // The next huddleTick detaches them from any huddle (single-clock model).
});

// Maggie's feature: ping the fresh users near the caller (one feed event for MVP).
export const pingNearby = spacetimedb.reducer((ctx) => {
  const p = ctx.db.presence.identity.find(ctx.sender);
  if (!p) throw new SenderError('Join a room first');
  if (!p.hasFix) throw new SenderError('Waiting for your location…');

  const peers = freshUsersNear(ctx, p.roomId, p.lat, p.lng).filter(
    (q: any) => !q.identity.equals(ctx.sender)
  );
  const who = ctx.db.user.identity.find(ctx.sender)?.name ?? 'Someone';
  emitEvent(ctx, p.roomId, 'ping', `${who} pinged ${peers.length} people nearby`, {
    lat: p.lat,
    lng: p.lng,
  });
});

// Save a place on the map at the current location.
export const savePlace = spacetimedb.reducer(
  { placeName: t.string(), note: t.option(t.string()) },
  (ctx, { placeName, note }) => {
    const p = ctx.db.presence.identity.find(ctx.sender);
    if (!p) throw new SenderError('Join a room first');
    if (!p.hasFix) throw new SenderError('Waiting for your location…');

    const trimmedName = placeName.trim();
    if (!trimmedName) throw new SenderError('Place name cannot be empty');

    const trimmedNote = note?.trim();

    ctx.db.savedPlace.insert({
      id: 0n,
      roomId: p.roomId,
      identity: ctx.sender,
      placeName: trimmedName,
      note: trimmedNote ? trimmedNote : undefined,
      lat: p.lat,
      lng: p.lng,
      createdAt: ctx.timestamp,
    });

    const who = ctx.db.user.identity.find(ctx.sender)?.name ?? 'Someone';
    emitEvent(ctx, p.roomId, 'place_saved', `${who} saved ${trimmedName}`, {
      lat: p.lat,
      lng: p.lng,
    });
  }
);

// ═════════════════════════════════════════════════════════════════════════════
// PART 2 — engine + scheduled reducers
// ═════════════════════════════════════════════════════════════════════════════

// Cluster↔huddle membership match threshold (Jaccard overlap). 0.34 ≈ "share at
// least one of two", tolerant of a single member swapping in/out between ticks.
const OVERLAP_THRESHOLD = 0.34;

// Precomputed micros thresholds for the state machine.
const DWELL_MICROS = BigInt(DWELL_THRESHOLD_SECONDS) * 1_000_000n;
const WARMTH_MICROS = BigInt(WARMTH_TICK_SECONDS) * 1_000_000n;
const COOLING_MICROS = BigInt(COOLING_THRESHOLD_SECONDS) * 1_000_000n;
const CANDIDATE_GRACE_MICROS = BigInt(CANDIDATE_GRACE_SECONDS) * 1_000_000n;

// Stable identity ordering. Hex is fixed-length, so lexicographic == numeric order.
// Load-bearing for determinism: SpacetimeDB does not guarantee iteration order, so
// every collection that drives clustering/matching is sorted by this first.
const idHex = (identity: any): string => identity.toHexString();
function cmpIdentity(a: any, b: any): number {
  const ha = idHex(a);
  const hb = idHex(b);
  return ha < hb ? -1 : ha > hb ? 1 : 0;
}

// All active, fresh, located users in a room — the input to clustering. Sorted by
// identity so cluster assignment is reproducible across ticks.
function freshUsersInRoom(ctx: any, roomId: bigint): any[] {
  const now = nowMicros(ctx);
  const rows = [...ctx.db.presence.roomId.filter(roomId)].filter(
    (p: any) =>
      p.status === 'active' &&
      p.hasFix &&
      now - p.lastSeen.microsSinceUnixEpoch <= STALE_MICROS
  );
  return rows.sort((a: any, b: any) => cmpIdentity(a.identity, b.identity));
}

// Group fresh users into proximity clusters via union-find over a "within radius"
// graph. O(n^2) edges — fine for a handful of users per room. Deterministic: input
// is identity-sorted, ties attach larger root under smaller, output sorted.
// NOTE: transitive chaining is intentional — A–B and B–C within radius ⇒ one
// cluster even if A–C is farther. Reads as "one group standing near each other".
// Hysteresis: a pair already co-membered in the SAME live huddle (memberHuddleOf)
// stays linked out to STAY_RADIUS_METERS; a brand-new link still needs PROXIMITY_RADIUS.
function clusterFreshUsers(fresh: any[], memberHuddleOf: Map<string, bigint>): any[][] {
  const n = fresh.length;
  const hexes = fresh.map((p: any) => idHex(p.identity));
  const parent = Array.from({ length: n }, (_, i) => i);
  const find = (x: number): number => {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]];
      x = parent[x];
    }
    return x;
  };
  const union = (a: number, b: number) => {
    const ra = find(a);
    const rb = find(b);
    if (ra === rb) return;
    if (ra < rb) parent[rb] = ra;
    else parent[ra] = rb;
  };

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const d = distanceMeters(fresh[i].lat, fresh[i].lng, fresh[j].lat, fresh[j].lng);
      const hi = memberHuddleOf.get(hexes[i]);
      const sameHuddle = hi != null && hi === memberHuddleOf.get(hexes[j]);
      if (d <= PROXIMITY_RADIUS_METERS || (sameHuddle && d <= STAY_RADIUS_METERS)) union(i, j);
    }
  }

  const groups = new Map<number, any[]>();
  for (let i = 0; i < n; i++) {
    const r = find(i);
    if (!groups.has(r)) groups.set(r, []);
    groups.get(r)!.push(fresh[i]);
  }

  const clusters = [...groups.values()].filter((g) => g.length >= MIN_USERS_FOR_HUDDLE);
  clusters.sort((a, b) => cmpIdentity(a[0].identity, b[0].identity));
  return clusters;
}

// Planar mean of member coordinates — adequate at ~100m / city scale.
function centroidOf(members: any[]): { lat: number; lng: number } {
  let sLat = 0;
  let sLng = 0;
  for (const m of members) {
    sLat += m.lat;
    sLng += m.lng;
  }
  return { lat: sLat / members.length, lng: sLng / members.length };
}

// Current (not-left) member identity hexes of a huddle.
function memberSet(ctx: any, huddleId: bigint): Set<string> {
  const s = new Set<string>();
  for (const m of ctx.db.huddleMember.huddleId.filter([huddleId])) {
    if (m.leftAt == null) s.add(idHex(m.identity));
  }
  return s;
}

const nameOf = (ctx: any, identity: any): string =>
  ctx.db.user.identity.find(identity)?.name ?? 'Someone';

// The huddle state machine, run per room. Driven solely by the scheduled huddleTick
// (1s) — the single clock for all transitions. Reads `presence`, mutates
// huddle / huddle_member / score / event. Clusters fresh users by distance and
// matches each cluster to an existing huddle by membership overlap.
function runHuddleEngine(ctx: any, roomId: bigint): void {
  const now = nowMicros(ctx);

  // Live huddles first — their current membership drives BOTH the hysteresis edges in
  // clustering (who is already grouped) and the cluster↔huddle match below. memberSets is
  // computed once here and reused, instead of re-scanning huddle_member per cluster×huddle.
  const liveHuddles = [...ctx.db.huddle.roomId.filter(roomId)]
    .filter((h: any) => h.status !== 'ended')
    .sort((a: any, b: any) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const memberSets = new Map<bigint, Set<string>>();
  const memberHuddleOf = new Map<string, bigint>();
  for (const h of liveHuddles) {
    const set = memberSet(ctx, h.id);
    memberSets.set(h.id, set);
    for (const hex of set) memberHuddleOf.set(hex, h.id); // sorted-id iteration ⇒ deterministic
  }

  const fresh = freshUsersInRoom(ctx, roomId);
  const clusters = clusterFreshUsers(fresh, memberHuddleOf);

  const clusterSets = clusters.map((c) => new Set(c.map((p: any) => idHex(p.identity))));
  const matched = new Set<bigint>();

  // Phase 1: match each cluster to at most one live huddle (greedy by best Jaccard).
  for (let ci = 0; ci < clusters.length; ci++) {
    const cset = clusterSets[ci];
    let best: any = null;
    let bestScore = 0;
    for (const h of liveHuddles) {
      if (matched.has(h.id)) continue;
      const hset = memberSets.get(h.id)!;
      let inter = 0;
      for (const x of cset) if (hset.has(x)) inter++;
      const unionSize = new Set([...cset, ...hset]).size;
      const sc = unionSize === 0 ? 0 : inter / unionSize;
      if (sc > bestScore) {
        bestScore = sc;
        best = h;
      }
    }

    if (best && bestScore >= OVERLAP_THRESHOLD) {
      matched.add(best.id);
      updateExistingHuddle(ctx, best, clusters[ci], now);
    } else {
      createCandidate(ctx, roomId, clusters[ci]);
    }
  }

  // Phase 2: live huddles no cluster matched have lost their group.
  for (const h of liveHuddles) {
    if (!matched.has(h.id)) declineHuddle(ctx, h, now);
  }
}

function createCandidate(ctx: any, roomId: bigint, cluster: any[]): void {
  const c = centroidOf(cluster);
  const h = ctx.db.huddle.insert({
    id: 0n,
    roomId,
    lat: c.lat,
    lng: c.lng,
    status: 'candidate',
    candidateStartedAt: ctx.timestamp,
    activatedAt: undefined,
    coolingStartedAt: undefined,
    endedAt: undefined,
    warmth: 0,
    memberCount: cluster.length,
    lastWarmthTickAt: ctx.timestamp,
  });
  for (const p of cluster) {
    ctx.db.huddleMember.insert({
      id: 0n,
      huddleId: h.id,
      identity: p.identity,
      joinedAt: ctx.timestamp,
      lastSeenInHuddle: ctx.timestamp,
      leftAt: undefined,
    });
  }
  emitEvent(ctx, roomId, 'huddle_forming', `Huddle forming (${cluster.length} nearby)`, {
    huddleId: h.id,
    lat: c.lat,
    lng: c.lng,
  });
}

function updateExistingHuddle(ctx: any, h: any, cluster: any[], now: bigint): void {
  const clusterIds = new Set(cluster.map((p: any) => idHex(p.identity)));
  const existing = [...ctx.db.huddleMember.huddleId.filter([h.id])];

  // 1. Members present in the cluster: ensure active + refresh; readmit returners.
  for (const p of cluster) {
    const hex = idHex(p.identity);
    const m = existing.find((x: any) => idHex(x.identity) === hex);
    if (m && m.leftAt == null) {
      ctx.db.huddleMember.id.update({ ...m, lastSeenInHuddle: ctx.timestamp });
    } else if (m && m.leftAt != null) {
      ctx.db.huddleMember.id.update({ ...m, leftAt: undefined, lastSeenInHuddle: ctx.timestamp });
    } else {
      ctx.db.huddleMember.insert({
        id: 0n,
        huddleId: h.id,
        identity: p.identity,
        joinedAt: ctx.timestamp,
        lastSeenInHuddle: ctx.timestamp,
        leftAt: undefined,
      });
    }
  }

  // 2. Current members no longer in the cluster: mark left.
  for (const m of existing) {
    if (m.leftAt == null && !clusterIds.has(idHex(m.identity))) {
      ctx.db.huddleMember.id.update({ ...m, leftAt: ctx.timestamp });
    }
  }

  // 3. Recompute centroid + member count + advance state.
  const c = centroidOf(cluster);
  const next: any = { ...h, lat: c.lat, lng: c.lng, memberCount: cluster.length };

  if (h.status === 'cooling') {
    next.status = 'active';
    next.coolingStartedAt = undefined;
    next.activatedAt = h.activatedAt ?? ctx.timestamp;
    emitEvent(ctx, h.roomId, 'huddle_activated', 'Huddle reactivated', {
      huddleId: h.id,
      lat: c.lat,
      lng: c.lng,
    });
  } else if (h.status === 'candidate') {
    next.coolingStartedAt = undefined; // cluster is present this tick → cancel any grace
    if (now - h.candidateStartedAt.microsSinceUnixEpoch >= DWELL_MICROS) {
      next.status = 'active';
      next.activatedAt = ctx.timestamp;
      for (const p of cluster) bumpHuddlesJoined(ctx, h.roomId, p.identity);
      emitEvent(ctx, h.roomId, 'huddle_activated', `🔥 Huddle activated (${cluster.length})`, {
        huddleId: h.id,
        lat: c.lat,
        lng: c.lng,
      });
    }
  }

  // 4. Warmth tick for active huddles (fold into the same row write).
  if (
    next.status === 'active' &&
    now - h.lastWarmthTickAt.microsSinceUnixEpoch >= WARMTH_MICROS
  ) {
    next.warmth = h.warmth + WARMTH_PER_TICK;
    next.lastWarmthTickAt = ctx.timestamp;
    for (const p of cluster) bumpWarmthPoints(ctx, h.roomId, p.identity);
  }

  ctx.db.huddle.id.update(next);
}

function bumpHuddlesJoined(ctx: any, roomId: bigint, identity: any): void {
  const sc = [...ctx.db.score.by_room_user.filter([roomId, identity])][0];
  if (sc) ctx.db.score.id.update({ ...sc, huddlesJoined: sc.huddlesJoined + 1 });
}

function bumpWarmthPoints(ctx: any, roomId: bigint, identity: any): void {
  const sc = [...ctx.db.score.by_room_user.filter([roomId, identity])][0];
  if (sc) {
    ctx.db.score.id.update({
      ...sc,
      warmthPoints: sc.warmthPoints + POINTS_PER_TICK,
      totalHuddleTime: sc.totalHuddleTime + BigInt(WARMTH_TICK_SECONDS),
    });
  }
}

function declineHuddle(ctx: any, h: any, now: bigint): void {
  // The huddle's group dissolved (below MIN_USERS, dispersed, or went stale).
  if (h.status === 'active') {
    markAllLeft(ctx, h.id);
    ctx.db.huddle.id.update({ ...h, status: 'cooling', coolingStartedAt: ctx.timestamp });
    emitEvent(ctx, h.roomId, 'huddle_cooling', 'Huddle cooling', { huddleId: h.id });
  } else if (h.status === 'candidate') {
    // Candidate grace: don't kill a forming huddle on a single jittery tick. Reuse
    // coolingStartedAt (unused while 'candidate') as the grace clock; end only if the
    // cluster stays gone past CANDIDATE_GRACE. Dwell (candidateStartedAt) is NOT reset.
    if (h.coolingStartedAt == null) {
      ctx.db.huddle.id.update({ ...h, coolingStartedAt: ctx.timestamp });
    } else if (now - h.coolingStartedAt.microsSinceUnixEpoch >= CANDIDATE_GRACE_MICROS) {
      endHuddle(ctx, h, 'Huddle dispersed before forming');
    }
  } else if (h.status === 'cooling') {
    const startedAt = h.coolingStartedAt?.microsSinceUnixEpoch ?? now;
    if (now - startedAt >= COOLING_MICROS) endHuddle(ctx, h, recapMessage(h, now));
  }
}

function recapMessage(h: any, now: bigint): string {
  const startMicros =
    h.activatedAt?.microsSinceUnixEpoch ?? h.candidateStartedAt.microsSinceUnixEpoch;
  const seconds = Number((now - startMicros) / 1_000_000n);
  return `Huddle ended after ${seconds}s · ${Math.round(h.warmth)} warmth`;
}

function markAllLeft(ctx: any, huddleId: bigint): void {
  for (const m of ctx.db.huddleMember.huddleId.filter([huddleId])) {
    if (m.leftAt == null) ctx.db.huddleMember.id.update({ ...m, leftAt: ctx.timestamp });
  }
}

function endHuddle(ctx: any, h: any, message: string): void {
  markAllLeft(ctx, h.id);
  ctx.db.huddle.id.update({ ...h, status: 'ended', endedAt: ctx.timestamp, memberCount: 0 });
  emitEvent(ctx, h.roomId, 'huddle_ended', message, { huddleId: h.id });
}

// Scheduled ~1s: advance every room's huddle state on time, even when nobody moves.
export const huddleTick = spacetimedb.reducer(
  { timer: huddleTickTimer.rowType },
  (ctx, { timer: _timer }) => {
    const roomIds = new Set<bigint>();
    for (const p of ctx.db.presence.iter()) roomIds.add(p.roomId);
    const sorted = [...roomIds].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
    for (const roomId of sorted) runHuddleEngine(ctx, roomId);
  }
);

// Scheduled ~5s: mark users stale once last_seen is too old; re-run affected rooms.
export const expireStalePresence = spacetimedb.reducer(
  { timer: presenceTickTimer.rowType },
  (ctx, { timer: _timer }) => {
    const now = nowMicros(ctx);
    for (const p of ctx.db.presence.iter()) {
      if (p.status === 'active' && now - p.lastSeen.microsSinceUnixEpoch > STALE_MICROS) {
        ctx.db.presence.identity.update({ ...p, status: 'stale' });
      }
    }
    // No engine re-run here: the 1s huddleTick already drops newly-stale users from
    // their clusters on its next pass (single-clock model).
  }
);

// Scheduled ~30s: decay huddle warmth so the map reflects recent activity.
export const decayHuddles = spacetimedb.reducer(
  { timer: decayTickTimer.rowType },
  (ctx, { timer: _timer }) => {
    for (const h of ctx.db.huddle.iter()) {
      if (h.status === 'ended') continue;
      const w = Math.max(0, h.warmth - DECAY_AMOUNT);
      if (w !== h.warmth) ctx.db.huddle.id.update({ ...h, warmth: w });
    }
    // Decay heatmap cells multiplicatively (smooth + snappy); drop faint ones.
    for (const c of [...ctx.db.heatCell.iter()]) {
      const w = c.weight * HEAT_DECAY_FACTOR;
      if (w < HEAT_MIN) ctx.db.heatCell.id.delete(c.id);
      else ctx.db.heatCell.id.update({ ...c, weight: w });
    }
  }
);

// ═════════════════════════════════════════════════════════════════════════════
// DEMO BOTS — server-simulated movers (no real client connection)
//
// botTick (≈1.5s) auto-spawns bots in the `demo` room once a real user has a fix,
// moves them on a deterministic script, keeps the heatmap rich, and despawns them
// when no real users remain. Bots reuse the engine untouched: they're just extra
// `presence` rows that huddleTick clusters like anyone else. `heartbeatLocation`
// can't be reused (it keys off ctx.sender), so botTick writes the same fields it
// would: presence lat/lng + bumpHeat. Determinism: motion is a pure function of
// ctx.timestamp; ctx.random is used only to mint identities + jitter at spawn.
// ═════════════════════════════════════════════════════════════════════════════

// Mint a synthetic Identity. Persisted in bot/user/presence rows so it's stable
// across ticks. Real clients use a different path, so collisions are not a concern.
function mintBotIdentity(ctx: any): any {
  return new Identity(ctx.random.bigintInRange(0n, (1n << 256n) - 1n));
}

// Meters → degrees offset at a given latitude (lat is ~constant; lng shrinks by cos).
function metersToLatLng(dxMeters: number, dyMeters: number, atLat: number): { dLat: number; dLng: number } {
  const dLat = dyMeters / 111_320;
  const dLng = dxMeters / (111_320 * Math.cos((atLat * Math.PI) / 180));
  return { dLat, dLng };
}

// The set of bot identities in a room (so we can tell humans from bots).
function botIdsInRoom(ctx: any, roomId: bigint): Set<string> {
  const bots = new Set<string>();
  for (const b of ctx.db.bot.roomId.filter(roomId)) bots.add(idHex(b.identity));
  return bots;
}

// A "human" is a real (non-bot) presence with a fix that was seen recently. We key on
// RECENCY (lastSeen within the stale window), not on connection `status`: a browser
// heartbeats every ~3s so it stays recent, but a one-shot disconnect (wifi blip, or a
// `spacetime call`) flips status to 'offline' instantly — recency rides that out so the
// demo doesn't collapse on a transient drop. A closed tab still ages out and despawns.
function realHumansInRoom(ctx: any, roomId: bigint): any[] {
  const now = nowMicros(ctx);
  const bots = botIdsInRoom(ctx, roomId);
  return [...ctx.db.presence.roomId.filter(roomId)]
    .filter(
      (p: any) =>
        !bots.has(idHex(p.identity)) &&
        p.hasFix &&
        now - p.lastSeen.microsSinceUnixEpoch <= STALE_MICROS
    )
    .sort((a: any, b: any) => cmpIdentity(a.identity, b.identity));
}

// A real (non-bot), located, recent presence in the room — the spawn/despawn anchor.
function realAnchorPresence(ctx: any, roomId: bigint): any | null {
  return realHumansInRoom(ctx, roomId)[0] ?? null;
}

// True if any human is "around" (a recent real presence). Used to decide despawn.
function hasRealUser(ctx: any, roomId: bigint): boolean {
  return realHumansInRoom(ctx, roomId).length > 0;
}

// Spawn the bot fleet around `anchor`: BOT_HUDDLER_COUNT huddlers (share one
// rendezvous near the anchor) + BOT_WANDERER_COUNT wanderers (homes scattered over
// the area). Each gets user + presence + score + bot rows. Also seeds an instant
// heat burst so the map is alive on the very next frame.
function spawnBots(ctx: any, roomId: bigint, anchor: { lat: number; lng: number }): void {
  // Shared rendezvous for the huddlers — a fixed offset from the anchor.
  const rdv = metersToLatLng(BOT_RENDEZVOUS_OFFSET_M, BOT_RENDEZVOUS_OFFSET_M, anchor.lat);
  const rendezvous = { lat: anchor.lat + rdv.dLat, lng: anchor.lng + rdv.dLng };

  let nameIdx = 0;
  const nextName = () => BOT_NAMES[nameIdx++ % BOT_NAMES.length];

  const insertBot = (kind: string, home: { lat: number; lng: number }, paramA: number) => {
    const identity = mintBotIdentity(ctx);
    const name = nextName();
    ctx.db.user.insert({ identity, name, createdAt: ctx.timestamp });
    ctx.db.presence.insert({
      identity,
      roomId,
      lat: home.lat,
      lng: home.lng,
      hasFix: true,
      lastSeen: ctx.timestamp,
      status: 'active',
    });
    ctx.db.score.insert({
      id: 0n,
      roomId,
      identity,
      warmthPoints: 0,
      huddlesJoined: 0,
      totalHuddleTime: 0n,
    });
    ctx.db.bot.insert({
      identity,
      roomId,
      name,
      kind,
      homeLat: home.lat,
      homeLng: home.lng,
      paramA,
      spawnedAt: ctx.timestamp,
    });
  };

  // Huddlers: home = the shared rendezvous; spread them by phase so they sit close.
  for (let i = 0; i < BOT_HUDDLER_COUNT; i++) {
    const phase = (i / Math.max(1, BOT_HUDDLER_COUNT)) * 2 * Math.PI;
    insertBot('huddler', rendezvous, phase);
  }

  // Wanderers: homes scattered in an annulus around the anchor (min..max radius) so
  // they read as separate pods spread across the map, not one blob over the huddlers.
  for (let i = 0; i < BOT_WANDERER_COUNT; i++) {
    const ang = ((i + 0.5) / BOT_WANDERER_COUNT) * 2 * Math.PI + ctx.random() * 0.6; // fan out, slight jitter
    const dist =
      BOT_WANDERER_MIN_SPREAD_M +
      (BOT_AREA_SPREAD_M - BOT_WANDERER_MIN_SPREAD_M) * ctx.random();
    const off = metersToLatLng(Math.cos(ang) * dist, Math.sin(ang) * dist, anchor.lat);
    const home = { lat: anchor.lat + off.dLat, lng: anchor.lng + off.dLng };
    insertBot('wanderer', home, ctx.random() * 2 * Math.PI);
  }

  // Instant heat: scatter a burst of bumps around the anchor so the heatmap is
  // populated immediately instead of accumulating over the first ~15s.
  seedHeatBurst(ctx, roomId, anchor);

  emitEvent(ctx, roomId, 'user_joined', `${BOT_HUDDLER_COUNT + BOT_WANDERER_COUNT} people are around`);
}

// Scatter heat across cells around the anchor (called once at spawn).
function seedHeatBurst(ctx: any, roomId: bigint, anchor: { lat: number; lng: number }): void {
  for (let i = 0; i < BOT_AMBIENT_HOTSPOTS; i++) {
    const ang = (i / BOT_AMBIENT_HOTSPOTS) * 2 * Math.PI;
    const dist = BOT_AREA_SPREAD_M * (0.3 + 0.7 * ctx.random());
    const off = metersToLatLng(Math.cos(ang) * dist, Math.sin(ang) * dist, anchor.lat);
    // Bump a few times so the cell starts well above the decay-delete floor.
    for (let k = 0; k < 3; k++) bumpHeat(ctx, roomId, anchor.lat + off.dLat, anchor.lng + off.dLng);
  }
}

// Keep a fixed ring of "hotspot" cells warm every tick (cafes/parks staying busy),
// so the heatmap looks city-alive even where no avatar stands. Hotspots are derived
// deterministically from the anchor, so they're stable for the demo's duration.
function warmAmbientHotspots(ctx: any, roomId: bigint, anchor: { lat: number; lng: number }): void {
  for (let i = 0; i < BOT_AMBIENT_HOTSPOTS; i++) {
    const ang = (i / BOT_AMBIENT_HOTSPOTS) * 2 * Math.PI;
    // Fixed (no random) radius so the same cells get re-warmed each tick.
    const dist = BOT_AREA_SPREAD_M * (0.35 + 0.5 * ((i % 3) / 2));
    const off = metersToLatLng(Math.cos(ang) * dist, Math.sin(ang) * dist, anchor.lat);
    bumpHeat(ctx, roomId, anchor.lat + off.dLat, anchor.lng + off.dLng);
  }
}

// Deterministic next position for one bot, as a pure function of elapsed time.
function botPosition(ctx: any, b: any, now: bigint): { lat: number; lng: number } {
  const tSeconds = Number(now / 1_000_000n);
  if (b.kind === 'wanderer') {
    const angle = b.paramA + tSeconds * BOT_ORBIT_SPEED;
    const off = metersToLatLng(
      Math.cos(angle) * BOT_ORBIT_RADIUS_M,
      Math.sin(angle) * BOT_ORBIT_RADIUS_M,
      b.homeLat
    );
    return { lat: b.homeLat + off.dLat, lng: b.homeLng + off.dLng };
  }

  // Huddler: homeLat/Lng IS the shared rendezvous. Smoothly blend between a tight
  // orbit at the rendezvous (clustered → huddle forms) and a scatter point ~220m out
  // (dispersed → huddle cools/ends), then back, so the full loop repeats every cycle.
  // `scatter` ∈ [0,1]: 0 = clustered, 1 = fully dispersed. Easing avoids teleporting.
  const cycle = BOT_RENDEZVOUS_HOLD_S + BOT_RENDEZVOUS_GAP_S;
  const phaseInCycle = ((tSeconds % cycle) + cycle) % cycle;
  const scatter =
    phaseInCycle < BOT_RENDEZVOUS_HOLD_S
      ? 0
      : Math.sin(((phaseInCycle - BOT_RENDEZVOUS_HOLD_S) / BOT_RENDEZVOUS_GAP_S) * Math.PI); // 0→1→0

  // Liveliness orbit while clustered (small radius); scatter target is fixed per bot.
  const orbitAngle = b.paramA + tSeconds * 0.4;
  const orbit = metersToLatLng(
    Math.cos(orbitAngle) * BOT_RENDEZVOUS_RADIUS_M,
    Math.sin(orbitAngle) * BOT_RENDEZVOUS_RADIUS_M,
    b.homeLat
  );
  const flee = metersToLatLng(
    Math.cos(b.paramA) * BOT_SCATTER_RADIUS_M,
    Math.sin(b.paramA) * BOT_SCATTER_RADIUS_M,
    b.homeLat
  );
  return {
    lat: b.homeLat + orbit.dLat * (1 - scatter) + flee.dLat * scatter,
    lng: b.homeLng + orbit.dLng * (1 - scatter) + flee.dLng * scatter,
  };
}

// Remove the whole fleet + their derived rows (reset between demos).
function despawnBots(ctx: any, roomId: bigint): void {
  for (const b of [...ctx.db.bot.roomId.filter(roomId)]) {
    const identity = b.identity;
    if (ctx.db.presence.identity.find(identity)) ctx.db.presence.identity.delete(identity);
    if (ctx.db.user.identity.find(identity)) ctx.db.user.identity.delete(identity);
    for (const sc of [...ctx.db.score.by_room_user.filter([roomId, identity])]) {
      ctx.db.score.id.delete(sc.id);
    }
    ctx.db.bot.identity.delete(identity);
  }
  // The next huddleTick sees the bots gone and ends any now-empty huddles.
}

// Scheduled ≈1.5s: drive the demo bots. Spawn-if-needed, move, keep heat warm, or
// despawn — all scoped to the `demo` room only.
export const botTick = spacetimedb.reducer(
  { timer: botTickTimer.rowType },
  (ctx, { timer: _timer }) => {
    const demoRoom = ctx.db.room.code.find(DEMO_ROOM_CODE);
    if (!demoRoom) return; // nobody has created the demo room yet
    const roomId = demoRoom.id;
    const now = nowMicros(ctx);

    const existingBots = [...ctx.db.bot.roomId.filter(roomId)];

    // Despawn when the humans have all left, so the next demo starts clean.
    if (!hasRealUser(ctx, roomId)) {
      if (existingBots.length > 0) despawnBots(ctx, roomId);
      return;
    }

    // Spawn once a real user has an actual fix to anchor on.
    if (existingBots.length === 0) {
      const anchor = realAnchorPresence(ctx, roomId);
      if (anchor) spawnBots(ctx, roomId, { lat: anchor.lat, lng: anchor.lng });
      return; // give the new presence rows a tick to settle before moving them
    }

    // Move every bot + bump its heat (same writes a real heartbeat performs).
    for (const b of existingBots) {
      const p = ctx.db.presence.identity.find(b.identity);
      if (!p) continue;
      const pos = botPosition(ctx, b, now);
      ctx.db.presence.identity.update({
        ...p,
        lat: pos.lat,
        lng: pos.lng,
        hasFix: true,
        lastSeen: ctx.timestamp,
        status: 'active',
      });
      bumpHeat(ctx, roomId, pos.lat, pos.lng);
    }

    // Keep the ambient hotspots warm so the heatmap stays rich between bot paths.
    const anchor = realAnchorPresence(ctx, roomId) ?? { lat: existingBots[0].homeLat, lng: existingBots[0].homeLng };
    warmAmbientHotspots(ctx, roomId, { lat: anchor.lat, lng: anchor.lng });
  }
);

// ═════════════════════════════════════════════════════════════════════════════
// LIFECYCLE
// ═════════════════════════════════════════════════════════════════════════════

// Schedule the three repeating ticks. (Empty-body ticks are harmless no-ops until
// Parts 1/2 fill them in — but this proves scheduling is wired end-to-end.)
export const init = spacetimedb.init((ctx) => {
  ctx.db.huddleTickTimer.insert({ scheduledId: 0n, scheduledAt: ScheduleAt.interval(HUDDLE_TICK_MICROS) });
  ctx.db.presenceTickTimer.insert({ scheduledId: 0n, scheduledAt: ScheduleAt.interval(PRESENCE_TICK_MICROS) });
  ctx.db.decayTickTimer.insert({ scheduledId: 0n, scheduledAt: ScheduleAt.interval(DECAY_TICK_MICROS) });
  ctx.db.botTickTimer.insert({ scheduledId: 0n, scheduledAt: ScheduleAt.interval(BOT_TICK_MICROS) });
});

export const onConnect = spacetimedb.clientConnected((ctx) => {
  const p = ctx.db.presence.identity.find(ctx.sender);
  if (p) ctx.db.presence.identity.update({ ...p, status: 'active', lastSeen: ctx.timestamp });
});

export const onDisconnect = spacetimedb.clientDisconnected((ctx) => {
  const p = ctx.db.presence.identity.find(ctx.sender);
  if (!p) return;
  ctx.db.presence.identity.update({ ...p, status: 'offline', lastSeen: ctx.timestamp });
  // The next huddleTick removes them from any huddle (single-clock model).
});

// DECAY_INTERVAL_SECONDS documents the decay cadence (encoded in DECAY_TICK_MICROS).
void [DECAY_INTERVAL_SECONDS];
