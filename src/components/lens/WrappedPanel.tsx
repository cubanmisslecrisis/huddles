import { useMemo, useState } from 'react';
import { Avatar } from '@/components/Avatar';
import { PanelCard } from '@/components/panel-ui';
import { personaFor } from '@/lib/characters';
import type { FriendVM } from '@/lib/view';

function weekSeed(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  return Math.floor((now.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000));
}

function weekRange(): string {
  const now = new Date();
  const day = now.getDay();
  const mon = new Date(now);
  mon.setDate(now.getDate() - ((day + 6) % 7));
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${fmt(mon)} – ${fmt(sun)}`;
}

function seededRand(seed: number, offset: number): number {
  const x = Math.sin(seed * 9301 + offset * 49297 + 233) * 93847;
  return x - Math.floor(x);
}

function PersonaCharacter({ path, alt }: { path: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <div className="h-20 w-20 shrink-0 rounded-2xl bg-secondary/60" />;
  return (
    <img
      src={path}
      alt={alt}
      onError={() => setFailed(true)}
      className="h-20 w-20 shrink-0 object-contain drop-shadow-md"
      draggable={false}
    />
  );
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TIMES = ['morning', 'afternoon', 'evening', 'night'];

export function WrappedPanel({ friends, bare = false }: { friends: FriendVM[]; bare?: boolean }) {
  const seed = weekSeed();
  const friendKey = friends.map((f) => f.key).join(',');

  const stats = useMemo(() => {
    const r = (n: number) => seededRand(seed, n);

    const hoursTotal = Math.floor(r(1) * 22) + 4;
    const totalHuddles = Math.floor(r(2) * 18) + 2;
    const longestMin = Math.floor(r(3) * 80) + 10;
    const streak = Math.floor(r(4) * 5) + 1;
    const topFriendIdx = friends.length > 0 ? Math.floor(r(5) * friends.length) : -1;
    const topFriend = topFriendIdx >= 0 ? friends[topFriendIdx] : null;
    const topFriendHours = Math.floor(r(6) * (hoursTotal * 0.6)) + 1;
    const persona = personaFor(seed);
    const bestDay = DAYS[Math.floor(r(8) * DAYS.length)];
    const bestTime = TIMES[Math.floor(r(9) * TIMES.length)];
    const milesWalked = (r(10) * 12 + 1).toFixed(1);

    const squadList = friends.slice(0, 5).map((f, i) => ({
      ...f,
      hours: Math.max(1, Math.floor(r(20 + i) * Math.min(hoursTotal, 14))),
    }));
    // sort descending so the bars look natural
    squadList.sort((a, b) => b.hours - a.hours);
    const maxHours = squadList[0]?.hours ?? 1;

    return { hoursTotal, totalHuddles, longestMin, streak, topFriend, topFriendHours, persona, bestDay, bestTime, milesWalked, squadList, maxHours };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed, friends.length, friendKey]);

  const longestStr = stats.longestMin >= 60
    ? `${Math.floor(stats.longestMin / 60)}h ${stats.longestMin % 60}m`
    : `${stats.longestMin}m`;

  return (
    <div className="flex flex-col gap-3 pb-2">

      {/* Hero */}
      <PanelCard bare={bare} className="relative overflow-hidden !p-5">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-8 -right-8 h-36 w-36 rounded-full bg-pink opacity-25 blur-2xl" />
          <div className="absolute -bottom-8 -left-8 h-40 w-40 rounded-full bg-orange opacity-20 blur-2xl" />
        </div>
        <div className="relative">
          <p className="text-[11px] font-bold uppercase tracking-widest text-pink">{weekRange()}</p>
          <h1 className="mt-1 font-heading text-4xl font-black leading-none text-foreground">Huddle<br />Wrapped</h1>
          <p className="mt-2 text-sm text-muted-foreground">Your week, by the numbers</p>
        </div>
      </PanelCard>

      {/* Persona */}
      <PanelCard bare={bare} className="relative overflow-hidden !p-5">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-pink/10 via-transparent to-orange/10" />
        <div className="relative flex items-center gap-4">
          <PersonaCharacter path={stats.persona.path} alt={stats.persona.persona} />
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">This week you were</p>
            <p className="mt-0.5 font-heading text-2xl font-black text-foreground">{stats.persona.persona}</p>
            <p className="mt-1 text-sm text-muted-foreground leading-snug">{stats.persona.desc}</p>
          </div>
        </div>
      </PanelCard>

      {/* Top friend */}
      {stats.topFriend && (
        <PanelCard bare={bare} className="!p-5">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Top Friend</p>
          <div className="mt-3 flex items-center gap-4">
            <Avatar name={stats.topFriend.name} colorKey={stats.topFriend.key} size={60} />
            <div className="min-w-0">
              <p className="truncate font-heading text-xl font-black text-foreground">{stats.topFriend.name}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                <span className="font-bold text-pink">{stats.topFriendHours}h</span> together this week
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">Your #1 hangout partner</p>
            </div>
          </div>
        </PanelCard>
      )}

      {/* Big number cards */}
      <div className="grid grid-cols-2 gap-3">
        <PanelCard bare={bare} className="!p-4 flex flex-col gap-1">
          <span className="font-heading text-4xl font-black text-pink leading-none">{stats.totalHuddles}</span>
          <span className="text-xs font-semibold text-muted-foreground">Huddles formed</span>
        </PanelCard>
        <PanelCard bare={bare} className="!p-4 flex flex-col gap-1">
          <span className="font-heading text-4xl font-black text-orange leading-none">{stats.hoursTotal}h</span>
          <span className="text-xs font-semibold text-muted-foreground">Hours out together</span>
        </PanelCard>
        <PanelCard bare={bare} className="!p-4 flex flex-col gap-1">
          <span className="font-heading text-4xl font-black text-blue leading-none">{longestStr}</span>
          <span className="text-xs font-semibold text-muted-foreground">Longest huddle</span>
        </PanelCard>
        <PanelCard bare={bare} className="!p-4 flex flex-col gap-1">
          <span className="font-heading text-4xl font-black text-green leading-none">{stats.streak}d</span>
          <span className="text-xs font-semibold text-muted-foreground">Hangout streak</span>
        </PanelCard>
      </div>

      {/* Peak time */}
      <PanelCard bare={bare} className="!p-5">
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Peak Hangout</p>
        <p className="mt-1 font-heading text-xl font-black text-foreground">
          {stats.bestDay} {stats.bestTime}
        </p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {stats.milesWalked} miles covered with your squad
        </p>
      </PanelCard>

      {/* Squad breakdown */}
      {stats.squadList.length > 0 && (
        <PanelCard bare={bare} className="!p-5">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Squad Breakdown</p>
          <div className="mt-3 flex flex-col gap-3">
            {stats.squadList.map((f) => (
              <div key={f.key} className="flex items-center gap-3">
                <Avatar name={f.name} colorKey={f.key} size={36} />
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="truncate text-sm font-bold text-foreground">{f.name}</span>
                    <span className="ml-2 shrink-0 text-sm font-black text-foreground">{f.hours}h</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-pink transition-all"
                      style={{ width: `${(f.hours / stats.maxHours) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </PanelCard>
      )}

    </div>
  );
}
