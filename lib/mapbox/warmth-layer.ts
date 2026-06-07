import type mapboxgl from "mapbox-gl"
import { buildHeatGeoJSON, WARMTH_LAYER_ID, WARMTH_SOURCE_ID } from "@/lib/map-warmth"
import { mapWarmthHeatmapGradient } from "@/lib/theme"
import type { HeatPoint } from "@/lib/view"

export function ensureWarmthLayer(
  map: mapboxgl.Map,
  warmthEnabled: boolean,
  heat: HeatPoint[]
) {
  const data = buildHeatGeoJSON(heat)

  const source = map.getSource(WARMTH_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined
  if (!source) {
    map.addSource(WARMTH_SOURCE_ID, {
      type: "geojson",
      data,
    })
  } else {
    source.setData(data)
  }

  if (!map.getLayer(WARMTH_LAYER_ID)) {
    map.addLayer({
      id: WARMTH_LAYER_ID,
      type: "heatmap",
      source: WARMTH_SOURCE_ID,
      slot: "top",
      paint: {
        "heatmap-weight": ["interpolate", ["linear"], ["get", "weight"], 0, 0, 4, 0.2, 12, 0.45, 24, 0.72, 40, 1],
        "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 12, 0.8, 15, 1.6, 17, 2.2],
        "heatmap-color": mapWarmthHeatmapGradient as unknown as mapboxgl.ExpressionSpecification,
        "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 12, 18, 15, 45, 17, 70],
        "heatmap-opacity": warmthEnabled ? 0.85 : 0,
      },
    })
  } else {
    map.setPaintProperty(WARMTH_LAYER_ID, "heatmap-opacity", warmthEnabled ? 0.85 : 0)
  }
}
