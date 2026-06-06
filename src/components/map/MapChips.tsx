import { Users } from 'lucide-react';
import { Avatar } from '@/components/Avatar';
import { mapFilters, type FilterKey } from '@/lib/places-data';

// Live presence chips (top-left of the map): friends nearby + huddles forming.
export function MapStatusChips({
  friendsNearby,
  huddlesForming,
  nearby,
}: {
  friendsNearby: number;
  huddlesForming: number;
  nearby: { key: string; name: string }[];
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex w-fit items-center gap-2 rounded-full bg-card/95 px-3 py-2 shadow-[0_4px_14px_rgba(20,20,20,0.1)] backdrop-blur-md">
        {nearby.length > 0 && (
          <div className="flex -space-x-2">
            {nearby.slice(0, 3).map((f) => (
              <Avatar key={f.key} name={f.name} colorKey={f.key} size={20} />
            ))}
          </div>
        )}
        <span className="text-xs font-semibold text-foreground">
          {friendsNearby} {friendsNearby === 1 ? 'friend' : 'friends'} nearby
        </span>
      </div>
      <div className="flex w-fit items-center gap-2 rounded-full bg-card/95 px-3 py-2 shadow-[0_4px_14px_rgba(20,20,20,0.1)] backdrop-blur-md">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue/10">
          <Users className="h-3.5 w-3.5 text-blue" />
        </span>
        <span className="text-xs font-semibold text-foreground">
          {huddlesForming} {huddlesForming === 1 ? 'huddle' : 'huddles'} forming
        </span>
      </div>
    </div>
  );
}

// Sticker-style category filter pills for the mobile map.
export function MapFilterChips({
  active,
  onChange,
}: {
  active: FilterKey;
  onChange: (k: FilterKey) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {mapFilters.map((f) => {
        const isActive = active === f.key;
        return (
          <button
            key={f.key}
            onClick={() => onChange(f.key)}
            aria-pressed={isActive}
            className="shrink-0 rounded-full px-4 py-2 text-sm font-bold shadow-[0_4px_14px_rgba(20,20,20,0.1)] transition active:scale-95"
            style={
              isActive
                ? { background: 'var(--color-foreground)', color: 'var(--color-background)' }
                : { background: 'var(--color-card)', color: f.color }
            }
          >
            {f.label}
          </button>
        );
      })}
    </div>
  );
}
