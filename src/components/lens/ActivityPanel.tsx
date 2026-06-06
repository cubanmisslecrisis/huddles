import { Users, LogOut, Flame, Snowflake, Sparkles, Flag, Radio, Circle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { EventVM } from '@/lib/view';
import { onYellow } from '@/lib/theme';
import { clockFromMicros } from '@/lib/avatar';
import { PanelCard } from '@/components/panel-ui';

// Map a server event `type` to an icon + brand color.
const EVENT_STYLE: Record<string, { icon: LucideIcon; color: string }> = {
  user_joined: { icon: Users, color: 'var(--color-green)' },
  user_left: { icon: LogOut, color: 'var(--color-muted-foreground)' },
  ping: { icon: Radio, color: 'var(--color-pink)' },
  huddle_forming: { icon: Sparkles, color: 'var(--color-orange)' },
  huddle_activated: { icon: Flame, color: 'var(--color-red)' },
  huddle_cooling: { icon: Snowflake, color: 'var(--color-blue)' },
  huddle_ended: { icon: Flag, color: 'var(--color-muted-foreground)' },
};

function styleFor(type: string) {
  return EVENT_STYLE[type] ?? { icon: Circle, color: 'var(--color-blue)' };
}

export function ActivityPanel({
  events,
  activeHuddles,
  friendsOut,
  bare = false,
}: {
  events: EventVM[];
  activeHuddles: number;
  friendsOut: number;
  bare?: boolean;
}) {
  return (
    <PanelCard bare={bare} className={bare ? 'flex flex-col' : 'flex h-full flex-col'}>
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-2xl font-black text-foreground">TODAY</h2>
        <div className="flex items-center gap-2 rounded-2xl bg-yellow px-3 py-1.5" style={{ color: onYellow }}>
          <span className="text-center">
            <span className="block text-lg font-black leading-none">{activeHuddles}</span>
            <span className="block text-[10px] font-semibold">Huddles</span>
          </span>
          <span className="h-7 w-px bg-black/15" />
          <span className="text-center">
            <span className="block text-lg font-black leading-none">{friendsOut}</span>
            <span className="block text-[10px] font-semibold">Friends out</span>
          </span>
        </div>
      </div>

      {events.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">Nothing yet — activity shows up here as people join, huddle, and ping.</p>
      ) : (
        <ol className="mt-4 flex flex-1 flex-col gap-4 overflow-y-auto">
          {events.map((item) => {
            const s = styleFor(item.type);
            const Icon = s.icon;
            return (
              <li key={item.id} className="flex gap-3">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
                  style={{ background: `color-mix(in oklab, ${s.color} 16%, transparent)` }}
                >
                  <Icon className="h-5 w-5" style={{ color: s.color }} strokeWidth={2.3} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold" style={{ color: s.color }}>
                    {clockFromMicros(item.micros)}
                  </p>
                  <p className="text-sm font-bold leading-snug text-foreground">{item.message}</p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </PanelCard>
  );
}
