import type { HeatPoint } from "@/lib/view"

export const WARMTH_SOURCE_ID = "warmth-points"
export const WARMTH_LAYER_ID = "warmth-heat"

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
