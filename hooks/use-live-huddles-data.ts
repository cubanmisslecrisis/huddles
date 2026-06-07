"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { tables, reducers } from "@/lib/module_bindings"
import { useSpacetimeDB, useTable, useReducer } from "spacetimedb/react"
import { distanceMeters } from "@/lib/avatar"
import type {
  FriendVM,
  HuddleVM,
  EventVM,
  ScoreVM,
  MeVM,
  HeatPoint,
  MapAvatar,
  SavedPlaceVM,
} from "@/lib/view"

function demoLoc(): { lat: number; lng: number } {
  return {
    lat: 40.7484 + (Math.random() - 0.5) * 0.004,
    lng: -73.9857 + (Math.random() - 0.5) * 0.004,
  }
}

export type GeoStatus = "idle" | "locating" | "live" | "demo"

export function useLiveHuddlesData() {
  const { identity, isActive: connected } = useSpacetimeDB()
  const myHex = identity?.toHexString()

  const [users] = useTable(tables.user)
  const [rooms] = useTable(tables.room)
  const [presence] = useTable(tables.presence)
  const [huddles] = useTable(tables.huddle)
  const [members] = useTable(tables.huddleMember)
  const [heatCells] = useTable(tables.heatCell)
  const [scores] = useTable(tables.score)
  const [events] = useTable(tables.event)
  const [savedPlacesRaw] = useTable(tables.savedPlace)

  const joinRoom = useReducer(reducers.joinRoom)
  const heartbeatLocation = useReducer(reducers.heartbeatLocation)
  const leaveRoom = useReducer(reducers.leaveRoom)
  const pingNearby = useReducer(reducers.pingNearby)

  const [nameInput, setNameInput] = useState("")
  const [roomInput, setRoomInput] = useState("demo")
  const [geo, setGeo] = useState<GeoStatus>("idle")
  const [myLoc, setMyLoc] = useState<{ lat: number; lng: number } | null>(null)

  const nameByHex = useMemo(() => {
    const m = new Map<string, string>()
    for (const u of users) m.set(u.identity.toHexString(), u.name)
    return m
  }, [users])

  const myPresence = useMemo(
    () => presence.find((p) => p.identity.toHexString() === myHex),
    [presence, myHex]
  )
  const joined = !!myPresence && myPresence.status !== "offline"
  const myRoomId = myPresence?.roomId
  const myRoom = useMemo(
    () => rooms.find((r) => myRoomId !== undefined && r.id === myRoomId),
    [rooms, myRoomId]
  )

  const beatRef = useRef(heartbeatLocation)
  beatRef.current = heartbeatLocation
  const lastFixRef = useRef<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    if (!joined) return

    const beat = () => {
      const f = lastFixRef.current
      if (f) beatRef.current({ lat: f.lat, lng: f.lng }).catch(console.error)
    }
    const apply = (lat: number, lng: number, live: boolean) => {
      const first = lastFixRef.current === null
      lastFixRef.current = { lat, lng }
      setMyLoc({ lat, lng })
      setGeo(live ? "live" : "demo")
      if (first) beat()
    }

    let watchId: number | null = null
    if (!navigator.geolocation) {
      const d = demoLoc()
      apply(d.lat, d.lng, false)
    } else {
      setGeo("locating")
      watchId = navigator.geolocation.watchPosition(
        (pos) => apply(pos.coords.latitude, pos.coords.longitude, true),
        () => {
          const d = demoLoc()
          apply(d.lat, d.lng, false)
        },
        { enableHighAccuracy: true, maximumAge: 4000, timeout: 10000 }
      )
    }

    const interval = setInterval(beat, 3000)
    return () => {
      clearInterval(interval)
      if (watchId !== null) navigator.geolocation.clearWatch(watchId)
    }
  }, [joined])

  const membersByHuddle = useMemo(() => {
    const m = new Map<string, string[]>()
    for (const mem of members) {
      if (mem.leftAt != null) continue
      const k = mem.huddleId.toString()
      const list = m.get(k) ?? []
      list.push(mem.identity.toHexString())
      m.set(k, list)
    }
    return m
  }, [members])

  const avatars = useMemo<MapAvatar[]>(() => {
    if (myRoomId === undefined) return []
    const out: MapAvatar[] = []
    const mergedHexes = new Set<string>()

    for (const h of huddles) {
      if (h.roomId !== myRoomId || h.status === "ended") continue
      const hexes = membersByHuddle.get(h.id.toString()) ?? []
      if (hexes.length < 2) continue
      hexes.forEach((x) => mergedHexes.add(x))
      out.push({
        key: "h" + h.id.toString(),
        lat: h.lat,
        lng: h.lng,
        name: nameByHex.get(hexes[0]) ?? "Someone",
        count: hexes.length,
        isMe: myHex ? hexes.includes(myHex) : false,
        merged: true,
        heat: h.warmth,
        memberKeys: hexes,
        selection: { kind: "huddle", id: h.id.toString() },
      })
    }

    for (const p of presence) {
      if (p.roomId !== myRoomId || p.status !== "active" || !p.hasFix) continue
      const hex = p.identity.toHexString()
      if (mergedHexes.has(hex)) continue
      out.push({
        key: hex,
        lat: p.lat,
        lng: p.lng,
        name: nameByHex.get(hex) ?? "Someone",
        count: 1,
        isMe: hex === myHex,
        merged: false,
        heat: 0,
        memberKeys: [],
        selection: { kind: "friend", id: hex },
      })
    }
    return out
  }, [huddles, presence, membersByHuddle, myRoomId, nameByHex, myHex])

  const heat = useMemo<HeatPoint[]>(
    () =>
      heatCells
        .filter((c) => myRoomId !== undefined && c.roomId === myRoomId)
        .map((c) => ({ lat: c.lat, lng: c.lng, weight: c.weight })),
    [heatCells, myRoomId]
  )

  const friends = useMemo<FriendVM[]>(() => {
    if (myRoomId === undefined) return []
    return presence
      .filter(
        (p) =>
          p.roomId === myRoomId &&
          p.identity.toHexString() !== myHex &&
          p.status !== "offline"
      )
      .map((p) => ({
        key: p.identity.toHexString(),
        name: nameByHex.get(p.identity.toHexString()) ?? "Someone",
        online: p.status === "active",
        lastSeenMicros: p.lastSeen.microsSinceUnixEpoch,
        distanceMeters:
          myLoc && p.hasFix ? distanceMeters(myLoc.lat, myLoc.lng, p.lat, p.lng) : null,
        lat: p.lat,
        lng: p.lng,
      }))
  }, [presence, myRoomId, myHex, nameByHex, myLoc])

  const huddleList = useMemo<HuddleVM[]>(() => {
    if (myRoomId === undefined) return []
    return huddles
      .filter((h) => h.roomId === myRoomId && h.status !== "ended")
      .map((h) => {
        const hexes = membersByHuddle.get(h.id.toString()) ?? []
        return {
          id: h.id.toString(),
          status: h.status,
          memberCount: hexes.length || h.memberCount,
          warmth: h.warmth,
          lat: h.lat,
          lng: h.lng,
          memberNames: hexes.map((x) => nameByHex.get(x) ?? "Someone"),
          memberKeys: hexes,
          includesMe: myHex ? hexes.includes(myHex) : false,
          distanceMeters: myLoc ? distanceMeters(myLoc.lat, myLoc.lng, h.lat, h.lng) : null,
        }
      })
      .sort((a, b) => b.warmth - a.warmth)
  }, [huddles, membersByHuddle, myRoomId, nameByHex, myHex, myLoc])

  const activityFeed = useMemo<EventVM[]>(() => {
    if (myRoomId === undefined) return []
    return events
      .filter((e) => e.roomId === myRoomId)
      .sort((a, b) =>
        a.createdAt.microsSinceUnixEpoch < b.createdAt.microsSinceUnixEpoch ? 1 : -1
      )
      .slice(0, 60)
      .map((e) => ({
        id: e.id.toString(),
        type: e.type,
        message: e.message,
        micros: e.createdAt.microsSinceUnixEpoch,
      }))
  }, [events, myRoomId])

  const board = useMemo<ScoreVM[]>(() => {
    if (myRoomId === undefined) return []
    return scores
      .filter((s) => s.roomId === myRoomId)
      .sort((a, b) => b.warmthPoints - a.warmthPoints)
      .map((s) => ({
        key: s.identity.toHexString(),
        name: nameByHex.get(s.identity.toHexString()) ?? "Someone",
        warmthPoints: s.warmthPoints,
        huddlesJoined: s.huddlesJoined,
        isMe: s.identity.toHexString() === myHex,
      }))
  }, [scores, myRoomId, nameByHex, myHex])

  const myScore = useMemo(() => board.find((s) => s.isMe), [board])

  const savedPlaces = useMemo<SavedPlaceVM[]>(() => {
    if (myRoomId === undefined) return []
    return savedPlacesRaw
      .filter((s) => s.roomId === myRoomId)
      .map((s) => ({
        id: s.id.toString(),
        placeName: s.placeName,
        note: s.note ?? null,
        lat: s.lat,
        lng: s.lng,
        savedAtMicros: s.createdAt.microsSinceUnixEpoch,
      }))
      .sort((a, b) => (a.savedAtMicros < b.savedAtMicros ? 1 : -1))
  }, [savedPlacesRaw, myRoomId])

  const nearbyCount = friends.filter((f) => f.online).length
  const formingCount = huddleList.filter((h) => h.status === "candidate").length
  const activeHuddles = huddleList.filter((h) => h.status === "active").length

  const me = useMemo<MeVM>(
    () => ({
      key: myHex ?? "",
      name: (myHex && nameByHex.get(myHex)) || nameInput || "You",
      roomName: myRoom?.name ?? "Huddle",
      roomCode: myRoom?.code ?? "",
      warmthPoints: myScore?.warmthPoints ?? 0,
      huddlesJoined: myScore?.huddlesJoined ?? 0,
    }),
    [myHex, nameByHex, nameInput, myRoom, myScore]
  )

  const roomPresenceHexes = useMemo(
    () =>
      new Set(
        presence
          .filter((p) => p.roomId === myRoomId && p.status !== "offline")
          .map((p) => p.identity.toHexString())
      ),
    [presence, myRoomId]
  )

  const sortedKeys = useMemo(
    () =>
      [...users.map((u) => u.identity.toHexString()).filter((h) => roomPresenceHexes.has(h))].sort(),
    [users, roomPresenceHexes]
  )

  useEffect(() => {
    if (!nameInput && myHex && nameByHex.has(myHex)) setNameInput(nameByHex.get(myHex)!)
  }, [myHex, nameByHex, nameInput])

  return {
    connected: connected && !!identity,
    joined,
    identity,
    myHex,
    nameInput,
    setNameInput,
    roomInput,
    setRoomInput,
    geo,
    myLoc,
    avatars,
    heat,
    friends,
    huddleList,
    activityFeed,
    board,
    me,
    savedPlaces,
    nearbyCount,
    formingCount,
    activeHuddles,
    sortedKeys,
    presence,
    huddles,
    joinRoom,
    leaveRoom,
    pingNearby,
  }
}
