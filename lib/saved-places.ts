import { friendsRecs, type SavedPlace } from "@/lib/huddles-data"
import { getFriendsRecRows, resolvePlaceKind, type EntityData } from "@/lib/entity-lookup"

export type SavedPanelSource = "saved" | "picks" | "friends"

export type SavedPlaceRow = {
  id: string
  pinId: string
  name: string
  category: string
  distanceLabel: string
}

export type FriendsRecRow = {
  id: string
  name: string
  category: string
  distanceLabel: string
  by: string
}

function matchCategoryFilter(category: string, filter: string, entityData: EntityData): boolean {
  if (filter === "All") return true
  const f = filter.toLowerCase().replace(/s$/, "")
  const kind = resolvePlaceKind({ category }, entityData)
  if (f === "event") return category.toLowerCase().includes("event")
  return kind === f || category.toLowerCase().includes(f)
}

export function filterSavedPlaces(
  items: SavedPlace[],
  filter: string,
  entityData: EntityData
): SavedPlaceRow[] {
  return items
    .filter((p) => matchCategoryFilter(p.category, filter, entityData))
    .map((p) => ({
      id: p.id,
      pinId: p.pinId,
      name: p.name,
      category: p.category,
      distanceLabel: p.distanceLabel,
    }))
}

export function filterFriendsRecs(filter: string, entityData: EntityData): FriendsRecRow[] {
  const rows = getFriendsRecRows(entityData)
  const source = rows.length > 0 ? rows : friendsRecs.map((r) => ({
    id: r.id,
    name: r.name,
    category: r.category,
    distanceLabel: r.distanceLabel,
    by: r.by,
  }))
  return source.filter((r) => matchCategoryFilter(r.category, filter, entityData))
}

export function getSavedPanelData(
  source: SavedPanelSource,
  filter: string,
  savedPlaces: SavedPlace[],
  entityData: EntityData
) {
  if (source === "saved") {
    return { kind: "saved" as const, rows: filterSavedPlaces(savedPlaces, filter, entityData) }
  }
  if (source === "picks") {
    return { kind: "picks" as const }
  }
  const rows = filterFriendsRecs(filter, entityData)
  if (rows.length === 0 && getFriendsRecRows(entityData).length === 0 && friendsRecs.length === 0) {
    return { kind: "friends-empty" as const }
  }
  if (rows.length === 0) {
    return { kind: "friends-filtered-empty" as const }
  }
  return { kind: "friends" as const, rows }
}
