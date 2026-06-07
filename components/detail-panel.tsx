"use client"

import { X, Users, Bookmark, Plus, Trash2, Flame } from "lucide-react"
import { PingIcon } from "@/components/ping-icon"
import {
  formatCoordinates,
  getFriend,
  getFriendDetailExtras,
  getHuddle,
  getMediaElementDetail,
  getNoteElementDetail,
  getPin,
  getPinElementDetail,
  getPlaceElementDetail,
  isPlaceKind,
  type EntityData,
} from "@/lib/entity-lookup"
import { PanelCard } from "@/components/panel-ui"
import { Button } from "@/components/ui/button"
import {
  typeButtonBold,
  typeEntityName,
  typeSectionLabel,
  typeBodyStrong,
  claySurfaceVar,
} from "@/lib/ui-styles"
import type { Selection } from "@/lib/selection"
import type {
  MapElementBase,
  MediaElementDetail,
  NoteElementDetail,
  PinElementDetail,
  PlaceElementDetail,
} from "@/lib/entity-lookup"

function actionButtonColor(
  label: string,
  color: "primary" | "blue" | "pink" | "red" | "green" | "outline" = "primary",
) {
  switch (label) {
    case "Join":
      return "red"
    case "Save":
      return "blue"
    case "Ping":
      return "green"
    default:
      return color
  }
}

function actionButtonIcon(label: string, icon?: React.ReactNode) {
  if (icon) return icon
  switch (label) {
    case "Start huddle":
      return <Flame className="h-4 w-4" />
    case "Ping":
      return <PingIcon />
    case "Save":
      return <Bookmark className="h-4 w-4" />
    default:
      return null
  }
}

function ActionButton({
  label,
  color = "primary",
  icon,
  onClick,
}: {
  label: string
  color?: "primary" | "blue" | "pink" | "red" | "green" | "outline"
  icon?: React.ReactNode
  onClick?: () => void
}) {
  const resolvedColor = actionButtonColor(label, color)
  const resolvedIcon = actionButtonIcon(label, icon)
  const variant =
    resolvedColor === "blue"
      ? "brandBlue"
      : resolvedColor === "pink"
        ? "brand"
        : resolvedColor === "red"
          ? "brandRed"
          : resolvedColor === "green"
            ? "brandGreen"
            : resolvedColor === "outline"
              ? "outline"
              : "default"
  const outlineClasses = resolvedColor === "outline" ? `border-0 ${claySurfaceVar}` : ""

  return (
    <Button variant={variant} size="lg" className={`flex-1 ${typeButtonBold} ${outlineClasses}`} onClick={onClick}>
      {resolvedIcon}
      {label}
    </Button>
  )
}

function DetailShell({
  title,
  onClose,
  children,
  bare = false,
}: {
  title: React.ReactNode
  onClose: () => void
  children: React.ReactNode
  bare?: boolean
}) {
  return (
    <PanelCard bare={bare} className={bare ? "flex flex-col" : "flex h-full flex-col"}>
      <div className="flex items-start justify-between">
        <div className="min-w-0">{title}</div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close detail"
          className="ml-2 shrink-0 p-1 text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-4 flex flex-1 flex-col gap-5 overflow-y-auto">{children}</div>
    </PanelCard>
  )
}

function MetaField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className={`mb-1 ${typeSectionLabel}`}>{label}</p>
      <div className="text-sm text-foreground">{children}</div>
    </div>
  )
}

function AuthorRow({ author }: { author: MapElementBase["author"] }) {
  return (
    <div className="flex items-center gap-2">
      <img src={author.avatar || "/placeholder.svg"} alt="" className="h-7 w-7 rounded-full object-cover" />
      <span className={typeBodyStrong}>{author.name}</span>
    </div>
  )
}

function formatLocationSubtitle(
  distanceLabel: string | undefined,
  coordinatesLabel: string,
  prefix?: string,
) {
  return [prefix, distanceLabel, coordinatesLabel].filter(Boolean).join(" · ")
}

function DetailTitleBlock({
  title,
  prefix,
  distanceLabel,
  coordinatesLabel,
  extraLine,
}: {
  title: React.ReactNode
  prefix?: string
  distanceLabel?: string
  coordinatesLabel: string
  extraLine?: React.ReactNode
}) {
  const locationLine = formatLocationSubtitle(distanceLabel, coordinatesLabel, prefix)

  return (
    <div>
      {title}
      <p className="text-sm text-muted-foreground">{locationLine}</p>
      {extraLine ? <p className="text-sm text-muted-foreground">{extraLine}</p> : null}
    </div>
  )
}

function MapElementActions({ isAuthor }: { isAuthor: boolean }) {
  return (
    <div className="flex gap-2">
      <ActionButton label="Start huddle" color="red" />
      {isAuthor && <ActionButton label="Delete" color="outline" icon={<Trash2 className="h-4 w-4" />} />}
    </div>
  )
}

function PinDetailView({ detail, bare, onClose }: { detail: PinElementDetail; bare: boolean; onClose: () => void }) {
  return (
    <DetailShell
      bare={bare}
      title={
        <DetailTitleBlock
          title={<p className={typeEntityName}>{detail.title}</p>}
          distanceLabel={detail.distanceLabel}
          coordinatesLabel={detail.coordinatesLabel}
        />
      }
      onClose={onClose}
    >
      <MetaField label="Author">
        <AuthorRow author={detail.author} />
      </MetaField>
      <MetaField label="Date created">{detail.createdAtLabel}</MetaField>
      <MapElementActions isAuthor={detail.isAuthor} />
    </DetailShell>
  )
}

function NoteDetailView({ detail, bare, onClose }: { detail: NoteElementDetail; bare: boolean; onClose: () => void }) {
  return (
    <DetailShell
      bare={bare}
      title={
        <DetailTitleBlock
          title={<p className={typeEntityName}>Note</p>}
          distanceLabel={detail.distanceLabel}
          coordinatesLabel={detail.coordinatesLabel}
        />
      }
      onClose={onClose}
    >
      <MetaField label="Note">
        <p className="rounded-lg bg-secondary px-3 py-2.5 font-medium leading-relaxed">{detail.noteText}</p>
      </MetaField>
      <MetaField label="Author">
        <AuthorRow author={detail.author} />
      </MetaField>
      <MetaField label="Date written">{detail.createdAtLabel}</MetaField>
      <MapElementActions isAuthor={detail.isAuthor} />
    </DetailShell>
  )
}

function MediaDetailView({ detail, bare, onClose }: { detail: MediaElementDetail; bare: boolean; onClose: () => void }) {
  return (
    <DetailShell
      bare={bare}
      title={
        <DetailTitleBlock
          title={<p className={typeEntityName}>{detail.title}</p>}
          distanceLabel={detail.distanceLabel}
          coordinatesLabel={detail.coordinatesLabel}
        />
      }
      onClose={onClose}
    >
      {detail.mediaType === "video" ? (
        <video
          src={detail.mediaUrl}
          controls
          className="h-48 w-full rounded-2xl bg-secondary object-cover"
          poster={detail.mediaUrl}
        />
      ) : (
        <img src={detail.mediaUrl || "/placeholder.svg"} alt="" className="h-48 w-full rounded-2xl object-cover" />
      )}
      <MetaField label="Author">
        <AuthorRow author={detail.author} />
      </MetaField>
      <MetaField label="Date created">{detail.createdAtLabel}</MetaField>
      <MapElementActions isAuthor={detail.isAuthor} />
    </DetailShell>
  )
}

function PlaceDetailView({ detail, bare, onClose }: { detail: PlaceElementDetail; bare: boolean; onClose: () => void }) {
  const isSaved = detail.saveStatus === "saved" || detail.saveStatus === "pick"

  return (
    <DetailShell
      bare={bare}
      title={
        <DetailTitleBlock
          title={<p className={typeEntityName}>{detail.title}</p>}
          prefix={detail.placeType}
          distanceLabel={detail.distanceLabel}
          coordinatesLabel={detail.coordinatesLabel}
        />
      }
      onClose={onClose}
    >
      <img
        src={detail.thumbnail || "/placeholder.svg"}
        alt=""
        className={
          detail.thumbnail.includes("/map-elements/")
            ? "h-36 w-full rounded-2xl border border-border/50 bg-secondary/40 object-contain p-4"
            : "h-36 w-full rounded-2xl object-cover"
        }
      />
      {detail.saveStatusLabel && (
        <p className={`text-sm ${typeBodyStrong}`}>{detail.saveStatusLabel}</p>
      )}
      {detail.recommendedByNames.length > 0 && (
        <MetaField label="Recommended by">
          <span>{detail.recommendedByNames.join(", ")}</span>
        </MetaField>
      )}
      <div className="flex gap-2">
        <ActionButton label="Start huddle" color="red" />
        {isSaved ? (
          <ActionButton label="Remove" color="outline" icon={<Trash2 className="h-4 w-4" />} />
        ) : (
          <ActionButton label="Save" />
        )}
      </div>
    </DetailShell>
  )
}

function HuddleDetailView({
  huddleId,
  bare,
  onClose,
  entityData,
}: {
  huddleId: string
  bare: boolean
  onClose: () => void
  entityData: EntityData
}) {
  const h = getHuddle(huddleId, entityData)
  if (!h) return null

  const timeLabel = h.startedAtLabel ?? h.timeLabel ?? "Time TBD"
  const coordinatesLabel = formatCoordinates(h.lat, h.lng)

  return (
    <DetailShell
      bare={bare}
      title={
        <DetailTitleBlock
          title={<p className={typeEntityName}>{h.name}</p>}
          distanceLabel={h.placeName}
          coordinatesLabel={coordinatesLabel}
          extraLine={h.status === "active" ? "Active Huddle" : "Forming"}
        />
      }
      onClose={onClose}
    >
      <MetaField label="Time">{timeLabel}</MetaField>
      <MetaField label="Participating">
        <div className="flex flex-col gap-2">
          <span className={`flex items-center gap-1.5 ${typeBodyStrong}`}>
            <Users className="h-4 w-4 text-red" /> {h.memberCount} people
          </span>
          <ul className="flex flex-col gap-1">
            {h.memberNames.map((name) => (
              <li key={name} className="text-sm text-muted-foreground">
                {name}
              </li>
            ))}
          </ul>
        </div>
      </MetaField>
      <div className="flex gap-2">
        <ActionButton label="Join" color="red" />
        <ActionButton label="Add people" color="outline" icon={<Plus className="h-4 w-4" />} />
      </div>
    </DetailShell>
  )
}

export function DetailPanel({
  selection,
  onClose,
  bare = false,
  onPing,
  entityData,
}: {
  selection: Selection
  onClose: () => void
  bare?: boolean
  onPing?: () => void
  entityData: EntityData
}) {
  if (!selection) return null

  if (selection.kind === "friend") {
    const f = getFriend(selection.id, entityData)
    if (!f) return null
    const extras = getFriendDetailExtras(selection.id, entityData)

    return (
      <DetailShell
        bare={bare}
        title={
          <div className="flex items-center gap-3">
            <img src={f.avatar || "/placeholder.svg"} alt="" className="h-14 w-14 rounded-full object-cover" />
            <div>
              <p className={typeEntityName}>{f.name}</p>
              <p className="text-sm text-muted-foreground">
                {f.placeName ? `At ${f.placeName}` : f.lastSeenLabel} · {f.distanceLabel}
              </p>
            </div>
          </div>
        }
        onClose={onClose}
      >
        <div className="flex gap-2">
          <ActionButton label="Ping" color="green" onClick={onPing} />
          <ActionButton label="Invite" color="outline" icon={<Plus className="h-4 w-4" />} />
        </div>
        <div>
          <p className={`mb-2 ${typeSectionLabel}`}>Recent recommendations</p>
          <ul className="flex flex-col gap-1.5 text-sm text-foreground">
            {extras.recentRecommendations.map((item) => (
              <li key={item} className="rounded-lg bg-secondary px-3 py-2 font-medium">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </DetailShell>
    )
  }

  if (selection.kind === "huddle") {
    return <HuddleDetailView huddleId={selection.id} bare={bare} onClose={onClose} entityData={entityData} />
  }

  const pin = getPin(selection.id, entityData)

  const pinDetail = getPinElementDetail(selection.id, entityData)
  if (pinDetail) return <PinDetailView detail={pinDetail} bare={bare} onClose={onClose} />

  const noteDetail = getNoteElementDetail(selection.id, entityData)
  if (noteDetail) return <NoteDetailView detail={noteDetail} bare={bare} onClose={onClose} />

  const mediaDetail = getMediaElementDetail(selection.id, entityData)
  if (mediaDetail) return <MediaDetailView detail={mediaDetail} bare={bare} onClose={onClose} />

  const placeDetail = getPlaceElementDetail(selection.id, entityData)
  if (placeDetail && (isPlaceKind(placeDetail.kind) || placeDetail.kind === "reco")) {
    return <PlaceDetailView detail={placeDetail} bare={bare} onClose={onClose} />
  }

  // Fallback for pins with unrecognized kinds
  if (pin) {
    const fallbackPlace = getPlaceElementDetail(selection.id, entityData)
    if (fallbackPlace) {
      return <PlaceDetailView detail={fallbackPlace} bare={bare} onClose={onClose} />
    }
  }

  return null
}
