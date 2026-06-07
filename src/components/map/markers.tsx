import { useState } from 'react';
import { Music, Camera, Heart, Bookmark, Star } from 'lucide-react';
import { colorFor, initialOf, photoFor, ME_PHOTO } from '@/lib/avatar';
import { pinColor, onYellow } from '@/lib/theme';
import type { StaticPin } from '@/lib/places-data';

export type SelKind = 'friend' | 'huddle' | 'pin';
export type Selection = { kind: SelKind; id: string } | null;

// A person (solo) or a merged huddle cluster, placed on the map. `heat` is the
// huddle's warmth (0 for a solo avatar) and drives the pulse ring.
export type MapAvatar = {
  key: string;
  lat: number;
  lng: number;
  name: string;
  count: number;
  isMe: boolean;
  merged: boolean;
  heat: number;
  // Member identity hexes for a merged huddle (drives the photo cluster); empty for solo.
  memberKeys: string[];
  selection: { kind: 'friend' | 'huddle'; id: string };
};

export type HeatPoint = { lat: number; lng: number; weight: number };

// A static place pin with coordinates already resolved against the user's location.
export type ResolvedPin = StaticPin & { lat: number; lng: number };

// Warmth at which a huddle's pulse maxes out (fastest / biggest / reddest).
const HEAT_REF = 40;
const HEAT_STOPS: [number, number, number][] = [
  [70, 130, 255],
  [0, 200, 255],
  [120, 255, 140],
  [255, 220, 80],
  [255, 90, 90],
];

export function heatColor(n: number): string {
  const t = Math.max(0, Math.min(1, n)) * (HEAT_STOPS.length - 1);
  const i = Math.floor(t);
  const f = t - i;
  const a = HEAT_STOPS[i];
  const b = HEAT_STOPS[Math.min(HEAT_STOPS.length - 1, i + 1)];
  const c = a.map((v, k) => Math.round(v + (b[k] - v) * f));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

const MY_BLUE = '#6B8FFF';

function Tail({ color }: { color: string }) {
  return (
    <span
      className="absolute left-1/2 top-full h-2.5 w-2.5 -translate-x-1/2 -translate-y-1.5 rotate-45 border-b-2 border-r-2 border-white"
      style={{ background: color }}
      aria-hidden
    />
  );
}

// A demo photo clipped to the disc; falls back to nothing (so the parent's hashed-color
// disc + initial show) if the image is missing or fails to load.
function DiscPhoto({ src }: { src: string }) {
  const [broken, setBroken] = useState(false);
  if (broken) return null;
  return (
    <img
      src={src}
      alt=""
      className="absolute inset-0 h-full w-full rounded-full object-cover"
      onError={() => setBroken(true)}
    />
  );
}

export function FriendMarker({
  avatar,
  selected,
  dimmed,
  onSelect,
}: {
  avatar: MapAvatar;
  selected: boolean;
  dimmed: boolean;
  onSelect: () => void;
}) {
  const color = avatar.isMe ? MY_BLUE : colorFor(avatar.key);
  const photo = avatar.isMe ? ME_PHOTO : photoFor(avatar.key);
  return (
    <button
      onClick={onSelect}
      aria-label={avatar.isMe ? 'You' : avatar.name}
      className="group block transition-all duration-200"
      style={{ opacity: dimmed ? 0.45 : 1 }}
    >
      <span className="relative block transition-transform duration-200 group-hover:-translate-y-1">
        <span
          className="relative flex items-center justify-center overflow-hidden rounded-full border-2 border-white font-bold text-white"
          style={{
            width: 42,
            height: 42,
            background: color,
            fontSize: 17,
            transform: selected ? 'scale(1.12)' : undefined,
            boxShadow: selected
              ? `0 0 0 6px color-mix(in oklab, ${color} 30%, transparent), 0 8px 16px rgba(20,20,20,0.18)`
              : avatar.isMe
                ? `0 0 0 4px rgba(107,143,255,0.35), 0 8px 16px rgba(20,20,20,0.18)`
                : '0 8px 16px rgba(20,20,20,0.18)',
          }}
        >
          {initialOf(avatar.name)}
          <DiscPhoto src={photo} />
        </span>
        <span className="absolute bottom-0 right-0 z-10 h-3.5 w-3.5 rounded-full border-2 border-white bg-green" />
        <Tail color={color} />
      </span>
    </button>
  );
}

export function HuddleMarker({
  avatar,
  selected,
  dimmed,
  onSelect,
}: {
  avatar: MapAvatar;
  selected: boolean;
  dimmed: boolean;
  onSelect: () => void;
}) {
  const n = Math.min(1, avatar.heat / HEAT_REF);
  const pulsing = avatar.heat > 0;
  const hot = heatColor(n);
  return (
    <button
      onClick={onSelect}
      aria-label={`Huddle of ${avatar.count}${avatar.isMe ? ', including you' : ''}`}
      className="group block transition-all duration-200"
      style={{ opacity: dimmed ? 0.5 : 1 }}
    >
      <span className="relative block transition-transform duration-200 group-hover:-translate-y-1">
        {pulsing && (
          <span
            className="heat-ring"
            style={
              {
                '--pulse-scale': (1.5 + 1.3 * n).toFixed(2),
                '--pulse-color': hot,
                animationDuration: `${(1.8 - 1.1 * n).toFixed(2)}s`,
              } as React.CSSProperties
            }
          />
        )}
        <span
          className="relative flex items-center rounded-full p-1"
          style={{
            background: hot,
            boxShadow: selected
              ? `0 0 0 6px color-mix(in oklab, ${hot} 30%, transparent), 0 8px 18px rgba(20,20,20,0.22)`
              : `0 0 ${(8 + 18 * n).toFixed(0)}px ${hot}, 0 8px 18px rgba(20,20,20,0.22)`,
          }}
        >
          {(avatar.memberKeys.length ? avatar.memberKeys : [avatar.key]).slice(0, 3).map((k, i) => (
            <span
              key={k}
              className="relative flex items-center justify-center overflow-hidden rounded-full border-2 border-white first:ml-0 -ml-3.5"
              style={{ width: 34, height: 34, background: colorFor(k), zIndex: 3 - i }}
            >
              <DiscPhoto src={photoFor(k)} />
            </span>
          ))}
          <span
            className="absolute -right-1.5 -top-1.5 z-10 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white px-1 text-xs font-black text-white"
            style={{ background: hot }}
          >
            {avatar.count}
          </span>
        </span>
        <Tail color={hot} />
      </span>
    </button>
  );
}

export function PinMarker({
  pin,
  selected,
  dimmed,
  onSelect,
}: {
  pin: ResolvedPin;
  selected: boolean;
  dimmed: boolean;
  onSelect: () => void;
}) {
  const color = pinColor(pin.color);
  const dark = pin.color === 'yellow';

  if (pin.kind === 'reco') {
    return (
      <button
        onClick={onSelect}
        aria-label={`Recommendation: ${pin.category}, ${pin.distanceLabel}`}
        className="group block transition-all duration-200"
        style={{ opacity: dimmed ? 0.5 : 1 }}
      >
        <span className="relative block transition-transform duration-200 group-hover:-translate-y-1">
          <span
            className="relative block rounded-2xl px-3 py-2 text-left shadow-[0_8px_16px_rgba(20,20,20,0.18)]"
            style={{
              background: color,
              color: onYellow,
              boxShadow: selected ? `0 0 0 5px color-mix(in oklab, ${color} 40%, transparent)` : undefined,
            }}
          >
            <span className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wide">
              {pin.label} <Star className="h-3 w-3" fill="currentColor" />
            </span>
            <span className="block text-sm font-bold leading-tight">{pin.category}</span>
            <span className="block text-xs font-semibold opacity-80">{pin.distanceLabel}</span>
            <span
              className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1 rotate-45"
              style={{ background: color }}
              aria-hidden
            />
          </span>
        </span>
      </button>
    );
  }

  const Icon =
    pin.kind === 'music' ? Music : pin.kind === 'content' ? Camera : pin.color === 'pink' ? Heart : Bookmark;

  return (
    <button
      onClick={onSelect}
      aria-label={pin.kind === 'music' ? 'Music spot' : pin.kind === 'content' ? 'Photo from a friend' : 'Saved place'}
      className="group block transition-all duration-200"
      style={{ opacity: dimmed ? 0.5 : 1 }}
    >
      <span className="relative block transition-transform duration-200 group-hover:-translate-y-1">
        <span
          className="flex h-10 w-10 items-center justify-center rounded-full rounded-bl-none border-2 border-white shadow-[0_8px_16px_rgba(20,20,20,0.18)]"
          style={{
            background: color,
            transform: 'rotate(45deg)',
            boxShadow: selected ? `0 0 0 5px color-mix(in oklab, ${color} 35%, transparent)` : undefined,
          }}
        >
          <Icon
            className="h-5 w-5"
            style={{ transform: 'rotate(-45deg)', color: dark ? onYellow : '#fff' }}
            fill={pin.kind === 'saved' ? 'currentColor' : 'none'}
            strokeWidth={2.4}
          />
        </span>
      </span>
    </button>
  );
}
