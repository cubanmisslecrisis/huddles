import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './HuddleMap.css';
import { useState, useMemo } from 'react';

type HuddleMember = {
  id: bigint;
  huddleId: bigint;
  identity: { toHexString: () => string };
  joinedAt: { toDate: () => Date };
};

type Player = {
  identity: { toHexString: () => string };
  name: string | undefined;
  penguinColor: string;
  online: boolean;
};

type Huddle = {
  id: bigint;
  name: string;
  lat: number;
  lng: number;
  warmth: number;
  memberCount: number;
  active: boolean;
  placeLabel: string;
};

const FALLBACK: [number, number] = [40.7484, -73.9857];

const TERRITORY_COLORS = [
  '#FF5FCB', // Aurora Pink
  '#FFD84D', // Sun Yellow
  '#1B2555', // Navy
  '#74F7B2', // Mint Green
  '#D8B5FF', // Lavender
];

function Penguin({ color, size = 32 }: { color: string; size?: number }) {
  return (
    <div
      className="map-penguin"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        fontSize: size * 0.6,
      }}
    >
      🐧
    </div>
  );
}

function createHuddleIconHtml(warmth: number, memberCount: number, active: boolean, color: string): string {
  const radius = 18 + Math.min(20, warmth / 40);
  const diameter = radius * 2;

  let membersHtml = '';
  if (memberCount <= 3) {
    membersHtml = `
      <div class="members-inline">
        ${Array(memberCount)
          .fill(null)
          .map((_, i) => {
            const angle = (360 / memberCount) * i;
            return `<div class="member-dot" style="transform: rotate(${angle}deg) translateY(-8px) rotate(-${angle}deg)"></div>`;
          })
          .join('')}
      </div>
    `;
  } else {
    membersHtml = `<span class="member-count">${memberCount}</span>`;
  }

  const pulseRing = active ? '<div class="pulse-ring"></div>' : '';
  const glow = active ? 'box-shadow: 0 0 16px rgba(255, 95, 203, 0.6);' : '';

  return `
    <div class="huddle-icon ${active ? 'active' : ''}" style="width: ${diameter}px; height: ${diameter}px; ${glow}">
      <div class="huddle-core" style="background: ${color}">
        ${membersHtml}
      </div>
      ${pulseRing}
    </div>
  `;
}

export default function HuddleMap({ huddles, members, players }: { huddles: readonly Huddle[]; members: readonly HuddleMember[]; players?: readonly Player[] }) {
  const [selectedHuddle, setSelectedHuddle] = useState<bigint | null>(null);

  const playerMap = useMemo(() => {
    const map = new Map<string, Player>();
    if (players) {
      for (const p of players) {
        map.set(p.identity.toHexString(), p);
      }
    }
    return map;
  }, [players]);

  const pts = huddles.filter(
    (h) => Number.isFinite(h.lat) && Number.isFinite(h.lng) && (h.lat !== 0 || h.lng !== 0)
  );

  const center: [number, number] = pts.length
    ? [
        pts.reduce((s, h) => s + h.lat, 0) / pts.length,
        pts.reduce((s, h) => s + h.lng, 0) / pts.length,
      ]
    : FALLBACK;

  const getHuddleMembers = (huddleId: bigint) => {
    const huddleMembers = members.filter((m) => m.huddleId.toString() === huddleId.toString());
    return huddleMembers
      .map((m) => {
        const player = playerMap.get(m.identity.toHexString());
        return {
          identity: m.identity.toHexString(),
          name: player?.name || 'Unknown',
          penguinColor: player?.penguinColor || '#7FD1FF',
        };
      })
      .slice(0, 8);
  };

  return (
    <div className="huddle-map-container">
      <MapContainer center={center} zoom={13} scrollWheelZoom className="huddle-map" key={pts.length ? 'has' : 'empty'}>
        <TileLayer
          attribution="&copy; OpenStreetMap, &copy; CARTO"
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        {pts.map((h, idx) => {
          const territorColor = TERRITORY_COLORS[idx % TERRITORY_COLORS.length];
          const huddleMembers = getHuddleMembers(h.id);

          return (
            <Marker
              key={h.id.toString()}
              position={[h.lat, h.lng]}
              icon={L.divIcon({
                html: createHuddleIconHtml(h.warmth, h.memberCount, h.active, territorColor),
                className: 'custom-marker',
                iconSize: [100, 100],
                iconAnchor: [50, 50],
              })}
              eventHandlers={{
                click: () => setSelectedHuddle(h.id),
              }}
            >
              <Popup maxWidth={280} className="huddle-popup">
                <div className="popup-content">
                  <div className="popup-header">
                    <h3>{h.name}</h3>
                    <span className={`badge ${h.active ? 'live' : ''}`}>{h.active ? '🔴 Live' : 'Ended'}</span>
                  </div>

                  <div className="popup-stats">
                    <div className="stat">
                      <span className="label">Warmth</span>
                      <span className="value">{Math.round(h.warmth)}</span>
                    </div>
                    <div className="stat">
                      <span className="label">Members</span>
                      <span className="value">{h.memberCount} 🐧</span>
                    </div>
                  </div>

                  {huddleMembers.length > 0 && (
                    <div className="popup-members">
                      <p className="members-label">In this huddle:</p>
                      <div className="members-grid">
                        {huddleMembers.slice(0, 6).map((m, i) => (
                          <div key={i} className="member-item" title={m.identity.slice(0, 6)}>
                            <Penguin color={m.penguinColor} size={24} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="popup-footer">
                    <span className="location">📍 {h.placeLabel}</span>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
