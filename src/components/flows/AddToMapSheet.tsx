import { Star, StickyNote, Camera, Bookmark, Users, ListPlus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { brandColor } from '@/lib/theme';
import { FlowSheet } from '@/components/flows/FlowSheet';

// STUB: the "places" domain has no backend yet, so every option just closes.
// TODO: wire to a real places/recommendation table + reducers.
const addOptions: { label: string; description: string; icon: LucideIcon; color: string }[] = [
  { label: 'Recommend a place', description: 'Share a spot with your room', icon: Star, color: brandColor('yellow') },
  { label: 'Add a note', description: 'Drop a note on the map', icon: StickyNote, color: brandColor('blue') },
  { label: 'Add a photo', description: 'Capture where you are', icon: Camera, color: brandColor('green') },
  { label: 'Save a place', description: 'Keep it for later', icon: Bookmark, color: brandColor('pink') },
  { label: 'Start a huddle', description: 'Invite nearby friends to gather', icon: Users, color: brandColor('orange') },
  { label: 'Create a list', description: 'Group places together', icon: ListPlus, color: brandColor('red') },
];

export function AddToMapSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <FlowSheet open={open} onOpenChange={onOpenChange} title="Add to map">
      <div className="flex flex-col gap-2">
        {addOptions.map((o) => {
          const Icon = o.icon;
          return (
            <button
              key={o.label}
              onClick={() => onOpenChange(false)}
              className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-3 text-left font-bold shadow-sm transition hover:bg-secondary active:scale-[0.99]"
            >
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                style={{ background: `color-mix(in oklab, ${o.color} 18%, transparent)` }}
              >
                <Icon className="h-5 w-5" style={{ color: o.color }} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm">{o.label}</span>
                <span className="block text-xs font-medium text-muted-foreground">{o.description}</span>
              </span>
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        Coming soon — the places layer isn't wired to a backend yet.
      </p>
    </FlowSheet>
  );
}
