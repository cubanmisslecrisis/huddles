import { useState, useEffect } from 'react';
import { searchNearbyPlaces } from '@/lib/google-places';
import type { Place } from '@/lib/google-places';
import { MapCanvas } from './MapCanvas';
import type { MapAvatar, HeatPoint, Selection } from './markers';
import type { LayerKey } from '@/lib/places-data';
import type { MapControls } from './MapCanvas';

const CATEGORIES = [
  { id: 'restaurant', label: 'Restaurants', emoji: '🍽️', types: ['restaurant'] },
  { id: 'cafe', label: 'Cafes', emoji: '☕', types: ['cafe'] },
  { id: 'bar', label: 'Bars', emoji: '🍺', types: ['bar'] },
  { id: 'bakery', label: 'Bakeries', emoji: '🥐', types: ['bakery'] },
  { id: 'pizza', label: 'Pizza', emoji: '🍕', types: ['restaurant'] },
  { id: 'sushi', label: 'Sushi', emoji: '🍣', types: ['restaurant'] },
  { id: 'dessert', label: 'Dessert', emoji: '🍰', types: ['bakery', 'cafe'] },
  { id: 'grocery', label: 'Groceries', emoji: '🛒', types: ['grocery_store'] },
];

export function GoogleMapsStyle({
  avatars,
  heat,
  myLoc,
  selection,
  onSelect,
  activeLayers,
  controlsRef,
  friends = [],
}: {
  avatars: MapAvatar[];
  heat: HeatPoint[];
  myLoc: { lat: number; lng: number } | null;
  selection: Selection;
  onSelect: (s: Selection) => void;
  activeLayers: Record<LayerKey, boolean>;
  controlsRef?: React.MutableRefObject<MapControls | null>;
  friends?: Array<{ key: string; name: string; distanceMeters?: number | null }>;
}) {
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'relevant' | 'distance' | 'rating'>('relevant');

  // Auto-load all nearby places
  useEffect(() => {
    if (!myLoc) return;

    const loadPlaces = async () => {
      setIsLoading(true);
      const allTypes = CATEGORIES.flatMap((c) => c.types);
      // 805 m radius ≈ a 1-mile diameter around the user.
      const foundPlaces = await searchNearbyPlaces(myLoc.lat, myLoc.lng, 805, allTypes);
      console.log('All found places:', foundPlaces.map(p => p.name));
      setPlaces(foundPlaces);
      setIsLoading(false);
    };

    loadPlaces();
  }, [myLoc]);

  const filteredPlaces = places
    .filter((place) => {
      const name = place.name.toLowerCase();
      return !name.startsWith('reco') && name !== '% arvo café' && name !== '% arvo cafe' && !name.includes('saved places');
    })
    .filter((place) => {
      if (activeCategory !== 'all') {
        const category = CATEGORIES.find((c) => c.id === activeCategory);
        // Filter by category type matching
        return category?.types.some((t) => place.type?.includes(t));
      }
      return true;
    })
    .filter((place) => {
      if (!searchQuery) return true;
      return place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        place.address?.toLowerCase().includes(searchQuery.toLowerCase());
    })
    .sort((a, b) => {
      if (sortBy === 'rating') {
        return (b.rating || 0) - (a.rating || 0);
      }
      if (sortBy === 'distance') {
        if (!myLoc) return 0;
        const distA = Math.sqrt(Math.pow(a.lat - myLoc.lat, 2) + Math.pow(a.lng - myLoc.lng, 2));
        const distB = Math.sqrt(Math.pow(b.lat - myLoc.lat, 2) + Math.pow(b.lng - myLoc.lng, 2));
        return distA - distB;
      }
      return 0; // relevant
    });

  return (
    <div className="flex h-full w-full bg-white">
      {/* Sidebar */}
      <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
        {/* Search Bar */}
        <div className="p-4 border-b border-gray-200">
          <input
            type="text"
            placeholder="Search restaurants, cafes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        {/* Category Filters */}
        <div className="border-b border-gray-200 p-3 overflow-x-auto">
          <div className="flex gap-2 whitespace-nowrap">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                activeCategory === 'all'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition flex items-center gap-1 ${
                  activeCategory === cat.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Sorting */}
        <div className="border-b border-gray-200 p-3 flex gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="relevant">Most Relevant</option>
            <option value="distance">Closest</option>
            <option value="rating">Highest Rated</option>
          </select>
          <div className="text-sm font-medium text-gray-600 py-1.5">
            {filteredPlaces.length} results
          </div>
        </div>

        {/* Places List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading && (
            <div className="p-8 text-center text-gray-500">
              <div className="text-3xl animate-spin mb-2">🔍</div>
              <p className="text-sm font-medium">Loading nearby places...</p>
            </div>
          )}

          {!isLoading && filteredPlaces.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <p className="text-sm">No places found</p>
            </div>
          )}

          <div>
            {filteredPlaces.map((place, index) => (
              <PlaceListItem
                key={place.placeId}
                place={place}
                index={index + 1}
                isSelected={selectedPlace?.placeId === place.placeId}
                onSelect={() =>
                  setSelectedPlace(selectedPlace?.placeId === place.placeId ? null : place)
                }
                myLoc={myLoc}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1">
        <MapCanvas
          avatars={avatars}
          heat={heat}
          myLoc={myLoc}
          selection={selection}
          onSelect={onSelect}
          activeLayers={activeLayers}
          controlsRef={controlsRef}
        friends={friends}
          places={filteredPlaces}
          selectedPlace={selectedPlace}
          onSelectPlace={setSelectedPlace}
        />
      </div>
    </div>
  );
}

function PlaceListItem({
  place,
  index,
  isSelected,
  onSelect,
  myLoc,
}: {
  place: Place;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  myLoc: { lat: number; lng: number } | null;
}) {
  const distance = myLoc
    ? Math.round(
        Math.sqrt(Math.pow(place.lat - myLoc.lat, 2) + Math.pow(place.lng - myLoc.lng, 2)) * 111000
      ) / 1000 // Convert to km
    : null;

  return (
    <button
      onClick={onSelect}
      className={`w-full border-b border-gray-100 p-4 text-left transition-colors hover:bg-gray-50 ${
        isSelected ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
      }`}
    >
      <div className="flex gap-3">
        {/* Marker Number */}
        <div className="flex-shrink-0 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
          {index}
        </div>

        {/* Place Info */}
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-gray-900 text-sm">{place.name}</div>

          {/* Rating */}
          {place.rating && (
            <div className="flex items-center gap-1 mt-1">
              <span className="text-yellow-500 text-sm">★</span>
              <span className="text-sm font-medium text-gray-700">{place.rating.toFixed(1)}</span>
              {place.userRatings && (
                <span className="text-xs text-gray-500">({place.userRatings})</span>
              )}
            </div>
          )}

          {/* Address & Distance */}
          <div className="text-xs text-gray-600 mt-1 truncate">{place.address}</div>
          {distance && <div className="text-xs text-gray-500 mt-0.5">{distance.toFixed(1)} km</div>}
        </div>
      </div>
    </button>
  );
}
