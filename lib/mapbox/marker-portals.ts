import { createPortal } from "react-dom"
import mapboxgl from "mapbox-gl"
import type { MapMarkerDef } from "@/hooks/use-map-marker-defs"
import { markerStackZIndex, sortMarkersByViewDepth } from "@/lib/map-marker-depth"
import type { MapProject } from "@/lib/map-projection"

export function getOrCreateMarkerContainer(
  containers: Map<string, HTMLDivElement>,
  key: string
): HTMLDivElement {
  let el = containers.get(key)
  if (!el) {
    el = document.createElement("div")
    el.className = "map-marker-root"
    el.style.width = "max-content"
    el.style.height = "max-content"
    containers.set(key, el)
  }
  return el
}

export function syncMapboxMarkers(
  map: mapboxgl.Map,
  markerDefs: MapMarkerDef[],
  containers: Map<string, HTMLDivElement>,
  mapboxMarkers: Map<string, mapboxgl.Marker>
) {
  const activeKeys = new Set(markerDefs.map((m) => m.key))

  mapboxMarkers.forEach((marker, key) => {
    if (!activeKeys.has(key)) {
      marker.remove()
      mapboxMarkers.delete(key)
    }
  })

  markerDefs.forEach((def) => {
    const el = getOrCreateMarkerContainer(containers, def.key)
    el.style.pointerEvents = "auto"

    if (!el.dataset.eventsBound) {
      const stopBubble = (e: Event) => e.stopPropagation()
      el.addEventListener("click", stopBubble)
      el.addEventListener("pointerdown", stopBubble)
      el.dataset.eventsBound = "1"
    }

    if (!mapboxMarkers.has(def.key)) {
      const marker = new mapboxgl.Marker({ element: el, anchor: def.anchor })
        .setLngLat([def.lng, def.lat])
        .addTo(map)
      mapboxMarkers.set(def.key, marker)
    } else {
      mapboxMarkers.get(def.key)!.setLngLat([def.lng, def.lat])
    }
  })
}

export function applyMarkerDepthZIndex(
  markerDefs: MapMarkerDef[],
  containers: Map<string, HTMLDivElement>,
  project: MapProject,
  selectedKey: string | null
) {
  const sorted = sortMarkersByViewDepth(markerDefs, project, selectedKey)
  sorted.forEach((def, index) => {
    const el = containers.get(def.key)
    if (!el) return
    const wrapper = el.closest(".mapboxgl-marker") as HTMLElement | null
    if (wrapper) wrapper.style.zIndex = markerStackZIndex(index)
  })
}

export function buildMarkerPortals(
  mounted: boolean,
  markerDefs: MapMarkerDef[],
  containers: Map<string, HTMLDivElement>
) {
  if (!mounted) return []
  return markerDefs.map((def) =>
    createPortal(def.node, getOrCreateMarkerContainer(containers, def.key), def.key)
  )
}
