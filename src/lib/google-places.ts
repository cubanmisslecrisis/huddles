export interface Place {
  placeId: string;
  name: string;
  lat: number;
  lng: number;
  type: string;
  rating?: number;
  userRatings?: number;
  address?: string;
}

const API_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;

// Initialize Google Maps library
declare global {
  interface Window {
    google?: any;
  }
}

function loadGoogleMapsScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.maps?.places) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Maps'));
    document.head.appendChild(script);
  });
}

export async function searchNearbyPlaces(
  lat: number,
  lng: number,
  radius: number = 1000,
  placeTypes: string[] = ['restaurant', 'cafe']
): Promise<Place[]> {
  try {
    await loadGoogleMapsScript();

    const service = new window.google.maps.places.PlacesService(
      document.createElement('div')
    );

    const places: Place[] = [];

    for (const type of placeTypes) {
      const results = await new Promise<any[]>((resolve, reject) => {
        service.nearbySearch(
          {
            location: { lat, lng },
            radius,
            type,
            language: 'en',
          },
          (results: any, status: any) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK) {
              resolve(results || []);
            } else {
              resolve([]);
            }
          }
        );
      });

      places.push(
        ...results.map((place) => ({
          placeId: place.place_id,
          name: place.name,
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
          type: place.types?.[0] || 'place',
          rating: place.rating,
          userRatings: place.user_ratings_total,
          address: place.vicinity,
        }))
      );
    }

    return places;
  } catch (error) {
    console.error('Error searching nearby places:', error);
    return [];
  }
}

export async function searchPlacesByQuery(
  lat: number,
  lng: number,
  query: string,
  radius: number = 2000
): Promise<Place[]> {
  try {
    await loadGoogleMapsScript();

    const service = new window.google.maps.places.PlacesService(
      document.createElement('div')
    );

    const results = await new Promise<any[]>((resolve, reject) => {
      service.nearbySearch(
        {
          location: { lat, lng },
          radius,
          keyword: query,
          language: 'en',
        },
        (results: any, status: any) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK) {
            resolve(results || []);
          } else {
            resolve([]);
          }
        }
      );
    });

    return results.map((place) => ({
      placeId: place.place_id,
      name: place.name,
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng(),
      type: place.types?.[0] || 'place',
      rating: place.rating,
      userRatings: place.user_ratings_total,
      address: place.vicinity,
    }));
  } catch (error) {
    console.error('Error searching places:', error);
    return [];
  }
}
