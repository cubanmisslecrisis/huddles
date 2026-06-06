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
// PART 2 — engine + scheduled reducers
// ═════════════════════════════════════════════════════════════════════════════

// Build proximity clusters from a list of fresh presence rows.
// Greedy O(n²) — fine for demo-scale rooms (<20 users).
// Returns arrays of presence rows, one array per cluster.
function buildClusters(users: any[]): any[][] {
  const assigned = new Set<number>();
  const clusters: any[][] = [];
  for (let i = 0; i < users.length; i++) {
    if (assigned.has(i)) continue;
    const cluster = [users[i]];
    assigned.add(i);
    for (let j = i + 1; j < users.length; j++) {
      if (assigned.has(j)) continue;
      if (distanceMeters(users[i].lat, users[i].lng, users[j].lat, users[j].lng) <= PROXIMITY_RADIUS_METERS) {
        cluster.push(users[j]);
        assigned.add(j);
      }
    }
    clusters.push(cluster);
  }
  return clusters;
}

// Centroid of a cluster.
function centroid(cluster: any[]): { lat: number; lng: number } {
  const lat = cluster.reduce((s: number, p: any) => s + p.lat, 0) / cluster.length;
  const lng = cluster.reduce((s: number, p: any) => s + p.lng, 0) / cluster.length;
  return { lat, lng };
}

// Find an existing non-ended huddle for this room whose centroid is near (lat,lng).
function findHuddleNear(ctx: any, roomId: bigint, lat: number, lng: number): any | null {
  for (const h of ctx.db.huddle.roomId.filter(roomId)) {
    if (h.status !== 'ended' && distanceMeters(lat, lng, h.lat, h.lng) <= PROXIMITY_RADIUS_METERS) {
      return h;
    }
  }
  return null;
}

// Upsert a score row: add warmth points and bump huddlesJoined on first join.
function addScore(ctx: any, roomId: bigint, identity: any, warmth: number, firstJoin: boolean): void {
  const rows = [...ctx.db.score.by_room_user.filter([roomId, identity])];
  if (rows.length === 0) return; // shouldn't happen — joinRoom inserts it
  const s = rows[0];
  ctx.db.score.id.update({
    ...s,
    warmthPoints: s.warmthPoints + warmth,
    huddlesJoined: s.huddlesJoined + (firstJoin ? 1 : 0),
    totalHuddleTime: s.totalHuddleTime + BigInt(WARMTH_TICK_SECONDS),
  });
}

// The huddle state machine. Called inline from Part 1 reducers (instant feedback)
// and from the scheduled huddleTick (time-driven correctness).
function runHuddleEngine(ctx: any, roomId: bigint): void {
  const now = nowMicros(ctx);

  // Fresh, active, GPS-fixed users in this room.
  const freshUsers = [...ctx.db.presence.roomId.filter(roomId)].filter(
    (p: any) =>
      p.status === 'active' &&
      p.hasFix &&
      now - p.lastSeen.microsSinceUnixEpoch <= STALE_MICROS
  );

  const clusters = buildClusters(freshUsers).filter((c) => c.length >= MIN_USERS_FOR_HUDDLE);

  // Track which huddle IDs are "covered" by a cluster this tick.
  const coveredHuddleIds = new Set<bigint>();

  for (const cluster of clusters) {
    const c = centroid(cluster);
    let huddle = findHuddleNear(ctx, roomId, c.lat, c.lng);

    if (!huddle) {
      // Create a candidate.
      huddle = ctx.db.huddle.insert({
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
          huddleId: huddle.id,
          identity: p.identity,
          joinedAt: ctx.timestamp,
          lastSeenInHuddle: ctx.timestamp,
          leftAt: undefined,
        });
      }
      const names = cluster
        .map((p: any) => ctx.db.user.identity.find(p.identity)?.name ?? 'Someone')
        .join(' + ');
      emitEvent(ctx, roomId, 'huddle_forming', `Huddle forming: ${names}`, { huddleId: huddle.id, lat: c.lat, lng: c.lng });
      coveredHuddleIds.add(huddle.id);
      continue;
    }

    coveredHuddleIds.add(huddle.id);

    // Sync members: update centroid + memberCount.
    const clusterIdentities = new Set(cluster.map((p: any) => p.identity.toHexString()));
    const existingMembers = [...ctx.db.huddleMember.huddleId.filter(huddle.id)];

    // Mark departed members.
    for (const m of existingMembers) {
      if (!m.leftAt && !clusterIdentities.has(m.identity.toHexString())) {
        ctx.db.huddleMember.id.update({ ...m, leftAt: ctx.timestamp });
      }
    }

    // Add new members or refresh lastSeenInHuddle.
    const memberIdentityHexes = new Set(existingMembers.map((m: any) => m.identity.toHexString()));
    for (const p of cluster) {
      const hex = p.identity.toHexString();
      if (!memberIdentityHexes.has(hex)) {
        ctx.db.huddleMember.insert({
          id: 0n,
          huddleId: huddle.id,
          identity: p.identity,
          joinedAt: ctx.timestamp,
          lastSeenInHuddle: ctx.timestamp,
          leftAt: undefined,
        });
      } else {
        const m = existingMembers.find((m: any) => m.identity.toHexString() === hex);
        if (m) ctx.db.huddleMember.id.update({ ...m, lastSeenInHuddle: ctx.timestamp, leftAt: undefined });
      }
    }

    // Refresh huddle centroid + memberCount.
    huddle = { ...huddle, lat: c.lat, lng: c.lng, memberCount: cluster.length };

    // State transitions.
    if (huddle.status === 'cooling') {
      huddle = { ...huddle, status: 'active', coolingStartedAt: undefined };
      ctx.db.huddle.id.update(huddle);
      emitEvent(ctx, roomId, 'huddle_activated', 'Huddle reactivated!', { huddleId: huddle.id, lat: c.lat, lng: c.lng });
    } else if (huddle.status === 'candidate') {
      const dwellMicros = BigInt(DWELL_THRESHOLD_SECONDS) * 1_000_000n;
      if (now - huddle.candidateStartedAt.microsSinceUnixEpoch >= dwellMicros) {
        huddle = { ...huddle, status: 'active', activatedAt: ctx.timestamp };
        ctx.db.huddle.id.update(huddle);
        const names = cluster
          .map((p: any) => ctx.db.user.identity.find(p.identity)?.name ?? 'Someone')
          .join(' + ');
        emitEvent(ctx, roomId, 'huddle_activated', `🔥 Huddle activated: ${names}`, { huddleId: huddle.id, lat: c.lat, lng: c.lng });
      } else {
        ctx.db.huddle.id.update(huddle);
      }
    } else {
      ctx.db.huddle.id.update(huddle);
    }

    // Warmth tick (only when active).
    if (huddle.status === 'active') {
      const tickMicros = BigInt(WARMTH_TICK_SECONDS) * 1_000_000n;
      if (now - huddle.lastWarmthTickAt.microsSinceUnixEpoch >= tickMicros) {
        const newWarmth = huddle.warmth + WARMTH_PER_TICK;
        ctx.db.huddle.id.update({ ...huddle, warmth: newWarmth, lastWarmthTickAt: ctx.timestamp });
        // Award points to each cluster member.
        let firstJoinCheck = false;
        for (const p of cluster) {
          const isNew = !existingMembers.some((m: any) => m.identity.toHexString() === p.identity.toHexString());
          if (!firstJoinCheck && isNew) firstJoinCheck = true;
          addScore(ctx, roomId, p.identity, POINTS_PER_TICK, isNew);
        }
        emitEvent(ctx, roomId, 'huddle_warmed', `Zone warmed +${WARMTH_PER_TICK}`, { huddleId: huddle.id, lat: c.lat, lng: c.lng });
      }
    }
  }

  // Handle huddles not covered by any cluster this tick.
  for (const h of [...ctx.db.huddle.roomId.filter(roomId)]) {
    if (h.status === 'ended' || coveredHuddleIds.has(h.id)) continue;

    if (h.status === 'active') {
      ctx.db.huddle.id.update({ ...h, status: 'cooling', coolingStartedAt: ctx.timestamp });
      emitEvent(ctx, roomId, 'huddle_cooling', 'Huddle cooling…', { huddleId: h.id, lat: h.lat, lng: h.lng });
    } else if (h.status === 'candidate') {
      ctx.db.huddle.id.update({ ...h, status: 'ended', endedAt: ctx.timestamp });
    } else if (h.status === 'cooling') {
      const coolMicros = BigInt(COOLING_THRESHOLD_SECONDS) * 1_000_000n;
      if (now - h.coolingStartedAt!.microsSinceUnixEpoch >= coolMicros) {
        ctx.db.huddle.id.update({ ...h, status: 'ended', endedAt: ctx.timestamp });
        // Duration from activation, or candidate start if never activated.
        const startMicros = h.activatedAt
          ? h.activatedAt.microsSinceUnixEpoch
          : h.candidateStartedAt.microsSinceUnixEpoch;
        const durationSec = Number((now - startMicros) / 1_000_000n);
        emitEvent(ctx, roomId, 'huddle_ended', `Huddle ended after ${durationSec}s`, { huddleId: h.id, lat: h.lat, lng: h.lng });
      }
    }
  }
}

// Scheduled ~1s: advance every room's huddle state on time.
export const huddleTick = spacetimedb.reducer(
  { timer: huddleTickTimer.rowType },
  (ctx, { timer: _timer }) => {
    const roomIds = new Set<bigint>([...ctx.db.presence.iter()].map((p: any) => p.roomId));
    for (const roomId of roomIds) {
      runHuddleEngine(ctx, roomId);
    }
  }
);

// Scheduled ~5s: mark users stale once last_seen is too old; run engine so cooling starts.
export const expireStalePresence = spacetimedb.reducer(
  { timer: presenceTickTimer.rowType },
  (ctx, { timer: _timer }) => {
    const now = nowMicros(ctx);
    const stalledRooms = new Set<bigint>();
    for (const p of [...ctx.db.presence.iter()]) {
      if (p.status === 'active' && now - p.lastSeen.microsSinceUnixEpoch > STALE_MICROS) {
        ctx.db.presence.identity.update({ ...p, status: 'stale' });
        stalledRooms.add(p.roomId);
      }
    }
    for (const roomId of stalledRooms) {
      runHuddleEngine(ctx, roomId);
    }
  }
);

// Scheduled ~30s: decay huddle warmth so the map reflects recent activity.
export const decayHuddles = spacetimedb.reducer(
  { timer: decayTickTimer.rowType },
  (ctx, { timer: _timer }) => {
    for (const h of [...ctx.db.huddle.iter()]) {
      if (h.status !== 'ended' && h.warmth > 0) {
        ctx.db.huddle.id.update({ ...h, warmth: Math.max(0, h.warmth - DECAY_AMOUNT) });
      }
    }
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

