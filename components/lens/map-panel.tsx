"use client"

import type { FriendPresence, Huddle } from "@/lib/huddles-data"
import { getFeaturedRecommendation, getNearbyFriend, resolvePlaceKind, type EntityData } from "@/lib/entity-lookup"
import {
  LensPanelHeader,
  LensPanelList,
  PanelCard,
  PingButton,
  lensPanelRowClass,
  lensPanelAvatarClass,
  lensPanelTitleClass,
  lensPanelSubtitleClass,
  StackedAvatars,
  PlaceMapIcon,
} from "@/components/panel-ui"
import { SelectableCard } from "@/components/selectable-card"
import type { Selection } from "@/lib/selection"
import { panelRowActionShellClass, panelShellClass, PanelRowAction } from "@/components/lens/panel-shared"

export function MapPanel({
  onSelect,
  bare = false,
  onPing,
  friends,
  huddles,
  entityData,
}: {
  onSelect: (s: Selection) => void
  bare?: boolean
  onPing?: () => void
  friends: FriendPresence[]
  huddles: Huddle[]
  entityData: EntityData
}) {
  const nearbyFriend = getNearbyFriend(entityData) ?? friends.find((f) => f.status === "online")
  const featuredReco = getFeaturedRecommendation(entityData)

  return (
    <PanelCard bare={bare} className={panelShellClass(!!bare)}>
      <LensPanelHeader title="Around" />

      <LensPanelList>
        {nearbyFriend ? (
          <div className={lensPanelRowClass}>
            <SelectableCard
              onSelect={() => onSelect({ kind: "friend", id: nearbyFriend.id })}
              className="flex min-w-0 flex-1 items-center gap-3 text-left"
            >
              <img src={nearbyFriend.avatar || "/placeholder.svg"} alt="" className={lensPanelAvatarClass} />
              <div className="min-w-0 flex-1">
                <p className={lensPanelTitleClass}>{nearbyFriend.name} is nearby</p>
                <p className={lensPanelSubtitleClass}>
                  {nearbyFriend.placeName
                    ? `At ${nearbyFriend.placeName} · ${nearbyFriend.distanceLabel?.split(" · ")[0] ?? ""}`
                    : nearbyFriend.distanceLabel}
                </p>
              </div>
            </SelectableCard>
            <div className={panelRowActionShellClass} onClick={(e) => e.stopPropagation()}>
              <PingButton onClick={onPing} />
            </div>
          </div>
        ) : null}

        {featuredReco ? (
          <div className={lensPanelRowClass}>
            <SelectableCard
              onSelect={() => onSelect({ kind: "pin", id: featuredReco.pinId })}
              className="flex min-w-0 flex-1 items-center gap-3 text-left"
            >
              <PlaceMapIcon kind={resolvePlaceKind({ pinId: featuredReco.pinId, category: featuredReco.category }, entityData)} />
              <div className="min-w-0 flex-1">
                <p className={lensPanelTitleClass}>{featuredReco.placeName}</p>
                <p className={lensPanelSubtitleClass}>
                  {featuredReco.recommendedBy.length} recs · {featuredReco.distanceLabel}
                </p>
              </div>
            </SelectableCard>
            <PanelRowAction label="Save" />
          </div>
        ) : null}

        {huddles.slice(0, 2).map((h) => (
          <div key={h.id} className={lensPanelRowClass}>
            <StackedAvatars avatars={h.memberAvatars} />
            <div className="min-w-0 flex-1">
              <p
                className={`${lensPanelTitleClass} cursor-pointer`}
                onClick={() => onSelect({ kind: "huddle", id: h.id })}
              >
                {h.name}
              </p>
              <p className={lensPanelSubtitleClass}>
                {h.memberCount} people · {h.placeName}
              </p>
            </div>
            <PanelRowAction label="Join" />
          </div>
        ))}
      </LensPanelList>
    </PanelCard>
  )
}
