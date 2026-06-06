// ───────────────────────────────────────────────────────────────────────────
// PLACEHOLDER — no backend yet (Phase-2 "places" domain).
// The people/proximity/huddle/heat data is all live from SpacetimeDB. Places
// (recommendations, saved spots, place pins) have no table yet, so this static
// set stands in for the design. Pins are stored as small lat/lng OFFSETS and
// resolved against the user's live location so they scatter around them.
// TODO: replace with a real `recommendation` / `place` table + reducers.
// ───────────────────────────────────────────────────────────────────────────

export type LayerKey = 'friends' | 'huddles' | 'recs' | 'saved' | 'warmth';

export type PinColorName = 'yellow' | 'pink' | 'blue' | 'green';

export type StaticPin = {
  id: string;
  kind: 'reco' | 'music' | 'content' | 'saved';
  label?: string;
  category?: string;
  distanceLabel?: string;
  dLat: number; // offset from the user's location, in degrees (~0.001 ≈ 100m)
  dLng: number;
  color: PinColorName;
};

export const staticPins: StaticPin[] = [
  { id: 'reco-coffee', kind: 'reco', label: 'RECO', category: 'Coffee', distanceLabel: '0.2 mi', dLat: 0.0016, dLng: -0.0011, color: 'yellow' },
  { id: 'music', kind: 'music', distanceLabel: '0.3 mi', dLat: 0.0022, dLng: 0.0014, color: 'pink' },
  { id: 'content', kind: 'content', distanceLabel: '0.2 mi', dLat: -0.0007, dLng: 0.0019, color: 'green' },
  { id: 'saved-heart', kind: 'saved', distanceLabel: '0.4 mi', dLat: -0.0019, dLng: -0.0006, color: 'blue' },
  { id: 'saved-pink', kind: 'saved', distanceLabel: '0.5 mi', dLat: -0.0014, dLng: 0.0021, color: 'pink' },
];

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
    id: 'arvo',
    pinId: 'reco-coffee',
    placeName: '% ARVO Café',
    category: 'Café',
    distanceLabel: '0.3 mi',
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
