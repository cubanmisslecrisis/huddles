import { useMemo } from 'react';
import { Avatar } from '@/components/Avatar';
import { PanelCard, SectionHeader } from '@/components/panel-ui';
import type { FriendVM } from '@/lib/view';

// Stable seed based on the current ISO week — stats change week to week but not on every render.
function weekSeed(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  return Math.floor((now.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000));
}

function seededRand(seed: number, offset: number): number {
  const x = Math.sin(seed * 9301 + offset * 49297 + 233) * 93847;
  return x - Math.floor(x);
}

export function WrappedPanel({ friends, bare = false }: { friends: FriendVM[]; bare?: boolean }) {
  const seed = weekSeed();

  const stats = useMemo(() => {
    const hoursHungOut = Math.floor(seededRand(seed, 1) * 25) + 5;
    const totalHuddles = Math.floor(seededRand(seed, 2) * 20) + 3;
    const longestHuddle = Math.floor(seededRand(seed, 3) * 45) + 5;
    const milesCovered = (seededRand(seed, 4) * 50 + 5).toFixed(1);
    const topFriendIdx = friends.length > 0 ? Math.floor(seededRand(seed, 5) * friends.length) : -1;
    const topFriend = topFriendIdx >= 0 ? friends[topFriendIdx] : null;

    const friendHours = friends.slice(0, 5).map((f, i) => ({
      ...f,
      hours: Math.floor(seededRand(seed, 10 + i) * 12) + 1,
    }));

    const facts = [
      `You were the huddle master — initiating ${totalHuddles} huddles this week!`,
      `You spent ${hoursHungOut} hours with friends — that's ${(hoursHungOut / 7).toFixed(1)}h per day.`,
      `Your longest huddle streak was ${longestHuddle} minutes. Committed!`,
      `You covered ${milesCovered} miles exploring with your squad.`,
      `You're in the top 15% of huddle enthusiasts this week. 🔥`,
    ];
    const fact = facts[Math.floor(seededRand(seed, 6) * facts.length)];

    return { hoursHungOut, totalHuddles, longestHuddle, topFriend, friendHours, fact };
  }, [seed, friends.length, friends.map(f => f.key).join(',')]);

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <PanelCard bare={bare} className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute -top-6 -right-6 h-32 w-32 rounded-full bg-pink opacity-20 blur-2xl" />
          <div className="absolute -bottom-6 -left-6 h-40 w-40 rounded-full bg-orange opacity-15 blur-2xl" />
        </div>
        <div className="relative z-10">
          <p className="text-xs font-bold uppercase tracking-widest text-pink">This Week</p>
          <h1 className="mt-1 font-heading text-3xl font-black text-foreground">Huddle Wrapped</h1>
          <p className="mt-1 text-sm text-muted-foreground">Your hangout story, by the numbers</p>
        </div>
      </PanelCard>

      {/* Top friend */}
      {stats.topFriend && (
        <PanelCard bare={bare}>
          <SectionHeader title="Top Friend This Week" />
          <div className="mt-4 flex items-center gap-4">
            <Avatar name={stats.topFriend.name} colorKey={stats.topFriend.key} size={64} />
            <div>
              <p className="text-lg font-black text-foreground">{stats.topFriend.name}</p>
              <p className="text-sm text-muted-foreground">
                <span className="font-bold text-pink">{stats.hoursHungOut}h</span> hung out together
              </p>
              <p className="mt-1 text-xs text-muted-foreground">#1 huddle partner 🏆</p>
            </div>
          </div>
        </PanelCard>
      )}

      {/* Stats grid */}
      <PanelCard bare={bare}>
        <SectionHeader title="By The Numbers" />
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-pink/10 p-4 text-center">
            <div className="font-heading text-3xl font-black text-pink">{stats.totalHuddles}</div>
            <div className="mt-1 text-xs font-semibold text-muted-foreground">Huddles</div>
          </div>
          <div className="rounded-2xl bg-orange/10 p-4 text-center">
            <div className="font-heading text-3xl font-black text-orange">{stats.longestHuddle}m</div>
            <div className="mt-1 text-xs font-semibold text-muted-foreground">Longest Session</div>
          </div>
          <div className="rounded-2xl bg-blue/10 p-4 text-center">
            <div className="font-heading text-3xl font-black text-blue">{friends.length}</div>
            <div className="mt-1 text-xs font-semibold text-muted-foreground">Friends Out</div>
          </div>
          <div className="rounded-2xl bg-green/10 p-4 text-center">
            <div className="font-heading text-3xl font-black text-green">{stats.hoursHungOut}h</div>
            <div className="mt-1 text-xs font-semibold text-muted-foreground">Time Together</div>
          </div>
        </div>
      </PanelCard>

      {/* Fun fact */}
      <PanelCard bare={bare} className="relative overflow-hidden bg-gradient-to-br from-pink/8 to-orange/8">
        <p className="text-sm font-medium text-foreground italic">"{stats.fact}"</p>
      </PanelCard>

      {/* Squad breakdown */}
      {stats.friendHours.length > 0 && (
        <PanelCard bare={bare}>
          <SectionHeader title="Squad Breakdown" />
          <div className="mt-3 flex flex-col gap-2">
            {stats.friendHours.map((f) => (
              <div key={f.key} className="flex items-center gap-3 rounded-xl bg-secondary/40 p-2">
                <Avatar name={f.name} colorKey={f.key} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-foreground">{f.name}</p>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-sm font-black text-foreground">{f.hours}h</span>
                  <div className="mt-1 h-1.5 w-16 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-pink"
                      style={{ width: `${(f.hours / 13) * 100}%` }}
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
