// ─────────────────────────────────────────────────────────────────────────────
// Huddle — SpacetimeDB module
//
// Friends form live "huddles". Like penguins huddling for warmth, a bigger and
// longer huddle generates more "warmth" in real time (a 1s scheduled tick),
// which drives a shared map of warmed places and a live leaderboard.
// ─────────────────────────────────────────────────────────────────────────────
import { schema, t, table, SenderError } from 'spacetimedb/server';
import { ScheduleAt } from 'spacetimedb';

// Warmth added per member, per tick (the tick fires once per second — see `init`).
const WARMTH_PER_MEMBER_PER_TICK = 1.0;

// Penguin avatar colors, assigned on first connect.
const PALETTE = [
  '#7FD1FF', '#FFB3C7', '#FFE08A', '#B5E8A0',
  '#C9B6FF', '#FFC09A', '#9AE6D0', '#FF9AA2',
];

// ── Tables ──────────────────────────────────────────────────────────────────

const player = table(
  { name: 'player', public: true },
  {
    identity: t.identity().primaryKey(),
    name: t.string().optional(),
    penguin_color: t.string(),
    online: t.bool(),
  }
);

const huddle = table(
  { name: 'huddle', public: true },
  {
    id: t.u64().primaryKey().autoInc(),
    name: t.string(),
    created_by: t.identity(),
    created_at: t.timestamp(),
    lat: t.f64(),
    lng: t.f64(),
    place_label: t.string(),
    warmth: t.f64(),
    member_count: t.u32(),
    active: t.bool(),
  }
);

const huddleMember = table(
  { name: 'huddle_member', public: true },
  {
    id: t.u64().primaryKey().autoInc(),
    huddle_id: t.u64().index('btree'),
    identity: t.identity(),
    joined_at: t.timestamp(),
  }
);

// Scheduled table that drives the warmth tick. `(): any => tick` defers the
// reference so the table and the reducer can refer to each other.
const warmthTimer = table(
  { name: 'warmth_timer', scheduled: (): any => tick },
  {
    scheduled_id: t.u64().primaryKey().autoInc(),
    scheduled_at: t.scheduleAt(),
  }
);

const spacetimedb = schema({ player, huddle, huddleMember, warmthTimer });
export default spacetimedb;

// ── Lifecycle ─────────────────────────────────────────────────────────────────

// Runs once when the module is first published. Start the repeating warmth tick.
export const init = spacetimedb.init((ctx) => {
  // 1_000_000 microseconds = 1 second.
  ctx.db.warmthTimer.insert({
    scheduled_id: 0n,
    scheduled_at: ScheduleAt.interval(1_000_000n),
  });
});

export const onConnect = spacetimedb.clientConnected((ctx) => {
  const existing = ctx.db.player.identity.find(ctx.sender);
  if (existing) {
    ctx.db.player.identity.update({ ...existing, online: true });
  } else {
    const color = PALETTE[ctx.random.integerInRange(0, PALETTE.length - 1)];
    ctx.db.player.insert({
      identity: ctx.sender,
      name: undefined,
      penguin_color: color,
      online: true,
    });
  }
});

export const onDisconnect = spacetimedb.clientDisconnected((ctx) => {
  const existing = ctx.db.player.identity.find(ctx.sender);
  if (existing) {
    ctx.db.player.identity.update({ ...existing, online: false });
  }
});

// ── Reducers ──────────────────────────────────────────────────────────────────

export const set_profile = spacetimedb.reducer(
  { name: t.string(), penguin_color: t.string() },
  (ctx, { name, penguin_color }) => {
    if (!name) throw new SenderError('Name must not be empty');
    const p = ctx.db.player.identity.find(ctx.sender);
    if (!p) throw new SenderError('Unknown player');
    ctx.db.player.identity.update({ ...p, name, penguin_color });
  }
);

export const create_huddle = spacetimedb.reducer(
  {
    name: t.string(),
    lat: t.f64(),
    lng: t.f64(),
    place_label: t.string(),
  },
  (ctx, { name, lat, lng, place_label }) => {
    if (!name) throw new SenderError('Huddle needs a name');
    const h = ctx.db.huddle.insert({
      id: 0n,
      name,
      created_by: ctx.sender,
      created_at: ctx.timestamp,
      lat,
      lng,
      place_label,
      warmth: 0,
      member_count: 1,
      active: true,
    });
    ctx.db.huddleMember.insert({
      id: 0n,
      huddle_id: h.id,
      identity: ctx.sender,
      joined_at: ctx.timestamp,
    });
  }
);

export const join_huddle = spacetimedb.reducer(
  { huddle_id: t.u64() },
  (ctx, { huddle_id }) => {
    const h = ctx.db.huddle.id.find(huddle_id);
    if (!h) throw new SenderError('Huddle not found');
    if (!h.active) throw new SenderError('That huddle has already ended');

    const already = [...ctx.db.huddleMember.huddle_id.filter(huddle_id)].some(
      (m) => m.identity.equals(ctx.sender)
    );
    if (already) return; // idempotent — joining twice is a no-op

    ctx.db.huddleMember.insert({
      id: 0n,
      huddle_id,
      identity: ctx.sender,
      joined_at: ctx.timestamp,
    });
    ctx.db.huddle.id.update({ ...h, member_count: h.member_count + 1 });
  }
);

export const leave_huddle = spacetimedb.reducer(
  { huddle_id: t.u64() },
  (ctx, { huddle_id }) => {
    const mine = [...ctx.db.huddleMember.huddle_id.filter(huddle_id)].find(
      (m) => m.identity.equals(ctx.sender)
    );
    if (!mine) return;
    ctx.db.huddleMember.id.delete(mine.id);

    const h = ctx.db.huddle.id.find(huddle_id);
    if (h) {
      const member_count = Math.max(0, h.member_count - 1);
      // An empty huddle ends itself (stops accruing warmth).
      ctx.db.huddle.id.update({
        ...h,
        member_count,
        active: member_count > 0 && h.active,
      });
    }
  }
);

export const end_huddle = spacetimedb.reducer(
  { huddle_id: t.u64() },
  (ctx, { huddle_id }) => {
    const h = ctx.db.huddle.id.find(huddle_id);
    if (!h) throw new SenderError('Huddle not found');
    if (!h.created_by.equals(ctx.sender)) {
      throw new SenderError('Only the host can end the huddle');
    }
    ctx.db.huddle.id.update({ ...h, active: false });
  }
);

// ── Scheduled warmth tick ───────────────────────────────────────────────────
// Fires once per second. Every active huddle gains warmth proportional to how
// many people are in it — more people huddling => warmth rises faster.
export const tick = spacetimedb.reducer(
  { timer: warmthTimer.rowType },
  (ctx, _args) => {
    for (const h of [...ctx.db.huddle.iter()]) {
      if (!h.active) continue;
      const gain = h.member_count * WARMTH_PER_MEMBER_PER_TICK;
      if (gain > 0) {
        ctx.db.huddle.id.update({ ...h, warmth: h.warmth + gain });
      }
    }
  }
);
