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

const PALETTE = ['#7FD1FF', '#FFB3C7', '#FFE08A', '#B5E8A0', '#C9B6FF', '#FFC09A', '#9AE6D0', '#FF9AA2'];

function colorFor(hex: string): string {
  let h = 0;
  for (let i = 0; i < hex.length; i++) h = (h * 31 + hex.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

function userIcon(u: UserMarker): L.DivIcon {
  const color = u.isMe ? '#7FD1FF' : colorFor(u.hex);
  const initial = (u.name || '?').slice(0, 1).toUpperCase();
  const ring = u.isMe ? 'box-shadow:0 0 0 3px rgba(127,209,255,0.5),0 0 14px rgba(127,209,255,0.7);' : '';
  return L.divIcon({
    className: 'live-marker',
    html: `<div class="live-dot" style="background:${color};${ring}">${initial}</div>
           <div class="live-name">${u.name}${u.isMe ? ' (you)' : ''}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

function huddleIcon(h: HuddleMarker): L.DivIcon {
  const r = 22 + Math.min(26, h.warmth / 30);
  const glow = h.active ? 'box-shadow:0 0 22px rgba(255,140,70,0.7);' : '';
  return L.divIcon({
    className: 'huddle-glow-marker',
    html: `<div class="huddle-glow ${h.active ? 'active' : ''}" style="width:${r * 2}px;height:${r * 2}px;${glow}">
             <span>${h.memberCount}🔥</span>
           </div>`,
    iconSize: [r * 2, r * 2],
    iconAnchor: [r, r],
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
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
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
