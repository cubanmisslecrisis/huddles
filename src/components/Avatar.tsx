import { colorFor, initialOf } from '@/lib/avatar';
import { cn } from '@/lib/utils';

// The one stand-in for every avatar/photo in the design: a hashed-color disc with
// the person's initial. `colorKey` keeps a user's color stable (use their identity
// hex); `dot` adds a presence indicator; `selected` adds a focus ring.
export function Avatar({
  name,
  colorKey,
  size = 44,
  dot,
  selected = false,
  ring,
  className,
}: {
  name: string;
  colorKey?: string;
  size?: number;
  dot?: 'online' | 'stale' | null;
  selected?: boolean;
  ring?: string;
  className?: string;
}) {
  const bg = colorFor(colorKey ?? name);
  return (
    <span
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center rounded-full border-2 border-white font-bold text-white',
        className
      )}
      style={{
        width: size,
        height: size,
        background: bg,
        fontSize: size * 0.42,
        boxShadow: selected
          ? `0 0 0 4px color-mix(in oklab, ${ring ?? bg} 35%, transparent)`
          : '0 4px 12px rgba(20,20,20,0.18)',
      }}
    >
      {initialOf(name)}
      {dot && (
        <span
          className="absolute bottom-0 right-0 rounded-full border-2 border-card"
          style={{
            width: Math.max(8, size * 0.28),
            height: Math.max(8, size * 0.28),
            background: dot === 'online' ? 'var(--color-green)' : 'var(--color-muted-foreground)',
          }}
        />
      )}
    </span>
  );
}
