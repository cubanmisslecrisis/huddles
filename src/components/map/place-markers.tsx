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
    places.forEach((place) => {
      if (markersRef.current.has(place.placeId)) {
        const marker = markersRef.current.get(place.placeId)!;
        marker.setLngLat([place.lng, place.lat]);
      } else {
        const el = document.createElement('div');
        el.className = 'place-marker';
        el.innerHTML = `
          <div class="place-marker-icon">
            <div class="place-marker-dot"></div>
          </div>
        `;

        const isSelected = selectedPlace?.placeId === place.placeId;
        if (isSelected) {
          el.classList.add('selected');
        }

        el.addEventListener('click', () => {
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
