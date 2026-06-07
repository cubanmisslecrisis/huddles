"use client"

import { useRef, useState } from "react"
import { useIsMobile } from "@/hooks/use-is-mobile"
import { DesktopShell } from "@/components/app-shell/desktop-shell"
import { MobileShell } from "@/components/app-shell/mobile-shell"
import { AddToMapSheet } from "@/components/flows/add-to-map-sheet"
import { PingNearbySheet } from "@/components/flows/ping-nearby-sheet"
import { SearchModal } from "@/components/flows/search-modal"
import { ProfileSettings } from "@/components/flows/profile-settings"
import { useHuddlesLive } from "@/components/providers/huddles-live-provider"
import type { MapControls } from "@/lib/map-controls"
import type { Selection } from "@/lib/selection"
import type { SheetState } from "@/components/panels/bottom-sheet"
import type { Lens } from "@/lib/nav-tabs"
import type { LayerKey } from "@/lib/huddles-data"
import { getPin } from "@/lib/entity-lookup"

export function HuddlesApp() {
  const isMobile = useIsMobile()
  const live = useHuddlesLive()
  const mapControls = useRef<MapControls | null>(null)

  const [lens, setLens] = useState<Lens>("map")
  const [selection, setSelection] = useState<Selection>(null)
  const [sheetState, setSheetState] = useState<SheetState>("peek")
  const [showAdd, setShowAdd] = useState(false)
  const [showPing, setShowPing] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [activeLayers, setActiveLayers] = useState<Record<LayerKey, boolean>>({
    friends: true,
    huddles: true,
    recs: true,
    saved: true,
    warmth: true,
  })

  const toggleLayer = (k: LayerKey) => setActiveLayers((prev) => ({ ...prev, [k]: !prev[k] }))

  const changeLens = (l: Lens) => {
    setLens(l)
    setSelection(null)
    setSheetState(l === "map" ? "peek" : "half")
  }

  const select = (s: Selection) => {
    setSelection(s)
    setSheetState(s ? "half" : "peek")
  }

  const flyToSelection = (s: Exclude<Selection, null>) => {
    if (s.kind === "friend") {
      const f = live.friendsUI.find((x) => x.id === s.id)
      if (f) mapControls.current?.flyTo(f.lat, f.lng)
    } else if (s.kind === "huddle") {
      const h = live.huddlesUI.find((x) => x.id === s.id)
      if (h) mapControls.current?.flyTo(h.lat, h.lng)
    } else if (s.kind === "pin") {
      const pin = getPin(s.id, live.entityData)
      if (pin) mapControls.current?.flyTo(pin.lat, pin.lng)
    }
  }

  const pick = (s: Exclude<Selection, null>) => {
    select(s)
    flyToSelection(s)
  }

  const onPing = () => {
    live.pingNearby().catch(console.error)
    setShowPing(false)
  }

  const mapOverlayActive = showAdd || showPing || showSearch || showProfile

  const shellProps = {
    lens,
    onChangeLens: changeLens,
    selection,
    onSelect: select,
    activeLayers,
    onToggleLayer: toggleLayer,
    onSetLayers: setActiveLayers,
    sheetState,
    onSheetStateChange: setSheetState,
    mapOverlayActive,
    onAdd: () => setShowAdd(true),
    onPing: () => setShowPing(true),
    onSearch: () => setShowSearch(true),
    onOpenProfile: () => setShowProfile(true),
    controlsRef: mapControls,
    friends: live.friendsUI,
    huddles: live.huddlesUI,
    activity: live.activityUI,
    savedPlaces: live.savedPlacesUI,
    entityData: live.entityData,
    me: live.meProfile,
    heat: live.heat,
    myLoc: live.myLoc,
    nearbyCount: live.nearbyCount,
    formingCount: live.formingCount,
    activeHuddles: live.activeHuddles,
    allPins: live.allPins,
  }

  if (isMobile === undefined) {
    return <div className="h-dvh w-full bg-background" />
  }

  return (
    <>
      {isMobile ? (
        <MobileShell {...shellProps} />
      ) : (
        <DesktopShell {...shellProps} />
      )}

      <AddToMapSheet open={showAdd} onOpenChange={setShowAdd} mobile={isMobile} />
      <PingNearbySheet
        open={showPing}
        onOpenChange={setShowPing}
        mobile={isMobile}
        friends={live.friendsUI}
        onPing={onPing}
      />
      <SearchModal
        open={showSearch}
        onOpenChange={setShowSearch}
        onPick={pick}
        entityData={live.entityData}
        mobile={isMobile}
      />
      <ProfileSettings
        open={showProfile}
        onOpenChange={setShowProfile}
        mobile={isMobile}
        me={live.meProfile}
        onLeave={() => live.leaveRoom().catch(console.error)}
      />
    </>
  )
}
