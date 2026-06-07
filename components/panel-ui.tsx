"use client"

import type { ReactNode } from "react"
import { ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PingIcon } from "@/components/ping-icon"
import { placeMapIconSrc } from "@/lib/entity-lookup"
import type { PlacePin } from "@/lib/huddles-data"
import {
  typeLinkAction,
  typePanelTitle,
  typeSectionLabelLg,
  typeListMeta,
  typeListSubtitle,
  typeListTitle,
  typeButtonBold,
  huddlePanel,
  radiusControl,
  radiusSurface,
  claySurfaceVar,
} from "@/lib/ui-styles"

export function SectionHeader({
  title,
  action = "See all",
  onAction,
}: {
  title: string
  action?: string
  onAction?: () => void
}) {
  return (
    <div className="flex items-center justify-between">
      <h2 className={typeSectionLabelLg}>{title}</h2>
      {action && (
        <Button variant="ghost" size="sm" clay={false} onClick={onAction} className={`h-auto px-0 ${typeLinkAction} hover:bg-transparent hover:text-foreground`}>
          {action}
        </Button>
      )}
    </div>
  )
}

/** Matches map search row inset (`top-4`) + height (`h-12`) so title centers align with map chrome. */
export const lensPanelHeaderClass =
  "flex h-12 shrink-0 items-center justify-between gap-3"

export function LensPanelHeader({
  title,
  children,
}: {
  title: string
  children?: ReactNode
}) {
  return (
    <div className={lensPanelHeaderClass}>
      <h2 className={`${typePanelTitle} leading-none`}>{title}</h2>
      {children ? <div className="flex shrink-0 items-center gap-1.5">{children}</div> : null}
    </div>
  )
}

export function LensPanelList({ children }: { children: ReactNode }) {
  return (
    <div className="mt-2 flex min-h-0 flex-1 flex-col divide-y divide-border overflow-y-auto">
      {children}
    </div>
  )
}

export function LensPanelFooter({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <div className="mt-4 shrink-0">
      <FooterButton label={label} onClick={onClick} />
    </div>
  )
}

export const lensPanelRowClass = "flex w-full items-center gap-3 py-2.5 text-left"
export const lensPanelThumbClass = `h-12 w-12 shrink-0 ${radiusControl} object-cover`
export const lensPanelAvatarClass = "h-12 w-12 shrink-0 rounded-full object-cover"
export const lensPanelTitleClass = typeListTitle
export const lensPanelSubtitleClass = typeListSubtitle
export const lensPanelMetaClass = typeListMeta

export function PlaceMapIcon({
  kind,
  className = "h-12 w-12",
}: {
  kind: PlacePin["kind"]
  className?: string
}) {
  return (
    <img
      src={placeMapIconSrc(kind)}
      alt=""
      className={`shrink-0 object-contain ${className}`}
    />
  )
}

export function PanelCard({
  children,
  className,
  bare = false,
}: {
  children: ReactNode
  className?: string
  /** Drop the bordered-card chrome when already inside a container (e.g. a bottom sheet). */
  bare?: boolean
}) {
  const base = bare ? "" : huddlePanel
  return <section className={`${base} ${className ?? ""}`}>{children}</section>
}

export function PingButton({ onClick }: { onClick?: () => void }) {
  return (
    <Button
      variant="brandGreen"
      size="pill"
      onClick={(e) => {
        e.stopPropagation()
        onClick?.()
      }}
    >
      <PingIcon />
      Ping
    </Button>
  )
}

export function StackedAvatars({ avatars, size = 48 }: { avatars: string[]; size?: number }) {
  const shown = avatars.slice(0, 2)
  const stacked = shown.length > 1
  const avatarSize = Math.round(size * 0.75)

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      {stacked ? (
        <>
          <img
            src={shown[0] || "/placeholder.svg"}
            alt=""
            className="absolute left-0 top-0 rounded-full border-2 border-card object-cover"
            style={{ width: avatarSize, height: avatarSize }}
          />
          <img
            src={shown[1] || "/placeholder.svg"}
            alt=""
            className="absolute bottom-0 right-0 z-10 rounded-full border-2 border-card object-cover"
            style={{ width: avatarSize, height: avatarSize }}
          />
        </>
      ) : (
        <img
          src={shown[0] || "/placeholder.svg"}
          alt=""
          className="size-full rounded-full object-cover"
        />
      )}
    </div>
  )
}

export function AvatarStack({ avatars, size = 6 }: { avatars: string[]; size?: number }) {
  return (
    <div className="flex -space-x-2">
      {avatars.map((a, i) => (
        <img
          key={`${a}-${i}`}
          src={a || "/placeholder.svg"}
          alt=""
          className="rounded-full border-2 border-card object-cover"
          style={{ height: size * 4, width: size * 4 }}
        />
      ))}
    </div>
  )
}

export function FooterButton({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <Button
      variant="outline"
      size="lg"
      clay="gentle"
      onClick={onClick}
      className={`w-full border-0 ${radiusSurface} ${typeButtonBold} ${claySurfaceVar}`}
    >
      {label}
      <ChevronRight className="h-4 w-4" />
    </Button>
  )
}
