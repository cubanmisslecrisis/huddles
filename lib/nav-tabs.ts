import { MapPin, Bell, Bookmark } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { FriendsIcon } from "@/components/friends-icon"
import { brandColor } from "@/lib/theme"

export type Lens = "map" | "activity" | "friends" | "saved"

export type NavTabIcon = LucideIcon | typeof FriendsIcon

export const navTabs: { key: Lens; label: string; icon: NavTabIcon; color: string; animClass: string }[] = [
  { key: "map", label: "Map", icon: MapPin, color: brandColor("red"), animClass: "transition-transform duration-300 ease-out group-hover:-translate-y-1" },
  { key: "activity", label: "Activity", icon: Bell, color: brandColor("blue"), animClass: "origin-top transition-transform duration-300 ease-out group-hover:rotate-[15deg]" },
  { key: "friends", label: "Friends", icon: FriendsIcon, color: brandColor("green"), animClass: "transition-transform duration-300 ease-out group-hover:scale-110 group-hover:-rotate-3" },
  { key: "saved", label: "Saved", icon: Bookmark, color: brandColor("pink"), animClass: "transition-transform duration-300 ease-out group-hover:scale-y-110 group-hover:scale-x-95 group-hover:-translate-y-0.5" },
]
