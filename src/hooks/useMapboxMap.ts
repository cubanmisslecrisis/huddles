import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { MapMarkerDef } from '@/hooks/useMapMarkerDefs';
import type { HeatPoint, HuddleHeatPoint } from '@/components/map/markers';

const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;

// [lng, lat] — Mapbox order. ~Midtown NYC, matching the server's demo fallback.
const FALLBACK: [number, number] = [-73.9857, 40.7484];
const DEFAULT_ZOOM = 14.5;

const WARMTH_SOURCE_ID = 'activity-heat';
const WARMTH_LAYER_ID = 'activity-heat-layer';
const HUDDLE_SOURCE_ID = 'huddle-heat';
const HUDDLE_LAYER_ID = 'huddle-heat-layer';

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

// Huddle-heat points with an animated throb factor `k` folded into the weight, so the
// heatmap *under* a huddle pulses with amplitude proportional to its warmth.
function huddleGeoJSON(points: HuddleHeatPoint[], k: number): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: points.map((p) => ({
      type: 'Feature',
      properties: { weight: p.warmth * k },
      geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
    })),
  };
}

// Raw mapbox-gl map with React-portal markers. The skeleton's light 3D `standard`
// basemap, fed our live avatars (markerDefs) + heat_cell warmth (heat).
export function useMapboxMap({
  markerDefs,
  heat,
  huddleHeat,
  warmthEnabled,
  myLoc,
}: {
  markerDefs: MapMarkerDef[];
  heat: HeatPoint[];
  huddleHeat: HuddleHeatPoint[];
  warmthEnabled: boolean;
  myLoc: { lat: number; lng: number } | null;
}) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const containersRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const mapboxMarkersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const recenteredRef = useRef(false);
  const huddleHeatRef = useRef(huddleHeat);
  huddleHeatRef.current = huddleHeat;

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
      pitch: 60,
      bearing: -20,
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
      if (!map.getLayer(WARMTH_LAYER_ID)) {
        map.addLayer({
          id: WARMTH_LAYER_ID,
          type: 'heatmap',
          source: WARMTH_SOURCE_ID,
          slot: 'top',
          paint: {
            'heatmap-weight': ['interpolate', ['linear'], ['get', 'weight'], 0, 0, 2, 0.4, 14, 1],
            'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 11, 1, 15, 1.8, 17, 2.4],
            'heatmap-color': [
              'interpolate',
              ['linear'],
              ['heatmap-density'],
              0,
              'rgba(250, 137, 39, 0)',
              0.15,
              'rgba(255, 210, 160, 0.45)',
              0.35,
              'rgba(255, 170, 90, 0.65)',
              0.55,
              'rgba(250, 137, 39, 0.8)',
              0.75,
              'rgba(235, 95, 25, 0.9)',
              1,
              'rgba(200, 55, 10, 1)',
            ],
            'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 11, 34, 15, 82, 17, 125],
            'heatmap-opacity': warmthEnabled ? 0.85 : 0,
          },
        });
      } else {
        map.setPaintProperty(WARMTH_LAYER_ID, 'heatmap-opacity', warmthEnabled ? 0.85 : 0);
      }
    };

    if (map.isStyleLoaded()) apply();
    else map.once('idle', apply);
  }, [mapReady, heat, warmthEnabled]);

  // Pulsing "huddle of heat": a second heatmap layer above the ambient one, sourced from
  // active huddle centroids, its per-point weight animated (throb ∝ warmth) via rAF. Blends
  // additively over the ambient heatmap → an existing hot area just gets hotter.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    let raf = 0;
    let cancelled = false;

    const ensure = () => {
      if (!map.getSource(HUDDLE_SOURCE_ID)) {
        map.addSource(HUDDLE_SOURCE_ID, { type: 'geojson', data: huddleGeoJSON(huddleHeatRef.current, 1) });
      }
      if (!map.getLayer(HUDDLE_LAYER_ID)) {
        map.addLayer({
          id: HUDDLE_LAYER_ID,
          type: 'heatmap',
          source: HUDDLE_SOURCE_ID,
          slot: 'top',
          paint: {
            'heatmap-weight': ['interpolate', ['linear'], ['get', 'weight'], 0, 0, 10, 1],
            'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 11, 1.6, 15, 2.8, 17, 3.6],
            'heatmap-color': [
              'interpolate',
              ['linear'],
              ['heatmap-density'],
              0,
              'rgba(255, 150, 40, 0)',
              0.2,
              'rgba(255, 170, 90, 0.5)',
              0.45,
              'rgba(255, 110, 40, 0.78)',
              0.7,
              'rgba(240, 60, 30, 0.9)',
              1,
              'rgba(210, 20, 20, 1)',
            ],
            'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 11, 48, 15, 100, 17, 155],
            'heatmap-opacity': warmthEnabled ? 0.95 : 0,
          },
        });
      } else {
        map.setPaintProperty(HUDDLE_LAYER_ID, 'heatmap-opacity', warmthEnabled ? 0.9 : 0);
      }
    };

    const tick = () => {
      const src = map.getSource(HUDDLE_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
      if (src) {
        const k = 0.5 + 0.7 * (0.5 + 0.5 * Math.sin(performance.now() / 450)); // ~2.8s throb (0.5..1.2)
        src.setData(huddleGeoJSON(huddleHeatRef.current, k));
      }
      raf = requestAnimationFrame(tick);
    };

    const start = () => {
      if (cancelled) return;
      ensure();
      raf = requestAnimationFrame(tick);
    };
    if (map.isStyleLoaded()) start();
    else map.once('idle', start);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      if (map.getLayer(HUDDLE_LAYER_ID)) map.removeLayer(HUDDLE_LAYER_ID);
      if (map.getSource(HUDDLE_SOURCE_ID)) map.removeSource(HUDDLE_SOURCE_ID);
    };
  }, [mapReady, warmthEnabled]);

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
    map.flyTo({ center: [myLoc.lng, myLoc.lat], zoom: DEFAULT_ZOOM, pitch: 60, bearing: -20, duration: 1200 });
  }, [mapReady, myLoc]);

  const recenter = useCallback(() => {
    const map = mapRef.current;
    const c = myLoc ? ([myLoc.lng, myLoc.lat] as [number, number]) : FALLBACK;
    map?.flyTo({ center: c, zoom: DEFAULT_ZOOM, pitch: 60, bearing: -20, duration: 900 });
  }, [myLoc]);

  const flyTo = useCallback((lat: number, lng: number) => {
    mapRef.current?.flyTo({ center: [lng, lat], zoom: 16, duration: 900 });
  }, []);

  const zoomIn = useCallback(() => mapRef.current?.zoomIn(), []);
  const zoomOut = useCallback(() => mapRef.current?.zoomOut(), []);

  const markerPortals = mounted ? markerDefs.map((def) => createPortal(def.node, getContainer(def.key), def.key)) : null;

  return { mapContainerRef, tokenMissing, markerPortals, recenter, flyTo, zoomIn, zoomOut };
}
