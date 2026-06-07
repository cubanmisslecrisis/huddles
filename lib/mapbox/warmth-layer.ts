import type mapboxgl from "mapbox-gl"
import {
  buildHeatGeoJSON,
  heatmapRadiusPulsed,
  warmthLayerPaint,
  WARMTH_LAYER_ID,
  WARMTH_SOURCE_ID,
} from "@/lib/map-warmth"
import type { HeatPoint } from "@/lib/view"

export function ensureWarmthLayer(
  map: mapboxgl.Map,
  warmthEnabled: boolean,
  heat: HeatPoint[],
  pulse = 1
) {
  const data = buildHeatGeoJSON(heat)
  const paint = warmthLayerPaint(warmthEnabled, pulse)

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
      paint,
    })
  } else {
    setWarmthLayerPulse(map, warmthEnabled, pulse)
    map.setPaintProperty(WARMTH_LAYER_ID, "heatmap-opacity", warmthEnabled ? 0.85 : 0)
  }
}

/** Update only the breathing radius — called each animation frame. */
export function setWarmthLayerPulse(
  map: mapboxgl.Map,
  warmthEnabled: boolean,
  pulse: number
) {
  if (!map.getLayer(WARMTH_LAYER_ID)) return
  map.setPaintProperty(
    WARMTH_LAYER_ID,
    "heatmap-radius",
    heatmapRadiusPulsed(pulse, warmthEnabled)
  )
}
