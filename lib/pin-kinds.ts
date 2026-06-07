import type { LayerKey } from "@/lib/huddles-data"
import type { PlacePin } from "@/lib/huddles-data"

export const PLACE_KINDS = new Set<PlacePin["kind"]>([
  "cafe",
  "food",
  "bar",
  "work",
  "park",
  "gym",
  "shop",
  "museum",
])

export const LOCATION_KINDS = new Set<PlacePin["kind"]>([
  ...PLACE_KINDS,
  "note",
  "pin",
])

export function isPlaceKind(kind: PlacePin["kind"]): boolean {
  return PLACE_KINDS.has(kind)
}

export const CATEGORY_TO_KIND: Record<string, PlacePin["kind"]> = {
  cafe: "cafe",
  food: "food",
  tacos: "food",
  bakery: "food",
  bar: "bar",
  bars: "bar",
  work: "work",
  park: "park",
  gym: "gym",
  shop: "shop",
  event: "shop",
  museum: "museum",
  note: "note",
  pin: "pin",
}

export const PNG_KINDS = new Set<PlacePin["kind"]>([
  "cafe",
  "food",
  "bar",
  "work",
  "park",
  "gym",
  "shop",
  "museum",
  "note",
  "pin",
])

const RECS_LOCATION_KINDS = new Set<PlacePin["kind"]>([
  "cafe",
  "food",
  "bar",
  "park",
  "shop",
  "museum",
  "note",
])

const SAVED_LOCATION_KINDS = new Set<PlacePin["kind"]>(["work", "gym", "pin"])

export function isRenderableOnMap(kind: PlacePin["kind"]): boolean {
  return kind !== "reco"
}

export function pinMapLayer(pin: PlacePin): LayerKey {
  if (pin.kind === "reco" || pin.kind === "music") return "recs"
  if (pin.kind === "saved" || pin.kind === "content") return "saved"
  if (RECS_LOCATION_KINDS.has(pin.kind)) return "recs"
  if (SAVED_LOCATION_KINDS.has(pin.kind)) return "saved"
  return "recs"
}

export function pinMapPriority(pin: PlacePin): number {
  if (pin.kind === "reco") return 4
  if (pin.kind === "music") return 5
  if (pin.kind === "saved") return 6
  if (pin.kind === "content") return 7
  if (pin.kind === "note") return 7
  return 5
}

export function placeMapIconSrc(kind: PlacePin["kind"]) {
  return `/map-elements/${kind}.png`
}
