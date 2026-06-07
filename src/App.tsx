import { useEffect, useMemo, useRef, useState } from 'react';
import { tables, reducers } from './module_bindings';
import { useSpacetimeDB, useTable, useReducer } from 'spacetimedb/react';
import { MobileShell } from '@/components/shell/MobileShell';
import { PingSheet } from '@/components/flows/PingSheet';
import { SearchModal } from '@/components/flows/SearchModal';
import { AddToMapSheet } from '@/components/flows/AddToMapSheet';
import { ProfileSettings } from '@/components/flows/ProfileSettings';
import { HuddlesLogo } from '@/components/HuddlesLogo';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { MapControls } from '@/components/map/MapCanvas';
import type { MapAvatar, HeatPoint, Selection } from '@/components/map/markers';
import type { FriendVM, HuddleVM, EventVM, MeVM } from '@/lib/view';
import type { Lens } from '@/lib/nav-tabs';
import type { SheetState } from '@/components/panels/BottomSheet';
import { filterToLayers, getPin, type FilterKey, type LayerKey } from '@/lib/places-data';
import { distanceMeters } from '@/lib/avatar';

// Demo fallback (~Midtown NYC) with small jitter, used when geolocation is denied.
function demoLoc(): { lat: number; lng: number } {
  return {
    lat: 40.7484 + (Math.random() - 0.5) * 0.004,
    lng: -73.9857 + (Math.random() - 0.5) * 0.004,
  };
}

const DEFAULT_LAYERS: Record<LayerKey, boolean> = {
  friends: true,
  huddles: true,
  recs: true,
  saved: true,
  warmth: true,
};

function App() {
  const { identity, isActive: connected } = useSpacetimeDB();
  const myHex = identity?.toHexString();

  const [users] = useTable(tables.user);
  const [rooms] = useTable(tables.room);
  const [presence] = useTable(tables.presence);
  const [huddles] = useTable(tables.huddle);
  const [members] = useTable(tables.huddleMember);
  const [heatCells] = useTable(tables.heatCell);
  const [scores] = useTable(tables.score);
  const [events] = useTable(tables.event);

  const joinRoom = useReducer(reducers.joinRoom);
  const heartbeatLocation = useReducer(reducers.heartbeatLocation);
  const leaveRoom = useReducer(reducers.leaveRoom);
  const pingNearby = useReducer(reducers.pingNearby);

  const [nameInput, setNameInput] = useState('');
  const [roomInput, setRoomInput] = useState('demo');
  const [geo, setGeo] = useState<'idle' | 'locating' | 'live' | 'demo'>('idle');
  const [myLoc, setMyLoc] = useState<{ lat: number; lng: number } | null>(null);

  // UI state (ported from the skeleton's HuddlesApp).
  const [lens, setLens] = useState<Lens>('map');
  const [selection, setSelection] = useState<Selection>(null);
  const [sheetState, setSheetState] = useState<SheetState>('peek');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [activeLayers, setActiveLayers] = useState<Record<LayerKey, boolean>>(DEFAULT_LAYERS);
  const [showAdd, setShowAdd] = useState(false);
  const [showPing, setShowPing] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const mapControls = useRef<MapControls | null>(null);

  const nameByHex = useMemo(() => {
    const m = new Map<string, string>();
    for (const u of users) m.set(u.identity.toHexString(), u.name);
    return m;
  }, [users]);

  const myPresence = useMemo(
    () => presence.find((p) => p.identity.toHexString() === myHex),
    [presence, myHex]
  );
  const joined = !!myPresence && myPresence.status !== 'offline';
  const myRoomId = myPresence?.roomId;
  const myRoom = useMemo(
    () => rooms.find((r) => myRoomId !== undefined && r.id === myRoomId),
    [rooms, myRoomId]
  );

  // ── Live location stream (unchanged from the original client) ───────────────
  const beatRef = useRef(heartbeatLocation);
  beatRef.current = heartbeatLocation;
  const lastFixRef = useRef<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!joined) return;

    const beat = () => {
      const f = lastFixRef.current;
      if (f) beatRef.current({ lat: f.lat, lng: f.lng }).catch(console.error);
    };
    const apply = (lat: number, lng: number, live: boolean) => {
      const first = lastFixRef.current === null;
      lastFixRef.current = { lat, lng };
      setMyLoc({ lat, lng });
      setGeo(live ? 'live' : 'demo');
      if (first) beat();
    };

    let watchId: number | null = null;
    if (!navigator.geolocation) {
      const d = demoLoc();
      apply(d.lat, d.lng, false);
    } else {
      setGeo('locating');
      watchId = navigator.geolocation.watchPosition(
        (pos) => apply(pos.coords.latitude, pos.coords.longitude, true),
        () => {
          const d = demoLoc();
          apply(d.lat, d.lng, false);
        },
        { enableHighAccuracy: true, maximumAge: 4000, timeout: 10000 }
      );
    }

    const interval = setInterval(beat, 3000);
    return () => {
      clearInterval(interval);
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  }, [joined]);

  // ── Derived live view-models ────────────────────────────────────────────────

  // Active (not-left) members per huddle → identity hexes.
  const membersByHuddle = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const mem of members) {
      if (mem.leftAt != null) continue;
      const k = mem.huddleId.toString();
      const list = m.get(k) ?? [];
      list.push(mem.identity.toHexString());
      m.set(k, list);
    }
    return m;
  }, [members]);

  // Map avatars: merged huddle clusters (2+ active members) + solo people.
  const avatars = useMemo<MapAvatar[]>(() => {
    if (myRoomId === undefined) return [];
    const out: MapAvatar[] = [];
    const mergedHexes = new Set<string>();

    for (const h of huddles) {
      if (h.roomId !== myRoomId || h.status === 'ended') continue;
      const hexes = membersByHuddle.get(h.id.toString()) ?? [];
      if (hexes.length < 2) continue;
      hexes.forEach((x) => mergedHexes.add(x));
      out.push({
        key: 'h' + h.id.toString(),
        lat: h.lat,
        lng: h.lng,
        name: nameByHex.get(hexes[0]) ?? 'Someone',
        count: hexes.length,
        isMe: myHex ? hexes.includes(myHex) : false,
        merged: true,
        heat: h.warmth,
        selection: { kind: 'huddle', id: h.id.toString() },
      });
    }

    for (const p of presence) {
      if (p.roomId !== myRoomId || p.status !== 'active' || !p.hasFix) continue;
      const hex = p.identity.toHexString();
      if (mergedHexes.has(hex)) continue;
      out.push({
        key: hex,
        lat: p.lat,
        lng: p.lng,
        name: nameByHex.get(hex) ?? 'Someone',
        count: 1,
        isMe: hex === myHex,
        merged: false,
        heat: 0,
        selection: { kind: 'friend', id: hex },
      });
    }
    return out;
  }, [huddles, presence, membersByHuddle, myRoomId, nameByHex, myHex]);

  const heat = useMemo<HeatPoint[]>(
    () =>
      heatCells
        .filter((c) => myRoomId !== undefined && c.roomId === myRoomId)
        .map((c) => ({ lat: c.lat, lng: c.lng, weight: c.weight })),
    [heatCells, myRoomId]
  );

  const friends = useMemo<FriendVM[]>(() => {
    if (myRoomId === undefined) return [];
    return presence
      .filter((p) => p.roomId === myRoomId && p.identity.toHexString() !== myHex && p.status !== 'offline')
      .map((p) => ({
        key: p.identity.toHexString(),
        name: nameByHex.get(p.identity.toHexString()) ?? 'Someone',
        online: p.status === 'active',
        lastSeenMicros: p.lastSeen.microsSinceUnixEpoch,
        distanceMeters:
          myLoc && p.hasFix ? distanceMeters(myLoc.lat, myLoc.lng, p.lat, p.lng) : null,
      }));
  }, [presence, myRoomId, myHex, nameByHex, myLoc]);

  const huddleList = useMemo<HuddleVM[]>(() => {
    if (myRoomId === undefined) return [];
    return huddles
      .filter((h) => h.roomId === myRoomId && h.status !== 'ended')
      .map((h) => {
        const hexes = membersByHuddle.get(h.id.toString()) ?? [];
        return {
          id: h.id.toString(),
          status: h.status,
          memberCount: hexes.length || h.memberCount,
          warmth: h.warmth,
          lat: h.lat,
          lng: h.lng,
          memberNames: hexes.map((x) => nameByHex.get(x) ?? 'Someone'),
          includesMe: myHex ? hexes.includes(myHex) : false,
          distanceMeters: myLoc ? distanceMeters(myLoc.lat, myLoc.lng, h.lat, h.lng) : null,
        };
      })
      .sort((a, b) => b.warmth - a.warmth);
  }, [huddles, membersByHuddle, myRoomId, nameByHex, myHex, myLoc]);

  const activityFeed = useMemo<EventVM[]>(() => {
    if (myRoomId === undefined) return [];
    return events
      .filter((e) => e.roomId === myRoomId)
      .sort((a, b) => (a.createdAt.microsSinceUnixEpoch < b.createdAt.microsSinceUnixEpoch ? 1 : -1))
      .slice(0, 60)
      .map((e) => ({
        id: e.id.toString(),
        type: e.type,
        message: e.message,
        micros: e.createdAt.microsSinceUnixEpoch,
      }));
  }, [events, myRoomId]);

  const board = useMemo<ScoreVM[]>(() => {
    if (myRoomId === undefined) return [];
    return scores
      .filter((s) => s.roomId === myRoomId)
      .sort((a, b) => b.warmthPoints - a.warmthPoints)
      .map((s) => ({
        key: s.identity.toHexString(),
        name: nameByHex.get(s.identity.toHexString()) ?? 'Someone',
        warmthPoints: s.warmthPoints,
        huddlesJoined: s.huddlesJoined,
        isMe: s.identity.toHexString() === myHex,
      }));
  }, [scores, myRoomId, nameByHex, myHex]);

  const myScore = useMemo(() => board.find((s) => s.isMe), [board]);

  const nearbyCount = friends.filter((f) => f.online).length;
  const formingCount = huddleList.filter((h) => h.status === 'candidate').length;
  const activeHuddles = huddleList.filter((h) => h.status === 'active').length;

  const me = useMemo<MeVM>(
    () => ({
      key: myHex ?? '',
      name: (myHex && nameByHex.get(myHex)) || nameInput || 'You',
      roomName: myRoom?.name ?? 'Huddle',
      roomCode: myRoom?.code ?? '',
      warmthPoints: myScore?.warmthPoints ?? 0,
      huddlesJoined: myScore?.huddlesJoined ?? 0,
    }),
    [myHex, nameByHex, nameInput, myRoom, myScore]
  );

  useEffect(() => {
    if (!nameInput && myHex && nameByHex.has(myHex)) setNameInput(nameByHex.get(myHex)!);
  }, [myHex, nameByHex, nameInput]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const onSelect = (s: Selection) => {
    setSelection(s);
    if (s) setSheetState('half');
  };

  const flyToSelection = (s: Exclude<Selection, null>) => {
    if (s.kind === 'friend') {
      const p = presence.find((x) => x.identity.toHexString() === s.id);
      if (p && p.hasFix) mapControls.current?.flyTo(p.lat, p.lng);
    } else if (s.kind === 'huddle') {
      const h = huddles.find((x) => x.id.toString() === s.id);
      if (h) mapControls.current?.flyTo(h.lat, h.lng);
    } else if (s.kind === 'pin' && myLoc) {
      const pin = getPin(s.id);
      if (pin) mapControls.current?.flyTo(myLoc.lat + pin.dLat, myLoc.lng + pin.dLng);
    }
  };

  const onPick = (s: Exclude<Selection, null>) => {
    setSelection(s);
    setSheetState('half');
    flyToSelection(s);
  };

  const onFilter = (k: FilterKey) => {
    setFilter(k);
    setActiveLayers((prev) => ({ ...filterToLayers[k], warmth: prev.warmth }));
  };

  const onChangeLens = (l: Lens) => {
    setLens(l);
    setSelection(null);
    setSheetState(l === 'map' ? 'peek' : 'half');
  };

  const onPing = () => {
    pingNearby().catch(console.error);
  };

  // ── Connecting ──────────────────────────────────────────────────────────────
  if (!connected || !identity) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-4 bg-background px-6">
        <HuddlesLogo />
        <p className="text-sm text-muted-foreground">Connecting…</p>
      </div>
    );
  }

  // ── Join ──────────────────────────────────────────────────────────────────────
  if (!joined) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-6 bg-background px-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <HuddlesLogo />
          <p className="max-w-xs text-sm text-muted-foreground">
            Share your location. Gather nearby. Make warmth.
          </p>
        </div>
        <form
          className="flex w-full max-w-xs flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            const name = nameInput.trim();
            const roomCode = roomInput.trim() || 'demo';
            if (!name) return;
            joinRoom({ name, roomCode }).catch(console.error);
          }}
        >
          <Input
            autoFocus
            placeholder="your name"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            className="h-12 rounded-2xl"
          />
          <Input
            placeholder="room code"
            value={roomInput}
            onChange={(e) => setRoomInput(e.target.value)}
            className="h-12 rounded-2xl"
          />
          <Button type="submit" variant="brand" size="lg" className="h-12 text-base font-bold">
            Get Started
          </Button>
        </form>
        <p className="text-xs text-muted-foreground">
          {geo === 'locating' ? 'Getting your location…' : 'We only use your location while you’re in a room.'}
        </p>
      </div>
    );
  }

  // ── Joined: the mobile social map ───────────────────────────────────────────
  return (
    <>
      <MobileShell
        lens={lens}
        onChangeLens={onChangeLens}
        selection={selection}
        onSelect={onSelect}
        sheetState={sheetState}
        onSheetStateChange={setSheetState}
        activeLayers={activeLayers}
        filter={filter}
        onFilter={onFilter}
        onSearch={() => setShowSearch(true)}
        onAdd={() => setShowAdd(true)}
        onPing={() => setShowPing(true)}
        onOpenProfile={() => setShowProfile(true)}
        controlsRef={mapControls}
        me={me}
        avatars={avatars}
        heat={heat}
        myLoc={myLoc}
        friends={friends}
        huddles={huddleList}
        events={activityFeed}
        nearbyCount={nearbyCount}
        formingCount={formingCount}
        activeHuddles={activeHuddles}
        friendsOut={nearbyCount}
      />

      <PingSheet open={showPing} onOpenChange={setShowPing} friends={friends} onPing={onPing} />
      <SearchModal open={showSearch} onOpenChange={setShowSearch} friends={friends} huddles={huddleList} onPick={onPick} />
      <AddToMapSheet open={showAdd} onOpenChange={setShowAdd} />
      <ProfileSettings
        open={showProfile}
        onOpenChange={setShowProfile}
        me={me}
        onLeave={() => leaveRoom().catch(console.error)}
      />
    </>
  );
}

export default App;
