import { useEffect, useRef } from 'react';

// Streams the device's LIVE GPS location and invokes `onPosition(lat, lng)` (throttled).
// Wire this to the `heartbeatLocation` reducer so the server always has your latest fix:
//
//   useGeolocation((lat, lng) => conn?.reducers.heartbeatLocation({ lat, lng }));
//
// Falls back to a fixed demo location if geolocation is denied/unavailable, so the app
// still works in a desktop browser (where two windows share ~the same coords → they huddle).
export function useGeolocation(
  onPosition: (lat: number, lng: number) => void,
  opts?: { throttleMs?: number; fallback?: { lat: number; lng: number } }
): void {
  const throttleMs = opts?.throttleMs ?? 3000;
  const fallback = opts?.fallback ?? { lat: 40.7484, lng: -73.9857 }; // ~Midtown NYC
  const lastSent = useRef(0);
  const cb = useRef(onPosition);
  cb.current = onPosition;

  useEffect(() => {
    const send = (lat: number, lng: number) => {
      const now = Date.now();
      if (now - lastSent.current < throttleMs) return;
      lastSent.current = now;
      cb.current(lat, lng);
    };

    if (!('geolocation' in navigator)) {
      send(fallback.lat, fallback.lng);
      return;
    }

    const id = navigator.geolocation.watchPosition(
      (pos) => send(pos.coords.latitude, pos.coords.longitude),
      () => send(fallback.lat, fallback.lng),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [throttleMs, fallback.lat, fallback.lng]);
}
