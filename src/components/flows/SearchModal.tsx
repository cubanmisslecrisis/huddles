import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import type { FriendVM, HuddleVM } from '@/lib/view';
import type { Selection } from '@/components/map/markers';
import { recommendations, staticPins, CATEGORY_META } from '@/lib/places-data';
import { relativeTimeFromMicros } from '@/lib/avatar';
import { huddleStatusLabel } from '@/lib/theme';
import { Avatar } from '@/components/Avatar';
import { Input } from '@/components/ui/input';

type Result = { id: string; title: string; subtitle: string; colorKey: string; selection: Exclude<Selection, null> };
type Group = { label: string; items: Result[] };

function buildGroups(query: string, friends: FriendVM[], huddles: HuddleVM[]): Group[] {
  const q = query.trim().toLowerCase();
  const match = (s: string) => !q || s.toLowerCase().includes(q);

  const friendItems: Result[] = friends
    .filter((f) => match(f.name))
    .map((f) => ({
      id: f.key,
      title: f.name,
      subtitle: f.online ? 'Online now' : `Last seen ${relativeTimeFromMicros(f.lastSeenMicros)}`,
      colorKey: f.key,
      selection: { kind: 'friend', id: f.key },
    }));

  const huddleItems: Result[] = huddles
    .filter((h) => match('huddle') || match(huddleStatusLabel(h.status)) || h.memberNames.some(match))
    .map((h) => ({
      id: h.id,
      title: h.memberNames[0] ? `${h.memberNames[0]} +${Math.max(0, h.memberCount - 1)}` : `Huddle of ${h.memberCount}`,
      subtitle: `${h.memberCount} people · ${huddleStatusLabel(h.status)}`,
      colorKey: `h${h.id}`,
      selection: { kind: 'huddle', id: h.id },
    }));

  const placeItems: Result[] = [
    ...recommendations.map((r) => ({
      id: r.pinId,
      title: r.placeName,
      subtitle: `${r.category} · ${r.distanceLabel}`,
      colorKey: r.id,
      selection: { kind: 'pin', id: r.pinId } as const,
    })),
    ...staticPins
      .filter((p) => !recommendations.some((r) => r.pinId === p.id))
      .map((p) => ({
        id: p.id,
        title: p.name,
        subtitle: `${CATEGORY_META[p.category].label}${p.distanceLabel ? ` · ${p.distanceLabel}` : ''}`,
        colorKey: p.id,
        selection: { kind: 'pin', id: p.id } as const,
      })),
  ].filter((r) => match(r.title) || match(r.subtitle));

  return [
    { label: 'Friends', items: friendItems },
    { label: 'Huddles', items: huddleItems },
    { label: 'Places', items: placeItems },
  ].filter((g) => g.items.length > 0);
}

export function SearchModal({
  open,
  onOpenChange,
  friends,
  huddles,
  onPick,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  friends: FriendVM[];
  huddles: HuddleVM[];
  onPick: (s: Exclude<Selection, null>) => void;
}) {
  const [query, setQuery] = useState('');
  const groups = useMemo(() => buildGroups(query, friends, huddles), [query, friends, huddles]);

  if (!open) return null;

  const pick = (s: Exclude<Selection, null>) => {
    onPick(s);
    onOpenChange(false);
    setQuery('');
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-card pt-[env(safe-area-inset-top,0px)]">
      <div className="flex flex-col gap-3 p-4">
        <div className="relative flex items-center">
          <Search className="pointer-events-none absolute left-4 z-10 h-5 w-5 text-muted-foreground" />
          <Input
            autoFocus
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search friends, huddles, places…"
            className="h-12 rounded-2xl pl-12 pr-16 text-sm"
          />
          <button
            onClick={() => {
              onOpenChange(false);
              setQuery('');
            }}
            className="absolute right-3 text-sm font-bold text-muted-foreground"
          >
            Cancel
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
          {groups.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No results found.</p>
          ) : (
            groups.map((g) => (
              <div key={g.label}>
                <p className="mb-1.5 font-heading text-xs font-extrabold uppercase tracking-wide text-muted-foreground">
                  {g.label}
                </p>
                <div className="flex flex-col">
                  {g.items.map((it) => (
                    <button
                      key={`${g.label}-${it.id}`}
                      onClick={() => pick(it.selection)}
                      className="flex items-center gap-3 rounded-2xl px-2 py-2 text-left transition hover:bg-secondary"
                    >
                      <Avatar name={it.title} colorKey={it.colorKey} size={40} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-foreground">{it.title}</p>
                        <p className="truncate text-xs text-muted-foreground">{it.subtitle}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
