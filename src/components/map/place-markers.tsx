import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import type { Place } from '@/lib/google-places';

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
    places.forEach((place, index) => {
      const markerNumber = index + 1;
      if (markersRef.current.has(place.placeId)) {
        const marker = markersRef.current.get(place.placeId)!;
        marker.setLngLat([place.lng, place.lat]);
      } else {
        const el = document.createElement('div');
        el.className = 'google-maps-marker';

        const isSelected = selectedPlace?.placeId === place.placeId;

        el.innerHTML = `
          <div class="google-maps-marker-pin ${isSelected ? 'selected' : ''}">
            <div class="google-maps-marker-number">${markerNumber}</div>
          </div>
        `;

        el.addEventListener('click', () => {
          onSelectPlace(isSelected ? null : place);
        });

        const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
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
