import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import type { Place } from '@/lib/google-places';

function getPlaceIcon(type: string): string {
  const typeStr = type.toLowerCase();
  if (typeStr.includes('restaurant')) return '🍽️';
  if (typeStr.includes('cafe') || typeStr.includes('coffee')) return '☕';
  if (typeStr.includes('bakery')) return '🥐';
  if (typeStr.includes('bar')) return '🍺';
  if (typeStr.includes('pizza')) return '🍕';
  if (typeStr.includes('sushi')) return '🍣';
  if (typeStr.includes('grocery')) return '🛒';
  if (typeStr.includes('shopping')) return '🛍️';
  if (typeStr.includes('bank')) return '🏦';
  if (typeStr.includes('library')) return '📚';
  if (typeStr.includes('park')) return '🌳';
  if (typeStr.includes('museum')) return '🎨';
  if (typeStr.includes('hotel')) return '🏨';
  if (typeStr.includes('transit')) return '🚇';
  return '📍';
}

export function PlaceMarkers({
  map,
  places,
  selectedPlace,
  onSelectPlace,
}: {
  map: mapboxgl.Map | null;
  places: Place[];
  selectedPlace: Place | null;
  onSelectPlace: (place: Place | null) => void;
}) {
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());

  useEffect(() => {
    if (!map) return;

    // Remove markers that are no longer in the places list
    const placeIds = new Set(places.map((p) => p.placeId));
    markersRef.current.forEach((marker, id) => {
      if (!placeIds.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    });

    // Add or update markers for current places
    places.forEach((place) => {
      if (markersRef.current.has(place.placeId)) {
        const marker = markersRef.current.get(place.placeId)!;
        marker.setLngLat([place.lng, place.lat]);
      } else {
        const el = document.createElement('div');
        el.className = 'place-label-marker';

        const isSelected = selectedPlace?.placeId === place.placeId;
        const icon = getPlaceIcon(place.type || '');

        el.innerHTML = `
          <div class="place-icon-marker ${isSelected ? 'selected' : ''}" title="${place.name}">
            ${icon}
          </div>
        `;

        el.addEventListener('click', (e) => {
          e.stopPropagation();
          onSelectPlace(isSelected ? null : place);
        });

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([place.lng, place.lat])
          .addTo(map);

        markersRef.current.set(place.placeId, marker);
      }
    });
  }, [map, places, selectedPlace, onSelectPlace]);

  // Cleanup
  useEffect(() => {
    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current.clear();
    };
  }, []);

  return null;
}
