"use client"

import { useMemo } from "react"
import {
  buildMarkerModels,
  computeDisplayMode,
  modelKey,
  type MarkerEntities,
} from "@/lib/map-markers-model"
import { clusterMarkers, type ResolvedMarker } from "@/lib/map-marker-clustering"
import type { Selection } from "@/lib/selection"
import type { LayerKey } from "@/lib/huddles-data"
import type { MapProject } from "@/lib/map-projection"

export type { ResolvedMarker, MapProject }

export function useMapMarkerLayout({
  activeLayers,
  selection,
  project,
  mapReady,
  mapVersion = 0,
  entities,
}: {
  activeLayers: Record<LayerKey, boolean>
  selection: Selection
  project: MapProject
  mapReady: boolean
  mapVersion?: number
  entities: MarkerEntities
}): ResolvedMarker[] {
  return useMemo(() => {
    const models = buildMarkerModels(activeLayers, entities)
    const ctx = { layers: activeLayers, selection }

    const withModes = models.map((m) => ({
      ...m,
      displayMode: computeDisplayMode(m, ctx),
    }))

    if (!mapReady) {
      return withModes
        .filter((m) => m.displayMode !== "hidden")
        .map((m) => ({ ...m, key: modelKey(m) }))
    }

    return clusterMarkers(withModes, project, { selection, layers: activeLayers })
  }, [activeLayers, selection, project, mapReady, mapVersion, entities])
}
