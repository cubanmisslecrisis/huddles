// ───────────────────────────────────────────────────────────────────────────
// PLACEHOLDER — no backend yet (Phase-2 "places" domain).
// The people/proximity/huddle/heat data is all live from SpacetimeDB. Places
// (category pins, ratings, which friends have been there) have no table yet, so
// this static set stands in for the design. Pins are stored as small lat/lng
// OFFSETS and resolved against the user's live location so they scatter around
// them. Ratings + `friendsVisited` are hard-coded stubs.
// TODO: replace with a real `recommendation` / `place` table + reducers (derive
// "friends who've been here" from ended huddles near the place).
// ───────────────────────────────────────────────────────────────────────────

export type LayerKey = 'friends' | 'huddles' | 'recs' | 'saved' | 'warmth';

export type PinColorName = 'yellow' | 'pink' | 'blue' | 'green';

// Category drives the little emoji pin on the map (🥐 bakery, 🍺 bar, …).
export type PlaceCategory = 'bakery' | 'bar' | 'cafe' | 'restaurant' | 'park' | 'music';

export const CATEGORY_META: Record<PlaceCategory, { emoji: string; label: string; color: PinColorName }> = {
  bakery: { emoji: '🥐', label: 'Bakery', color: 'yellow' },
  bar: { emoji: '🍺', label: 'Bar', color: 'blue' },
  cafe: { emoji: '☕', label: 'Café', color: 'yellow' },
  restaurant: { emoji: '🍜', label: 'Restaurant', color: 'pink' },
  park: { emoji: '🌳', label: 'Park', color: 'green' },
  music: { emoji: '🎵', label: 'Live Music', color: 'pink' },
};

export type StaticPin = {
  id: string;
  // Coarse layer tag so the filter pills (filterToLayers) keep working.
  kind: 'reco' | 'saved';
  category: PlaceCategory;
  name: string;
  distanceLabel: string;
  dLat: number; // offset from the user's location, in degrees (~0.001 ≈ 100m)
  dLng: number;
  rating: number; // 0–5, one decimal
  reviewCount: number;
  friendsVisited: string[]; // friend names who've been here (stub) → Avatar initials
  color: PinColorName;
};

export const staticPins: StaticPin[] = [
  {
    id: 'arvo',
    kind: 'reco',
    category: 'cafe',
    name: '% ARVO Café',
    distanceLabel: '0.2 mi',
    dLat: 0.0016,
    dLng: -0.0011,
    rating: 4.8,
    reviewCount: 312,
    friendsVisited: ['Sophie', 'Maya', 'Jake'],
    color: 'yellow',
  },
  {
    id: 'boulange',
    kind: 'reco',
    category: 'bakery',
    name: 'La Boulange',
    distanceLabel: '0.3 mi',
    dLat: 0.0022,
    dLng: 0.0014,
    rating: 4.6,
    reviewCount: 188,
    friendsVisited: ['Maya'],
    color: 'yellow',
  },
  {
    id: 'lowkey',
    kind: 'saved',
    category: 'bar',
    name: 'Lowkey Bar',
    distanceLabel: '0.2 mi',
    dLat: -0.0007,
    dLng: 0.0019,
    rating: 4.4,
    reviewCount: 96,
    friendsVisited: ['Sophie', 'Jake', 'Leah', 'Tom'],
    color: 'blue',
  },
  {
    id: 'ramen-ya',
    kind: 'reco',
    category: 'restaurant',
    name: 'Ramen-Ya',
    distanceLabel: '0.4 mi',
    dLat: -0.0019,
    dLng: -0.0006,
    rating: 4.7,
    reviewCount: 241,
    friendsVisited: [],
    color: 'pink',
  },
  {
    id: 'dolores',
    kind: 'saved',
    category: 'park',
    name: 'Dolores Park',
    distanceLabel: '0.5 mi',
    dLat: -0.0014,
    dLng: 0.0021,
    rating: 4.9,
    reviewCount: 1024,
    friendsVisited: ['Maya', 'Jake'],
    color: 'green',
  },
  {
    id: 'the-chapel',
    kind: 'saved',
    category: 'music',
    name: 'The Chapel',
    distanceLabel: '0.6 mi',
    dLat: 0.0009,
    dLng: -0.0022,
    rating: 4.5,
    reviewCount: 73,
    friendsVisited: [],
    color: 'pink',
  },
];

// A featured recommendation surfaced in the map lens + search. Points at a place.
export type StaticReco = {
  id: string;
  pinId: string;
  placeName: string;
  category: string;
  distanceLabel: string;
  tasteMatch: number;
  recommendedBy: string[]; // names → rendered as Avatar initials
};

export const recommendations: StaticReco[] = [
  {
    id: 'arvo-reco',
    pinId: 'arvo',
    placeName: '% ARVO Café',
    category: 'Café',
    distanceLabel: '0.2 mi',
    tasteMatch: 98,
    recommendedBy: ['Sophie', 'Maya', 'Jake'],
  },
];

export const featuredReco = recommendations[0];

// Category filter pills on the mobile map → which layers each one turns on.
// Only `all` / `huddles` filter real (live) markers; the rest scope static pins.
export type FilterKey = 'all' | 'huddles' | 'food' | 'activities' | 'cafes' | 'music';

export const mapFilters: { key: FilterKey; label: string; color: string }[] = [
  { key: 'all', label: 'All', color: 'var(--color-foreground)' },
  { key: 'huddles', label: 'Huddles', color: 'var(--color-blue)' },
  { key: 'food', label: 'Food', color: 'var(--color-orange)' },
  { key: 'activities', label: 'Activities', color: 'var(--color-pink)' },
  { key: 'cafes', label: 'Cafés', color: 'var(--color-yellow)' },
  { key: 'music', label: 'Music', color: 'var(--color-purple)' },
];

export const filterToLayers: Record<FilterKey, Record<LayerKey, boolean>> = {
  all: { friends: true, huddles: true, recs: true, saved: true, warmth: false },
  huddles: { friends: false, huddles: true, recs: false, saved: false, warmth: false },
  food: { friends: false, huddles: false, recs: true, saved: true, warmth: false },
  activities: { friends: true, huddles: true, recs: false, saved: false, warmth: false },
  cafes: { friends: false, huddles: false, recs: true, saved: false, warmth: false },
  music: { friends: false, huddles: false, recs: true, saved: false, warmth: false },
};

export function getReco(pinId: string): StaticReco | undefined {
  return recommendations.find((r) => r.pinId === pinId);
}

export function getPin(id: string): StaticPin | undefined {
  return staticPins.find((p) => p.id === id);
}
