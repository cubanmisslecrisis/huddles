import { Star } from 'lucide-react';
import type { FriendVM, HuddleVM } from '@/lib/view';
import type { Selection } from '@/components/map/markers';
import { featuredReco } from '@/lib/places-data';
import { onYellow } from '@/lib/theme';
import { distanceLabel, relativeTimeFromMicros } from '@/lib/avatar';
import { Avatar } from '@/components/Avatar';
import { SectionHeader, PanelCard, PingButton, AvatarStack } from '@/components/panel-ui';
import { SelectableCard } from '@/components/selectable-card';
import { HuddleRow } from '@/components/huddle-row';

export function MapPanel({
  nearestFriend,
  huddles,
  onSelect,
  onPing,
  bare = false,
}: {
  nearestFriend: FriendVM | null;
  huddles: HuddleVM[];
  onSelect: (s: Selection) => void;
  onPing?: () => void;
  bare?: boolean;
}) {
  return (
    <div className="flex flex-col gap-4">
      <PanelCard bare={bare}>
        <SectionHeader title="Around You" />
        {nearestFriend ? (
          <SelectableCard
            onSelect={() => onSelect({ kind: 'friend', id: nearestFriend.key })}
            className="mt-3 flex w-full cursor-pointer items-center gap-3 rounded-xl p-1 text-left transition hover:bg-secondary/60"
          >
            <Avatar name={nearestFriend.name} colorKey={nearestFriend.key} size={48} dot={nearestFriend.online ? 'online' : 'stale'} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-foreground">{nearestFriend.name}</p>
              <p className="text-sm text-foreground">
                {nearestFriend.online ? 'Sharing live location' : `Last seen ${relativeTimeFromMicros(nearestFriend.lastSeenMicros)}`}
              </p>
              {nearestFriend.distanceMeters != null && (
                <p className="text-xs text-muted-foreground">{distanceLabel(nearestFriend.distanceMeters)} away</p>
              )}
            </div>
            <PingButton onClick={onPing} />
          </SelectableCard>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">No one else is sharing nearby yet.</p>
        )}
      </PanelCard>

      <PanelCard bare={bare}>
        <SectionHeader title="Active Huddles" />
        {huddles.length > 0 ? (
          <div className="mt-3 flex flex-col gap-3">
            {huddles.map((h) => (
              <HuddleRow key={h.id} huddle={h} onSelect={() => onSelect({ kind: 'huddle', id: h.id })} />
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            No huddles yet — get within ~100m of someone in your room to form one.
          </p>
        )}
      </PanelCard>

      <PanelCard bare={bare}>
        <SectionHeader title="Recommended for you" />
        <button
          onClick={() => onSelect({ kind: 'pin', id: featuredReco.pinId })}
          className="mt-3 flex w-full gap-3 text-left"
        >
          <div className="relative shrink-0">
            <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow/70 to-orange/70">
              <Star className="h-8 w-8" style={{ color: onYellow }} fill="currentColor" />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-base font-bold text-foreground">{featuredReco.placeName}</p>
            <p className="text-sm text-muted-foreground">
              {featuredReco.category} · {featuredReco.distanceLabel}
            </p>
            <span className="mt-1.5 inline-block rounded-full bg-pink/15 px-2.5 py-1 text-xs font-bold text-pink">
              {featuredReco.tasteMatch}% taste match
            </span>
            <div className="mt-2 flex items-center gap-2">
              <AvatarStack people={featuredReco.recommendedBy.map((n) => ({ key: n, name: n }))} size={5} />
              <span className="text-xs text-muted-foreground">Loved by friends nearby</span>
            </div>
          </div>
        </button>
      </PanelCard>
    </div>
  );
}
