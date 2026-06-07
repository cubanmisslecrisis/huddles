import { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import type { Place } from '@/lib/google-places';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;

const PLACE_ICONS: Record<string, string> = {
  restaurant: '🍽️',
  cafe: '☕',
  bakery: '🥐',
  bar: '🍺',
  pizza: '🍕',
  sushi: '🍣',
  grocery_store: '🛒',
  shopping_mall: '🛍️',
  bank: '🏦',
  library: '📚',
  park: '🌳',
  museum: '🎨',
  hotel: '🏨',
  transit_station: '🚇',
};

function getPlaceIcon(type: string): string {
  const typeStr = type.toLowerCase();
  for (const [key, icon] of Object.entries(PLACE_ICONS)) {
    if (typeStr.includes(key)) return icon;
  }
  return '📍';
}

export function GoogleMap({
  places,
  selectedPlace,
  onSelectPlace,
  myLoc,
}: {
  places: Place[];
  selectedPlace: Place | null;
  onSelectPlace: (place: Place | null) => void;
  myLoc: { lat: number; lng: number } | null;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const userMarkerRef = useRef<any>(null);
  const heatmapRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Load Google Maps API
  useEffect(() => {
    const loader = new Loader({
      apiKey: GOOGLE_MAPS_API_KEY,
      version: 'weekly',
      libraries: ['places', 'visualization'],
    });

    loader.load().then(() => {
      if (!mapRef.current) return;

      const googleMaps = (window as any).google.maps;
      const map = new googleMaps.Map(mapRef.current, {
        zoom: 14,
        center: myLoc || { lat: 40.7484, lng: -73.9857 },
        mapTypeId: 'roadmap',
        styles: [
          {
            featureType: 'all',
            elementType: 'all',
            stylers: [{ saturation: -100 }],
          },
        ],
      });

      googleMapRef.current = map;
      setMapLoaded(true);
    });
  }, []);

  // Add user location marker
  useEffect(() => {
    if (!googleMapRef.current || !myLoc) return;

    const googleMaps = (window as any).google?.maps;
    if (!googleMaps) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.setPosition(myLoc);
    } else {
      userMarkerRef.current = new googleMaps.Marker({
        position: myLoc,
        map: googleMapRef.current,
        title: 'Your location',
        icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
      });
    }

    googleMapRef.current.setCenter(myLoc);
  }, [myLoc, mapLoaded]);

  // Add heatmap layer
  useEffect(() => {
    if (!googleMapRef.current || places.length === 0) return;

    const googleMaps = (window as any).google?.maps;
    if (!googleMaps) return;

    const heatmapData = places.map(
      (place) =>
        new googleMaps.LatLng(place.lat, place.lng)
    );

    if (heatmapRef.current) {
      heatmapRef.current.setData(heatmapData);
    } else {
      heatmapRef.current = new googleMaps.visualization.HeatmapLayer({
        data: heatmapData,
        map: googleMapRef.current,
        radius: 50,
        opacity: 0.5,
      });
    }
  }, [places, mapLoaded]);

  // Update place markers
  useEffect(() => {
    if (!googleMapRef.current || !mapLoaded) return;

    const googleMaps = (window as any).google?.maps;
    if (!googleMaps) return;

    // Remove markers not in places list
    const placeIds = new Set(places.map((p) => p.placeId));
    markersRef.current.forEach((marker, id) => {
      if (!placeIds.has(id)) {
        marker.setMap(null);
        markersRef.current.delete(id);
      }
    });

    // Add/update place markers
    places.forEach((place) => {
      if (markersRef.current.has(place.placeId)) {
        const marker = markersRef.current.get(place.placeId)!;
        marker.setPosition({ lat: place.lat, lng: place.lng });
      } else {
        const icon = getPlaceIcon(place.type || '');

        const marker = new googleMaps.Marker({
          position: { lat: place.lat, lng: place.lng },
          map: googleMapRef.current,
          title: place.name,
          label: {
            text: icon,
            fontSize: '18px',
          },
        });

        const infoWindow = new googleMaps.InfoWindow({
          content: `
            <div style="padding: 10px; max-width: 200px;">
              <h3 style="margin: 0 0 8px 0; font-weight: bold;">${place.name}</h3>
              <div style="font-size: 12px; color: #666;">
                ${place.address ? `<p>${place.address}</p>` : ''}
                ${place.rating ? `<p>⭐ ${place.rating.toFixed(1)}${place.userRatings ? ` (${place.userRatings})` : ''}</p>` : ''}
              </div>
            </div>
          `,
        });

        marker.addListener('click', () => {
          // Close all info windows
          document.querySelectorAll('.gm-ui-hover-effect').forEach((el) => {
            if (el instanceof HTMLElement) {
              el.style.display = 'none';
            }
          });
          infoWindow.open(googleMapRef.current, marker);
          onSelectPlace(place);
        });

        markersRef.current.set(place.placeId, marker);
      }
    });
  }, [places, mapLoaded, onSelectPlace]);

  return (
    <div
      ref={mapRef}
      className="w-full h-full"
      style={{ minHeight: '100%' }}
    />
  );
}
