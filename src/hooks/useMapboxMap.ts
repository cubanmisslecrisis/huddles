import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { MapMarkerDef } from '@/hooks/useMapMarkerDefs';
import type { HeatPoint } from '@/components/map/markers';

const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;

// [lng, lat] — Mapbox order. ~Midtown NYC, matching the server's demo fallback.
const FALLBACK: [number, number] = [-73.9857, 40.7484];
const DEFAULT_ZOOM = 14.5;

const WARMTH_SOURCE_ID = 'activity-heat';
const WARMTH_LAYER_ID = 'activity-heat-layer';

function heatGeoJSON(heat: HeatPoint[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: heat.map((h) => ({
      type: 'Feature',
      properties: { weight: h.weight },
      geometry: { type: 'Point', coordinates: [h.lng, h.lat] },
    })),
  };
}

// Raw mapbox-gl map with React-portal markers. The skeleton's light 3D `standard`
// basemap, fed our live avatars (markerDefs) + heat_cell warmth (heat).
export function useMapboxMap({
  markerDefs,
  heat,
  warmthEnabled,
  myLoc,
}: {
  markerDefs: MapMarkerDef[];
  heat: HeatPoint[];
  warmthEnabled: boolean;
  myLoc: { lat: number; lng: number } | null;
}) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const containersRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const mapboxMarkersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const recenteredRef = useRef(false);

  const [mapReady, setMapReady] = useState(false);
  const [tokenMissing, setTokenMissing] = useState(false);
  const [mounted, setMounted] = useState(false);

  const markerKeys = markerDefs.map((d) => d.key).join('\0');

  const getContainer = useCallback((key: string) => {
    let el = containersRef.current.get(key);
    if (!el) {
      el = document.createElement('div');
      containersRef.current.set(key, el);
    }
    return el;
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Create the map once.
  useEffect(() => {
    if (!TOKEN) {
      setTokenMissing(true);
      return;
    }
    if (mapRef.current || !mapContainerRef.current) return;

    mapboxgl.accessToken = TOKEN;
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/standard',
      center: FALLBACK,
      zoom: 12,
      pitch: 0,
      bearing: 0,
      antialias: true,
      attributionControl: false,
    });
    mapRef.current = map;

    map.on('style.load', () => {
      try {
        map.setConfigProperty('basemap', 'lightPreset', 'day');
        map.setConfigProperty('basemap', 'showPointOfInterestLabels', false);
      } catch {
        // older style versions may not support config properties
      }
    });

    map.on('load', () => setMapReady(true));

    return () => {
      map.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, []);

  // Warmth heatmap: ensure source+layer, refresh data when `heat` changes, toggle opacity.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const apply = () => {
      const data = heatGeoJSON(heat);
      const src = map.getSource(WARMTH_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
      if (!src) {
        map.addSource(WARMTH_SOURCE_ID, { type: 'geojson', data });
      } else {
        src.setData(data);
      }
      // Natural heatmap paint — no animation, weight drives spread.
      // Server weights range 0–16 (HEAT_PER_HEARTBEAT=2, HEAT_MAX=16, decays with factor 0.6).
      const heatmapPaint: mapboxgl.HeatmapLayerSpecification['paint'] = {
        // Map server weight (0–16) to heatmap point weight (0–1).
        'heatmap-weight': ['interpolate', ['linear'], ['get', 'weight'], 0, 0, 4, 0.4, 8, 0.7, 16, 1],
        // Intensity amplifies the kernel density — stronger at closer zoom.
        'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 10, 0.4, 13, 1.0, 15, 1.8, 17, 2.5],
        // Natural warm color ramp: transparent → amber → orange → red, hot core white.
        'heatmap-color': [
          'interpolate',
          ['linear'],
          ['heatmap-density'],
          0,   'rgba(0, 0, 0, 0)',
          0.1, 'rgba(255, 220, 80, 0.35)',
          0.3, 'rgba(255, 140, 20, 0.6)',
          0.5, 'rgba(255, 60, 10, 0.75)',
          0.7, 'rgba(220, 10, 40, 0.85)',
          0.9, 'rgba(180, 0, 80, 0.92)',
          1,   'rgba(255, 255, 255, 1)',
        ],
        // Larger radius = more organic spread; scales up as you zoom in.
        'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 10, 20, 12, 45, 14, 80, 15, 110, 16, 150, 17, 200],
        'heatmap-opacity': warmthEnabled ? 0.8 : 0,
      };

      if (!map.getLayer(WARMTH_LAYER_ID)) {
        map.addLayer({
          id: WARMTH_LAYER_ID,
          type: 'heatmap',
          source: WARMTH_SOURCE_ID,
          slot: 'top',
          paint: heatmapPaint,
        });
      } else {
        map.setPaintProperty(WARMTH_LAYER_ID, 'heatmap-weight', heatmapPaint['heatmap-weight']);
        map.setPaintProperty(WARMTH_LAYER_ID, 'heatmap-intensity', heatmapPaint['heatmap-intensity']);
        map.setPaintProperty(WARMTH_LAYER_ID, 'heatmap-color', heatmapPaint['heatmap-color']);
        map.setPaintProperty(WARMTH_LAYER_ID, 'heatmap-radius', heatmapPaint['heatmap-radius']);
        map.setPaintProperty(WARMTH_LAYER_ID, 'heatmap-opacity', heatmapPaint['heatmap-opacity']);
      }
    };

    if (map.isStyleLoaded()) apply();
    else map.once('idle', apply);
  }, [mapReady, heat, warmthEnabled]);

  // Sync mapbox markers to the current marker defs (add new, remove gone).
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const activeKeys = new Set(markerDefs.map((m) => m.key));
    mapboxMarkersRef.current.forEach((marker, key) => {
      if (!activeKeys.has(key)) {
        marker.remove();
        mapboxMarkersRef.current.delete(key);
      }
    });

    for (const def of markerDefs) {
      const existing = mapboxMarkersRef.current.get(def.key);
      if (existing) {
        existing.setLngLat([def.lng, def.lat]);
      } else {
        const el = getContainer(def.key);
        const marker = new mapboxgl.Marker({ element: el, anchor: def.anchor })
          .setLngLat([def.lng, def.lat])
          .addTo(map);
        mapboxMarkersRef.current.set(def.key, marker);
      }
    }
  }, [mapReady, markerKeys, markerDefs, getContainer]);

  // Fly to the user's location the first time we get a fix.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !myLoc || recenteredRef.current) return;
    recenteredRef.current = true;
    map.flyTo({ center: [myLoc.lng, myLoc.lat], zoom: DEFAULT_ZOOM, pitch: 0, bearing: 0, duration: 1200 });
  }, [mapReady, myLoc]);

  const recenter = useCallback(() => {
    const map = mapRef.current;
    const c = myLoc ? ([myLoc.lng, myLoc.lat] as [number, number]) : FALLBACK;
    map?.flyTo({ center: c, zoom: DEFAULT_ZOOM, pitch: 0, bearing: 0, duration: 900 });
  }, [myLoc]);

  const flyTo = useCallback((lat: number, lng: number) => {
    mapRef.current?.flyTo({ center: [lng, lat], zoom: 16, duration: 900 });
  }, []);

  const zoomIn = useCallback(() => mapRef.current?.zoomIn(), []);
  const zoomOut = useCallback(() => mapRef.current?.zoomOut(), []);

  const markerPortals = mounted ? markerDefs.map((def) => createPortal(def.node, getContainer(def.key), def.key)) : null;

  return { mapContainerRef, tokenMissing, markerPortals, recenter, flyTo, zoomIn, zoomOut, mapRef };
}
