import { useState } from 'react';
import { searchNearbyPlaces, searchPlacesByQuery } from '@/lib/google-places';
import type { Place } from '@/lib/google-places';

export function PlacesSearch({
  userLat,
  userLng,
  onPlacesFound,
  onLoadingChange,
}: {
  userLat: number | null;
  userLng: number | null;
  onPlacesFound: (places: Place[]) => void;
  onLoadingChange?: (loading: boolean) => void;
}) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  if (!userLat || !userLng) {
    return null;
  }

  const handleNearbySearch = async (placeTypes: string[]) => {
    setIsSearching(true);
    onLoadingChange?.(true);
    const places = await searchNearbyPlaces(userLat, userLng, 1500, placeTypes);
    onPlacesFound(places);
    setIsSearching(false);
    onLoadingChange?.(false);
  };

  const handleQuerySearch = async () => {
    if (!query.trim()) return;
    setIsSearching(true);
    onLoadingChange?.(true);
    const places = await searchPlacesByQuery(userLat, userLng, query, 2000);
    onPlacesFound(places);
    setIsSearching(false);
    onLoadingChange?.(false);
  };

  return (
    <div className="absolute bottom-6 left-6 z-50 flex flex-col gap-3 pointer-events-auto">
      {showSearch && (
        <div className="flex gap-2 bg-white rounded-lg shadow-xl border border-gray-200 p-3 w-72">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleQuerySearch()}
            placeholder="Search places..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            disabled={isSearching}
            autoFocus
          />
          <button
            onClick={handleQuerySearch}
            disabled={isSearching || !query.trim()}
            className="px-4 py-2 bg-orange-500 text-white rounded font-medium text-sm hover:bg-orange-600 disabled:opacity-50 transition"
          >
            {isSearching ? '...' : 'Go'}
          </button>
          <button
            onClick={() => setShowSearch(false)}
            className="px-3 py-2 text-gray-400 hover:text-gray-600 text-lg"
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
            className="px-4 py-2 bg-white text-gray-800 rounded-lg shadow-lg hover:shadow-xl text-lg font-semibold border border-gray-200 disabled:opacity-50 transition hover:bg-gray-50"
            title="Custom search"
          >
            🔍
          </button>
        )}

        <button
          onClick={() => handleNearbySearch(['restaurant'])}
          disabled={isSearching}
          className="px-4 py-2 bg-white text-gray-800 rounded-lg shadow-lg hover:shadow-xl font-semibold text-sm border border-gray-200 disabled:opacity-50 transition hover:bg-gray-50 whitespace-nowrap"
          title="Find nearby restaurants"
        >
          🍽️ Restaurants
        </button>

        <button
          onClick={() => handleNearbySearch(['cafe'])}
          disabled={isSearching}
          className="px-4 py-2 bg-white text-gray-800 rounded-lg shadow-lg hover:shadow-xl font-semibold text-sm border border-gray-200 disabled:opacity-50 transition hover:bg-gray-50 whitespace-nowrap"
          title="Find nearby cafes"
        >
          ☕ Cafes
        </button>

        <button
          onClick={() => handleNearbySearch(['restaurant', 'cafe', 'bar', 'bakery'])}
          disabled={isSearching}
          className="px-4 py-2 bg-white text-gray-800 rounded-lg shadow-lg hover:shadow-xl font-semibold text-sm border border-gray-200 disabled:opacity-50 transition hover:bg-gray-50 whitespace-nowrap"
          title="Find all food & drink places"
        >
          🍴 Food & Drink
        </button>
      </div>
    </div>
  );
}
