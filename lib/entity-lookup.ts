import {
  pins as staticPins,
  recommendations as staticRecommendations,
  yourPicks as staticYourPicks,
  type FriendPresence,
  type Huddle,
  type PlacePin,
  type Recommendation,
  type SavedPlace,
} from "@/lib/huddles-data"
import {
  CATEGORY_TO_KIND,
  isPlaceKind,
  LOCATION_KINDS,
  placeMapIconSrc,
} from "@/lib/pin-kinds"
import { getRecentRecommendationsForFriend } from "@/lib/demo-recommendations"

function normalizeCategory(category: string) {
  return category.trim().toLowerCase().normalize("NFD").replace(/\p{M}/gu, "")
}

export type EntityData = {
  friends: FriendPresence[]
  huddles: Huddle[]
  pins: PlacePin[]
  me: { id: string; name: string; avatar: string }
  recommendations: Recommendation[]
  yourPicks: SavedPlace[]
}

export const defaultEntityData: EntityData = {
  friends: [],
  huddles: [],
  pins: staticPins,
  me: { id: "you", name: "You", avatar: "/characters/sensei.webp" },
  recommendations: staticRecommendations,
  yourPicks: staticYourPicks,
}

export function resolvePlaceKind(
  options: { pinId?: string; category?: string },
  data: EntityData = defaultEntityData
): PlacePin["kind"] {
  if (options.pinId) {
    const pin = data.pins.find((p) => p.id === options.pinId)
    if (pin && LOCATION_KINDS.has(pin.kind)) return pin.kind
  }

  const key = normalizeCategory(options.category ?? "")
  return CATEGORY_TO_KIND[key] ?? "pin"
}

export { placeMapIconSrc, isPlaceKind }

export type PlaceDetail = {
  id: string
  placeName: string
  category: string
  distanceLabel: string
  thumbnail: string
  recommendedBy?: string[]
  whyForYou?: string
  friendActivity?: string[]
  warmthLabel?: string
}

export type FriendDetailExtras = {
  recentRecommendations: string[]
}

export type HuddleDetailExtras = {
  activityItems: string[]
  warmthActivity?: string
}

export type PlaceSaveStatus = "saved" | "pick" | "recommended" | "none"

export type AuthorInfo = {
  id: string
  name: string
  avatar: string
}

export type MapElementBase = {
  id: string
  lat: number
  lng: number
  distanceLabel: string
  coordinatesLabel: string
  author: AuthorInfo
  createdAtLabel: string
  isAuthor: boolean
}

export type PinElementDetail = MapElementBase & {
  kind: "pin"
  title: string
}

export type NoteElementDetail = MapElementBase & {
  kind: "note"
  noteText: string
}

export type MediaElementDetail = MapElementBase & {
  kind: "content"
  title: string
  mediaType: "image" | "video"
  mediaUrl: string
}

export type PlaceElementDetail = {
  id: string
  kind: PlacePin["kind"]
  title: string
  placeType: string
  lat: number
  lng: number
  distanceLabel: string
  coordinatesLabel: string
  saveStatus: PlaceSaveStatus
  saveStatusLabel: string
  recommendedByNames: string[]
  thumbnail: string
}

function buildAvatarNameMap(data: EntityData): Record<string, string> {
  const map: Record<string, string> = {}
  for (const f of data.friends) map[f.avatar] = f.name
  map[data.me.avatar] = data.me.name
  return map
}

export function formatCoordinates(lat: number, lng: number): string {
  const latDir = lat >= 0 ? "N" : "S"
  const lngDir = lng >= 0 ? "E" : "W"
  return `${Math.abs(lat).toFixed(4)}° ${latDir}, ${Math.abs(lng).toFixed(4)}° ${lngDir}`
}

export function isCurrentUserAuthor(authorId: string | undefined, meId: string): boolean {
  return authorId === meId
}

export function getPin(pinId: string, data: EntityData = defaultEntityData): PlacePin | undefined {
  return data.pins.find((p) => p.id === pinId)
}

export function avatarPathToName(avatar: string, data: EntityData = defaultEntityData): string {
  return buildAvatarNameMap(data)[avatar] ?? "Friend"
}

export function getPlaceSaveStatus(
  pinId: string,
  data: EntityData = defaultEntityData
): {
  status: PlaceSaveStatus
  recommendedByNames: string[]
} {
  const reco = data.recommendations.find((r) => r.pinId === pinId)
  if (reco) {
    return {
      status: "recommended",
      recommendedByNames: reco.recommendedBy.map((a) => avatarPathToName(a, data)),
    }
  }

  const pick = data.yourPicks.find((p) => p.pinId === pinId)
  if (pick) {
    const status: PlaceSaveStatus = pick.badge === "star" ? "pick" : "saved"
    return { status, recommendedByNames: [] }
  }

  return { status: "none", recommendedByNames: [] }
}

function resolveAuthor(pin: PlacePin): AuthorInfo {
  if (pin.authorId && pin.authorName && pin.authorAvatar) {
    return { id: pin.authorId, name: pin.authorName, avatar: pin.authorAvatar }
  }
  return { id: "unknown", name: "Unknown", avatar: "/placeholder.svg" }
}

function resolveCreatedAt(pin: PlacePin): string {
  return pin.createdAtLabel ?? "Unknown date"
}

function buildMapElementBase(pin: PlacePin, data: EntityData): MapElementBase {
  const author = resolveAuthor(pin)
  return {
    id: pin.id,
    lat: pin.lat,
    lng: pin.lng,
    distanceLabel: pin.distanceLabel ?? "",
    coordinatesLabel: formatCoordinates(pin.lat, pin.lng),
    author,
    createdAtLabel: resolveCreatedAt(pin),
    isAuthor: isCurrentUserAuthor(author.id, data.me.id),
  }
}

export function getPinElementDetail(
  pinId: string,
  data: EntityData = defaultEntityData
): PinElementDetail | undefined {
  const pin = getPin(pinId, data)
  if (!pin || pin.kind !== "pin") return undefined

  return {
    ...buildMapElementBase(pin, data),
    kind: "pin",
    title: pin.label ?? "Pin",
  }
}

export function getNoteElementDetail(
  pinId: string,
  data: EntityData = defaultEntityData
): NoteElementDetail | undefined {
  const pin = getPin(pinId, data)
  if (!pin || pin.kind !== "note") return undefined

  return {
    ...buildMapElementBase(pin, data),
    kind: "note",
    noteText: pin.noteText ?? pin.label ?? "",
  }
}

export function getMediaElementDetail(
  pinId: string,
  data: EntityData = defaultEntityData
): MediaElementDetail | undefined {
  const pin = getPin(pinId, data)
  if (!pin || pin.kind !== "content") return undefined

  const mediaUrl = pin.mediaUrl ?? pin.thumbnail ?? "/placeholder.svg"
  return {
    ...buildMapElementBase(pin, data),
    kind: "content",
    title: pin.label ?? "Media",
    mediaType: pin.mediaType ?? "image",
    mediaUrl,
  }
}

export function getPlaceElementDetail(
  pinId: string,
  data: EntityData = defaultEntityData
): PlaceElementDetail | undefined {
  const reco = data.recommendations.find((r) => r.pinId === pinId)
  const pick = data.yourPicks.find((p) => p.pinId === pinId)
  const pin = getPin(pinId, data)

  if (!pin && !reco && !pick) return undefined

  const { status, recommendedByNames } = getPlaceSaveStatus(pinId, data)

  const saveStatusLabel =
    status === "recommended"
      ? "Recommended by friend(s)"
      : status === "pick"
        ? "One of your picks"
        : status === "saved"
          ? "Saved"
          : ""

  if (reco) {
    return {
      id: reco.id,
      kind: pin?.kind ?? "reco",
      title: reco.placeName,
      placeType: reco.category,
      lat: pin?.lat ?? 0,
      lng: pin?.lng ?? 0,
      distanceLabel: reco.distanceLabel,
      coordinatesLabel: pin ? formatCoordinates(pin.lat, pin.lng) : reco.distanceLabel,
      saveStatus: status,
      saveStatusLabel,
      recommendedByNames,
      thumbnail: reco.thumbnail,
    }
  }

  if (pick) {
    const resolvedPin = pin ?? getPin(pick.pinId, data)
    return {
      id: pick.id,
      kind: resolvedPin?.kind ?? resolvePlaceKind({ category: pick.category }),
      title: pick.name,
      placeType: pick.category,
      lat: resolvedPin?.lat ?? 0,
      lng: resolvedPin?.lng ?? 0,
      distanceLabel: pick.distanceLabel,
      coordinatesLabel: resolvedPin ? formatCoordinates(resolvedPin.lat, resolvedPin.lng) : pick.distanceLabel,
      saveStatus: status,
      saveStatusLabel,
      recommendedByNames,
      thumbnail: pick.thumbnail,
    }
  }

  if (!pin || !isPlaceKind(pin.kind)) return undefined

  return {
    id: pin.id,
    kind: pin.kind,
    title: pin.label ?? pin.category ?? "Place",
    placeType: pin.category ?? pin.kind,
    lat: pin.lat,
    lng: pin.lng,
    distanceLabel: pin.distanceLabel ?? "",
    coordinatesLabel: formatCoordinates(pin.lat, pin.lng),
    saveStatus: status,
    saveStatusLabel,
    recommendedByNames,
    thumbnail: placeMapIconSrc(pin.kind),
  }
}

export function getFriend(
  id: string,
  data: EntityData = defaultEntityData
): FriendPresence | undefined {
  return data.friends.find((f) => f.id === id)
}

export function getFriendDetailExtras(
  id: string,
  data: EntityData = defaultEntityData
): FriendDetailExtras {
  return {
    recentRecommendations: getRecentRecommendationsForFriend(id, {
      pins: data.pins,
      recommendations: data.recommendations,
      friends: data.friends,
      me: data.me,
    }),
  }
}

export type FriendsRecRow = {
  id: string
  name: string
  category: string
  distanceLabel: string
  by: string
}

export function getFriendsRecRows(data: EntityData = defaultEntityData): FriendsRecRow[] {
  if (data.recommendations.length > 0) {
    const rows: FriendsRecRow[] = []
    for (const reco of data.recommendations) {
      for (const avatar of reco.recommendedBy) {
        rows.push({
          id: `${reco.id}-${avatar}`,
          name: reco.placeName,
          category: reco.category,
          distanceLabel: reco.distanceLabel,
          by: avatarPathToName(avatar, data),
        })
      }
    }
    return rows
  }

  return data.pins
    .filter((p) => p.authorId && p.label && isPlaceKind(p.kind))
    .map((p) => ({
      id: p.id,
      name: p.label!,
      category: p.category ?? "",
      distanceLabel: p.distanceLabel ?? "",
      by: p.authorName ?? "Friend",
    }))
}

export function getHuddle(
  id: string,
  data: EntityData = defaultEntityData
): Huddle | undefined {
  return data.huddles.find((h) => h.id === id)
}

export function getHuddleDetailExtras(id: string): HuddleDetailExtras {
  void id
  return {
    activityItems: ["Maya joined", "Jake added a photo"],
    warmthActivity: "Bayfront Trail warmed +12",
  }
}

export function getPlaceDetailForPin(
  pinId: string,
  data: EntityData = defaultEntityData
): PlaceDetail | undefined {
  const reco = data.recommendations.find((r) => r.pinId === pinId)
  if (reco) {
    return {
      id: reco.id,
      placeName: reco.placeName,
      category: reco.category,
      distanceLabel: reco.distanceLabel,
      thumbnail: reco.thumbnail,
      recommendedBy: reco.recommendedBy,
      whyForYou: "Maya recommended it, and you've liked 4 of her last 5 cafe picks.",
      friendActivity: [
        'Maya: "best latte art"',
        "Jake saved this yesterday",
        "Sophie and 4 others love this place",
      ],
      warmthLabel: "Warm now",
    }
  }

  const pick = data.yourPicks.find((p) => p.pinId === pinId)
  if (pick) {
    return {
      id: pick.id,
      placeName: pick.name,
      category: pick.category,
      distanceLabel: pick.distanceLabel,
      thumbnail: pick.thumbnail,
      whyForYou: "Maya recommended it, and you've liked 4 of her last 5 cafe picks.",
      friendActivity: [
        'Maya: "best latte art"',
        "Jake saved this yesterday",
        "Sophie and 4 others love this place",
      ],
      warmthLabel: "Warm now",
    }
  }

  const pin = data.pins.find((p) => p.id === pinId)
  if (!pin) return undefined

  const isCustomType = LOCATION_KINDS.has(pin.kind)

  return {
    id: pin.id,
    placeName: pin.label ?? pin.category ?? "Saved place",
    category: pin.category ?? "Place",
    distanceLabel: pin.distanceLabel ?? "",
    thumbnail:
      pin.kind === "content"
        ? (pin.thumbnail ?? "/placeholder.svg")
        : isCustomType
          ? placeMapIconSrc(pin.kind)
          : "/placeholder.svg",
    whyForYou: "Maya recommended it, and you've liked 4 of her last 5 cafe picks.",
    friendActivity: [
      'Maya: "best latte art"',
      "Jake saved this yesterday",
      "Sophie and 4 others love this place",
    ],
    warmthLabel: "Warm now",
  }
}

export function buildMapStats(data: EntityData) {
  return {
    nearbyFriends: data.friends.filter((f) => f.status === "online" || f.status === "nearby").length,
    formingHuddles: data.huddles.filter((h) => h.status === "forming").length,
    activeHuddles: data.huddles.filter((h) => h.status === "active").length,
    friendsOut: data.friends.filter((f) => f.status !== "stale").length,
  }
}

export function getNearbyFriend(data: EntityData = defaultEntityData): FriendPresence | undefined {
  const withDist = data.friends.filter((f) => f.status === "online" || f.status === "nearby")
  return withDist[0]
}

export function getFeaturedRecommendation(data: EntityData = defaultEntityData) {
  if (data.recommendations.length === 0) return undefined
  return [...data.recommendations].sort(
    (a, b) => b.recommendedBy.length - a.recommendedBy.length
  )[0]
}
