import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

type Huddle = {
  id: bigint;
  name: string;
  lat: number;
  lng: number;
  warmth: number;
  memberCount: number;
  active: boolean;
};

// ~Midtown NYC, used when there are no huddles to center on yet.
const FALLBACK: [number, number] = [40.7484, -73.9857];

export default function HuddleMap({ huddles }: { huddles: readonly Huddle[] }) {
  const pts = huddles.filter(
    (h) => Number.isFinite(h.lat) && Number.isFinite(h.lng) && (h.lat !== 0 || h.lng !== 0)
  );

  const center: [number, number] = pts.length
    ? [
        pts.reduce((s, h) => s + h.lat, 0) / pts.length,
        pts.reduce((s, h) => s + h.lng, 0) / pts.length,
      ]
    : FALLBACK;

  return (
    // key flips only on empty<->has-points so the map recenters once data arrives,
    // without remounting every time a huddle is added.
    <MapContainer center={center} zoom={13} scrollWheelZoom className="map" key={pts.length ? 'has' : 'empty'}>
      <TileLayer
        attribution="&copy; OpenStreetMap, &copy; CARTO"
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      {pts.map((h) => {
        const radius = 9 + Math.min(36, h.warmth / 18);
        const color = h.active ? '#ff7a59' : '#6f8bbf';
        return (
          <CircleMarker
            key={h.id.toString()}
            center={[h.lat, h.lng]}
            radius={radius}
            pathOptions={{ color, fillColor: color, fillOpacity: h.active ? 0.5 : 0.25, weight: 2 }}
          >
            <Tooltip direction="top">
              <b>{h.name}</b> · {Math.round(h.warmth)} warmth · {h.memberCount}🐧
              {h.active ? ' · live' : ''}
            </Tooltip>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
