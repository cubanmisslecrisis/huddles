import { X, LogOut, MapPin, Users, Flame, Zap } from 'lucide-react';
import type { MeVM } from '@/lib/view';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/ui/button';
import { colorFor } from '@/lib/avatar';

export function ProfileSettings({
  open,
  onOpenChange,
  me,
  onLeave,
  friendCount = 0,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  me: MeVM;
  onLeave: () => void;
  friendCount?: number;
}) {
  if (!open) return null;

  const accentColor = colorFor(me.key);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Ambient blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-20 -right-20 h-72 w-72 rounded-full blur-3xl opacity-20"
          style={{ background: accentColor }}
        />
        <div
          className="absolute top-40 -left-16 h-56 w-56 rounded-full blur-3xl opacity-10"
          style={{ background: accentColor }}
        />
      </div>

      {/* Header bar */}
      <div
        className="relative flex items-center justify-between px-5"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)', paddingBottom: 16 }}
      >
        <span className="font-heading text-lg font-black text-foreground">Profile</span>
        <button
          onClick={() => onOpenChange(false)}
          aria-label="Close"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Scrollable body */}
      <div className="relative flex-1 overflow-y-auto px-5 pb-[calc(env(safe-area-inset-bottom,0px)+24px)]">

        {/* Avatar + name */}
        <div className="mt-4 flex flex-col items-center gap-3 text-center">
          <Avatar name={me.name} colorKey={me.key} size={96} className="ring-4 ring-offset-4 ring-offset-background" style={{ '--tw-ring-color': accentColor } as React.CSSProperties} />
          <div>
            <h1 className="font-heading text-3xl font-black text-foreground">{me.name}</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">Huddles member</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="mt-8 grid grid-cols-3 gap-3">
          <div className="flex flex-col items-center gap-1 rounded-2xl bg-secondary/60 py-4">
            <Flame className="h-5 w-5 text-orange" strokeWidth={2.2} />
            <span className="font-heading text-2xl font-black text-foreground">{me.warmthPoints}</span>
            <span className="text-[11px] font-semibold text-muted-foreground">Warmth</span>
          </div>
          <div className="flex flex-col items-center gap-1 rounded-2xl bg-secondary/60 py-4">
            <Zap className="h-5 w-5 text-blue" strokeWidth={2.2} />
            <span className="font-heading text-2xl font-black text-foreground">{me.huddlesJoined}</span>
            <span className="text-[11px] font-semibold text-muted-foreground">Huddles</span>
          </div>
          <div className="flex flex-col items-center gap-1 rounded-2xl bg-secondary/60 py-4">
            <Users className="h-5 w-5 text-green" strokeWidth={2.2} />
            <span className="font-heading text-2xl font-black text-foreground">{friendCount}</span>
            <span className="text-[11px] font-semibold text-muted-foreground">Friends</span>
          </div>
        </div>

        {/* Room card */}
        <div className="mt-4 rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
              <MapPin className="h-5 w-5 text-foreground" strokeWidth={2.2} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Current Room</p>
              <p className="truncate font-heading text-lg font-black text-foreground">{me.roomName}</p>
            </div>
            {me.roomCode && me.roomCode !== me.roomName && (
              <span className="shrink-0 rounded-lg bg-secondary px-2.5 py-1 text-xs font-bold text-muted-foreground">
                {me.roomCode}
              </span>
            )}
          </div>
        </div>

        {/* Identity card */}
        <div className="mt-3 rounded-2xl border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Identity</p>
          <p className="mt-1 truncate font-mono text-xs text-muted-foreground">{me.key}</p>
        </div>

        {/* Leave room */}
        <Button
          variant="outline"
          size="lg"
          className="mt-6 w-full font-bold text-destructive border-destructive/30 hover:bg-destructive/5"
          onClick={() => {
            onLeave();
            onOpenChange(false);
          }}
        >
          <LogOut className="h-4 w-4" />
          Leave room
        </Button>
      </div>
    </div>
  );
}
