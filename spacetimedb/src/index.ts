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
import { ScheduleAt } from 'spacetimedb';

// ═════════════════════════════════════════════════════════════════════════════
// CONSTANTS  (hackathon demo values — see HUDDLE_LOGIC.md "Constants")
// ═════════════════════════════════════════════════════════════════════════════
const MIN_USERS_FOR_HUDDLE = 2;
const PROXIMITY_RADIUS_METERS = 100; // two users this close count as "together"
const DWELL_THRESHOLD_SECONDS = 10;
const WARMTH_TICK_SECONDS = 5;
const COOLING_THRESHOLD_SECONDS = 10;
const PRESENCE_STALE_SECONDS = 15;
const WARMTH_PER_TICK = 5;
const POINTS_PER_TICK = 5;
const DECAY_INTERVAL_SECONDS = 30;
const DECAY_AMOUNT = 2;

// Scheduled tick cadences, in microseconds.
const HUDDLE_TICK_MICROS = 1_000_000n; // 1s — runs the huddle state machine
const PRESENCE_TICK_MICROS = 5_000_000n; // 5s — expire stale presence
const DECAY_TICK_MICROS = 30_000_000n; // 30s — cool huddle warmth

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

// ═════════════════════════════════════════════════════════════════════════════
// SCHEMA
// ═════════════════════════════════════════════════════════════════════════════
const spacetimedb = schema({
  // Part 1
  user,
  room,
  presence,
  // Part 2
  huddle,
  huddleMember,
  event,
  score,
  // scheduled
  huddleTickTimer,
  presenceTickTimer,
  decayTickTimer,
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

    // Seam to Part 2: re-cluster this room now that someone moved.
    runHuddleEngine(ctx, p.roomId);
  }
);

// Leave: mark the caller offline. Part 2's engine detaches them from any huddle.
export const leaveRoom = spacetimedb.reducer((ctx) => {
  const p = ctx.db.presence.identity.find(ctx.sender);
  if (!p) return;
  ctx.db.presence.identity.update({ ...p, status: 'offline', lastSeen: ctx.timestamp });

  const who = ctx.db.user.identity.find(ctx.sender)?.name ?? 'Someone';
  emitEvent(ctx, p.roomId, 'user_left', `${who} left`);

  runHuddleEngine(ctx, p.roomId);
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

// ═════════════════════════════════════════════════════════════════════════════
// PART 2 — engine + scheduled reducers (signatures locked; bodies are stubs)
// ═════════════════════════════════════════════════════════════════════════════

// The huddle state machine. Plain helper so BOTH the scheduled tick and Part 1's
// heartbeatLocation can run it. Reads `presence` (read-only) and mutates
// huddle / huddle_member / score. Clusters fresh users by PROXIMITY_RADIUS_METERS.
function runHuddleEngine(_ctx: any, _roomId: bigint): void {
  // TODO (Part 2): cluster freshUsersNear-style by proximity; candidate → active →
  // cooling → ended per HUDDLE_LOGIC.md; warm + score active huddles.
}

// Scheduled ~1s: advance every room's huddle state on time.
export const huddleTick = spacetimedb.reducer(
  { timer: huddleTickTimer.rowType },
  (_ctx, { timer: _timer }) => {
    // TODO (Part 2): for each room, runHuddleEngine(...).
  }
);

// Scheduled ~5s: mark users stale/offline once last_seen is too old; cool affected huddles.
export const expireStalePresence = spacetimedb.reducer(
  { timer: presenceTickTimer.rowType },
  (_ctx, { timer: _timer }) => {
    // TODO (Part 2): now - lastSeen > PRESENCE_STALE_SECONDS → status='stale'; cool huddles.
  }
);

// Scheduled ~30s: decay huddle warmth so the map reflects recent activity.
export const decayHuddles = spacetimedb.reducer(
  { timer: decayTickTimer.rowType },
  (_ctx, { timer: _timer }) => {
    // TODO (Part 2): warmth = max(0, warmth - DECAY_AMOUNT); optional cooled event.
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
});

export const onConnect = spacetimedb.clientConnected((ctx) => {
  const p = ctx.db.presence.identity.find(ctx.sender);
  if (p) ctx.db.presence.identity.update({ ...p, status: 'active', lastSeen: ctx.timestamp });
});

export const onDisconnect = spacetimedb.clientDisconnected((ctx) => {
  const p = ctx.db.presence.identity.find(ctx.sender);
  if (!p) return;
  ctx.db.presence.identity.update({ ...p, status: 'offline', lastSeen: ctx.timestamp });
  runHuddleEngine(ctx, p.roomId);
});

// Silence "unused" for Part 2 constants the engine stub doesn't reference yet.
void [
  MIN_USERS_FOR_HUDDLE, DWELL_THRESHOLD_SECONDS, WARMTH_TICK_SECONDS,
  COOLING_THRESHOLD_SECONDS, WARMTH_PER_TICK, POINTS_PER_TICK,
  DECAY_INTERVAL_SECONDS, DECAY_AMOUNT,
];
