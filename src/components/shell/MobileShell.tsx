import { useMemo } from 'react';
import { type MapControls } from '@/components/map/MapCanvas';
import { GoogleMapsStyle } from '@/components/map/GoogleMapsStyle';
import { MapStatusChips, MapFilterChips } from '@/components/map/MapChips';
import { BottomNavIsland } from '@/components/shell/BottomNavIsland';
import { BottomSheet, type SheetState } from '@/components/panels/BottomSheet';
import { MapPanel } from '@/components/lens/MapPanel';
import { ActivityPanel } from '@/components/lens/ActivityPanel';
import { FriendsPanel } from '@/components/lens/FriendsPanel';
import { WrappedPanel } from '@/components/lens/WrappedPanel';
import { DetailPanel } from '@/components/DetailPanel';
import { Avatar } from '@/components/Avatar';
import { ME_PHOTO } from '@/lib/avatar';
import { Search, Plus } from 'lucide-react';
import type { Lens } from '@/lib/nav-tabs';
import type { LayerKey, FilterKey } from '@/lib/places-data';
import type { MapAvatar, HeatPoint, Selection } from '@/components/map/markers';
import type { FriendVM, HuddleVM, EventVM, MeVM } from '@/lib/view';

export function MobileShell({
  lens,
  onChangeLens,
  selection,
  onSelect,
  sheetState,
  onSheetStateChange,
  activeLayers,
  filter,
  onFilter,
  onSearch,
  onAdd,
  onPing,
  onOpenProfile,
  controlsRef,
  me,
  avatars,
  heat,
  myLoc,
  friends,
  huddles,
  events,
  nearbyCount,
  formingCount,
  activeHuddles,
  friendsOut,
}: {
  lens: Lens;
  onChangeLens: (l: Lens) => void;
  selection: Selection;
  onSelect: (s: Selection) => void;
  sheetState: SheetState;
  onSheetStateChange: (s: SheetState) => void;
  activeLayers: Record<LayerKey, boolean>;
  filter: FilterKey;
  onFilter: (k: FilterKey) => void;
  onSearch: () => void;
  onAdd: () => void;
  onPing: () => void;
  onOpenProfile: () => void;
  controlsRef: React.MutableRefObject<MapControls | null>;
  me: MeVM;
  avatars: MapAvatar[];
  heat: HeatPoint[];
  myLoc: { lat: number; lng: number } | null;
  friends: FriendVM[];
  huddles: HuddleVM[];
  events: EventVM[];
  nearbyCount: number;
  formingCount: number;
  activeHuddles: number;
  friendsOut: number;
}) {
  const nearestFriend = useMemo<FriendVM | null>(() => {
    if (friends.length === 0) return null;
    const withDist = friends.filter((f) => f.distanceMeters != null);
    if (withDist.length > 0) {
      return [...withDist].sort((a, b) => (a.distanceMeters ?? 0) - (b.distanceMeters ?? 0))[0];
    }
    return friends.find((f) => f.online) ?? friends[0];
  }, [friends]);

  const sheetContent = selection ? (
    <DetailPanel
      selection={selection}
      friends={friends}
      huddles={huddles}
      onClose={() => onSelect(null)}
      onPing={onPing}
      bare
    />
  ) : lens === 'map' ? (
    <MapPanel nearestFriend={nearestFriend} huddles={huddles} onSelect={onSelect} onPing={onPing} bare />
  ) : lens === 'activity' ? (
    <ActivityPanel events={events} activeHuddles={activeHuddles} friendsOut={friendsOut} bare />
  ) : lens === 'friends' ? (
    <FriendsPanel friends={friends} onSelect={onSelect} onPing={onPing} bare />
  ) : (
    <WrappedPanel friends={friends} bare />
  );

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-background">
      <GoogleMapsStyle
        avatars={avatars}
        heat={heat}
        myLoc={myLoc}
        selection={selection}
        onSelect={onSelect}
        activeLayers={activeLayers}
        filter={filter}
        controlsRef={controlsRef}
        friends={friends}
      />

      {/* Top layer: status chips + profile avatar */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-40 flex items-start justify-between gap-3 px-4"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
      >
        <div className="pointer-events-auto">
          <MapStatusChips
            friendsNearby={nearbyCount}
            huddlesForming={formingCount}
            nearby={friends.filter((f) => f.online).map((f) => ({ key: f.key, name: f.name }))}
          />
        </div>
        <div className="pointer-events-auto flex shrink-0 flex-col items-end gap-2.5">
          <button onClick={onOpenProfile} aria-label="Your profile" className="rounded-full">
            <Avatar name={me.name} colorKey={me.key} photo={ME_PHOTO} size={44} className="ring-2 ring-yellow ring-offset-2 ring-offset-background" />
          </button>
          <button
            onClick={onSearch}
            aria-label="Search"
            className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-[0_8px_24px_rgba(20,20,20,0.12)] transition hover:bg-secondary active:scale-95"
          >
            <Search className="h-6 w-6" strokeWidth={2.4} />
          </button>
          <button
            onClick={onAdd}
            aria-label="Add to map"
            className="flex h-14 w-14 items-center justify-center rounded-full bg-red text-white shadow-[0_8px_24px_rgba(240,68,56,0.4)] transition hover:brightness-105 active:scale-95"
          >
            <Plus className="h-7 w-7" strokeWidth={2.6} />
          </button>
        </div>
      </div>

      <BottomSheet
        state={sheetState}
        onStateChange={onSheetStateChange}
        header={
          lens === 'map' && !selection ? <MapFilterChips active={filter} onChange={onFilter} /> : undefined
        }
      >
        {sheetContent}
      </BottomSheet>

      <BottomNavIsland active={lens} onChange={onChangeLens} />
    </div>
  );
}
