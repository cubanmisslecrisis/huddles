import { useState } from 'react';
import { searchNearbyPlaces, searchPlacesByQuery } from '@/lib/google-places';
import type { Place } from '@/lib/google-places';

export function PlacesSearch({
  userLat,
  userLng,
  onPlacesFound,
  loading = false,
}: {
  userLat: number | null;
  userLng: number | null;
  onPlacesFound: (places: Place[]) => void;
  loading?: boolean;
}) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  if (!userLat || !userLng) {
    return null;
  }

  const handleNearbySearch = async (placeTypes: string[]) => {
    setIsSearching(true);
    const places = await searchNearbyPlaces(userLat, userLng, 1500, placeTypes);
    onPlacesFound(places);
    setIsSearching(false);
  };

  const handleQuerySearch = async () => {
    if (!query.trim()) return;
    setIsSearching(true);
    const places = await searchPlacesByQuery(userLat, userLng, query, 2000);
    onPlacesFound(places);
    setIsSearching(false);
  };

  return (
    <div className="absolute bottom-6 left-6 z-40 flex flex-col gap-2">
      {showSearch && (
        <div className="flex gap-2 bg-white rounded-lg shadow-lg p-3 max-w-sm">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleQuerySearch()}
            placeholder="Search places (e.g., 'coffee shops')"
            className="flex-1 px-3 py-2 border border-gray-300 rounded bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            disabled={isSearching}
          />
          <button
            onClick={handleQuerySearch}
            disabled={isSearching || !query.trim()}
            className="px-3 py-2 bg-orange-500 text-white rounded text-sm hover:bg-orange-600 disabled:opacity-50"
          >
            {isSearching ? '...' : 'Search'}
          </button>
          <button
            onClick={() => setShowSearch(false)}
            className="px-3 py-2 text-gray-600 hover:text-gray-800"
          >
            ✕
          </button>
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {!showSearch && (
          <button
            onClick={() => setShowSearch(true)}
            disabled={isSearching}
            className="px-3 py-2 bg-white text-gray-700 rounded-lg shadow hover:shadow-md text-sm font-medium disabled:opacity-50 transition"
            title="Custom search"
          >
            🔍
          </button>
        )}

        <button
          onClick={() => handleNearbySearch(['restaurant'])}
          disabled={isSearching}
          className="px-3 py-2 bg-white text-gray-700 rounded-lg shadow hover:shadow-md text-sm font-medium disabled:opacity-50 transition"
          title="Find nearby restaurants"
        >
          🍽️ Restaurants
        </button>

        <button
          onClick={() => handleNearbySearch(['cafe'])}
          disabled={isSearching}
          className="px-3 py-2 bg-white text-gray-700 rounded-lg shadow hover:shadow-md text-sm font-medium disabled:opacity-50 transition"
          title="Find nearby cafes"
        >
          ☕ Cafes
        </button>

        <button
          onClick={() => handleNearbySearch(['restaurant', 'cafe', 'bar', 'bakery'])}
          disabled={isSearching}
          className="px-3 py-2 bg-white text-gray-700 rounded-lg shadow hover:shadow-md text-sm font-medium disabled:opacity-50 transition"
          title="Find all food & drink places"
        >
          🍴 Food & Drink
        </button>
      </div>
    </div>
  );
}
