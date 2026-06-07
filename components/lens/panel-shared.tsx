"use client"

import { Bookmark } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PingIcon } from "@/components/ping-icon"
import type { FriendPresence } from "@/lib/huddles-data"
import { typeButtonBold } from "@/lib/ui-styles"

export function friendNearbySubtitle(friend: FriendPresence): string | undefined {
  if (friend.placeName) {
    const dist = friend.distanceLabel?.split(" · ")[0]
    return dist ? `At ${friend.placeName} · ${dist}` : `At ${friend.placeName}`
  }
  return friend.distanceLabel
}

export function friendDetailLocationLine(friend: FriendPresence): string {
  const head = friend.placeName ? `At ${friend.placeName}` : friend.lastSeenLabel
  return friend.distanceLabel ? `${head} · ${friend.distanceLabel}` : head
}

export const panelShellClass = (bare: boolean) => (bare ? "flex flex-col" : "flex h-full flex-col")
export const panelRowActionShellClass = "shrink-0 pr-1.5"

type PanelRowActionVariant = "brandBlue" | "brand" | "brandRed" | "brandGreen"

/** Right-panel row actions: Join = red, Save = blue, Ping = green. */
export function panelActionVariant(label: string): PanelRowActionVariant {
  switch (label) {
    case "Join":
      return "brandRed"
    case "Save":
      return "brandBlue"
    case "Ping":
      return "brandGreen"
    default:
      return "brandBlue"
  }
}

export function PanelRowAction({
  label,
  variant,
  onClick,
}: {
  label: string
  variant?: PanelRowActionVariant
  onClick?: () => void
}) {
  const resolvedVariant = variant ?? panelActionVariant(label)

  return (
    <div className={panelRowActionShellClass} onClick={(e) => e.stopPropagation()}>
      <Button variant={resolvedVariant} size="pill" className={typeButtonBold} onClick={onClick}>
        {label === "Ping" ? <PingIcon /> : label === "Save" ? <Bookmark className="h-4 w-4" /> : null}
        {label}
      </Button>
    </div>
  )
}
