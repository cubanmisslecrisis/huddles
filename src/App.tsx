import { useEffect, useMemo, useRef, useState } from 'react';
import './App.css';
import { tables, reducers } from './module_bindings';
import { useSpacetimeDB, useTable, useReducer } from 'spacetimedb/react';
import LiveMap, { type UserMarker, type HuddleMarker } from './LiveMap';

const EVENT_EMOJI: Record<string, string> = {
  user_joined: '👋',
  user_left: '🚪',
  ping: '📣',
  huddle_forming: '✨',
  huddle_activated: '🔥',
  huddle_warmed: '🌡️',
  huddle_cooling: '❄️',
  huddle_ended: '🏁',
};

// Demo fallback (~Midtown NYC) with small jitter, used when geolocation is denied.
function demoLoc(): { lat: number; lng: number } {
  return {
    lat: 40.7484 + (Math.random() - 0.5) * 0.004,
    lng: -73.9857 + (Math.random() - 0.5) * 0.004,
  };
}

function App() {
  const { identity, isActive: connected } = useSpacetimeDB();
  const myHex = identity?.toHexString();

  const [users] = useTable(tables.user);
  const [rooms] = useTable(tables.room);
  const [presence] = useTable(tables.presence);
  const [huddles] = useTable(tables.huddle);
  const [events] = useTable(tables.event);
  const [scores] = useTable(tables.score);

  const joinRoom = useReducer(reducers.joinRoom);
  const heartbeatLocation = useReducer(reducers.heartbeatLocation);
  const leaveRoom = useReducer(reducers.leaveRoom);
  const pingNearby = useReducer(reducers.pingNearby);

  const [nameInput, setNameInput] = useState('');
  const [roomInput, setRoomInput] = useState('demo');
  const [geo, setGeo] = useState<'idle' | 'locating' | 'live' | 'demo'>('idle');
  const [myLoc, setMyLoc] = useState<[number, number] | null>(null);

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

  // Keep a stable ref to the heartbeat reducer so the geolocation watch effect
  // doesn't tear down/recreate on every render.
  const beatRef = useRef(heartbeatLocation);
  beatRef.current = heartbeatLocation;

  // Stream live location once joined.
  useEffect(() => {
    if (!joined) return;
    let last = 0;
    const send = (lat: number, lng: number, live: boolean) => {
      setMyLoc([lat, lng]);
      setGeo(live ? 'live' : 'demo');
      const now = Date.now();
      if (now - last < 2000) return; // throttle to ~every 2s
      last = now;
      beatRef.current({ lat, lng }).catch(console.error);
    };

    if (!navigator.geolocation) {
      const d = demoLoc();
      send(d.lat, d.lng, false);
      return;
    }

    setGeo('locating');
    const id = navigator.geolocation.watchPosition(
      (pos) => send(pos.coords.latitude, pos.coords.longitude, true),
      () => {
        const d = demoLoc();
        send(d.lat, d.lng, false);
      },
      { enableHighAccuracy: true, maximumAge: 4000, timeout: 10000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [joined]);

  const userMarkers = useMemo<UserMarker[]>(
    () =>
      presence
        .filter(
          (p) =>
            myRoomId !== undefined &&
            p.roomId === myRoomId &&
            p.status === 'active' &&
            p.hasFix
        )
        .map((p) => ({
          hex: p.identity.toHexString(),
          name: nameByHex.get(p.identity.toHexString()) ?? 'Someone',
          lat: p.lat,
          lng: p.lng,
          isMe: p.identity.toHexString() === myHex,
        })),
    [presence, myRoomId, nameByHex, myHex]
  );

  const huddleMarkers = useMemo<HuddleMarker[]>(
    () =>
      huddles
        .filter((h) => myRoomId !== undefined && h.roomId === myRoomId && h.status !== 'ended')
        .map((h) => ({
          id: h.id.toString(),
          lat: h.lat,
          lng: h.lng,
          warmth: h.warmth,
          memberCount: h.memberCount,
          active: h.status === 'active',
        })),
    [huddles, myRoomId]
  );

  const feed = useMemo(
    () =>
      events
        .filter((e) => myRoomId !== undefined && e.roomId === myRoomId)
        .sort((a, b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime())
        .slice(0, 30),
    [events, myRoomId]
  );

  const board = useMemo(
    () =>
      scores
        .filter((s) => myRoomId !== undefined && s.roomId === myRoomId)
        .sort((a, b) => b.warmthPoints - a.warmthPoints),
    [scores, myRoomId]
  );

  useEffect(() => {
    if (!nameInput && myHex && nameByHex.has(myHex)) setNameInput(nameByHex.get(myHex)!);
  }, [myHex, nameByHex, nameInput]);

  // ── Connecting ──
  if (!connected || !identity) {
    return (
      <div className="screen center">
        <div className="logo big float">🔥</div>
        <p className="muted">Connecting…</p>
      </div>
    );
  }

  // ── Join ──
  if (!joined) {
    return (
      <div className="screen center onboarding">
        <div className="logo big float">🔥</div>
        <h1 className="title">Huddles</h1>
        <p className="muted">Share your location. Gather with people nearby. Make warmth.</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const name = nameInput.trim();
            const roomCode = roomInput.trim() || 'demo';
            if (!name) return;
            joinRoom({ name, roomCode }).catch(console.error);
          }}
        >
          <input
            autoFocus
            placeholder="your name"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
          />
          <input placeholder="room code" value={roomInput} onChange={(e) => setRoomInput(e.target.value)} />
          <button type="submit" className="primary big">
            Join
          </button>
        </form>
        <p className="muted small">We'll ask for your location after you join.</p>
      </div>
    );
  }

  const nearbyCount = userMarkers.filter((u) => !u.isMe).length;

  return (
    <div className="screen lobby">
      <header className="lobby-head">
        <div className="me">
          <span className="brand">🔥 Huddles</span>
          <span className="muted small">· {myRoom?.name ?? myRoom?.code ?? ''}</span>
        </div>
        <button className="ghost small" onClick={() => leaveRoom().catch(console.error)}>
          Leave
        </button>
      </header>

      <section className="status-panel">
        <div className="status-where">
          <span className="muted small">
            {geo === 'locating' && '📡 Getting your location…'}
            {geo === 'live' && '🟢 Sharing live location'}
            {geo === 'demo' && '🧪 Demo location (GPS unavailable)'}
            {geo === 'idle' && 'Starting…'}
          </span>
          <strong>{nearbyCount === 0 ? 'Nobody nearby yet' : `${nearbyCount} nearby`}</strong>
        </div>
        <button
          className="ghost small"
          disabled={!myLoc}
          onClick={() => pingNearby().catch(console.error)}
        >
          👋 Wave at people nearby
        </button>
      </section>

      <LiveMap users={userMarkers} huddles={huddleMarkers} myLoc={myLoc} />

      <section>
        <h2>🔥 Warmth points</h2>
        <div className="list">
          {board.length === 0 && <p className="muted">No points yet — huddle up to earn warmth.</p>}
          {board.map((s, i) => {
            const isMe = s.identity.toHexString() === myHex;
            return (
              <div key={s.id.toString()} className={'card board-row' + (isMe ? ' me-row' : '')}>
                <span className="rank-n">{i + 1}</span>
                <div className="card-main">
                  <strong>{nameByHex.get(s.identity.toHexString()) ?? 'Someone'}</strong>
                  <span className="muted small">{s.huddlesJoined} huddles</span>
                </div>
                <span className="warm-badge">{s.warmthPoints}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2>Live feed</h2>
        <div className="feed">
          {feed.length === 0 && <p className="muted">Nothing happening yet.</p>}
          {feed.map((e) => (
            <div key={e.id.toString()} className="feed-item">
              <span className="feed-emoji">{EVENT_EMOJI[e.type] ?? '•'}</span>
              <span className="feed-msg">{e.message}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default App;
