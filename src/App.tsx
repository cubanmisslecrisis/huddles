import { useEffect, useMemo, useRef, useState } from 'react';
import './App.css';
import { tables, reducers } from './module_bindings';
import { useSpacetimeDB, useTable, useReducer } from 'spacetimedb/react';
import { QRCodeSVG } from 'qrcode.react';
import HuddleMap from './HuddleMap';

const PALETTE = [
  '#7FD1FF', '#FFB3C7', '#FFE08A', '#B5E8A0',
  '#C9B6FF', '#FFC09A', '#9AE6D0', '#FF9AA2',
];

// Fallback location (~Midtown NYC) used when geolocation is denied/unavailable.
const DEFAULT_LOC = { lat: 40.7484, lng: -73.9857 };

function jitter(loc: { lat: number; lng: number }) {
  return {
    lat: loc.lat + (Math.random() - 0.5) * 0.01,
    lng: loc.lng + (Math.random() - 0.5) * 0.01,
  };
}

function getLocation(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(jitter(DEFAULT_LOC));
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(jitter(DEFAULT_LOC)),
      { timeout: 5000, maximumAge: 60000 }
    );
  });
}

function warmthLabel(w: number): string {
  if (w < 30) return 'Chilly';
  if (w < 120) return 'Cozy';
  if (w < 400) return 'Toasty';
  if (w < 1000) return 'Roasting';
  return 'Blazing';
}

// Asymptotic 0..100 fill so the meter keeps creeping up as warmth grows.
function warmthPct(w: number): number {
  return Math.round(100 * (1 - Math.exp(-w / 400)));
}

function Penguin({ color, name, size = 44 }: { color: string; name?: string; size?: number }) {
  return (
    <div
      className="penguin"
      style={{ width: size, height: size, background: color, fontSize: size * 0.5 }}
      title={name}
    >
      <span role="img" aria-label="penguin">🐧</span>
    </div>
  );
}

function App() {
  const { identity, isActive: connected } = useSpacetimeDB();

  const [players] = useTable(tables.player);
  const [huddles] = useTable(tables.huddle);
  const [members] = useTable(tables.huddleMember);

  const setProfile = useReducer(reducers.setProfile);
  const createHuddle = useReducer(reducers.createHuddle);
  const joinHuddle = useReducer(reducers.joinHuddle);
  const leaveHuddle = useReducer(reducers.leaveHuddle);
  const endHuddle = useReducer(reducers.endHuddle);

  const myHex = identity?.toHexString();
  const me = useMemo(
    () => players.find((p) => p.identity.toHexString() === myHex),
    [players, myHex]
  );
  const myName = me?.name ?? '';

  const myHuddleIds = useMemo(() => {
    const s = new Set<string>();
    for (const m of members) {
      if (m.identity.toHexString() === myHex) s.add(m.huddleId.toString());
    }
    return s;
  }, [members, myHex]);

  const myActiveHuddle = useMemo(() => {
    const mine = huddles.filter((h) => h.active && myHuddleIds.has(h.id.toString()));
    mine.sort((a, b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime());
    return mine[0] ?? null;
  }, [huddles, myHuddleIds]);

  // Auto-join when arriving via a QR / share link: ?h=<huddleId>
  const joinedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!connected || !myName) return;
    const h = new URLSearchParams(window.location.search).get('h');
    if (h && joinedRef.current !== h) {
      joinedRef.current = h;
      try {
        joinHuddle({ huddleId: BigInt(h) }).catch(() => {});
      } catch {
        /* bad id in URL — ignore */
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, myName]);

  const [nameInput, setNameInput] = useState('');
  const [colorInput, setColorInput] = useState<string | null>(null);
  const [newHuddle, setNewHuddle] = useState('');
  const [starting, setStarting] = useState(false);
  const [tab, setTab] = useState<'home' | 'map'>('home');

  // ── Connecting ──
  if (!connected || !identity) {
    return (
      <div className="screen center">
        <div className="logo big float">🐧</div>
        <p className="muted">Waddling in…</p>
      </div>
    );
  }

  // ── Onboarding ──
  if (!myName) {
    const color = colorInput ?? me?.penguinColor ?? PALETTE[0];
    return (
      <div className="screen center onboarding">
        <div className="logo big float">🐧</div>
        <h1 className="title">Huddle</h1>
        <p className="muted">Get cozy. Gather your people. Make warmth.</p>
        <Penguin color={color} size={84} />
        <div className="swatches">
          {PALETTE.map((c) => (
            <button
              key={c}
              className={'swatch' + (c === color ? ' sel' : '')}
              style={{ background: c }}
              onClick={() => setColorInput(c)}
              aria-label={'color ' + c}
            />
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!nameInput.trim()) return;
            setProfile({ name: nameInput.trim(), penguinColor: color }).catch(console.error);
          }}
        >
          <input
            autoFocus
            placeholder="your name"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
          />
          <button type="submit" className="primary big">Enter</button>
        </form>
      </div>
    );
  }

  // ── Huddle Room (hero) ──
  if (myActiveHuddle) {
    const h = myActiveHuddle;
    const roster = members
      .filter((m) => m.huddleId.toString() === h.id.toString())
      .map((m) => players.find((p) => p.identity.toHexString() === m.identity.toHexString()))
      .filter((p): p is (typeof players)[number] => Boolean(p));
    const isHost = h.createdBy.toHexString() === myHex;
    const joinUrl = `${window.location.origin}${window.location.pathname}?h=${h.id.toString()}`;

    return (
      <div className="screen room">
        <div className="room-head">
          <span className="pill">{h.name}</span>
          <span className="pill">{h.memberCount} 🐧</span>
        </div>

        <div className="warmth">
          <div className="warmth-num">{Math.round(h.warmth)}</div>
          <div className="warmth-label">{warmthLabel(h.warmth)} · warmth</div>
          <div className="meter">
            <div className="meter-fill" style={{ width: warmthPct(h.warmth) + '%' }} />
          </div>
          <p className="muted small">+{h.memberCount}/sec · the more of you, the faster it heats</p>
        </div>

        <div className="huddle-cluster">
          {roster.map((p) => (
            <div key={p.identity.toHexString()} className="cluster-pen">
              <Penguin color={p.penguinColor} name={p.name ?? ''} size={54} />
              <span className="pen-name">{p.name || p.identity.toHexString().slice(0, 6)}</span>
            </div>
          ))}
        </div>

        <div className="invite">
          <div className="qr"><QRCodeSVG value={joinUrl} size={140} /></div>
          <p className="muted small">Scan to pile into the huddle</p>
        </div>

        <div className="room-actions">
          <button className="ghost" onClick={() => leaveHuddle({ huddleId: h.id }).catch(console.error)}>
            Leave
          </button>
          {isHost && (
            <button className="danger" onClick={() => endHuddle({ huddleId: h.id }).catch(console.error)}>
              End huddle
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Lobby ──
  const activeHuddles = [...huddles].filter((h) => h.active).sort((a, b) => b.warmth - a.warmth);
  const leaderboard = [...huddles].sort((a, b) => b.warmth - a.warmth).slice(0, 8);

  const onStart = async () => {
    setStarting(true);
    const loc = await getLocation();
    try {
      await createHuddle({
        name: newHuddle.trim() || `${myName}'s huddle`,
        lat: loc.lat,
        lng: loc.lng,
        placeLabel: newHuddle.trim() || 'Huddle spot',
      });
      setNewHuddle('');
    } catch (e) {
      console.error(e);
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="screen lobby">
      <header className="lobby-head">
        <div className="me">
          <Penguin color={me?.penguinColor ?? PALETTE[0]} size={36} />
          <span>{myName}</span>
        </div>
        <span className="brand">🐧 Huddle</span>
      </header>

      {tab === 'home' ? (
        <>
          <section className="start">
            <input
              placeholder="name your huddle…"
              value={newHuddle}
              onChange={(e) => setNewHuddle(e.target.value)}
            />
            <button className="primary big" disabled={starting} onClick={onStart}>
              {starting ? 'Starting…' : 'Start a huddle'}
            </button>
          </section>

          <section>
            <h2>Huddles forming</h2>
            {activeHuddles.length === 0 && <p className="muted">No live huddles yet — start one!</p>}
            <div className="list">
              {activeHuddles.map((h) => (
                <div key={h.id.toString()} className="card">
                  <div className="card-main">
                    <strong>{h.name}</strong>
                    <span className="muted small">{h.memberCount} 🐧 · {Math.round(h.warmth)} warmth</span>
                  </div>
                  <button className="primary" onClick={() => joinHuddle({ huddleId: h.id }).catch(console.error)}>
                    Join
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2>🔥 Warmest huddles</h2>
            <div className="list">
              {leaderboard.length === 0 && <p className="muted">Be the first to make some warmth.</p>}
              {leaderboard.map((h, i) => (
                <div key={h.id.toString()} className="card rank">
                  <span className="rank-n">{i + 1}</span>
                  <div className="card-main">
                    <strong>{h.name}</strong>
                    <span className="muted small">{h.memberCount} 🐧 {h.active ? '· live' : '· ended'}</span>
                  </div>
                  <span className="warm-badge">{Math.round(h.warmth)}</span>
                </div>
              ))}
            </div>
          </section>
        </>
      ) : (
        <HuddleMap huddles={huddles} />
      )}

      <nav className="tabbar">
        <button className={'tab' + (tab === 'home' ? ' active' : '')} onClick={() => setTab('home')}>
          🏠 Home
        </button>
        <button className={'tab' + (tab === 'map' ? ' active' : '')} onClick={() => setTab('map')}>
          🗺️ Map
        </button>
      </nav>
    </div>
  );
}

export default App;
