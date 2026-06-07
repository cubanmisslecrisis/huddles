import { useState } from 'react';
import type { Place } from '@/lib/google-places';

export function PlacesPanel({
  places,
  selectedPlace,
  onSelectPlace,
  isLoading,
}: {
  places: Place[];
  selectedPlace: Place | null;
  onSelectPlace: (place: Place | null) => void;
  isLoading: boolean;
}) {
  const [isOpen, setIsOpen] = useState(true);

  if (!isOpen && places.length === 0) {
    return null;
  }

  return (
    <div className="absolute right-6 top-6 z-40 max-h-[70vh] w-80 bg-white rounded-lg shadow-lg overflow-hidden flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-800">
          {places.length > 0 ? `${places.length} Places Found` : 'Search for places'}
        </h3>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-gray-500 hover:text-gray-700 text-xl"
        >
          {isOpen ? '⌄' : '^'}
        </button>
      </div>

      {isOpen && (
        <div className="flex-1 overflow-y-auto">
          {isLoading && (
            <div className="p-4 text-center text-gray-500">
              <div className="inline-block animate-spin">⏳</div>
              <p className="mt-2 text-sm">Searching...</p>
            </div>
          )}

          {places.length === 0 && !isLoading && (
            <div className="p-4 text-center text-gray-500 text-sm">
              Click a button below the map to search for restaurants, cafes, or other places.
            </div>
          )}

          <div className="divide-y divide-gray-200">
            {places.map((place) => (
              <button
                key={place.placeId}
                onClick={() => onSelectPlace(selectedPlace?.placeId === place.placeId ? null : place)}
                className={`w-full p-3 text-left transition-colors hover:bg-gray-50 ${
                  selectedPlace?.placeId === place.placeId ? 'bg-orange-50 border-l-4 border-orange-500' : ''
                }`}
              >
                <div className="font-medium text-gray-800 text-sm truncate">{place.name}</div>
                <div className="text-xs text-gray-500 mt-1 truncate">{place.address}</div>
                {(place.rating || place.userRatings) && (
                  <div className="text-xs text-gray-600 mt-2 flex items-center gap-2">
                    {place.rating && (
                      <>
                        <span className="text-yellow-500">★</span>
                        <span>
                          {place.rating.toFixed(1)}
                          {place.userRatings && ` (${place.userRatings})`}
                        </span>
                      </>
                    )}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
