import { useMemo } from 'react';
import { staticPins, type LayerKey } from '@/lib/places-data';
import {
  FriendMarker,
  HuddleMarker,
  PinMarker,
  type MapAvatar,
  type ResolvedPin,
  type Selection,
} from '@/components/map/markers';

export type MarkerAnchor = 'bottom' | 'center' | 'top';

export type MapMarkerDef = {
  key: string;
  lng: number;
  lat: number;
  anchor: MarkerAnchor;
  node: React.ReactNode;
};

// Builds the live marker set: one node per solo avatar (FriendMarker) / merged huddle
// (HuddleMarker), plus static place pins resolved against the user's location.
export function useMapMarkerDefs({
  avatars,
  selection,
  onSelect,
  activeLayers,
  origin,
}: {
  avatars: MapAvatar[];
  selection: Selection;
  onSelect: (s: Selection) => void;
  activeLayers: Record<LayerKey, boolean>;
  origin: { lat: number; lng: number } | null;
}): MapMarkerDef[] {
  return useMemo(() => {
    const hasSelection = selection !== null;
    const isSel = (k: 'friend' | 'huddle' | 'pin', id: string) =>
      selection !== null && selection.kind === k && selection.id === id;

    const defs: MapMarkerDef[] = [];

    for (const a of avatars) {
      const layerOn = a.merged ? activeLayers.huddles : activeLayers.friends;
      if (!layerOn) continue;
      const sel = a.selection;
      defs.push({
        key: a.key,
        lng: a.lng,
        lat: a.lat,
        anchor: 'bottom',
        node: a.merged ? (
          <HuddleMarker
            avatar={a}
            selected={isSel('huddle', sel.id)}
            dimmed={hasSelection && !isSel('huddle', sel.id)}
            onSelect={() => onSelect(sel)}
          />
        ) : (
          <FriendMarker
            avatar={a}
            selected={isSel('friend', sel.id)}
            dimmed={hasSelection && !isSel('friend', sel.id)}
            onSelect={() => onSelect(sel)}
          />
        ),
      });
    }

    // Static place pins — only meaningful once we know where the user is.
    if (origin) {
      for (const p of staticPins) {
        const visible =
          ((p.kind === 'reco' || p.kind === 'music') && activeLayers.recs) ||
          ((p.kind === 'saved' || p.kind === 'content') && activeLayers.saved);
        if (!visible) continue;
        const resolved: ResolvedPin = { ...p, lat: origin.lat + p.dLat, lng: origin.lng + p.dLng };
        defs.push({
          key: `pin-${p.id}`,
          lng: resolved.lng,
          lat: resolved.lat,
          anchor: 'bottom',
          node: (
            <PinMarker
              pin={resolved}
              selected={isSel('pin', p.id)}
              dimmed={hasSelection && !isSel('pin', p.id)}
              onSelect={() => onSelect({ kind: 'pin', id: p.id })}
            />
          ),
        });
      }
    }

    return defs;
  }, [avatars, selection, onSelect, activeLayers, origin]);
}
