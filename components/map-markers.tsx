"use client"

import {
  Music,
  Bookmark,
  Heart,
  Star,
  Coffee,
  Utensils,
  Wine,
  Briefcase,
  Trees,
  Dumbbell,
  ShoppingBag,
  Landmark,
  StickyNote,
  MapPin,
  Users,
  Flame,
} from "lucide-react"
import type { FriendPresence, Huddle, PlacePin } from "@/lib/huddles-data"
import type { MarkerDisplayMode } from "@/lib/map-markers-model"
import { pinMarkerLabel } from "@/lib/marker-labels"
import { PNG_KINDS } from "@/lib/pin-kinds"
import { markerSizeClasses } from "@/lib/map-marker-sizes"
import { claySurface, huddleAccentColor, onBrandForeground, pinColor } from "@/lib/theme"
import {
  typeMarkerBadge,
  typeMarkerChip,
  typeMarkerEyebrow,
  typeMarkerMeta,
  typeMarkerTitle,
  shadowClay,
  shadowFloat,
  shadowFloatMd,
  claySurfaceVar,
  radiusSurface,
  radiusThumb,
} from "@/lib/ui-styles"

function SelectionRing({ color, inset = "-4px" }: { color: string; inset?: string }) {
  return (
    <span
      className="pointer-events-none absolute rounded-[inherit]"
      style={{
        inset,
        background: `color-mix(in oklab, ${color} 30%, transparent)`,
      }}
      aria-hidden
    />
  )
}

function Tail({ color }: { color: string }) {
  return (
    <span
      className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1.5 rotate-45"
      style={{ background: color }}
      aria-hidden
    />
  )
}

function MarkerButton({
  label,
  dimmed,
  onClick,
  children,
}: {
  label: string
  dimmed: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      aria-label={label}
      className="group block cursor-pointer transition-all duration-200"
      style={{ opacity: dimmed ? 0.45 : 1 }}
    >
      <span className="relative block transition-transform duration-200 group-hover:-translate-y-1">{children}</span>
    </button>
  )
}

export function FriendMarker({
  friend,
  selected,
  dimmed,
  onSelect,
}: {
  friend: FriendPresence
  selected: boolean
  dimmed: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onSelect()
      }}
      aria-label={`${friend.name}${friend.placeName ? ` at ${friend.placeName}` : ""}${friend.distanceLabel ? `, ${friend.distanceLabel}` : ""}`}
      className="group block shrink-0 cursor-pointer leading-none transition-all duration-200"
      style={{
        opacity: dimmed ? 0.45 : friend.status === "stale" ? 0.8 : 1,
      }}
    >
      <span className="relative inline-block size-14 shrink-0 transition-transform duration-200 group-hover:-translate-y-1">
        <span
          className={`relative flex size-full shrink-0 items-center justify-center overflow-hidden rounded-full p-[3px] ${shadowClay} transition-transform`}
          style={{
            ...claySurface(friend.ring),
            transform: selected ? "scale(1.15)" : undefined,
          }}
        >
          {selected ? <SelectionRing color={friend.ring} inset="-6px" /> : null}
          <img
            src={friend.avatar || "/placeholder.svg"}
            alt=""
            className="size-full rounded-full border-2 border-white object-cover"
          />
        </span>
      </span>
    </button>
  )
}

export function HuddleMarker({
  huddle,
  displayMode,
  selected,
  dimmed,
  onSelect,
}: {
  huddle: Huddle
  displayMode: MarkerDisplayMode
  selected: boolean
  dimmed: boolean
  onSelect: () => void
}) {
  const color = huddleAccentColor(huddle.color)

  if (displayMode === "chip") {
    return (
      <MarkerButton
        label={`${huddle.status === "active" ? "Active huddle" : "Forming huddle"}: ${huddle.name}, ${huddle.memberCount} people`}
        dimmed={dimmed}
        onClick={onSelect}
      >
        <span
          className={`relative flex items-center gap-1.5 rounded-full px-3 py-1.5 ${typeMarkerChip} text-white ${shadowClay} ${markerSizeClasses.chip}`}
          style={claySurface(color)}
        >
          {selected ? <SelectionRing color={color} inset="-4px" /> : null}
          <Flame className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{huddle.name}</span>
          <span className="shrink-0 opacity-80">· {huddle.memberCount}</span>
        </span>
      </MarkerButton>
    )
  }

  if (displayMode === "pin") {
    return (
      <MarkerButton
        label={`${huddle.status === "active" ? "Active huddle" : "Forming huddle"}: ${huddle.name}, ${huddle.memberCount} people`}
        dimmed={dimmed}
        onClick={onSelect}
      >
        <span
          className={`relative z-10 flex items-center justify-center rounded-full border-2 border-white ${shadowClay} ${markerSizeClasses.pin}`}
          style={{
            ...claySurface(color),
            outline: huddle.status === "forming" ? "2px dashed rgba(255,255,255,0.7)" : undefined,
            outlineOffset: huddle.status === "forming" ? "-4px" : undefined,
          }}
        >
          {selected ? <SelectionRing color={color} inset="-5px" /> : null}
          <Users className="h-5 w-5 text-white" />
        </span>
      </MarkerButton>
    )
  }

  // card mode — selected active huddle only
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onSelect()
      }}
      aria-label={`Active huddle: ${huddle.name}, ${huddle.memberCount} people`}
      className="group block cursor-pointer transition-all duration-200"
      style={{ opacity: dimmed ? 0.5 : 1 }}
    >
      <span className="relative block transition-transform duration-200 group-hover:-translate-y-1">
        <span
          className={`relative block ${radiusSurface} px-3 py-2 text-left text-white ${shadowClay} ${markerSizeClasses.card}`}
          style={claySurface(color)}
        >
          {selected ? <SelectionRing color={color} inset="-5px" /> : null}
          <span className={`block ${typeMarkerEyebrow} text-white/80`}>Active Huddle</span>
          <span className={`block ${typeMarkerTitle}`}>{huddle.name}</span>
          <span className={`mt-0.5 flex items-center gap-1 ${typeMarkerMeta}`}>
            <span className="flex -space-x-1">
              {huddle.memberAvatars.slice(0, 3).map((a) => (
                <img key={a} src={a || "/placeholder.svg"} alt="" className="h-4 w-4 rounded-full border border-white object-cover" />
              ))}
            </span>
            {huddle.memberCount}
          </span>
          <Tail color={color} />
        </span>
      </span>
    </button>
  )
}

const PIN_ICONS: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  cafe: Coffee,
  food: Utensils,
  bar: Wine,
  work: Briefcase,
  park: Trees,
  gym: Dumbbell,
  shop: ShoppingBag,
  museum: Landmark,
  note: StickyNote,
  pin: MapPin,
  reco: Star,
  music: Music,
  saved: Bookmark,
}

function pinIconForKind(kind: PlacePin["kind"]) {
  return PIN_ICONS[kind] ?? MapPin
}

export function PinMarker({
  pin,
  displayMode,
  selected,
  dimmed,
  onSelect,
}: {
  pin: PlacePin
  displayMode: MarkerDisplayMode
  selected: boolean
  dimmed: boolean
  onSelect: () => void
}) {
  const color = pinColor(pin.color)
  const dark = pin.color === "yellow"
  const Icon = pinIconForKind(pin.kind)
  const FillIcon = pin.kind === "saved" && pin.color === "blue" ? Heart : Icon

  // Photo thumbnails for content pins — rounded squares, not location icons.
  if (pin.kind === "content") {
    return (
      <MarkerButton label={pinMarkerLabel(pin)} dimmed={dimmed} onClick={onSelect}>
        <span
          className="relative z-10 block transition-all duration-200"
          style={{ transform: selected ? "scale(1.12)" : undefined }}
        >
          <span
            className={`relative block overflow-hidden ${radiusThumb} border-2 border-white bg-card ${shadowClay} ${claySurfaceVar} ${markerSizeClasses.avatar}`}
          >
            {selected ? <SelectionRing color={color} inset="-5px" /> : null}
            <img
              src={pin.thumbnail || "/placeholder.svg"}
              alt=""
              className="size-full object-cover"
            />
          </span>
        </span>
      </MarkerButton>
    )
  }

  // 3D image markers for category kinds that ship a PNG asset.
  if (PNG_KINDS.has(pin.kind)) {
    return (
      <MarkerButton label={pinMarkerLabel(pin)} dimmed={dimmed} onClick={onSelect}>
        <span className="relative z-10 block">
          <img
            src={`/map-elements/${pin.kind}.png`}
            alt={pin.kind}
            className="h-12 w-12 object-contain"
            style={{ filter: "drop-shadow(0 8px 16px rgba(20,20,20,0.25))" }}
          />
        </span>
      </MarkerButton>
    )
  }

  return (
    <MarkerButton label={pinMarkerLabel(pin)} dimmed={dimmed} onClick={onSelect}>
      <span
        className={`relative z-10 flex items-center justify-center rounded-full border-2 border-white ${shadowFloat} ${markerSizeClasses.pin}`}
        style={{
          background: color,
          boxShadow: selected ? `0 0 0 5px color-mix(in oklab, ${color} 35%, transparent)` : undefined,
          transform: selected ? "scale(1.12)" : undefined,
        }}
      >
        <FillIcon
          className="h-5 w-5"
          style={{ color: dark ? onBrandForeground("yellow") : "#fff" }}
          fill={pin.kind === "saved" || pin.kind === "reco" ? "currentColor" : "none"}
          strokeWidth={2.4}
        />
      </span>
    </MarkerButton>
  )
}

export function ClusterMarker({
  count,
  dominantLabel,
  dimmed,
  onClick,
}: {
  count: number
  dominantLabel: string
  dimmed: boolean
  onClick: () => void
}) {
  return (
    <MarkerButton label={`${count} things here: ${dominantLabel}`} dimmed={dimmed} onClick={onClick}>
      <span
        className={`relative z-10 flex items-center justify-center rounded-full border-2 border-white bg-card ${typeMarkerTitle} text-foreground ${shadowFloat} ${markerSizeClasses.cluster}`}
      >
        <span className="text-base leading-none">☕</span>
        <span className={`absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-yellow px-1 ${typeMarkerBadge}`}>
          +{count - 1}
        </span>
      </span>
    </MarkerButton>
  )
}
