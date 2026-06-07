"use client"

import { useMemo, useState, useCallback, useEffect } from "react"
import type mapboxgl from "mapbox-gl"
import {
  FriendMarker,
  HuddleMarker,
  PinMarker,
  ClusterMarker,
} from "@/components/map-markers"
import type { Selection } from "@/lib/selection"
import { ClusterPopover } from "@/components/map/cluster-popover"
import { useMapMarkerLayout } from "@/hooks/use-map-marker-layout"
import type { MapProject } from "@/lib/map-projection"
import { clusterDominantLabel } from "@/lib/marker-labels"
import type { LayerKey } from "@/lib/huddles-data"
import type { MarkerEntities } from "@/lib/map-markers-model"
import { sortMarkersByViewDepth } from "@/lib/map-marker-depth"

export type MapMarkerDef = {
  key: string
  lng: number
  lat: number
  anchor: mapboxgl.Anchor
  priority: number
  node: React.ReactNode
}

export function useMapMarkerDefs({
  selection,
  onSelect,
  activeLayers,
  project,
  mapReady,
  mapVersion = 0,
  entities,
}: {
  selection: Selection
  onSelect: (s: Selection) => void
  activeLayers: Record<LayerKey, boolean>
  project: MapProject
  mapReady: boolean
  mapVersion?: number
  entities: MarkerEntities
}): { markerDefs: MapMarkerDef[]; selectedKey: string | null } {
  const [openClusterId, setOpenClusterId] = useState<string | null>(null)

  const closeCluster = useCallback(() => setOpenClusterId(null), [])

  useEffect(() => {
    setOpenClusterId(null)
  }, [selection])

  const resolved = useMapMarkerLayout({
    activeLayers,
    selection,
    project,
    mapReady,
    mapVersion,
    entities,
  })

  const hasSelection = selection !== null

  const selectedKey = useMemo(() => {
    if (!selection) return null
    return `${selection.kind}-${selection.id}`
  }, [selection])

  const markerDefs = useMemo(() => {
    const defs: MapMarkerDef[] = []

    resolved.forEach((m) => {
      const isSelected =
        selection !== null &&
        m.kind !== "cluster" &&
        selection.kind === m.kind &&
        selection.id === m.id
      const dimmed = hasSelection && !isSelected && m.kind !== "cluster"

      let node: React.ReactNode = null

      if (m.kind === "friend" && m.friend) {
        node = (
          <FriendMarker
            friend={m.friend}
            selected={isSelected}
            dimmed={dimmed}
            onSelect={() => onSelect({ kind: "friend", id: m.id })}
          />
        )
      } else if (m.kind === "huddle" && m.huddle) {
        node = (
          <HuddleMarker
            huddle={m.huddle}
            displayMode={m.displayMode}
            selected={isSelected}
            dimmed={dimmed}
            onSelect={() => onSelect({ kind: "huddle", id: m.id })}
          />
        )
      } else if (m.kind === "pin" && m.pin) {
        node = (
          <PinMarker
            pin={m.pin}
            displayMode={m.displayMode}
            selected={isSelected}
            dimmed={dimmed}
            onSelect={() => onSelect({ kind: "pin", id: m.id })}
          />
        )
      } else if (m.kind === "cluster" && m.clusterMembers) {
        const clusterOpen = openClusterId === m.id
        node = (
          <span className="relative block">
            {clusterOpen && (
              <ClusterPopover
                members={m.clusterMembers}
                onSelect={onSelect}
                onClose={closeCluster}
              />
            )}
            <ClusterMarker
              count={m.clusterMembers.length}
              dominantLabel={clusterDominantLabel(m.clusterMembers)}
              dimmed={dimmed}
              onClick={() => setOpenClusterId(clusterOpen ? null : m.id)}
            />
          </span>
        )
      }

      if (!node || m.displayMode === "hidden") return

      defs.push({
        key: m.key,
        lng: m.lng,
        lat: m.lat,
        anchor: m.kind === "friend" ? "center" : "bottom",
        priority: m.priority,
        node,
      })
    })

    return sortMarkersByViewDepth(defs, project, selectedKey)
  }, [resolved, selection, hasSelection, onSelect, openClusterId, closeCluster, selectedKey, project])

  return { markerDefs, selectedKey }
}
