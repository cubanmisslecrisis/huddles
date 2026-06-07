"use client"

import { Plus, Minus, Navigation, Maximize2, Minimize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MapStatusChips } from "@/components/map/map-chips"
import { MapTokenMissing } from "@/components/map/map-token-missing"
import { LayerToggleButtons } from "@/components/map/layer-toggle-buttons"
import { HuddleSearchBar } from "@/components/huddle-search-bar"
import { claySurfaceVar, shadowClay } from "@/lib/ui-styles"
import type { LayerKey } from "@/lib/huddles-data"

export function MapOverlays({
  tokenMissing,
  onRecenter,
  onZoomIn,
  onZoomOut,
  isFullscreen,
  onToggleFullscreen,
  activeLayers,
  onToggleLayer,
  nearbyCount,
  huddleCount,
  friendAvatars,
}: {
  tokenMissing: boolean
  onRecenter: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  isFullscreen: boolean
  onToggleFullscreen: () => void
  activeLayers: Record<LayerKey, boolean>
  onToggleLayer: (k: LayerKey) => void
  nearbyCount: number
  huddleCount: number
  friendAvatars: string[]
}) {
  const FullscreenIcon = isFullscreen ? Minimize2 : Maximize2

  return (
    <>
      {tokenMissing && <MapTokenMissing />}

      <div className="pointer-events-none absolute left-4 right-4 top-4 z-50 flex items-center gap-2">
        <HuddleSearchBar className="pointer-events-auto relative flex-1">
          <LayerToggleButtons activeLayers={activeLayers} onToggleLayer={onToggleLayer} />
        </HuddleSearchBar>

        <div className="pointer-events-auto">
          <Button
            onClick={onToggleFullscreen}
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            variant="outline"
            size="icon-lg"
            className={`h-12 w-12 rounded-full border-0 bg-card ${claySurfaceVar}`}
          >
            <FullscreenIcon className="h-5 w-5 origin-center transition-transform duration-300 ease-out group-hover:scale-110" />
          </Button>
        </div>
      </div>

      <div className="absolute bottom-4 left-1/2 z-50 -translate-x-1/2">
        <MapStatusChips
          variant="desktop"
          nearbyCount={nearbyCount}
          huddleCount={huddleCount}
          friendAvatars={friendAvatars}
        />
      </div>

      <Button
        onClick={onRecenter}
        aria-label="Recenter map"
        variant="outline"
        size="icon-lg"
        className={`absolute bottom-4 left-4 z-50 rounded-full border-0 bg-card ${claySurfaceVar}`}
      >
        <Navigation className="h-5 w-5 origin-center transition-transform duration-300 ease-out group-hover:rotate-12 group-hover:scale-110" fill="currentColor" />
      </Button>

      <div className={`group/zoom absolute bottom-4 right-4 z-50 flex flex-row overflow-hidden rounded-full border-0 bg-card ${shadowClay} ${claySurfaceVar} origin-center transition-[transform,transform-origin] duration-400 ease-[cubic-bezier(0.34,1.25,0.64,1)] [transform:perspective(200px)_rotateY(0deg)] has-[:active]:duration-100 has-[#zoom-in:hover]:origin-right has-[#zoom-in:hover]:[transform:perspective(200px)_rotateY(30deg)] has-[#zoom-in:active]:origin-right has-[#zoom-in:active]:[transform:perspective(200px)_rotateY(8deg)_scale3d(0.95,0.95,1)] has-[#zoom-out:hover]:origin-left has-[#zoom-out:hover]:[transform:perspective(200px)_rotateY(-30deg)] has-[#zoom-out:active]:origin-left has-[#zoom-out:active]:[transform:perspective(200px)_rotateY(-8deg)_scale3d(0.95,0.95,1)]`}>
        <Button id="zoom-in" onClick={onZoomIn} aria-label="Zoom in" variant="ghost" size="icon-lg" clay={false} className="group rounded-none transition-shadow duration-300 hover:bg-transparent active:shadow-clay-pressed">
          <Plus className="h-5 w-5 origin-center transition-transform duration-400 ease-[cubic-bezier(0.34,1.25,0.64,1)] group-hover:rotate-90 group-hover:scale-125" />
        </Button>
        <Button id="zoom-out" onClick={onZoomOut} aria-label="Zoom out" variant="ghost" size="icon-lg" clay={false} className="group rounded-none transition-shadow duration-300 hover:bg-transparent active:shadow-clay-pressed">
          <Minus className="h-5 w-5 origin-center transition-transform duration-400 ease-[cubic-bezier(0.34,1.25,0.64,1)] group-hover:scale-125" />
        </Button>
      </div>
    </>
  )
}
