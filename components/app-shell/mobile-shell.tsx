"use client"

import { useState, type MutableRefObject } from "react"
import { MapCanvas } from "@/components/map-canvas"
import { MapFilterChips, type FilterKey } from "@/components/map/map-chips"
import { HuddleSearchBar } from "@/components/huddle-search-bar"
import { BottomNavIsland } from "@/components/app-shell/bottom-nav-island"
import { BottomSheet, type SheetState } from "@/components/panels/bottom-sheet"
import { LensPanelRouter } from "@/components/lens/lens-panel-router"
import { DetailPanel } from "@/components/detail-panel"
import type { Selection } from "@/lib/selection"
import type { Lens } from "@/lib/nav-tabs"
import type {
  ActivityItem,
  FriendPresence,
  Huddle,
  LayerKey,
  PlacePin,
  SavedPlace,
} from "@/lib/huddles-data"
import type { EntityData } from "@/lib/entity-lookup"
import type { MapControls } from "@/lib/map-controls"
import type { HeatPoint } from "@/lib/view"

const filterToLayers: Record<FilterKey, Record<LayerKey, boolean>> = {
  all: { friends: true, huddles: true, recs: true, saved: true, warmth: true },
  huddles: { friends: false, huddles: true, recs: false, saved: false, warmth: true },
  food: { friends: false, huddles: false, recs: true, saved: true, warmth: true },
  activities: { friends: true, huddles: true, recs: false, saved: false, warmth: true },
  cafes: { friends: false, huddles: false, recs: true, saved: false, warmth: true },
  music: { friends: false, huddles: false, recs: true, saved: false, warmth: true },
}

export function MobileShell({
  lens,
  onChangeLens,
  selection,
  onSelect,
  activeLayers,
  onToggleLayer,
  onSetLayers,
  sheetState,
  onSheetStateChange,
  onAdd,
  onPing,
  onSearch,
  onOpenProfile,
  mapOverlayActive = false,
  controlsRef,
  friends,
  huddles,
  activity,
  savedPlaces,
  entityData,
  me,
  heat,
  myLoc,
  nearbyCount,
  formingCount,
  allPins,
}: {
  lens: Lens
  onChangeLens: (lens: Lens) => void
  selection: Selection
  onSelect: (s: Selection) => void
  activeLayers: Record<LayerKey, boolean>
  onToggleLayer: (k: LayerKey) => void
  onSetLayers: (layers: Record<LayerKey, boolean>) => void
  sheetState: SheetState
  onSheetStateChange: (s: SheetState) => void
  mapOverlayActive?: boolean
  onAdd: () => void
  onPing: () => void
  onSearch: () => void
  onOpenProfile: () => void
  controlsRef: MutableRefObject<MapControls | null>
  friends: FriendPresence[]
  huddles: Huddle[]
  activity: ActivityItem[]
  savedPlaces: SavedPlace[]
  entityData: EntityData
  me: { id: string; name: string; avatar: string }
  heat: HeatPoint[]
  myLoc: { lat: number; lng: number } | null
  nearbyCount: number
  formingCount: number
  allPins: PlacePin[]
}) {
  const [filter, setFilter] = useState<FilterKey>("all")

  const applyFilter = (k: FilterKey) => {
    setFilter(k)
    onSetLayers(filterToLayers[k])
  }

  const sheetVisible = selection !== null || lens !== "map"

  const sheetContent = selection ? (
    <DetailPanel selection={selection} onClose={() => onSelect(null)} onPing={onPing} entityData={entityData} bare />
  ) : lens !== "map" ? (
    <LensPanelRouter
      lens={lens}
      onSelect={onSelect}
      onPing={onPing}
      friends={friends}
      huddles={huddles}
      activity={activity}
      savedPlaces={savedPlaces}
      entityData={entityData}
      activeHuddles={huddles.filter((h) => h.status === "active").length}
      friendsOut={nearbyCount}
      bare
    />
  ) : null

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-background">
      <MapCanvas
        selection={selection}
        onSelect={onSelect}
        activeLayers={activeLayers}
        onToggleLayer={onToggleLayer}
        overlayActive={mapOverlayActive}
        variant="mobile"
        friends={friends}
        huddles={huddles}
        pins={allPins}
        heat={heat}
        myLoc={myLoc}
        controlsRef={controlsRef}
        nearbyCount={nearbyCount}
        huddleCount={huddles.length}
      />

      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-40 flex flex-col gap-3 px-4"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 12px)" }}
      >
        <div className="flex items-center gap-2">
          <HuddleSearchBar
            className="pointer-events-auto min-w-0 flex-1"
            readOnly
            onActivate={onSearch}
          />
          <button
            onClick={onOpenProfile}
            aria-label="Your profile"
            className="pointer-events-auto shrink-0 rounded-full"
          >
            <img
              src={me.avatar || "/placeholder.svg"}
              alt=""
              className="h-11 w-11 rounded-full object-cover ring-2 ring-red ring-offset-2 ring-offset-background"
            />
          </button>
        </div>

        {lens === "map" && !selection && (
          <div className="pointer-events-auto -mx-4 min-w-full">
            <MapFilterChips active={filter} onChange={applyFilter} nearbyCount={nearbyCount} formingCount={formingCount} />
          </div>
        )}
      </div>

      {sheetVisible && (
        <BottomSheet state={sheetState} onStateChange={onSheetStateChange}>
          {sheetContent}
        </BottomSheet>
      )}

      <BottomNavIsland active={lens} onChange={onChangeLens} onPing={onPing} onAdd={onAdd} />
    </div>
  )
}
