import type { FriendPresence, Huddle, LayerKey, PlacePin } from "@/lib/huddles-data"
import { isRenderableOnMap, pinMapLayer, pinMapPriority } from "@/lib/pin-kinds"
import type { Selection } from "@/lib/selection"

export type MarkerDisplayMode = "hidden" | "pin" | "chip" | "card" | "cluster"

export type MapEntityKind = "friend" | "huddle" | "pin" | "cluster"

export type MapMarkerModel = {
  id: string
  kind: MapEntityKind
  lng: number
  lat: number
  priority: number
  layer: LayerKey
  pinKind?: PlacePin["kind"]
  friend?: FriendPresence
  huddle?: Huddle
  pin?: PlacePin
  clusterMembers?: MapMarkerModel[]
}

export type MarkerEntities = {
  friends: FriendPresence[]
  huddles: Huddle[]
  pins: PlacePin[]
}

export type LayoutContext = {
  layers: Record<LayerKey, boolean>
  selection: Selection
}

function isSelected(selection: Selection, kind: "friend" | "huddle" | "pin", id: string): boolean {
  return selection !== null && selection.kind === kind && selection.id === id
}

function selectedId(selection: Selection): string | null {
  if (!selection) return null
  return `${selection.kind}-${selection.id}`
}

export function computeDisplayMode(m: MapMarkerModel, ctx: LayoutContext): MarkerDisplayMode {
  if (m.kind === "cluster") return "cluster"
  if (!ctx.layers[m.layer]) return "hidden"

  const selId = selectedId(ctx.selection)
  const modelId = `${m.kind}-${m.id}`

  if (selId === modelId) {
    if (m.kind === "huddle" && m.huddle?.status === "active") return "card"
    return "pin"
  }

  if (m.kind === "huddle") {
    return m.huddle?.status === "active" ? "chip" : "pin"
  }

  return "pin"
}

function isPinVisible(pin: PlacePin, layers: Record<LayerKey, boolean>): boolean {
  return layers[pinMapLayer(pin)]
}

export function buildMarkerModels(
  layers: Record<LayerKey, boolean>,
  entities: MarkerEntities
): MapMarkerModel[] {
  const models: MapMarkerModel[] = []
  const { friends, huddles, pins } = entities

  if (layers.huddles) {
    huddles.forEach((h) => {
      models.push({
        id: h.id,
        kind: "huddle",
        lng: h.lng,
        lat: h.lat,
        priority: h.status === "active" ? 1 : 5,
        layer: "huddles",
        huddle: h,
      })
    })
  }

  if (layers.friends) {
    friends.forEach((f) => {
      models.push({
        id: f.id,
        kind: "friend",
        lng: f.lng,
        lat: f.lat,
        priority: 2,
        layer: "friends",
        friend: f,
      })
    })
  }

  pins.forEach((p) => {
    if (!isRenderableOnMap(p.kind)) return
    if (!isPinVisible(p, layers)) return
    models.push({
      id: p.id,
      kind: "pin",
      lng: p.lng,
      lat: p.lat,
      priority: pinMapPriority(p),
      layer: pinMapLayer(p),
      pinKind: p.kind,
      pin: p,
    })
  })

  return models
}

export function modelKey(m: MapMarkerModel): string {
  if (m.kind === "cluster") return `cluster-${m.id}`
  return `${m.kind}-${m.id}`
}

export function isClusterExempt(m: MapMarkerModel, ctx: LayoutContext): boolean {
  if (m.kind === "friend") return true
  if (m.kind === "huddle" && m.huddle?.status === "active") return true
  if (isSelected(ctx.selection, m.kind as "friend" | "huddle" | "pin", m.id)) return true
  return false
}

export function selectionFromModel(m: MapMarkerModel): Selection {
  if (m.kind === "friend" || m.kind === "huddle" || m.kind === "pin") {
    return { kind: m.kind, id: m.id }
  }
  return null
}
