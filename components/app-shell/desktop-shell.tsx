"use client"

import type { MutableRefObject } from "react"
import { LeftNavRail } from "@/components/left-nav-rail"
import { MapCanvas } from "@/components/map-canvas"
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

export function DesktopShell({
  lens,
  onChangeLens,
  selection,
  onSelect,
  activeLayers,
  onToggleLayer,
  onAdd,
  onPing,
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
  allPins,
}: {
  lens: Lens
  onChangeLens: (lens: Lens) => void
  selection: Selection
  onSelect: (s: Selection) => void
  activeLayers: Record<LayerKey, boolean>
  onToggleLayer: (k: LayerKey) => void
  onAdd: () => void
  onPing: () => void
  onOpenProfile: () => void
  mapOverlayActive?: boolean
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
  allPins: PlacePin[]
}) {
  return (
    <div className="flex h-dvh min-h-0 gap-2 bg-background px-4 pb-5 pt-5 pl-2">
      <LeftNavRail
        active={lens}
        onChange={onChangeLens}
        onAdd={onAdd}
        onPing={onPing}
        onOpenProfile={onOpenProfile}
        me={me}
      />

      <main className="relative min-h-0 min-w-0 flex-1">
        <MapCanvas
          selection={selection}
          onSelect={onSelect}
          activeLayers={activeLayers}
          onToggleLayer={onToggleLayer}
          overlayActive={mapOverlayActive}
          friends={friends}
          huddles={huddles}
          pins={allPins}
          heat={heat}
          myLoc={myLoc}
          controlsRef={controlsRef}
          nearbyCount={nearbyCount}
          huddleCount={huddles.length}
        />
      </main>

      <aside className="hidden min-h-0 w-[380px] shrink-0 lg:flex lg:flex-col">
        <div className="flex h-full min-h-0 flex-col">
          {selection ? (
            <DetailPanel
              selection={selection}
              onClose={() => onSelect(null)}
              onPing={onPing}
              entityData={entityData}
            />
          ) : (
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
            />
          )}
        </div>
      </aside>
    </div>
  )
}
