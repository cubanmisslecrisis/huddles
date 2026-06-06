import type { FriendVM } from '@/lib/view';
import { distanceLabel } from '@/lib/avatar';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/ui/button';
import { FlowSheet } from '@/components/flows/FlowSheet';

// Real: fires the pingNearby() reducer (which pings everyone within ~100m). The list
// is informational — the server decides who's actually in range.
export function PingSheet({
  open,
  onOpenChange,
  friends,
  onPing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  friends: FriendVM[];
  onPing: () => void;
}) {
  const online = friends.filter((f) => f.online);
  return (
    <FlowSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Ping nearby"
      footer={
        <Button
          variant="brand"
          size="lg"
          className="flex-1 font-bold"
          onClick={() => {
            onPing();
            onOpenChange(false);
          }}
        >
          Ping nearby
        </Button>
      }
    >
      <p className="text-sm text-muted-foreground">Send a wave to everyone within ~100m of you in this room.</p>
      <div className="mt-3 flex flex-col divide-y divide-border">
        {online.length === 0 ? (
          <p className="py-3 text-sm text-muted-foreground">No one's online in your room right now.</p>
        ) : (
          online.map((f) => (
            <div key={f.key} className="flex items-center gap-3 py-3">
              <Avatar name={f.name} colorKey={f.key} size={40} dot="online" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-foreground">{f.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {f.distanceMeters != null ? `${distanceLabel(f.distanceMeters)} away` : 'Sharing location'}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </FlowSheet>
  );
}
