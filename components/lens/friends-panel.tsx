"use client"

import { Plus } from "lucide-react"
import type { FriendPresence } from "@/lib/huddles-data"
import {
  LensPanelHeader,
  LensPanelList,
  PanelCard,
  PingButton,
  lensPanelRowClass,
  lensPanelAvatarClass,
  lensPanelTitleClass,
  lensPanelSubtitleClass,
  lensPanelMetaClass,
} from "@/components/panel-ui"
import { Button } from "@/components/ui/button"
import { SelectableCard } from "@/components/selectable-card"
import type { Selection } from "@/lib/selection"
import { panelRowActionShellClass, panelShellClass } from "@/components/lens/panel-shared"

function FriendRow({
  friend,
  onSelect,
  onPing,
}: {
  friend: FriendPresence
  onSelect: () => void
  onPing?: () => void
}) {
  return (
    <div className={lensPanelRowClass}>
      <SelectableCard
        onSelect={onSelect}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        <img src={friend.avatar || "/placeholder.svg"} alt="" className={lensPanelAvatarClass} />
        <div className="min-w-0 flex-1">
          <p className={lensPanelTitleClass}>{friend.name}</p>
          <p className={lensPanelSubtitleClass}>
            {friend.placeName ? `At ${friend.placeName}` : friend.lastSeenLabel}
          </p>
          <p className={lensPanelMetaClass}>{friend.distanceLabel}</p>
        </div>
      </SelectableCard>
      <div className={panelRowActionShellClass} onClick={(e) => e.stopPropagation()}>
        <PingButton onClick={onPing} />
      </div>
    </div>
  )
}

export function FriendsPanel({
  onSelect,
  bare = false,
  onPing,
  friends,
}: {
  onSelect: (s: Selection) => void
  bare?: boolean
  onPing?: () => void
  friends: FriendPresence[]
}) {
  return (
    <PanelCard bare={bare} className={panelShellClass(!!bare)}>
      <LensPanelHeader title="Friends">
        <Button variant="ghost" size="icon" clay={false} className="size-8 rounded-lg text-foreground" aria-label="Invite">
          <Plus className="h-4 w-4" />
        </Button>
      </LensPanelHeader>

      <LensPanelList>
        {friends.map((f) => (
          <FriendRow
            key={f.id}
            friend={f}
            onSelect={() => onSelect({ kind: "friend", id: f.id })}
            onPing={onPing}
          />
        ))}
      </LensPanelList>
    </PanelCard>
  )
}
