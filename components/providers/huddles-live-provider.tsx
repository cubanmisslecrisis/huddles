"use client"

import { createContext, useContext, useMemo } from "react"
import { HuddlesLogo } from "@/components/huddles-logo"
import { JoinScreen } from "@/components/flows/join-screen"
import { CharacterKeysContext } from "@/lib/characters"
import { useLiveHuddlesData } from "@/hooks/use-live-huddles-data"
import {
  adaptFriends,
  adaptHuddles,
  adaptMeProfile,
  adaptSavedPlace,
  adaptSavedPlacePin,
} from "@/lib/live-adapters"
import type {
  FriendPresence,
  Huddle,
  ActivityItem,
  SavedPlace,
  PlacePin,
} from "@/lib/huddles-data"
import type { HeatPoint, MapAvatar, MeVM } from "@/lib/view"
import { buildDemoActivity } from "@/lib/demo-activity"
import { buildDemoRecommendationData } from "@/lib/demo-recommendations"
import type { EntityData } from "@/lib/entity-lookup"

type HuddlesLiveContextValue = ReturnType<typeof useLiveHuddlesData> & {
  friendsUI: FriendPresence[]
  huddlesUI: Huddle[]
  activityUI: ActivityItem[]
  meProfile: ReturnType<typeof adaptMeProfile>
  savedPlacesUI: SavedPlace[]
  savedPins: PlacePin[]
  allPins: PlacePin[]
  entityData: EntityData
}

const HuddlesLiveContext = createContext<HuddlesLiveContextValue | null>(null)

export function useHuddlesLive() {
  const ctx = useContext(HuddlesLiveContext)
  if (!ctx) throw new Error("useHuddlesLive must be used within HuddlesLiveProvider")
  return ctx
}

export function HuddlesLiveProvider({ children }: { children: React.ReactNode }) {
  const live = useLiveHuddlesData()

  const friendsUI = adaptFriends(live.friends)
  const huddlesUI = adaptHuddles(live.huddleList)
  const meProfile = adaptMeProfile(live.me)
  const savedPlacesUI = live.savedPlaces.map((s) => adaptSavedPlace(s, live.myLoc))
  const savedPins = live.savedPlaces.map(adaptSavedPlacePin)

  const demoPeople = useMemo(() => {
    const people = friendsUI
      .filter((f) => Number.isFinite(f.lat) && Number.isFinite(f.lng))
      .map((f) => ({ id: f.id, name: f.name, avatar: f.avatar, lat: f.lat, lng: f.lng }))
    if (live.myLoc) {
      people.push({
        id: meProfile.id,
        name: meProfile.name,
        avatar: meProfile.avatar,
        lat: live.myLoc.lat,
        lng: live.myLoc.lng,
      })
    }
    return people
  }, [friendsUI, live.myLoc, meProfile])

  const { pins: demoPins, recommendations: demoRecommendations } = useMemo(
    () => buildDemoRecommendationData(demoPeople, live.myLoc),
    [demoPeople, live.myLoc]
  )

  const activityUI = useMemo(
    () =>
      buildDemoActivity({
        friends: friendsUI,
        huddles: huddlesUI,
        recommendations: demoRecommendations,
      }),
    [friendsUI, huddlesUI, demoRecommendations]
  )

  const allPins = [...demoPins, ...savedPins]

  const entityData: EntityData = {
    friends: friendsUI,
    huddles: huddlesUI,
    pins: allPins,
    me: meProfile,
    recommendations: demoRecommendations,
    yourPicks: savedPlacesUI,
  }

  const value: HuddlesLiveContextValue = {
    ...live,
    friendsUI,
    huddlesUI,
    activityUI,
    meProfile,
    savedPlacesUI,
    savedPins,
    allPins,
    entityData,
  }

  if (!live.connected) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-4 bg-background px-6">
        <HuddlesLogo />
        <p className="text-sm text-muted-foreground">Connecting…</p>
      </div>
    )
  }

  if (!live.joined) {
    return (
      <JoinScreen
        nameInput={live.nameInput}
        roomInput={live.roomInput}
        geo={live.geo}
        onNameChange={live.setNameInput}
        onRoomChange={live.setRoomInput}
        onJoin={(name, roomCode) => live.joinRoom({ name, roomCode }).catch(console.error)}
      />
    )
  }

  return (
    <CharacterKeysContext.Provider value={live.sortedKeys}>
      <HuddlesLiveContext.Provider value={value}>{children}</HuddlesLiveContext.Provider>
    </CharacterKeysContext.Provider>
  )
}

export type { HeatPoint, MapAvatar, MeVM }
