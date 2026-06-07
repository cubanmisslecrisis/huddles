import type { ReactNode } from 'react';
import { X, Flame, Users, Plus, Bookmark, Star } from 'lucide-react';
import type { FriendVM, HuddleVM } from '@/lib/view';
import type { Selection } from '@/components/map/markers';
import { getPin, getReco, CATEGORY_META, type PinColorName } from '@/lib/places-data';
import { Avatar } from '@/components/Avatar';
import { PanelCard, AvatarStack } from '@/components/panel-ui';
import { Button } from '@/components/ui/button';
import { distanceLabel, relativeTimeFromMicros } from '@/lib/avatar';
import { huddleStatusColor, huddleStatusLabel, pinColor } from '@/lib/theme';

// "Maya, Jake +2 have been here" — a compact summary of friends who've visited.
function friendsSummary(names: string[]): string {
  if (names.length === 1) return `${names[0]} has been here`;
  if (names.length === 2) return `${names[0]} & ${names[1]} have been here`;
  return `${names[0]}, ${names[1]} +${names.length - 2} have been here`;
}

function DetailShell({
  title,
  onClose,
  children,
  bare = false,
}: {
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  bare?: boolean;
}) {
  return (
    <PanelCard bare={bare} className={bare ? 'flex flex-col' : 'flex h-full flex-col'}>
      <div className="flex items-start justify-between">
        <div className="min-w-0">{title}</div>
        <Button onClick={onClose} aria-label="Close detail" variant="secondary" size="icon" className="ml-2 shrink-0 rounded-full">
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="mt-4 flex flex-1 flex-col gap-5 overflow-y-auto">{children}</div>
    </PanelCard>
  );
}

export function DetailPanel({
  selection,
  friends,
  huddles,
  onClose,
  onPing,
  bare = false,
}: {
  selection: Selection;
  friends: FriendVM[];
  huddles: HuddleVM[];
  onClose: () => void;
  onPing?: () => void;
  bare?: boolean;
}) {
  if (!selection) return null;

  if (selection.kind === 'friend') {
    const f = friends.find((x) => x.key === selection.id);
    if (!f) return null;
    return (
      <DetailShell
        bare={bare}
        onClose={onClose}
        title={
          <div className="flex items-center gap-3">
            <Avatar name={f.name} colorKey={f.key} size={56} dot={f.online ? 'online' : 'stale'} />
            <div>
              <p className="font-heading text-xl font-black text-foreground">{f.name}</p>
              <p className="text-sm text-muted-foreground">
                {f.online ? 'Sharing live location' : `Last seen ${relativeTimeFromMicros(f.lastSeenMicros)}`}
                {f.distanceMeters != null ? ` · ${distanceLabel(f.distanceMeters)} away` : ''}
              </p>
            </div>
          </div>
        }
      >
        <div className="flex gap-2">
          <Button variant="brand" size="lg" className="flex-1 font-bold" onClick={onPing}>
            Ping
          </Button>
          <Button variant="outline" size="lg" className="flex-1 font-bold" disabled>
            <Plus className="h-4 w-4" /> Invite
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          You'll form a huddle automatically when you're within ~100m of each other.
        </p>
      </DetailShell>
    );
  }

  if (selection.kind === 'huddle') {
    const h = huddles.find((x) => x.id === selection.id);
    if (!h) return null;
    const color = huddleStatusColor(h.status);
    return (
      <DetailShell
        bare={bare}
        onClose={onClose}
        title={
          <div>
            <p className="font-heading text-xl font-black text-foreground">{huddleStatusLabel(h.status)}</p>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              {h.memberCount} people
              {h.distanceMeters != null ? ` · ${distanceLabel(h.distanceMeters)} away` : ''}
            </p>
          </div>
        }
      >
        <div
          className="flex items-center justify-center rounded-2xl py-8"
          style={{ background: `color-mix(in oklab, ${color} 14%, transparent)` }}
        >
          <span className="flex items-center gap-2 text-2xl font-black" style={{ color }}>
            <Flame className="h-7 w-7" /> {Math.round(h.warmth)}° warmth
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm font-semibold text-foreground">
          <span className="flex items-center gap-1.5">
            <Users className="h-4 w-4 text-blue" /> {h.memberCount} people
          </span>
          <span className="text-muted-foreground">{huddleStatusLabel(h.status)}</span>
        </div>
        <div className="flex gap-2">
          <Button variant="brand" size="lg" className="flex-1 font-bold" onClick={onPing}>
            Ping nearby
          </Button>
          <Button variant="outline" size="lg" className="flex-1 font-bold" disabled>
            <Bookmark className="h-4 w-4" /> Save
          </Button>
        </div>
        <div>
          <p className="mb-2 font-heading text-sm font-extrabold uppercase tracking-wide text-foreground">Members</p>
          <div className="flex -space-x-2">
            {h.memberNames.slice(0, 8).map((name, i) => (
              <Avatar key={`${name}-${i}`} name={name} size={40} className="border-2 border-card" />
            ))}
          </div>
        </div>
      </DetailShell>
    );
  }

  // pin (static place)
  const reco = getReco(selection.id);
  const pin = getPin(selection.id);
  const meta = pin ? CATEGORY_META[pin.category] : null;
  const placeName = pin?.name ?? reco?.placeName ?? 'Place';
  const categoryLabel = meta?.label ?? reco?.category ?? 'Place';
  const dist = pin?.distanceLabel ?? reco?.distanceLabel ?? '';
  const tileColor = pinColor((pin?.color ?? 'yellow') as PinColorName);
  const visitedFriends = pin?.friendsVisited ?? [];

  return (
    <DetailShell
      bare={bare}
      onClose={onClose}
      title={
        <div>
          <p className="font-heading text-xl font-black text-foreground">{placeName}</p>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            {categoryLabel}
            {dist ? ` · ${dist}` : ''}
          </p>
        </div>
      }
    >
      <div
        className="flex h-32 items-center justify-center rounded-2xl text-6xl"
        style={{ background: `color-mix(in oklab, ${tileColor} 22%, transparent)` }}
      >
        <span aria-hidden>{meta?.emoji ?? '📍'}</span>
      </div>

      {pin && (
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-base font-black text-foreground">
            <Star className="h-4 w-4 text-yellow" fill="currentColor" /> {pin.rating.toFixed(1)}
          </span>
          <span className="text-sm text-muted-foreground">· {pin.reviewCount.toLocaleString()} reviews</span>
          {reco && (
            <span className="ml-auto inline-block rounded-full bg-pink/15 px-2.5 py-1 text-xs font-bold text-pink">
              {reco.tasteMatch}% taste match
            </span>
          )}
        </div>
      )}

      <div>
        <p className="mb-2 font-heading text-sm font-extrabold uppercase tracking-wide text-foreground">
          Friends who've been here
        </p>
        {visitedFriends.length > 0 ? (
          <div className="flex items-center gap-3">
            <AvatarStack people={visitedFriends.slice(0, 5).map((n) => ({ key: n, name: n }))} size={9} />
            <span className="text-sm text-muted-foreground">{friendsSummary(visitedFriends)}</span>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">None of your friends have checked in here yet.</p>
        )}
      </div>

      <div className="flex gap-2">
        <Button variant="brandBlue" size="lg" className="flex-1 font-bold" disabled>
          Start huddle
        </Button>
        <Button variant="outline" size="lg" className="flex-1 font-bold" disabled>
          <Bookmark className="h-4 w-4" /> Save
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">Places are a Phase-2 preview — recommendations aren't wired to a backend yet.</p>
    </DetailShell>
  );
}
