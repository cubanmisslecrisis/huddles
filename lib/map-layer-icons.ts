import { Star, Bookmark, Flame, type LucideIcon } from "lucide-react"
import { FriendsIcon } from "@/components/friends-icon"
import type { LayerKey } from "@/lib/huddles-data"

export type MapLayerIcon = LucideIcon | typeof FriendsIcon

export const layerIcons: Record<LayerKey, MapLayerIcon> = {
  friends: FriendsIcon,
  huddles: Flame,
  recs: Star,
  saved: Bookmark,
  warmth: Flame,
}

export function layerIconAnimation(key: LayerKey): string {
  switch (key) {
    case "recs":
      return "group-hover:rotate-[72deg] group-hover:scale-110 origin-center"
    case "saved":
      return "group-hover:scale-110 origin-center"
    case "friends":
      return "group-hover:scale-110 group-hover:-rotate-6 origin-center"
    case "huddles":
      return "animate-burn origin-bottom"
    default:
      return "group-hover:scale-110 origin-center"
  }
}
