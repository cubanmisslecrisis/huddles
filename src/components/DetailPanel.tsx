import type { ReactNode } from 'react';
import { X, Flame, Users, Plus, Bookmark } from 'lucide-react';
import type { FriendVM, HuddleVM } from '@/lib/view';
import type { Selection } from '@/components/map/markers';
import { getPin, getReco, type PinColorName } from '@/lib/places-data';
import { Avatar } from '@/components/Avatar';
import { PanelCard } from '@/components/panel-ui';
import { Button } from '@/components/ui/button';
import { distanceLabel, relativeTimeFromMicros } from '@/lib/avatar';
import { huddleStatusColor, huddleStatusLabel, onYellow, pinColor } from '@/lib/theme';

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
  const placeName = reco?.placeName ?? pin?.label ?? pin?.category ?? 'Saved place';
  const category = reco?.category ?? pin?.category ?? 'Place';
  const dist = reco?.distanceLabel ?? pin?.distanceLabel ?? '';
  const tileColor = pinColor((pin?.color ?? 'yellow') as PinColorName);

  return (
    <DetailShell
      bare={bare}
      onClose={onClose}
      title={
        <div>
          <p className="font-heading text-xl font-black text-foreground">{placeName}</p>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            {category}
            {dist ? ` · ${dist}` : ''} ·
            <span className="flex items-center gap-0.5 font-semibold text-warmth">
              <Flame className="h-3.5 w-3.5" /> Warm now
            </span>
          </p>
        </div>
      }
    >
      <div className="flex h-32 items-center justify-center rounded-2xl" style={{ background: `color-mix(in oklab, ${tileColor} 22%, transparent)` }}>
        <span className="font-heading text-lg font-black" style={{ color: pin?.color === 'yellow' ? onYellow : tileColor }}>
          {category}
        </span>
      </div>
      {reco && (
        <span className="inline-block w-fit rounded-full bg-pink/15 px-2.5 py-1 text-xs font-bold text-pink">
          {reco.tasteMatch}% taste match
        </span>
      )}
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
