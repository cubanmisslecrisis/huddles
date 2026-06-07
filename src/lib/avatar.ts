// Stable per-key color + initials so a given user always looks the same. PALETTE +
// colorFor are lifted from the old LiveMap so map markers and list rows match. The hashed
// color also backs the avatar ring + the fallback disc when a photo fails to load.

export const PALETTE = [
  '#6B8FFF',
  '#FF6B9D',
  '#FFC93C',
  '#6BCB77',
  '#4D96FF',
  '#FF8A80',
  '#64B5F6',
  '#81C784',
  '#FFD54F',
  '#BA68C8',
];

// Avatars are the Club Penguin characters (served from public/characters). A key (use a
// user's identity hex) maps deterministically to one — same hashing as colorFor, so a
// person's penguin is stable across markers, lists, and detail panels. `sensei` is reserved
// for "me" (ME_PHOTO), so the pool below is the other seven.
export const AVATAR_PHOTOS = [
  '/characters/gary.webp',
  '/characters/rookie.webp',
  '/characters/bookworm.webp',
  '/characters/hippie.webp',
  '/characters/klutzy.webp',
  '/characters/cadence.webp',
  '/characters/herbert.webp',
];

// The current user's avatar — a fixed penguin so "me" is always consistent (the yellow ring
// distinguishes you anyway). `sensei` = "The Anchor": where you sit, the huddle forms.
export const ME_PHOTO = '/characters/sensei.webp';

function hashKey(key: string): number {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return h;
}

export function colorFor(key: string): string {
  return PALETTE[hashKey(key) % PALETTE.length];
}

export function photoFor(key: string): string {
  return AVATAR_PHOTOS[hashKey(key) % AVATAR_PHOTOS.length];
}

export function initialOf(name: string): string {
  return (name || '?').trim().slice(0, 1).toUpperCase();
}

// Great-circle distance in meters (haversine) — mirrors the server's distanceMeters.
export function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function distanceLabel(meters: number): string {
  if (meters < 950) return `${Math.round(meters / 10) * 10} m`;
  return `${(meters / 1609.34).toFixed(1)} mi`;
}

// "now" / "3m ago" / "2h ago" from a SpacetimeDB Timestamp's micros (a bigint).
export function relativeTimeFromMicros(micros: bigint): string {
  const ms = Number(micros / 1000n);
  const diff = Date.now() - ms;
  if (diff < 45_000) return 'now';
  const mins = Math.round(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

// Clock label "9:30 AM" from micros — for the Activity feed timestamps.
export function clockFromMicros(micros: bigint): string {
  const d = new Date(Number(micros / 1000n));
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}
