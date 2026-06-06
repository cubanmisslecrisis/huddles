import Map, { Source, Layer, Marker } from 'react-map-gl';
import type { MapRef, LayerProps } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useEffect, useMemo, useRef } from 'react';

const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;

// [lng, lat] — Mapbox order. ~Midtown NYC, matches the server demo fallback.
const FALLBACK: [number, number] = [-73.9857, 40.7484];

// One avatar on the map. `merged` = a huddle cluster (count members in one marker).
export type Avatar = {
  key: string;
  lat: number;
  lng: number;
  name: string;
  count: number;
  isMe: boolean;
  merged: boolean;
};

export type HeatPoint = { lat: number; lng: number; weight: number };

const PALETTE = [
  '#6B8FFF', '#FF6B9D', '#FFC93C', '#6BCB77', '#4D96FF',
  '#FF8A80', '#64B5F6', '#81C784', '#FFD54F', '#BA68C8',
];

function colorFor(key: string): string {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

// Snap-Map-style activity heatmap, driven by heat_cell weights.
const heatLayer: LayerProps = {
  id: 'activity-heat',
  type: 'heatmap',
  paint: {
    // Real cell weights are small (a few hits), so saturate quickly: weight 2 is
    // already warm, weight 12+ is full. Generous intensity/radius keeps sparse
    // cells visible.
    'heatmap-weight': ['interpolate', ['linear'], ['get', 'weight'], 0, 0, 2, 0.5, 12, 1],
    'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1.5, 16, 3.5],
    'heatmap-color': [
      'interpolate', ['linear'], ['heatmap-density'],
      0, 'rgba(0,0,0,0)',
      0.15, 'rgba(70,130,255,0.5)',
      0.4, 'rgba(0,200,255,0.65)',
      0.6, 'rgba(120,255,140,0.75)',
      0.8, 'rgba(255,220,80,0.85)',
      1, 'rgba(255,90,90,0.95)',
    ],
    'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 18, 12, 36, 16, 60],
    'heatmap-opacity': 0.75,
  },
};

// Pan to the user's location once, the first time we get a fix.
function useRecenterOnce(mapRef: React.RefObject<MapRef | null>, myLoc: [number, number] | null) {
  const done = useRef(false);
  useEffect(() => {
    if (myLoc && !done.current && mapRef.current) {
      done.current = true;
      mapRef.current.flyTo({ center: [myLoc[1], myLoc[0]], zoom: 15, duration: 1200 });
    }
  }, [myLoc, mapRef]);
}

export default function LiveMap({
  avatars,
  heat,
  myLoc,
}: {
  avatars: Avatar[];
  heat: HeatPoint[];
  myLoc: [number, number] | null;
}) {
  const mapRef = useRef<MapRef | null>(null);
  useRecenterOnce(mapRef, myLoc);

  const heatGeoJSON = useMemo(
    () => ({
      type: 'FeatureCollection' as const,
      features: heat.map((h) => ({
        type: 'Feature' as const,
        properties: { weight: h.weight },
        geometry: { type: 'Point' as const, coordinates: [h.lng, h.lat] },
      })),
    }),
    [heat]
  );

  if (!TOKEN) {
    return (
      <div className="map map-empty">
        <div>
          🗺️ <strong>Map needs a Mapbox token</strong>
          <p className="muted small">
            Add a public <code>pk.*</code> token as <code>VITE_MAPBOX_TOKEN</code> in
            <code> .env.local</code>, then restart the dev server.
          </p>
        </div>
      </div>
    );
  }

  const initialViewState = myLoc
    ? { longitude: myLoc[1], latitude: myLoc[0], zoom: 14 }
    : { longitude: FALLBACK[0], latitude: FALLBACK[1], zoom: 12 };

  return (
    <div className="map">
      <Map
        ref={mapRef}
        mapboxAccessToken={TOKEN}
        initialViewState={initialViewState}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        projection={{ name: 'mercator' }}
        style={{ width: '100%', height: '100%' }}
      >
        <Source id="activity" type="geojson" data={heatGeoJSON}>
          <Layer {...heatLayer} />
        </Source>

        {avatars.map((a) => (
          <Marker key={a.key} longitude={a.lng} latitude={a.lat} anchor="bottom">
            <div className={'avatar' + (a.merged ? ' merged' : '') + (a.isMe ? ' me' : '')}>
              <div
                className="avatar-dot"
                style={{ background: a.isMe ? '#6B8FFF' : colorFor(a.key) }}
              >
                {a.merged ? a.count : (a.name || '?').slice(0, 1).toUpperCase()}
              </div>
              <div className="avatar-name">
                {a.merged ? `${a.name} +${a.count - 1}` : a.name}
                {a.isMe ? ' (you)' : ''}
              </div>
            </div>
          </Marker>
        ))}
      </Map>
    </div>
  );
}
