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
  // Cafes & Coffee
  { id: 'reco-coffee', kind: 'reco', label: 'RECO', category: 'Coffee', distanceLabel: '0.2 mi', dLat: 0.0016, dLng: -0.0011, color: 'yellow' },
  { id: 'cafe-bloom', kind: 'reco', category: 'Café', distanceLabel: '0.3 mi', dLat: 0.0025, dLng: 0.0008, color: 'yellow' },
  { id: 'cafe-soho', kind: 'reco', category: 'Café', distanceLabel: '0.4 mi', dLat: -0.0032, dLng: 0.0006, color: 'yellow' },
  { id: 'cafe-west', kind: 'reco', category: 'Café', distanceLabel: '0.5 mi', dLat: 0.0005, dLng: -0.0038, color: 'yellow' },

  // Restaurants & Food
  { id: 'restaurant-italian', kind: 'reco', category: 'Italian Restaurant', distanceLabel: '0.3 mi', dLat: 0.0010, dLng: 0.0028, color: 'yellow' },
  { id: 'restaurant-asian', kind: 'reco', category: 'Asian Fusion', distanceLabel: '0.4 mi', dLat: -0.0018, dLng: 0.0025, color: 'yellow' },
  { id: 'restaurant-mexican', kind: 'reco', category: 'Mexican', distanceLabel: '0.2 mi', dLat: 0.0014, dLng: 0.0018, color: 'yellow' },
  { id: 'restaurant-burger', kind: 'reco', category: 'Burger Bar', distanceLabel: '0.6 mi', dLat: -0.0035, dLng: -0.0020, color: 'yellow' },

  // Bars & Lounges
  { id: 'bar-rooftop', kind: 'reco', category: 'Rooftop Bar', distanceLabel: '0.3 mi', dLat: 0.0022, dLng: -0.0020, color: 'pink' },
  { id: 'bar-cocktail', kind: 'reco', category: 'Cocktail Bar', distanceLabel: '0.4 mi', dLat: -0.0025, dLng: -0.0018, color: 'pink' },
  { id: 'bar-dive', kind: 'reco', category: 'Dive Bar', distanceLabel: '0.5 mi', dLat: 0.0008, dLng: -0.0032, color: 'pink' },
  { id: 'bar-wine', kind: 'reco', category: 'Wine Bar', distanceLabel: '0.6 mi', dLat: -0.0010, dLng: 0.0038, color: 'pink' },

  // Music & Entertainment
  { id: 'music-live', kind: 'music', category: 'Live Music', distanceLabel: '0.3 mi', dLat: 0.0022, dLng: 0.0014, color: 'pink' },
  { id: 'music-venue', kind: 'music', category: 'Concert Hall', distanceLabel: '0.5 mi', dLat: -0.0028, dLng: 0.0030, color: 'pink' },
  { id: 'music-karaoke', kind: 'music', category: 'Karaoke Bar', distanceLabel: '0.4 mi', dLat: 0.0035, dLng: -0.0005, color: 'pink' },
  { id: 'music-dj', kind: 'music', category: 'DJ Club', distanceLabel: '0.6 mi', dLat: -0.0020, dLng: -0.0032, color: 'pink' },

  // Activities & Recreation
  { id: 'activity-bowling', kind: 'content', category: 'Bowling', distanceLabel: '0.4 mi', dLat: 0.0030, dLng: 0.0022, color: 'green' },
  { id: 'activity-arcade', kind: 'content', category: 'Arcade Games', distanceLabel: '0.3 mi', dLat: -0.0007, dLng: 0.0019, color: 'green' },
  { id: 'activity-gym', kind: 'content', category: 'Gym & Fitness', distanceLabel: '0.2 mi', dLat: 0.0016, dLng: 0.0025, color: 'green' },
  { id: 'activity-yoga', kind: 'content', category: 'Yoga Studio', distanceLabel: '0.5 mi', dLat: -0.0032, dLng: 0.0015, color: 'green' },
  { id: 'activity-park', kind: 'content', category: 'Park & Recreation', distanceLabel: '0.3 mi', dLat: 0.0020, dLng: -0.0025, color: 'green' },
  { id: 'activity-cinema', kind: 'content', category: 'Cinema', distanceLabel: '0.6 mi', dLat: -0.0038, dLng: 0.0008, color: 'green' },

  // Saved Favorites
  { id: 'saved-heart', kind: 'saved', distanceLabel: '0.4 mi', dLat: -0.0019, dLng: -0.0006, color: 'blue' },
  { id: 'saved-pink', kind: 'saved', distanceLabel: '0.5 mi', dLat: -0.0014, dLng: 0.0021, color: 'blue' },
  { id: 'saved-spot', kind: 'saved', distanceLabel: '0.2 mi', dLat: 0.0012, dLng: -0.0015, color: 'blue' },
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
  {
    id: 'bloom-cafe',
    pinId: 'cafe-bloom',
    placeName: 'Bloom Coffee Roasters',
    category: 'Café',
    distanceLabel: '0.3 mi',
    tasteMatch: 92,
    recommendedBy: ['Alex', 'Jordan'],
  },
  {
    id: 'rooftop-bar',
    pinId: 'bar-rooftop',
    placeName: 'Sky Lounge',
    category: 'Rooftop Bar',
    distanceLabel: '0.3 mi',
    tasteMatch: 87,
    recommendedBy: ['Sam', 'Casey'],
  },
  {
    id: 'live-music',
    pinId: 'music-live',
    placeName: 'The Groove Room',
    category: 'Live Music',
    distanceLabel: '0.3 mi',
    tasteMatch: 95,
    recommendedBy: ['Taylor', 'Morgan', 'Riley'],
  },
  {
    id: 'bowling',
    pinId: 'activity-bowling',
    placeName: 'Strike Out Bowling',
    category: 'Bowling',
    distanceLabel: '0.4 mi',
    tasteMatch: 89,
    recommendedBy: ['Pat', 'Charlie'],
  },
];

export const featuredReco = recommendations[0];

// Category filter pills on the mobile map → which layers each one turns on.
// Only `all` / `huddles` filter real (live) markers; the rest scope static pins.
export type FilterKey = 'all' | 'huddles' | 'food' | 'restaurants' | 'bars' | 'cafes' | 'music' | 'activities';

export const mapFilters: { key: FilterKey; label: string; color: string }[] = [
  { key: 'all', label: 'All', color: 'var(--color-foreground)' },
  { key: 'huddles', label: 'Huddles', color: 'var(--color-blue)' },
  { key: 'cafes', label: 'Cafés', color: 'var(--color-yellow)' },
  { key: 'restaurants', label: 'Restaurants', color: 'var(--color-orange)' },
  { key: 'bars', label: 'Bars', color: 'var(--color-pink)' },
  { key: 'music', label: 'Music', color: 'var(--color-purple)' },
  { key: 'activities', label: 'Activities', color: 'var(--color-green)' },
];

export const filterToLayers: Record<FilterKey, Record<LayerKey, boolean>> = {
  all: { friends: true, huddles: true, recs: true, saved: true, warmth: false },
  huddles: { friends: false, huddles: true, recs: false, saved: false, warmth: false },
  cafes: { friends: false, huddles: false, recs: true, saved: false, warmth: false },
  restaurants: { friends: false, huddles: false, recs: true, saved: false, warmth: false },
  bars: { friends: false, huddles: false, recs: true, saved: false, warmth: false },
  food: { friends: false, huddles: false, recs: true, saved: true, warmth: false },
  music: { friends: false, huddles: false, recs: true, saved: false, warmth: false },
  activities: { friends: true, huddles: false, recs: true, saved: false, warmth: false },
};

export function getReco(pinId: string): StaticReco | undefined {
  return recommendations.find((r) => r.pinId === pinId);
}

export function getPin(id: string): StaticPin | undefined {
  return staticPins.find((p) => p.id === id);
}
