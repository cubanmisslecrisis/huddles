import { brandColor } from "@/lib/theme"

export type Status = "online" | "nearby" | "stale" | "in_huddle"

export type FriendPresence = {
  id: string
  name: string
  avatar: string
  ring: string
  // geographic position
  lng: number
  lat: number
  placeName?: string
  distanceLabel?: string
  lastSeenLabel: string
  status: Status
  canInvite?: boolean
}

export type Huddle = {
  id: string
  name: string
  lng: number
  lat: number
  placeName: string
  status: "forming" | "active" | "cooling"
  color: "red" | "orange"
  memberCount: number
  memberAvatars: string[]
  memberNames: string[]
  startedAtLabel?: string
  timeLabel?: string
  thumbnail: string
}

export type PlacePin = {
  id: string
  kind: "reco" | "saved" | "content" | "music" | "cafe" | "food" | "bar" | "work" | "park" | "gym" | "shop" | "museum" | "note" | "pin"
  label?: string
  category?: string
  distanceLabel?: string
  /** Photo thumbnail for content pins */
  thumbnail?: string
  authorId?: string
  authorName?: string
  authorAvatar?: string
  createdAtLabel?: string
  noteText?: string
  mediaType?: "image" | "video"
  mediaUrl?: string
  lng: number
  lat: number
  color: "yellow" | "pink" | "blue" | "green" | "orange" | "purple" | "gray"
}

export type Recommendation = {
  id: string
  pinId: string
  placeName: string
  category: string
  distanceLabel: string
  recommendedBy: string[]
  thumbnail: string
}

export type ActivitySection = "now" | "coming_up" | "recent"

export type ActivityItem = {
  id: string
  type: "huddle_started" | "place_saved" | "friend_joined" | "ping" | "recommendation"
  section: ActivitySection
  actor: string
  actorAvatars: string[]
  title: string
  /** Object context — event time, place, category, headcount, etc. */
  context: string
  /** When the activity happened — separate from event time in context. */
  activityAt: string
  badgeColor: "pink" | "blue" | "green" | "orange"
  actionLabel?: string
}

export type SavedPlace = {
  id: string
  pinId: string
  name: string
  category: string
  distanceLabel: string
  thumbnail: string
  badge: "star" | "heart" | "food"
}

export const me = {
  id: "you",
  name: "You",
  avatar: "/avatars/you.png",
}

// Downtown Miami / Bayfront area
export const MAP_CENTER: [number, number] = [-80.189, 25.773]
export const MAP_ZOOM = 14.8

export const circles = [
  { id: "eeg", name: "EEG Fam", meta: "3 nearby · 2 huddles forming", avatars: ["/avatars/maya.png", "/avatars/jake.png", "/avatars/sophie.png"] },
  { id: "nyu", name: "NYU Friends", meta: "8 nearby · 12 new recs", avatars: ["/avatars/leo.png", "/avatars/nina.png", "/avatars/jake.png"] },
  { id: "close", name: "Close Friends", meta: "Private · 1 active huddle", avatars: ["/avatars/maya.png", "/avatars/sophie.png"] },
]

export const friends: FriendPresence[] = [
  {
    id: "maya",
    name: "Maya",
    avatar: "/avatars/maya.png",
    ring: brandColor("yellow"),
    lng: -80.1858,
    lat: 25.7805,
    placeName: "ARVO Café",
    distanceLabel: "0.3 mi · 5m ago",
    lastSeenLabel: "5m ago",
    status: "online",
  },
  {
    id: "jake",
    name: "Jake",
    avatar: "/avatars/jake.png",
    ring: brandColor("blue"),
    lng: -80.2005,
    lat: 25.7782,
    placeName: "Art Walk",
    distanceLabel: "0.2 mi · 12m ago",
    lastSeenLabel: "12m ago",
    status: "online",
    canInvite: true,
  },
  {
    id: "sophie",
    name: "Sophie",
    avatar: "/avatars/sophie.png",
    ring: brandColor("orange"),
    lng: -80.1948,
    lat: 25.7682,
    placeName: "Bayfront Park",
    distanceLabel: "0.3 mi · 1h ago",
    lastSeenLabel: "1h ago",
    status: "nearby",
  },
  {
    id: "leo",
    name: "Leo",
    avatar: "/avatars/leo.png",
    ring: brandColor("green"),
    lng: -80.1872,
    lat: 25.7712,
    placeName: "Pickup Game",
    distanceLabel: "0.6 mi · 2h ago",
    lastSeenLabel: "2h ago",
    status: "nearby",
    canInvite: true,
  },
  {
    id: "nina",
    name: "Nina",
    avatar: "/avatars/nina.png",
    ring: brandColor("pink"),
    lng: -80.1885,
    lat: 25.7748,
    distanceLabel: "2.2 mi away",
    lastSeenLabel: "Last seen 3h ago",
    status: "stale",
  },
]

export const huddles: Huddle[] = [
  {
    id: "run-club",
    name: "Sunset Run Club",
    lng: -80.1908,
    lat: 25.7768,
    placeName: "Bayfront Trail",
    status: "active",
    color: "red",
    memberCount: 12,
    memberAvatars: ["/avatars/maya.png", "/avatars/jake.png", "/avatars/sophie.png", "/avatars/leo.png"],
    memberNames: ["Maya", "Jake", "Sophie", "Leo", "Nina", "Alex", "Sam", "Riley", "Jordan", "Casey", "Taylor", "Morgan"],
    startedAtLabel: "Started 9:30 AM",
    thumbnail: "/places/run-club.png",
  },
  {
    id: "art-walk",
    name: "Art Walk",
    lng: -80.1932,
    lat: 25.7724,
    placeName: "Wynwood",
    status: "forming",
    color: "orange",
    memberCount: 8,
    memberAvatars: ["/avatars/nina.png", "/avatars/leo.png", "/avatars/jake.png"],
    memberNames: ["Nina", "Leo", "Jake", "Maya", "Sophie", "Chris", "Dana", "Evan"],
    timeLabel: "Today 6PM",
    thumbnail: "/places/art-walk.png",
  },
]

export const pins: PlacePin[] = [
  {
    id: "content",
    kind: "content",
    label: "Wynwood mural",
    lng: -80.1888,
    lat: 25.7735,
    color: "green",
    thumbnail: "/places/art-walk.png",
    mediaType: "image",
    mediaUrl: "/places/art-walk.png",
    authorId: "jake",
    authorName: "Jake",
    authorAvatar: "/avatars/jake.png",
    createdAtLabel: "Jun 5, 2026",
  },
  {
    id: "pin-reco-arvo",
    kind: "reco",
    label: "Maya reco",
    category: "ARVO Café",
    distanceLabel: "0.3 mi",
    lng: -80.1855,
    lat: 25.7802,
    color: "yellow",
  },
  {
    id: "pin-cafe",
    kind: "cafe",
    label: "Panther Coffee",
    category: "Cafe",
    distanceLabel: "0.1 mi",
    lng: -80.1842,
    lat: 25.7758,
    color: "yellow",
    authorId: "maya",
    authorName: "Maya",
    authorAvatar: "/avatars/maya.png",
    createdAtLabel: "May 28, 2026",
  },
  {
    id: "pin-food",
    kind: "food",
    label: "Coyo Taco",
    category: "Food",
    distanceLabel: "0.2 mi",
    lng: -80.1915,
    lat: 25.7775,
    color: "orange",
    authorId: "leo",
    authorName: "Leo",
    authorAvatar: "/avatars/leo.png",
    createdAtLabel: "Jun 1, 2026",
  },
  {
    id: "pin-bar",
    kind: "bar",
    label: "Gramps Bar",
    category: "Bar",
    distanceLabel: "0.4 mi",
    lng: -80.1925,
    lat: 25.7685,
    color: "purple",
    authorId: "sophie",
    authorName: "Sophie",
    authorAvatar: "/avatars/sophie.png",
    createdAtLabel: "May 20, 2026",
  },
  {
    id: "pin-work",
    kind: "work",
    label: "The Lab Miami",
    category: "Work",
    distanceLabel: "0.3 mi",
    lng: -80.1960,
    lat: 25.7720,
    color: "gray",
    authorId: "you",
    authorName: "You",
    authorAvatar: "/avatars/you.png",
    createdAtLabel: "Apr 12, 2026",
  },
  {
    id: "pin-park",
    kind: "park",
    label: "Bayfront Park",
    category: "Park",
    distanceLabel: "0.5 mi",
    lng: -80.1870,
    lat: 25.7780,
    color: "green",
    authorId: "nina",
    authorName: "Nina",
    authorAvatar: "/avatars/nina.png",
    createdAtLabel: "Jun 3, 2026",
  },
  {
    id: "pin-gym",
    kind: "gym",
    label: "Equinox Gym",
    category: "Gym",
    distanceLabel: "0.3 mi",
    lng: -80.1905,
    lat: 25.7708,
    color: "blue",
    authorId: "jake",
    authorName: "Jake",
    authorAvatar: "/avatars/jake.png",
    createdAtLabel: "May 15, 2026",
  },
  {
    id: "pin-shop",
    kind: "shop",
    label: "Wynwood Shop",
    category: "Shop",
    distanceLabel: "0.6 mi",
    lng: -80.1985,
    lat: 25.7760,
    color: "pink",
    authorId: "maya",
    authorName: "Maya",
    authorAvatar: "/avatars/maya.png",
    createdAtLabel: "Jun 2, 2026",
  },
  {
    id: "pin-museum",
    kind: "museum",
    label: "Pérez Art Museum",
    category: "Museum",
    distanceLabel: "0.8 mi",
    lng: -80.1820,
    lat: 25.7730,
    color: "yellow",
    authorId: "sophie",
    authorName: "Sophie",
    authorAvatar: "/avatars/sophie.png",
    createdAtLabel: "May 30, 2026",
  },
  {
    id: "pin-note",
    kind: "note",
    label: "Miami Hub Note",
    category: "Note",
    distanceLabel: "0.2 mi",
    lng: -80.1945,
    lat: 25.7752,
    color: "pink",
    authorId: "you",
    authorName: "You",
    authorAvatar: "/avatars/you.png",
    createdAtLabel: "Jun 6, 2026",
    noteText: "Great spot for meetups — shaded tables and strong Wi-Fi near the water.",
  },
  {
    id: "pin-pin",
    kind: "pin",
    label: "Meeting Point",
    category: "Pin",
    distanceLabel: "0.4 mi",
    lng: -80.1862,
    lat: 25.7725,
    color: "blue",
    authorId: "you",
    authorName: "You",
    authorAvatar: "/avatars/you.png",
    createdAtLabel: "Jun 4, 2026",
  },
]

export const recommendations: Recommendation[] = [
  {
    id: "arvo",
    pinId: "pin-reco-arvo",
    placeName: "ARVO Café",
    category: "Café",
    distanceLabel: "0.3 mi",
    recommendedBy: ["/avatars/sophie.png", "/avatars/maya.png", "/avatars/jake.png", "/avatars/leo.png", "/avatars/nina.png"],
    thumbnail: "/places/arvo-cafe.png",
  },
]

export const activity: ActivityItem[] = [
  {
    id: "a1",
    type: "huddle_started",
    section: "now",
    actor: "Sunset Run Club",
    actorAvatars: ["/avatars/maya.png", "/avatars/jake.png", "/avatars/sophie.png"],
    title: "Sunset Run Club started",
    context: "12 people · Bayfront Trail",
    activityAt: "Started 9:30 AM · 0.5 mi",
    badgeColor: "blue",
    actionLabel: "Join",
  },
  {
    id: "a4",
    type: "ping",
    section: "now",
    actor: "Sophie",
    actorAvatars: ["/avatars/sophie.png"],
    title: "Sophie pinged you",
    context: "Bayfront Park · 1.1 mi away",
    activityAt: "2:30 PM",
    badgeColor: "pink",
    actionLabel: "Join",
  },
  {
    id: "a3",
    type: "friend_joined",
    section: "coming_up",
    actor: "Jake",
    actorAvatars: ["/avatars/jake.png"],
    title: "Jake joined Art Walk",
    context: "Today 6 PM · Wynwood",
    activityAt: "Joined 1:45 PM",
    badgeColor: "orange",
  },
  {
    id: "a5",
    type: "recommendation",
    section: "coming_up",
    actor: "Leo + Nina",
    actorAvatars: ["/avatars/leo.png", "/avatars/nina.png"],
    title: "Leo + Nina saved Rooftop Cinema",
    context: "Tonight 8:30 PM · Event",
    activityAt: "Saved 3:20 PM",
    badgeColor: "pink",
  },
  {
    id: "a2",
    type: "place_saved",
    section: "recent",
    actor: "Maya",
    actorAvatars: ["/avatars/maya.png"],
    title: "Maya saved ARVO Café",
    context: "Café · 0.3 mi away",
    activityAt: "11:15 AM",
    badgeColor: "green",
  },
]

export const yourPicks: SavedPlace[] = [
  { id: "arvo", pinId: "pin-cafe", name: "ARVO Café", category: "Café", distanceLabel: "0.3 mi", thumbnail: "/places/arvo-cafe.png", badge: "star" },
  { id: "rooftop", pinId: "pin-shop", name: "Rooftop Cinema", category: "Event", distanceLabel: "1.2 mi", thumbnail: "/places/rooftop-cinema.png", badge: "heart" },
  { id: "camino", pinId: "pin-food", name: "El Camino", category: "Tacos", distanceLabel: "0.6 mi", thumbnail: "/places/el-camino.png", badge: "food" },
]

export const friendsRecs = [
  {
    id: "havana",
    by: "Maya",
    byAvatar: "/avatars/maya.png",
    name: "Little Havana Bakery",
    category: "Bakery",
    distanceLabel: "1.0 mi",
  },
]

export type LayerKey = "friends" | "huddles" | "recs" | "saved" | "warmth"

export const layers: { key: LayerKey; label: string; color: string }[] = [
  { key: "huddles", label: "Huddles", color: brandColor("red") },
  { key: "friends", label: "Friends", color: brandColor("green") },
  { key: "recs", label: "Recs", color: brandColor("yellow") },
  { key: "saved", label: "Saved", color: brandColor("blue") },
]
