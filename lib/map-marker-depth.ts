import type { MapProject } from "@/hooks/use-map-marker-layout"

export type DepthSortableMarker = {
  key: string
  lng: number
  lat: number
  priority: number
}

/** Base z-index for map markers (kept below app overlays at z-50+). */
export const MAP_MARKER_Z_BASE = 10

/**
 * Map stacking rule: at the current pitch/bearing, markers whose anchor sits
 * lower on screen (larger projected y) read as closer to the viewer and paint
 * above markers that appear behind them. Ties fall back to entity priority;
 * the selected marker is always stacked last.
 */
export function markerScreenDepth(lng: number, lat: number, project: MapProject): number | null {
  const pt = project(lng, lat)
  return pt?.y ?? null
}

export function compareMarkerViewDepth(
  a: DepthSortableMarker,
  b: DepthSortableMarker,
  project: MapProject
): number {
  const ya = markerScreenDepth(a.lng, a.lat, project)
  const yb = markerScreenDepth(b.lng, b.lat, project)
  if (ya === null && yb === null) return a.priority - b.priority
  if (ya === null) return -1
  if (yb === null) return 1
  const yDiff = ya - yb
  if (Math.abs(yDiff) > 0.5) return yDiff
  return a.priority - b.priority
}

export function sortMarkersByViewDepth<T extends DepthSortableMarker>(
  markers: T[],
  project: MapProject,
  selectedKey?: string | null
): T[] {
  const sorted = [...markers].sort((a, b) => compareMarkerViewDepth(a, b, project))
  if (selectedKey) {
    const idx = sorted.findIndex((m) => m.key === selectedKey)
    if (idx >= 0) {
      const [sel] = sorted.splice(idx, 1)
      sorted.push(sel)
    }
  }
  return sorted
}

export function markerStackZIndex(stackIndex: number): string {
  return String(MAP_MARKER_Z_BASE + stackIndex)
}
