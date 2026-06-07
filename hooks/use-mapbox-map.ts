"use client"

import { useCallback, useEffect, useRef, useState, type MutableRefObject } from "react"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import { MAP_CENTER, MAP_ZOOM } from "@/lib/huddles-data"
import type { MapMarkerDef } from "@/hooks/use-map-marker-defs"
import type { MapProject } from "@/lib/map-projection"
import type { MapControls } from "@/lib/map-controls"
import { ensureWarmthLayer } from "@/lib/mapbox/warmth-layer"
import type { HeatPoint } from "@/lib/view"
import { attachRotateGesture } from "@/lib/mapbox/rotate-gesture"
import {
  applyMarkerDepthZIndex,
  buildMarkerPortals,
  syncMapboxMarkers,
} from "@/lib/mapbox/marker-portals"

export type { MapProject as MapProjectFn }

const FALLBACK_CENTER: [number, number] = [-73.9857, 40.7484]

export function useMapboxMap({
  markerDefs,
  warmthEnabled,
  heat,
  myLoc,
  selectedKey,
  onMapBackgroundClick,
  onMapReady,
  onClusterEpoch,
  projectRef,
  controlsRef,
}: {
  markerDefs: MapMarkerDef[]
  warmthEnabled: boolean
  heat: HeatPoint[]
  myLoc: { lat: number; lng: number } | null
  selectedKey?: string | null
  onMapBackgroundClick?: () => void
  onMapReady?: (ready: boolean) => void
  onClusterEpoch?: () => void
  projectRef?: MutableRefObject<MapProject>
  controlsRef?: MutableRefObject<MapControls | null>
}) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const containersRef = useRef<Map<string, HTMLDivElement>>(new Map())
  const mapboxMarkersRef = useRef<Map<string, mapboxgl.Marker>>(new Map())
  const onMapBackgroundClickRef = useRef(onMapBackgroundClick)
  onMapBackgroundClickRef.current = onMapBackgroundClick
  const onMapReadyRef = useRef(onMapReady)
  onMapReadyRef.current = onMapReady
  const onClusterEpochRef = useRef(onClusterEpoch)
  onClusterEpochRef.current = onClusterEpoch
  const gestureActiveRef = useRef(false)
  const recenteredRef = useRef(false)
  const heatRef = useRef(heat)
  heatRef.current = heat

  const [tokenMissing, setTokenMissing] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [mapReady, setMapReady] = useState(false)

  const markerKeys = markerDefs.map((d) => d.key).join("\0")
  const markerDefsRef = useRef(markerDefs)
  const selectedKeyRef = useRef(selectedKey ?? null)
  markerDefsRef.current = markerDefs
  selectedKeyRef.current = selectedKey ?? null

  const project = useCallback<MapProject>((lng, lat) => {
    const map = mapRef.current
    if (!map) return null
    try {
      const pt = map.project([lng, lat])
      return { x: pt.x, y: pt.y }
    } catch {
      return null
    }
  }, [])

  useEffect(() => {
    if (projectRef) projectRef.current = project
  }, [project, projectRef])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    if (!token) {
      setTokenMissing(true)
      return
    }
    if (mapRef.current || !mapContainerRef.current) return

    mapboxgl.accessToken = token
    const initialCenter: [number, number] = myLoc
      ? [myLoc.lng, myLoc.lat]
      : FALLBACK_CENTER

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/standard",
      center: initialCenter,
      zoom: MAP_ZOOM,
      pitch: 60,
      bearing: -20,
      antialias: true,
      attributionControl: false,
    })
    mapRef.current = map

    map.on("style.load", () => {
      try {
        map.setConfigProperty("basemap", "lightPreset", "day")
        map.setConfigProperty("basemap", "showPointOfInterestLabels", false)
      } catch {
        // older style versions may not support config properties
      }
    })

    const bump = () => {
      if (gestureActiveRef.current) return
      onClusterEpochRef.current?.()
    }

    map.on("load", () => {
      setMapReady(true)
      onMapReadyRef.current?.(true)
    })
    map.on("moveend", bump)
    map.on("zoomend", bump)

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return

    const applyWarmth = () => ensureWarmthLayer(map, warmthEnabled, heatRef.current)

    if (map.isStyleLoaded()) {
      applyWarmth()
    } else {
      map.once("load", applyWarmth)
    }
  }, [mapReady, warmthEnabled, heat])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady || !myLoc || recenteredRef.current) return
    recenteredRef.current = true
    map.flyTo({ center: [myLoc.lng, myLoc.lat], zoom: MAP_ZOOM, pitch: 60, bearing: -20, duration: 1200 })
  }, [mapReady, myLoc])

  const flyTo = useCallback((lat: number, lng: number) => {
    mapRef.current?.flyTo({ center: [lng, lat], zoom: MAP_ZOOM + 1, pitch: 60, bearing: -20, duration: 800 })
  }, [])

  const recenter = useCallback(() => {
    const center: [number, number] = myLoc ? [myLoc.lng, myLoc.lat] : MAP_CENTER
    mapRef.current?.flyTo({ center, zoom: MAP_ZOOM, pitch: 60, bearing: -20, duration: 1200 })
  }, [myLoc])

  useEffect(() => {
    if (!controlsRef) return
    controlsRef.current = { flyTo, recenter }
    return () => {
      controlsRef.current = null
    }
  }, [controlsRef, flyTo, recenter])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return

    return attachRotateGesture(map, gestureActiveRef, () => {
      onClusterEpochRef.current?.()
    })
  }, [mapReady])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return

    const handleMapClick = (e: mapboxgl.MapMouseEvent) => {
      const target = e.originalEvent.target
      if (target instanceof Element) {
        if (target.closest(".map-marker-root") || target.closest(".mapboxgl-marker")) return
      }
      if (e.originalEvent.defaultPrevented) return
      onMapBackgroundClickRef.current?.()
    }

    map.on("click", handleMapClick)
    return () => {
      map.off("click", handleMapClick)
    }
  }, [mapReady])

  const applyDepth = useCallback(() => {
    applyMarkerDepthZIndex(
      markerDefsRef.current,
      containersRef.current,
      project,
      selectedKeyRef.current
    )
  }, [project])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return

    syncMapboxMarkers(map, markerDefs, containersRef.current, mapboxMarkersRef.current)
    applyDepth()
  }, [mapReady, markerKeys, markerDefs, applyDepth])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return

    const onMove = () => applyDepth()
    map.on("move", onMove)
    applyDepth()
    return () => {
      map.off("move", onMove)
    }
  }, [mapReady, applyDepth])

  const zoomIn = useCallback(() => {
    mapRef.current?.zoomIn()
  }, [])

  const zoomOut = useCallback(() => {
    mapRef.current?.zoomOut()
  }, [])

  const markerPortals = buildMarkerPortals(mounted, markerDefs, containersRef.current)

  return {
    mapContainerRef,
    tokenMissing,
    markerPortals,
    recenter,
    zoomIn,
    zoomOut,
  }
}
