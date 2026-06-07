import { Avatar } from '@/components/Avatar';
import { PanelCard, SectionHeader } from '@/components/panel-ui';
import type { FriendVM } from '@/lib/view';

export function WrappedPanel({ friends, bare = false }: { friends: FriendVM[]; bare?: boolean }) {
  // Generate fake wrapped stats
  const topFriend = friends.length > 0 ? friends[Math.floor(Math.random() * friends.length)] : null;
  const hoursHungOut = Math.floor(Math.random() * 25) + 5;
  const totalHuddles = Math.floor(Math.random() * 20) + 3;
  const longestHuddle = Math.floor(Math.random() * 45) + 5;

  const funFacts = [
    `You were the huddle master this week — initiating ${totalHuddles} huddles!`,
    `You spent ${hoursHungOut} hours with friends. That's ${(hoursHungOut / 7).toFixed(1)} hours per day!`,
    `Your longest huddle streak was ${longestHuddle} minutes. Impressive commitment!`,
    `You're in the top 15% of huddle enthusiasts this week.`,
    `You covered ${(Math.random() * 50 + 5).toFixed(1)} miles exploring with friends.`,
  ];

  const randomFact = funFacts[Math.floor(Math.random() * funFacts.length)];

  return (
    <div className="flex flex-col gap-4">
      <PanelCard bare={bare} className="gradient-to-b from-pink/20 to-orange/20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-pink blur-3xl"></div>
          <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-orange blur-3xl"></div>
        </div>
        <div className="relative z-10">
          <h1 className="font-heading text-4xl font-black text-foreground">Huddle 2024</h1>
          <p className="text-sm text-muted-foreground mt-2">Your weekly huddle wrapped</p>
        </div>
      </PanelCard>

      {topFriend && (
        <PanelCard bare={bare}>
          <SectionHeader title="Top Friend This Week" />
          <div className="mt-4 flex flex-col items-center gap-3">
            <Avatar name={topFriend.name} colorKey={topFriend.key} size={64} />
            <h3 className="text-lg font-bold text-foreground text-center">{topFriend.name}</h3>
            <p className="text-sm text-muted-foreground text-center">
              You hung out for <span className="font-bold text-pink">{hoursHungOut} hours</span> this week
            </p>
          </div>
        </PanelCard>
      )}

      <PanelCard bare={bare}>
        <SectionHeader title="By The Numbers" />
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-pink/10 p-4 text-center">
            <div className="font-heading text-3xl font-black text-pink">{totalHuddles}</div>
            <div className="mt-1 text-xs font-semibold text-muted-foreground">Huddles Formed</div>
          </div>
          <div className="rounded-2xl bg-orange/10 p-4 text-center">
            <div className="font-heading text-3xl font-black text-orange">{longestHuddle}m</div>
            <div className="mt-1 text-xs font-semibold text-muted-foreground">Longest Huddle</div>
          </div>
          <div className="rounded-2xl bg-blue/10 p-4 text-center">
            <div className="font-heading text-3xl font-black text-blue">{friends.length}</div>
            <div className="mt-1 text-xs font-semibold text-muted-foreground">Friends Connected</div>
          </div>
          <div className="rounded-2xl bg-green/10 p-4 text-center">
            <div className="font-heading text-3xl font-black text-green">{hoursHungOut}h</div>
            <div className="mt-1 text-xs font-semibold text-muted-foreground">Time Together</div>
          </div>
        </div>
      </PanelCard>

      <PanelCard bare={bare} className="relative overflow-hidden bg-gradient-to-br from-warmth/10 to-pink/10">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-2 right-2 text-4xl">✨</div>
          <div className="absolute bottom-2 left-2 text-4xl">🎉</div>
        </div>
        <div className="relative z-10">
          <p className="text-sm text-foreground italic">"{randomFact}"</p>
        </div>
      </PanelCard>

      {friends.length > 1 && (
        <PanelCard bare={bare}>
          <SectionHeader title="Squad Goals" />
          <div className="mt-3 flex flex-col gap-2">
            {friends.slice(0, 5).map((f) => (
              <div key={f.key} className="flex items-center gap-3 rounded-xl bg-secondary/40 p-2">
                <Avatar name={f.name} colorKey={f.key} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-foreground truncate">{f.name}</p>
                </div>
                <span className="text-xs font-bold text-muted-foreground">
                  {Math.floor(Math.random() * 12) + 1}h
                </span>
              </div>
            ))}
          </div>
        </PanelCard>
      )}
    </div>
  );
}
