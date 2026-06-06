import type { FriendVM } from '@/lib/view';
import type { Selection } from '@/components/map/markers';
import { distanceLabel, relativeTimeFromMicros } from '@/lib/avatar';
import { Avatar } from '@/components/Avatar';
import { PanelCard, PingButton } from '@/components/panel-ui';
import { SelectableCard } from '@/components/selectable-card';

function FriendRow({ friend, onSelect, onPing }: { friend: FriendVM; onSelect: () => void; onPing?: () => void }) {
  return (
    <SelectableCard
      onSelect={onSelect}
      className="flex w-full cursor-pointer items-center gap-3 py-2.5 text-left transition"
    >
      <Avatar name={friend.name} colorKey={friend.key} size={48} dot={friend.online ? 'online' : 'stale'} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-foreground">{friend.name}</p>
        <p className="truncate text-sm text-foreground">
          {friend.online ? 'Online now' : `Last seen ${relativeTimeFromMicros(friend.lastSeenMicros)}`}
        </p>
        {friend.distanceMeters != null && (
          <p className="text-xs text-muted-foreground">{distanceLabel(friend.distanceMeters)} away</p>
        )}
      </div>
      <div className="flex shrink-0 items-center" onClick={(e) => e.stopPropagation()}>
        <PingButton onClick={onPing} />
      </div>
    </SelectableCard>
  );
}

export function FriendsPanel({
  friends,
  onSelect,
  onPing,
  bare = false,
}: {
  friends: FriendVM[];
  onSelect: (s: Selection) => void;
  onPing?: () => void;
  bare?: boolean;
}) {
  return (
    <PanelCard bare={bare} className={bare ? 'flex flex-col' : 'flex h-full flex-col'}>
      <h2 className="font-heading text-2xl font-black text-foreground">Friends</h2>
      {friends.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">No one else has joined this room yet.</p>
      ) : (
        <div className="mt-2 flex flex-1 flex-col divide-y divide-border overflow-y-auto">
          {friends.map((f) => (
            <FriendRow key={f.key} friend={f} onSelect={() => onSelect({ kind: 'friend', id: f.key })} onPing={onPing} />
          ))}
        </div>
      )}
    </PanelCard>
  );
}
