"use client"

import { useState, useEffect, useRef, useCallback, useMemo, type MutableRefObject } from "react"
import { MapOverlays } from "@/components/map-overlays"
import { MapTokenMissing } from "@/components/map/map-token-missing"
import { useMapMarkerDefs } from "@/hooks/use-map-marker-defs"
import { useMapboxMap } from "@/hooks/use-mapbox-map"
import type { MapProjectFn } from "@/hooks/use-mapbox-map"
import type { Selection } from "@/lib/selection"
import type { FriendPresence, Huddle, LayerKey, PlacePin } from "@/lib/huddles-data"
import type { MapControls } from "@/lib/map-controls"
import type { HeatPoint } from "@/lib/view"
import { cn } from "@/lib/utils"
import { huddleMapCanvas } from "@/lib/ui-styles"

const noopProject: MapProjectFn = () => null

export function MapCanvas({
  selection,
  onSelect,
  activeLayers,
  onToggleLayer,
  variant = "desktop",
  overlayActive = false,
  friends,
  huddles,
  pins,
  heat,
  myLoc,
  controlsRef,
  nearbyCount,
  huddleCount,
}: {
  selection: Selection
  onSelect: (s: Selection) => void
  activeLayers: Record<LayerKey, boolean>
  onToggleLayer: (k: LayerKey) => void
  variant?: "desktop" | "mobile"
  overlayActive?: boolean
  friends: FriendPresence[]
  huddles: Huddle[]
  pins: PlacePin[]
  heat: HeatPoint[]
  myLoc: { lat: number; lng: number } | null
  controlsRef?: MutableRefObject<MapControls | null>
  nearbyCount: number
  huddleCount: number
}) {
  const friendAvatars = useMemo(
    () => friends.filter((f) => f.status === "online" || f.status === "nearby").map((f) => f.avatar),
    [friends]
  )
  const projectRef = useRef<MapProjectFn>(noopProject)
  const stableProject = useCallback<MapProjectFn>((lng, lat) => projectRef.current(lng, lat), [])

  const [mapReady, setMapReady] = useState(false)
  const [clusterEpoch, setClusterEpoch] = useState(0)

  const entities = useMemo(() => ({ friends, huddles, pins }), [friends, huddles, pins])

  const { markerDefs, selectedKey } = useMapMarkerDefs({
    selection,
    onSelect,
    activeLayers,
    project: stableProject,
    mapReady,
    mapVersion: clusterEpoch,
    entities,
  })

  const clearSelection = () => onSelect(null)

  const { mapContainerRef, tokenMissing, markerPortals, recenter, zoomIn, zoomOut } = useMapboxMap({
    markerDefs,
    warmthEnabled: activeLayers.warmth,
    heat,
    myLoc,
    selectedKey,
    onMapBackgroundClick: clearSelection,
    onMapReady: setMapReady,
    onClusterEpoch: () => setClusterEpoch((v) => v + 1),
    projectRef,
    controlsRef,
  })

  const [isFullscreen, setIsFullscreen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === containerRef.current)
    }
    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
    }
  }, [])

  const toggleFullscreen = () => {
    const container = containerRef.current
    if (!container) return

    if (!document.fullscreenElement) {
      container.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`)
      })
    } else {
      document.exitFullscreen()
    }
  }

  const isMobile = variant === "mobile"

  return (
    <div
      ref={containerRef}
      className={cn(
        "map-canvas",
        overlayActive && "map-canvas--overlay-active",
        isMobile
          ? "absolute inset-0 h-full w-full overflow-hidden bg-[oklch(0.93_0.03_230)]"
          : cn(
              "relative h-full w-full overflow-hidden bg-[oklch(0.93_0.03_230)] transition-all duration-300",
              isFullscreen
                ? "rounded-none border-none shadow-none"
                : huddleMapCanvas
            )
      )}
    >
      <div ref={mapContainerRef} className="absolute inset-0 h-full w-full" />
      {markerPortals}
      {isMobile ? (
        tokenMissing && <MapTokenMissing />
      ) : (
        <MapOverlays
          tokenMissing={tokenMissing}
          activeLayers={activeLayers}
          onToggleLayer={onToggleLayer}
          onRecenter={recenter}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
          nearbyCount={nearbyCount}
          huddleCount={huddleCount}
          friendAvatars={friendAvatars}
        />
      )}
    </div>
  )
}
