import { useEffect, useMemo, useRef, useState } from 'react';
import './App.css';
import { tables, reducers } from './module_bindings';
import { useSpacetimeDB, useTable, useReducer } from 'spacetimedb/react';
import LiveMap, { type UserMarker, type HuddleMarker } from './LiveMap';

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
  const [scores] = useTable(tables.score);

  const joinRoom = useReducer(reducers.joinRoom);
  const heartbeatLocation = useReducer(reducers.heartbeatLocation);
  const leaveRoom = useReducer(reducers.leaveRoom);

  const [nameInput, setNameInput] = useState('');
  const [roomInput, setRoomInput] = useState('demo');
  const [geo, setGeo] = useState<'idle' | 'locating' | 'live' | 'demo'>('idle');
  const [myLoc, setMyLoc] = useState<[number, number] | null>(null);
  const [tab, setTab] = useState<'home' | 'friends' | 'profile' | 'leaderboard'>('home');

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

  const board = useMemo(
    () =>
      scores
        .filter((s) => myRoomId !== undefined && s.roomId === myRoomId)
        .sort((a, b) => b.warmthPoints - a.warmthPoints),
    [scores, myRoomId]
  );

  const myScore = useMemo(() => board.find((s) => s.identity.toHexString() === myHex), [board, myHex]);

  useEffect(() => {
    if (!nameInput && myHex && nameByHex.has(myHex)) setNameInput(nameByHex.get(myHex)!);
  }, [myHex, nameByHex, nameInput]);

  // ── Connecting ──
  if (!connected || !identity) {
    return (
      <div className="screen center">
        <div className="logo big float">🧊</div>
        <p className="muted">Connecting…</p>
      </div>
    );
  }

  // ── Join ──
  if (!joined) {
    return (
      <div className="screen center onboarding">
        <div className="logo big float">🧊</div>
        <h1 className="title">Huddle</h1>
        <p className="muted">Share your location. Gather nearby. Make warmth.</p>
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
            Get Started
          </button>
        </form>
      </div>
    );
  }

  const nearbyCount = userMarkers.filter((u) => !u.isMe).length;
  const otherUsers = users.filter((u) => u.identity.toHexString() !== myHex);

  return (
    <div className="screen lobby">
      <header className="lobby-head">
        <div className="me">
          <div style={{ width: 36, height: 36, borderRadius: '35%', background: 'linear-gradient(135deg, #E8F4FF, #F0F8FF)', border: '2px solid #6B8FFF', flex: 'none' }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, color: 'var(--text)', margin: 0, fontSize: '0.95rem' }}>{nameInput}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>{myRoom?.name ?? 'Huddle'}</div>
          </div>
        </div>
        <button className="ghost" onClick={() => leaveRoom().catch(console.error)}>
          Leave
        </button>
      </header>

      <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', paddingBottom: '80px' }}>

      {tab === 'home' ? (
        <>
          <div style={{ padding: '16px', background: 'var(--card-bg)', borderRadius: '20px', margin: '16px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
              {geo === 'live' && '🟢 Sharing live location'}
              {geo === 'demo' && '📡 Demo location'}
              {geo === 'locating' && '📍 Getting location…'}
            </div>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text)' }}>
              {nearbyCount} {nearbyCount === 1 ? 'person' : 'people'} nearby
            </div>
          </div>

          <div style={{ flex: 1, minHeight: 0, marginX: '16px', marginBottom: '16px' }}>
            <LiveMap users={userMarkers} huddles={huddleMarkers} myLoc={myLoc} />
          </div>
        </>
      ) : tab === 'friends' ? (
        <div style={{ gap: '12px', display: 'flex', flexDirection: 'column', padding: '16px' }}>
          <div style={{ background: 'var(--card-bg)', borderRadius: '20px', padding: '16px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)' }}>
            <h2 style={{ margin: '0 0 12px', fontSize: '1.1rem', color: 'var(--text)' }}>Friends</h2>
            {otherUsers.length === 0 ? (
              <p className="muted">No friends in this room yet</p>
            ) : (
              <div className="list">
                {otherUsers.map((u) => (
                  <div key={u.identity.toHexString()} className="card">
                    <div style={{ width: 36, height: 36, borderRadius: '35%', background: 'linear-gradient(135deg, #E8F4FF, #F0F8FF)', border: '2px solid #6B8FFF', flex: 'none' }} />
                    <div className="card-main">
                      <strong>{u.name}</strong>
                      <span className="muted small">Online now</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : tab === 'profile' ? (
        <div style={{ gap: '16px', display: 'flex', flexDirection: 'column', padding: '16px' }}>
          <div style={{ background: 'var(--card-bg)', borderRadius: '24px', padding: '24px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', textAlign: 'center' }}>
            <div style={{ width: 100, height: 100, borderRadius: '35%', background: 'linear-gradient(135deg, #E8F4FF, #F0F8FF)', border: '3px solid #6B8FFF', margin: '0 auto 16px' }} />
            <h2 style={{ margin: '0 0 4px', fontSize: '1.3rem', color: 'var(--text)' }}>{nameInput}</h2>
            <p className="muted">{myRoom?.code}</p>
          </div>

          <div style={{ background: 'var(--card-bg)', borderRadius: '20px', padding: '16px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '0.95rem', color: 'var(--text)', fontWeight: 700 }}>Stats</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ background: 'var(--bg)', borderRadius: '16px', padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--blue)', margin: 0 }}>{myScore?.warmthPoints ?? 0}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Warmth Points</div>
              </div>
              <div style={{ background: 'var(--bg)', borderRadius: '16px', padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--blue)', margin: 0 }}>{myScore?.huddlesJoined ?? 0}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Huddles</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ gap: '12px', display: 'flex', flexDirection: 'column', padding: '16px' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '1.1rem', color: 'var(--text)' }}>City Leaderboard</h2>
          <div className="list">
            {board.length === 0 && <p className="muted">No scores yet</p>}
            {board.map((s, i) => {
              const isMe = s.identity.toHexString() === myHex;
              return (
                <div key={s.id.toString()} className={'card' + (isMe ? ' rank' : '')}>
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
        </div>
      )}
      </div>

      <nav className="tabbar">
        <button className={'tab' + (tab === 'home' ? ' active' : '')} onClick={() => setTab('home')}>
          <div style={{ fontSize: '1.2rem' }}>🗺️</div>
          <div>Home</div>
        </button>
        <button className={'tab' + (tab === 'friends' ? ' active' : '')} onClick={() => setTab('friends')}>
          <div style={{ fontSize: '1.2rem' }}>👥</div>
          <div>Friends</div>
        </button>
        <button className={'tab' + (tab === 'profile' ? ' active' : '')} onClick={() => setTab('profile')}>
          <div style={{ fontSize: '1.2rem' }}>👤</div>
          <div>Profile</div>
        </button>
        <button className={'tab' + (tab === 'leaderboard' ? ' active' : '')} onClick={() => setTab('leaderboard')}>
          <div style={{ fontSize: '1.2rem' }}>⭐</div>
          <div>Rankings</div>
        </button>
      </nav>
    </div>
  );
}

export default App;
