import { useEffect, useState } from 'react';
import { useMapMarkerDefs } from '@/hooks/useMapMarkerDefs';
import { useMapboxMap } from '@/hooks/useMapboxMap';
import { PlacesSearch } from '@/components/map/PlacesSearch';
import { PlaceMarkers } from '@/components/map/place-markers';
import { PlacesPanel } from '@/components/map/PlacesPanel';
import type { MapAvatar, HeatPoint, Selection } from '@/components/map/markers';
import type { LayerKey } from '@/lib/places-data';
import type { Place } from '@/lib/google-places';

export type MapControls = { recenter: () => void; flyTo: (lat: number, lng: number) => void };

export function MapCanvas({
  avatars,
  heat,
  myLoc,
  selection,
  onSelect,
  activeLayers,
  controlsRef,
}: {
  avatars: MapAvatar[];
  heat: HeatPoint[];
  myLoc: { lat: number; lng: number } | null;
  selection: Selection;
  onSelect: (s: Selection) => void;
  activeLayers: Record<LayerKey, boolean>;
  controlsRef?: React.MutableRefObject<MapControls | null>;
}) {
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false);

  const markerDefs = useMapMarkerDefs({ avatars, selection, onSelect, activeLayers, origin: myLoc });
  const { mapContainerRef, tokenMissing, markerPortals, recenter, flyTo, mapRef } = useMapboxMap({
    markerDefs,
    heat,
    warmthEnabled: activeLayers.warmth,
    myLoc,
  });

  useEffect(() => {
    if (controlsRef) controlsRef.current = { recenter, flyTo };
  }, [controlsRef, recenter, flyTo]);

  return (
    <div className="absolute inset-0 h-full w-full overflow-hidden bg-[oklch(0.93_0.03_230)]">
      <div ref={mapContainerRef} className="absolute inset-0 h-full w-full" />
      {markerPortals}
      <PlaceMarkers
        map={mapRef.current}
        places={places}
        selectedPlace={selectedPlace}
        onSelectPlace={setSelectedPlace}
      />
      <PlacesPanel
        places={places}
        selectedPlace={selectedPlace}
        onSelectPlace={setSelectedPlace}
        isLoading={isLoadingPlaces}
      />
      <PlacesSearch
        userLat={myLoc?.lat || null}
        userLng={myLoc?.lng || null}
        onPlacesFound={setPlaces}
        onLoadingChange={setIsLoadingPlaces}
      />
      {tokenMissing && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-secondary p-6 text-center">
          <p className="max-w-sm text-sm font-semibold text-foreground">
            Add your Mapbox token as{' '}
            <code className="rounded bg-card px-1.5 py-0.5 text-xs">VITE_MAPBOX_TOKEN</code> in{' '}
            <code className="rounded bg-card px-1.5 py-0.5 text-xs">.env.local</code> to load the 3D map.
          </p>
        </div>
      )}
    </div>
  );
}
