import { useState } from 'react';
import { colorFor, initialOf, photoFor } from '@/lib/avatar';
import { cn } from '@/lib/utils';

// The one stand-in for every avatar in the design. Renders a deterministic demo photo
// (from `photoFor`, pool in public/avatars) clipped to a disc with a white ring; the
// hashed-color disc shows through as the fallback if the photo is missing/fails to load,
// and the hashed color also tints the selected ring. `colorKey` keeps a user's photo+color
// stable (use their identity hex); pass `photo` to override (e.g. a fixed "me" avatar).
export function Avatar({
  name,
  colorKey,
  photo,
  size = 44,
  dot,
  selected = false,
  ring,
  className,
  style,
}: {
  name: string;
  colorKey?: string;
  photo?: string;
  size?: number;
  dot?: 'online' | 'stale' | null;
  selected?: boolean;
  ring?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const key = colorKey ?? name;
  const bg = colorFor(key);
  const src = photo ?? photoFor(key);
  const [broken, setBroken] = useState(false);
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
        ...style,
      }}
    >
      {!broken && src ? (
        <img
          src={src}
          alt=""
          className="absolute inset-0 h-full w-full rounded-full object-cover"
          onError={() => setBroken(true)}
        />
      ) : (
        initialOf(name)
      )}
      {dot && (
        <span
          className="absolute bottom-0 right-0 z-10 rounded-full border-2 border-card"
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
