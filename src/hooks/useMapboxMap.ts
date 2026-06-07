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
  const [heatmapPulse, setHeatmapPulse] = useState(0);

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

  // Spreading/contracting animation for heatmap radius
  useEffect(() => {
    let animationFrameId: number;
    let startTime = Date.now();

    const animate = () => {
      const elapsed = (Date.now() - startTime) % 3000;
      const progress = elapsed / 3000;
      const spread = 0.7 + Math.sin(progress * Math.PI * 2) * 0.3;
      setHeatmapPulse(spread);
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
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
      if (!map.getLayer(WARMTH_LAYER_ID)) {
        map.addLayer({
          id: WARMTH_LAYER_ID,
          type: 'heatmap',
          source: WARMTH_SOURCE_ID,
          slot: 'top',
          paint: {
            // Weight now comes from accumulating huddle heat (server caps a cell at ~40).
            // Spread the ramp across that range so intensity is a real gradient — fresh/small
            // huddles read cool, long-lived/large ones saturate hot — instead of every cell
            // pinning at max (the old 0..2 ramp made all heat look identical).
            'heatmap-weight': ['interpolate', ['linear'], ['get', 'weight'], 0, 0, 4, 0.2, 12, 0.45, 24, 0.72, 40, 1],
            'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 10, 0.5, 12, 1.2, 14, 2.0, 16, 3.0, 17, 4.0],
            'heatmap-color': [
              'interpolate',
              ['linear'],
              ['heatmap-density'],
              0,
              'rgba(255, 255, 0, 0)',
              0.08,
              'rgba(255, 200, 0, 0.4)',
              0.15,
              'rgba(255, 140, 0, 0.6)',
              0.25,
              'rgba(255, 80, 20, 0.75)',
              0.35,
              'rgba(255, 40, 100, 0.85)',
              0.5,
              'rgba(200, 20, 200, 0.9)',
              0.65,
              'rgba(100, 50, 255, 0.92)',
              0.8,
              'rgba(0, 150, 255, 0.95)',
              0.9,
              'rgba(0, 255, 200, 0.97)',
              1,
              'rgba(0, 255, 150, 1)',
            ],
            'heatmap-radius': warmthEnabled
              ? ['interpolate', ['linear'], ['zoom'], 10, 15 * heatmapPulse, 12, 35 * heatmapPulse, 14, 65 * heatmapPulse, 15, 90 * heatmapPulse, 16, 120 * heatmapPulse, 17, 160 * heatmapPulse]
              : ['interpolate', ['linear'], ['zoom'], 10, 15, 12, 35, 14, 65, 15, 90, 16, 120, 17, 160],
            'heatmap-opacity': warmthEnabled ? 0.85 : 0,
          },
        });
      } else {
        const radiusInterpolation: mapboxgl.ExpressionSpecification = warmthEnabled
          ? ['interpolate', ['linear'], ['zoom'], 10, 15 * heatmapPulse, 12, 35 * heatmapPulse, 14, 65 * heatmapPulse, 15, 90 * heatmapPulse, 16, 120 * heatmapPulse, 17, 160 * heatmapPulse]
          : ['interpolate', ['linear'], ['zoom'], 10, 15, 12, 35, 14, 65, 15, 90, 16, 120, 17, 160];
        map.setPaintProperty(WARMTH_LAYER_ID, 'heatmap-radius', radiusInterpolation);
        map.setPaintProperty(WARMTH_LAYER_ID, 'heatmap-opacity', warmthEnabled ? 0.85 : 0);
      }
    };

    if (map.isStyleLoaded()) apply();
    else map.once('idle', apply);
  }, [mapReady, heat, warmthEnabled, heatmapPulse]);

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
