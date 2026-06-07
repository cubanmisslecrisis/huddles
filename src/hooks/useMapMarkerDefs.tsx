import { useMemo } from 'react';
import { type LayerKey } from '@/lib/places-data';
import {
  FriendMarker,
  HuddleMarker,
  type MapAvatar,
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
// (HuddleMarker). Place pins are real Google places drawn separately as emoji markers
// (see place-markers.tsx) — no static pins here.
export function useMapMarkerDefs({
  avatars,
  selection,
  onSelect,
  activeLayers,
}: {
  avatars: MapAvatar[];
  selection: Selection;
  onSelect: (s: Selection) => void;
  activeLayers: Record<LayerKey, boolean>;
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

    return defs;
  }, [avatars, selection, onSelect, activeLayers]);
}
