"use client"

import { Users, Utensils, Zap, Coffee, Music, LayoutGrid, Flame } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { brandColor, semanticColor } from "@/lib/theme"
import { typeBodyStrong, typeChipLabel, shadowFloatSm, claySurfaceVar, shadowClay } from "@/lib/ui-styles"

export type FilterKey = "all" | "huddles" | "food" | "activities" | "cafes" | "music"

export const mapFilters: { key: FilterKey; label: string; color: string }[] = [
  { key: "all", label: "All", color: semanticColor("foreground") },
  { key: "huddles", label: "Huddles", color: brandColor("red") },
  { key: "food", label: "Food", color: brandColor("orange") },
  { key: "activities", label: "Activities", color: brandColor("pink") },
  { key: "cafes", label: "Cafés", color: brandColor("yellow") },
  { key: "music", label: "Music", color: brandColor("purple") },
]

const filterIcons: Record<FilterKey, LucideIcon> = {
  all: LayoutGrid,
  huddles: Flame,
  food: Utensils,
  activities: Zap,
  cafes: Coffee,
  music: Music,
}

export function MapStatusChips({
  variant = "desktop",
  nearbyCount = 0,
  huddleCount = 0,
  friendAvatars = [],
}: {
  variant?: "desktop" | "mobile"
  nearbyCount?: number
  huddleCount?: number
  friendAvatars?: string[]
}) {
  const compact = variant === "mobile"
  return (
    <div
      className={`flex w-fit items-center rounded-full bg-card/95 ${shadowClay} backdrop-blur-md border-0 shrink-0 ${claySurfaceVar} ${
        compact ? "h-9 gap-3 px-3" : "h-11 gap-4 px-4"
      }`}
    >
      <div className="flex items-center gap-2 shrink-0">
        <div className="flex -space-x-3 shrink-0">
          {friendAvatars.slice(0, 3).map((avatar, i) => (
            <img
              key={i}
              src={avatar || "/placeholder.svg"}
              alt=""
              className={`rounded-full border-2 border-card object-cover shrink-0 ${compact ? "h-5 w-5" : "h-7 w-7"}`}
            />
          ))}
        </div>
        <span className={`${typeBodyStrong} whitespace-nowrap ${compact ? "text-xs" : "text-sm"}`}>
          {nearbyCount} nearby &nbsp; {huddleCount} {huddleCount === 1 ? "huddle" : "huddles"}
        </span>
      </div>
    </div>
  )
}

/** Sticker-style category filter pills for the mobile map. */
export function MapFilterChips({
  active,
  onChange,
  nearbyCount = 0,
  formingCount = 0,
}: {
  active: FilterKey
  onChange: (k: FilterKey) => void
  nearbyCount?: number
  formingCount?: number
}) {
  return (
    <div className="flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {mapFilters.map((f) => {
        const Icon = filterIcons[f.key]
        const isActive = active === f.key
        return (
          <button
            key={f.key}
            onClick={() => onChange(f.key)}
            aria-pressed={isActive}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 ${typeChipLabel} ${shadowFloatSm} transition-all duration-200 ease-out hover:scale-[1.04] hover:-translate-y-px hover:shadow-float-md active:scale-[0.97]`}
            style={
              isActive
                ? {
                    background: f.key === "all" ? semanticColor("foreground") : f.color,
                    color: semanticColor("background"),
                  }
                : { background: semanticColor("card"), color: f.color }
            }
          >
            <Icon
              className="h-4 w-4 transition-transform duration-200"
              fill={isActive ? "currentColor" : "none"}
              strokeWidth={isActive ? 1.75 : 2.2}
            />
            {f.label}
          </button>
        )
      })}
    </div>
  )
}
