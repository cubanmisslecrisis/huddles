// Plain view-models the UI renders. Derived from live SpacetimeDB tables.

export type FriendVM = {
  key: string
  name: string
  online: boolean
  lastSeenMicros: bigint
  distanceMeters: number | null
  lat: number
  lng: number
}

export type HuddleVM = {
  id: string
  status: string
  memberCount: number
  warmth: number
  lat: number
  lng: number
  memberNames: string[]
  memberKeys: string[]
  includesMe: boolean
  distanceMeters: number | null
}

export type EventVM = {
  id: string
  type: string
  message: string
  micros: bigint
}

export type ScoreVM = {
  key: string
  name: string
  warmthPoints: number
  huddlesJoined: number
  isMe: boolean
}

export type MeVM = {
  key: string
  name: string
  roomName: string
  roomCode: string
  warmthPoints: number
  huddlesJoined: number
}

export type HeatPoint = {
  lat: number
  lng: number
  weight: number
}

export type MapAvatar = {
  key: string
  lat: number
  lng: number
  name: string
  count: number
  isMe: boolean
  merged: boolean
  heat: number
  memberKeys: string[]
  selection: { kind: "friend" | "huddle"; id: string }
}

export type SavedPlaceVM = {
  id: string
  placeName: string
  note: string | null
  lat: number
  lng: number
  savedAtMicros: bigint
}
