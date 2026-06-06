import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useMemo, useRef } from 'react';

export type UserMarker = {
  hex: string;
  name: string;
  lat: number;
  lng: number;
  isMe: boolean;
};

export type HuddleMarker = {
  id: string;
  lat: number;
  lng: number;
  warmth: number;
  memberCount: number;
  active: boolean;
};

const FALLBACK: [number, number] = [40.7484, -73.9857]; // ~Midtown NYC

const PALETTE = [
  '#6B8FFF', '#FF6B9D', '#FFC93C', '#6BCB77', '#4D96FF',
  '#FF8A80', '#64B5F6', '#81C784', '#FFD54F', '#BA68C8'
];

const HUDDLE_COLORS = [
  '#FF6B9D', '#FFC93C', '#6BCB77', '#4D96FF',
  '#FF8A80', '#64B5F6', '#FFD54F', '#BA68C8'
];

function colorFor(hex: string): string {
  let h = 0;
  for (let i = 0; i < hex.length; i++) h = (h * 31 + hex.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

function huddleColorFor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return HUDDLE_COLORS[h % HUDDLE_COLORS.length];
}

function userIcon(u: UserMarker): L.DivIcon {
  const color = u.isMe ? '#6B8FFF' : colorFor(u.hex);
  const initial = (u.name || '?').slice(0, 1).toUpperCase();
  const ring = u.isMe
    ? 'box-shadow:0 0 0 4px rgba(107,143,255,0.4),0 0 16px rgba(107,143,255,0.6);'
    : 'box-shadow:0 2px 8px rgba(0,0,0,0.15);';
  return L.divIcon({
    className: 'live-marker',
    html: `<div class="live-dot" style="background:${color};${ring}">${initial}</div>
           <div class="live-name">${u.name}${u.isMe ? ' (you)' : ''}</div>`,
    iconSize: [40, 48],
    iconAnchor: [20, 48],
  });
}

function huddleIcon(h: HuddleMarker): L.DivIcon {
  const baseRadius = 18;
  const warmthBonus = Math.min(22, h.warmth / 25);
  const radius = baseRadius + warmthBonus;
  const diameter = radius * 2;

  const color = huddleColorFor(h.id);
  const glow = h.active
    ? `box-shadow:0 0 0 3px ${color}40,0 0 24px ${color}60;`
    : `box-shadow:0 4px 12px rgba(0,0,0,0.15);`;

  const pulse = h.active ? 'style="animation: pulse-huddle 2s ease-in-out infinite;"' : '';

  return L.divIcon({
    className: 'huddle-glow-marker',
    html: `<div class="huddle-icon ${h.active ? 'active' : ''}" style="width:${diameter}px;height:${diameter}px;background:${color};border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-weight:800;font-size:0.95rem;${glow}${pulse}">
             <span>${h.memberCount}</span>
           </div>`,
    iconSize: [diameter, diameter],
    iconAnchor: [radius, radius],
  });
}

// Pan to `focus` only the first time we get a valid one (don't fight the user panning).
function Recenter({ focus }: { focus: [number, number] | null }) {
  const map = useMap();
  const done = useRef(false);
  useEffect(() => {
    if (focus && !done.current) {
      done.current = true;
      map.setView(focus, 15, { animate: true });
    }
  }, [focus, map]);
  return null;
}

export default function LiveMap({
  users,
  huddles,
  myLoc,
}: {
  users: UserMarker[];
  huddles: HuddleMarker[];
  myLoc: [number, number] | null;
}) {
  const center = useMemo<[number, number]>(() => {
    if (myLoc) return myLoc;
    if (users.length) return [users[0].lat, users[0].lng];
    return FALLBACK;
  }, [myLoc, users]);

  return (
    <div className="map">
      <MapContainer center={center} zoom={13} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution="&copy; OpenStreetMap, &copy; CARTO"
          url="https://{s}.basemaps.cartocdn.com/positron/{z}/{x}/{y}{r}.png"
        />
        <Recenter focus={myLoc} />
        {huddles.map((h) => (
          <Marker key={'h' + h.id} position={[h.lat, h.lng]} icon={huddleIcon(h)} />
        ))}
        {users.map((u) => (
          <Marker key={u.hex} position={[u.lat, u.lng]} icon={userIcon(u)}>
            <Popup>
              {u.name}
              {u.isMe ? ' (you)' : ''}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
