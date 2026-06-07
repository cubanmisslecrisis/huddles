"use client"

import type { Lens } from "@/lib/nav-tabs"
import type { Selection } from "@/lib/selection"
import type { ActivityItem, FriendPresence, Huddle, SavedPlace } from "@/lib/huddles-data"
import type { EntityData } from "@/lib/entity-lookup"
import { MapPanel } from "@/components/lens/map-panel"
import { ActivityPanel } from "@/components/lens/activity-panel"
import { FriendsPanel } from "@/components/lens/friends-panel"
import { SavedPanel } from "@/components/lens/saved-panel"

export function LensPanelRouter({
  lens,
  onSelect,
  onPing,
  bare = false,
  friends,
  huddles,
  activity,
  savedPlaces,
  entityData,
  activeHuddles,
  friendsOut,
}: {
  lens: Lens
  onSelect: (s: Selection) => void
  onPing?: () => void
  bare?: boolean
  friends: FriendPresence[]
  huddles: Huddle[]
  activity: ActivityItem[]
  savedPlaces: SavedPlace[]
  entityData: EntityData
  activeHuddles: number
  friendsOut: number
}) {
  switch (lens) {
    case "map":
      return (
        <MapPanel
          onSelect={onSelect}
          onPing={onPing}
          bare={bare}
          friends={friends}
          huddles={huddles}
          entityData={entityData}
        />
      )
    case "activity":
      return (
        <ActivityPanel
          bare={bare}
          activity={activity}
          activeHuddles={activeHuddles}
          friendsOut={friendsOut}
        />
      )
    case "friends":
      return (
        <FriendsPanel onSelect={onSelect} onPing={onPing} bare={bare} friends={friends} />
      )
    case "saved":
      return (
        <SavedPanel onSelect={onSelect} bare={bare} savedPlaces={savedPlaces} entityData={entityData} />
      )
  }
}
