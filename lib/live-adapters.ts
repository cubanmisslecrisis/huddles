import { colorFor, distanceLabel, photoFor, relativeTimeFromMicros, clockFromMicros, ME_PHOTO } from "@/lib/avatar"
import { brandColor } from "@/lib/theme"
import type {
  FriendPresence,
  Huddle,
  ActivityItem,
  SavedPlace,
  PlacePin,
  Status,
} from "@/lib/huddles-data"
import type {
  FriendVM,
  HuddleVM,
  EventVM,
  MeVM,
  SavedPlaceVM,
} from "@/lib/view"

export function adaptFriend(vm: FriendVM): FriendPresence {
  const status: Status = vm.online ? "online" : "stale"
  const dist =
    vm.distanceMeters != null
      ? `${distanceLabel(vm.distanceMeters)} · ${relativeTimeFromMicros(vm.lastSeenMicros)}`
      : relativeTimeFromMicros(vm.lastSeenMicros)

  return {
    id: vm.key,
    name: vm.name,
    avatar: photoFor(vm.key),
    ring: colorFor(vm.key),
    lng: vm.lng,
    lat: vm.lat,
    distanceLabel: dist,
    lastSeenLabel: relativeTimeFromMicros(vm.lastSeenMicros),
    status,
  }
}

export function adaptFriends(vms: FriendVM[]): FriendPresence[] {
  return vms.map(adaptFriend)
}

export function adaptHuddle(vm: HuddleVM): Huddle {
  const statusMap: Record<string, Huddle["status"]> = {
    candidate: "forming",
    active: "active",
    cooling: "cooling",
  }
  const status = statusMap[vm.status] ?? "forming"

  return {
    id: vm.id,
    name: vm.memberNames.length > 0 ? `${vm.memberNames[0]}'s Huddle` : "Huddle",
    lng: vm.lng,
    lat: vm.lat,
    placeName: "Nearby",
    status,
    color: status === "active" ? "red" : "orange",
    memberCount: vm.memberCount,
    memberAvatars: vm.memberKeys.map((k) => photoFor(k)),
    memberNames: vm.memberNames,
    timeLabel: status === "forming" ? "Forming now" : undefined,
    thumbnail: "/places/run-club.png",
  }
}

export function adaptHuddles(vms: HuddleVM[]): Huddle[] {
  return vms.map(adaptHuddle)
}

const EVENT_TYPE_MAP: Record<
  string,
  { type: ActivityItem["type"]; badgeColor: ActivityItem["badgeColor"]; section: ActivityItem["section"] }
> = {
  user_joined: { type: "friend_joined", badgeColor: "green", section: "recent" },
  user_left: { type: "friend_joined", badgeColor: "orange", section: "recent" },
  ping: { type: "ping", badgeColor: "pink", section: "now" },
  huddle_forming: { type: "huddle_started", badgeColor: "orange", section: "now" },
  huddle_activated: { type: "huddle_started", badgeColor: "blue", section: "now" },
  huddle_cooling: { type: "huddle_started", badgeColor: "blue", section: "recent" },
  huddle_ended: { type: "huddle_started", badgeColor: "orange", section: "recent" },
  place_saved: { type: "place_saved", badgeColor: "green", section: "recent" },
}

export function adaptEvent(vm: EventVM): ActivityItem {
  const style = EVENT_TYPE_MAP[vm.type] ?? {
    type: "friend_joined" as const,
    badgeColor: "blue" as const,
    section: "recent" as const,
  }

  return {
    id: vm.id,
    type: style.type,
    section: style.section,
    actor: vm.message.split(" ")[0] ?? "Someone",
    actorAvatars: [],
    title: vm.message,
    context: vm.type.replace(/_/g, " "),
    activityAt: clockFromMicros(vm.micros),
    badgeColor: style.badgeColor,
  }
}

export function adaptActivity(vms: EventVM[]): ActivityItem[] {
  return vms.map(adaptEvent)
}

export function adaptSavedPlace(vm: SavedPlaceVM, myLoc?: { lat: number; lng: number } | null): SavedPlace {
  const dist =
    myLoc != null
      ? distanceLabel(
          Math.sqrt((vm.lat - myLoc.lat) ** 2 + (vm.lng - myLoc.lng) ** 2) * 111_000
        )
      : "Nearby"

  return {
    id: vm.id,
    pinId: `saved-${vm.id}`,
    name: vm.placeName,
    category: vm.note ?? "Saved",
    distanceLabel: dist,
    thumbnail: "/places/arvo-cafe.png",
    badge: "star",
  }
}

export function adaptSavedPlacePin(vm: SavedPlaceVM): PlacePin {
  return {
    id: `saved-${vm.id}`,
    kind: "saved",
    label: vm.placeName,
    category: vm.note ?? "Saved",
    noteText: vm.note ?? undefined,
    lng: vm.lng,
    lat: vm.lat,
    color: "blue",
    authorName: "You",
    createdAtLabel: relativeTimeFromMicros(vm.savedAtMicros),
  }
}

export function adaptMeProfile(me: MeVM) {
  return {
    id: me.key || "you",
    name: me.name,
    avatar: ME_PHOTO,
    roomName: me.roomName,
    roomCode: me.roomCode,
    warmthPoints: me.warmthPoints,
    huddlesJoined: me.huddlesJoined,
  }
}

export function adaptMePresence(me: MeVM, myLoc: { lat: number; lng: number } | null): FriendPresence {
  return {
    id: me.key || "you",
    name: me.name,
    avatar: ME_PHOTO,
    ring: brandColor("yellow"),
    lng: myLoc?.lng ?? 0,
    lat: myLoc?.lat ?? 0,
    distanceLabel: "You",
    lastSeenLabel: "now",
    status: "online",
  }
}
