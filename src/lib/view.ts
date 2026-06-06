// Plain view-models the UI renders. App derives these from the live SpacetimeDB
// tables so panels never touch SpacetimeDB types directly.

export type FriendVM = {
  key: string; // identity hex (stable color key + selection id)
  name: string;
  online: boolean; // presence.status === 'active'
  lastSeenMicros: bigint;
  distanceMeters: number | null; // from my fix, if both have one
};

export type HuddleVM = {
  id: string; // huddle id as string (selection id)
  status: string; // candidate | active | cooling
  memberCount: number;
  warmth: number;
  lat: number;
  lng: number;
  memberNames: string[];
  includesMe: boolean;
  distanceMeters: number | null;
};

export type EventVM = {
  id: string;
  type: string;
  message: string;
  micros: bigint;
};

export type ScoreVM = {
  key: string; // identity hex
  name: string;
  warmthPoints: number;
  huddlesJoined: number;
  isMe: boolean;
};

export type MeVM = {
  key: string; // identity hex
  name: string;
  roomName: string;
  roomCode: string;
  warmthPoints: number;
  huddlesJoined: number;
};
