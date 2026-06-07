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

  return (
    <div className="absolute right-6 top-6 z-50 w-96 bg-white rounded-xl shadow-xl border border-gray-200 flex flex-col max-h-[70vh] pointer-events-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-white rounded-t-xl">
        <h3 className="font-bold text-gray-800">
          {places.length > 0 ? `${places.length} Places Found` : 'Nearby Places'}
        </h3>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          title={isOpen ? 'Collapse' : 'Expand'}
        >
          {isOpen ? '−' : '+'}
        </button>
      </div>

      {/* Content */}
      {isOpen && (
        <div className="flex-1 overflow-y-auto">
          {isLoading && (
            <div className="p-8 text-center">
              <div className="inline-block text-3xl animate-spin">🔍</div>
              <p className="mt-2 text-sm font-medium text-gray-600">Searching nearby...</p>
            </div>
          )}

          {places.length === 0 && !isLoading && (
            <div className="p-6 text-center text-gray-500">
              <p className="text-sm">👇 Click a button below the map to search</p>
              <p className="text-xs mt-2">Try "Restaurants", "Cafes", or "Food & Drink"</p>
            </div>
          )}

          {places.length > 0 && (
            <div className="divide-y divide-gray-100">
              {places.map((place) => (
                <button
                  key={place.placeId}
                  onClick={() => onSelectPlace(selectedPlace?.placeId === place.placeId ? null : place)}
                  className={`w-full px-4 py-3 text-left transition-all hover:bg-orange-50 ${
                    selectedPlace?.placeId === place.placeId
                      ? 'bg-orange-100 border-l-4 border-orange-500'
                      : 'hover:border-l-4 hover:border-orange-200'
                  }`}
                >
                  <div className="font-semibold text-gray-800 text-sm">{place.name}</div>
                  <div className="text-xs text-gray-500 mt-1">{place.address}</div>
                  {(place.rating || place.userRatings) && (
                    <div className="text-xs text-gray-600 mt-2 flex items-center gap-1">
                      <span className="text-yellow-500 text-lg">★</span>
                      <span className="font-medium">
                        {place.rating?.toFixed(1) || 'N/A'}
                      </span>
                      {place.userRatings && (
                        <span className="text-gray-400">({place.userRatings})</span>
                      )}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
