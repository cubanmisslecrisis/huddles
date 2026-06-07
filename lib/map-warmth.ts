import type mapboxgl from "mapbox-gl"
import type { HeatPoint } from "@/lib/view"

export const WARMTH_SOURCE_ID = "warmth-points"
export const WARMTH_LAYER_ID = "warmth-heat"

/** Weight ramp 0..40 — matches server HEAT_MAX clamp. */
export const heatmapWeight: mapboxgl.ExpressionSpecification = [
  "interpolate",
  ["linear"],
  ["get", "weight"],
  0,
  0,
  4,
  0.2,
  12,
  0.45,
  24,
  0.72,
  40,
  1,
]

/** Stronger intensity at mid zoom so warmth reads on the 3D map. */
export const heatmapIntensity: mapboxgl.ExpressionSpecification = [
  "interpolate",
  ["linear"],
  ["zoom"],
  10,
  0.5,
  12,
  1.2,
  14,
  2.0,
  16,
  3.0,
  17,
  4.0,
]

/** Thermodynamic yellow → orange → magenta → blue → cyan gradient from the legacy app. */
export const heatmapColor: mapboxgl.ExpressionSpecification = [
  "interpolate",
  ["linear"],
  ["heatmap-density"],
  0,
  "rgba(255, 255, 0, 0)",
  0.08,
  "rgba(255, 200, 0, 0.4)",
  0.15,
  "rgba(255, 140, 0, 0.6)",
  0.25,
  "rgba(255, 80, 20, 0.75)",
  0.35,
  "rgba(255, 40, 100, 0.85)",
  0.5,
  "rgba(200, 20, 200, 0.9)",
  0.65,
  "rgba(100, 50, 255, 0.92)",
  0.8,
  "rgba(0, 150, 255, 0.95)",
  0.9,
  "rgba(0, 255, 200, 0.97)",
  1,
  "rgba(0, 255, 150, 1)",
]

/** Steady radius when warmth layer is off — tight footprint for huddle shapes. */
export const heatmapRadius: mapboxgl.ExpressionSpecification = [
  "interpolate",
  ["linear"],
  ["zoom"],
  10,
  8,
  12,
  16,
  14,
  28,
  15,
  40,
  16,
  55,
  17,
  75,
]

/** Base radius stops for the breathing pulse (legacy dramatic heatmap). */
export function heatmapRadiusPulsed(
  pulse: number,
  warmthEnabled: boolean
): mapboxgl.ExpressionSpecification {
  if (!warmthEnabled) return heatmapRadius
  return [
    "interpolate",
    ["linear"],
    ["zoom"],
    10,
    15 * pulse,
    12,
    35 * pulse,
    14,
    65 * pulse,
    15,
    90 * pulse,
    16,
    120 * pulse,
    17,
    160 * pulse,
  ]
}

export function buildHeatGeoJSON(heat: HeatPoint[]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: heat.map((h) => ({
      type: "Feature",
      properties: { weight: h.weight },
      geometry: { type: "Point", coordinates: [h.lng, h.lat] },
    })),
  }
}

export function warmthLayerPaint(
  warmthEnabled: boolean,
  pulse = 1
): mapboxgl.HeatmapLayerSpecification["paint"] {
  return {
    "heatmap-weight": heatmapWeight,
    "heatmap-intensity": heatmapIntensity,
    "heatmap-color": heatmapColor,
    "heatmap-radius": heatmapRadiusPulsed(pulse, warmthEnabled),
    "heatmap-opacity": warmthEnabled ? 0.85 : 0,
  }
}
