import { LogOut } from 'lucide-react';
import type { MeVM } from '@/lib/view';
import { ME_PHOTO } from '@/lib/avatar';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/ui/button';
import { FlowSheet } from '@/components/flows/FlowSheet';

// Real: shows the user's live score + room, and leaves the room (leaveRoom reducer).
export function ProfileSettings({
  open,
  onOpenChange,
  me,
  onLeave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  me: MeVM;
  onLeave: () => void;
}) {
  return (
    <FlowSheet
      open={open}
      onOpenChange={onOpenChange}
      title={
        <span className="flex items-center gap-3">
          <Avatar name={me.name} colorKey={me.key} photo={ME_PHOTO} size={44} className="ring-2 ring-yellow ring-offset-2 ring-offset-card" />
          <span className="truncate">{me.name}</span>
        </span>
      }
    >
      <p className="text-sm text-muted-foreground">
        Room <span className="font-bold text-foreground">{me.roomName}</span>
        {me.roomCode && me.roomCode !== me.roomName ? <span className="text-muted-foreground"> · {me.roomCode}</span> : null}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-secondary p-4 text-center">
          <div className="font-heading text-3xl font-black text-warmth">{me.warmthPoints}</div>
          <div className="mt-1 text-xs font-semibold text-muted-foreground">Warmth Points</div>
        </div>
        <div className="rounded-2xl bg-secondary p-4 text-center">
          <div className="font-heading text-3xl font-black text-blue">{me.huddlesJoined}</div>
          <div className="mt-1 text-xs font-semibold text-muted-foreground">Huddles Joined</div>
        </div>
      </div>

      <Button
        variant="outline"
        size="lg"
        className="mt-5 w-full font-bold text-destructive"
        onClick={() => {
          onLeave();
          onOpenChange(false);
        }}
      >
        <LogOut className="h-4 w-4" /> Leave room
      </Button>
    </FlowSheet>
  );
}
