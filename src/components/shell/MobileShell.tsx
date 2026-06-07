import { useMemo } from 'react';
import { MapCanvas, type MapControls } from '@/components/map/MapCanvas';
import { MapStatusChips, MapFilterChips } from '@/components/map/MapChips';
import { BottomNavIsland } from '@/components/shell/BottomNavIsland';
import { BottomSheet, type SheetState } from '@/components/panels/BottomSheet';
import { MapPanel } from '@/components/lens/MapPanel';
import { ActivityPanel } from '@/components/lens/ActivityPanel';
import { FriendsPanel } from '@/components/lens/FriendsPanel';
import { RankingsPanel } from '@/components/lens/RankingsPanel';
import { DetailPanel } from '@/components/DetailPanel';
import { Avatar } from '@/components/Avatar';
import type { Lens } from '@/lib/nav-tabs';
import type { LayerKey, FilterKey } from '@/lib/places-data';
import type { MapAvatar, HeatPoint, HuddleHeatPoint, Selection } from '@/components/map/markers';
import type { FriendVM, HuddleVM, EventVM, ScoreVM, MeVM } from '@/lib/view';

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
  huddleHeat,
  myLoc,
  friends,
  huddles,
  events,
  board,
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
  huddleHeat: HuddleHeatPoint[];
  myLoc: { lat: number; lng: number } | null;
  friends: FriendVM[];
  huddles: HuddleVM[];
  events: EventVM[];
  board: ScoreVM[];
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
    <RankingsPanel board={board} bare />
  );

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-background">
      <MapCanvas
        avatars={avatars}
        heat={heat}
        huddleHeat={huddleHeat}
        myLoc={myLoc}
        selection={selection}
        onSelect={onSelect}
        activeLayers={activeLayers}
        controlsRef={controlsRef}
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
        <button onClick={onOpenProfile} aria-label="Your profile" className="pointer-events-auto shrink-0 rounded-full">
          <Avatar name={me.name} colorKey={me.key} size={44} className="ring-2 ring-yellow ring-offset-2 ring-offset-background" />
        </button>
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

      <BottomNavIsland active={lens} onChange={onChangeLens} onSearch={onSearch} onAdd={onAdd} />
    </div>
  );
}
