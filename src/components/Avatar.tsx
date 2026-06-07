import { useState } from 'react';
import { colorFor, initialOf } from '@/lib/avatar';
import { useCharacterFor } from '@/lib/characters';
import { cn } from '@/lib/utils';

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
  const [imgFailed, setImgFailed] = useState(false);
  const bg = colorFor(colorKey ?? name);
  const character = useCharacterFor(colorKey ?? '');
  const useImage = !!colorKey && !imgFailed;

  const dotSize = Math.max(8, size * 0.28);
  const shadowStyle = selected
    ? `0 0 0 4px color-mix(in oklab, ${ring ?? bg} 35%, transparent)`
    : '0 4px 12px rgba(20,20,20,0.18)';

  return (
    <span
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center rounded-full border-2 border-white',
        className,
      )}
      style={{
        width: size,
        height: size,
        background: useImage ? 'transparent' : bg,
        fontSize: size * 0.42,
        boxShadow: shadowStyle,
        overflow: 'hidden',
      }}
    >
      {useImage ? (
        <img
          src={character.path}
          alt={character.persona}
          onError={() => setImgFailed(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }}
          draggable={false}
        />
      ) : (
        <span className="font-bold text-white select-none">{initialOf(name)}</span>
      )}

      {dot && (
        <span
          className="absolute bottom-0 right-0 rounded-full border-2 border-card"
          style={{
            width: dotSize,
            height: dotSize,
            background: dot === 'online' ? 'var(--color-green)' : 'var(--color-muted-foreground)',
          }}
        />
      )}
    </span>
  );
}
