import { Music, Camera, Heart, Bookmark, Star } from 'lucide-react';
import { colorFor, initialOf } from '@/lib/avatar';
import { pinColor, onYellow } from '@/lib/theme';
import type { StaticPin } from '@/lib/places-data';

export type SelKind = 'friend' | 'huddle' | 'pin';
export type Selection = { kind: SelKind; id: string } | null;

// A person (solo) or a merged huddle cluster, placed on the map. `heat` is the
// huddle's warmth (0 for a solo avatar); markers are static — the heatmap itself
// pulses (see `useMapboxMap` heatmapPulse), not the avatar.
export type MapAvatar = {
  key: string;
  lat: number;
  lng: number;
  name: string;
  count: number;
  isMe: boolean;
  merged: boolean;
  heat: number;
  selection: { kind: 'friend' | 'huddle'; id: string };
};

export type HeatPoint = { lat: number; lng: number; weight: number };

// A pulsing "huddle of heat" point: a huddle's centroid + its warmth. The heatmap
// under the huddle throbs with this (see useMapboxMap), not the avatar.
export type HuddleHeatPoint = { lat: number; lng: number; warmth: number };

// A static place pin with coordinates already resolved against the user's location.
export type ResolvedPin = StaticPin & { lat: number; lng: number };

const MY_BLUE = '#6B8FFF';
const HUDDLE_COLOR = '#FA8927'; // static warm color for a huddle marker

function Tail({ color }: { color: string }) {
  return (
    <span
      className="absolute left-1/2 top-full h-2.5 w-2.5 -translate-x-1/2 -translate-y-1.5 rotate-45 border-b-2 border-r-2 border-white"
      style={{ background: color }}
      aria-hidden
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
  return (
    <button
      onClick={onSelect}
      aria-label={avatar.isMe ? 'You' : avatar.name}
      className="group block transition-all duration-200"
      style={{ opacity: dimmed ? 0.45 : 1 }}
    >
      <span className="relative block transition-transform duration-200 group-hover:-translate-y-1">
        <span
          className="flex items-center justify-center rounded-full border-2 border-white font-bold text-white"
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
        </span>
        <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-green" />
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
  const color = avatar.isMe ? MY_BLUE : HUDDLE_COLOR;
  return (
    <button
      onClick={onSelect}
      aria-label={`Huddle of ${avatar.count}${avatar.isMe ? ', including you' : ''}`}
      className="group block transition-all duration-200"
      style={{ opacity: dimmed ? 0.5 : 1 }}
    >
      <span className="relative block transition-transform duration-200 group-hover:-translate-y-1">
        <span
          className="relative flex items-center justify-center rounded-full border-2 border-white font-black text-white"
          style={{
            width: 46,
            height: 46,
            background: color,
            fontSize: 18,
            transform: selected ? 'scale(1.1)' : undefined,
            boxShadow: selected
              ? `0 0 0 6px color-mix(in oklab, ${color} 30%, transparent), 0 8px 18px rgba(20,20,20,0.22)`
              : avatar.isMe
                ? `0 0 0 4px rgba(107,143,255,0.35), 0 8px 18px rgba(20,20,20,0.22)`
                : '0 8px 18px rgba(20,20,20,0.22)',
          }}
        >
          {avatar.count}
        </span>
        <Tail color={color} />
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
