import type { MapMarkerModel } from "@/lib/map-markers-model"
import type { PlacePin } from "@/lib/huddles-data"

export function markerTitle(m: MapMarkerModel): string {
  if (m.kind === "friend") return m.friend?.name ?? "Friend"
  if (m.kind === "huddle") return m.huddle?.name ?? "Huddle"
  if (m.kind === "pin") return m.pin?.label ?? m.pin?.category ?? "Place"
  return "Places"
}

export function markerSubtitle(m: MapMarkerModel): string {
  if (m.kind === "friend") return m.friend?.placeName ?? m.friend?.distanceLabel ?? "Nearby"
  if (m.kind === "huddle") return m.huddle?.placeName ?? `${m.huddle?.memberCount ?? 0} people`
  if (m.kind === "pin") return m.pin?.category ?? m.pin?.kind ?? ""
  return ""
}

export function clusterDominantLabel(members: MapMarkerModel[]): string {
  const sorted = [...members].sort((a, b) => a.priority - b.priority)
  return markerTitle(sorted[0])
}

export function pinMarkerLabel(pin: PlacePin): string {
  if (pin.kind === "reco") return `Recommendation: ${pin.category ?? pin.label}, ${pin.distanceLabel ?? ""}`
  if (pin.kind === "music") return "Music spot"
  if (pin.kind === "content") return "Photo from a friend"
  if (pin.kind === "saved") return "Saved place"
  return `${pin.kind} spot: ${pin.label || pin.category || ""}`
}
