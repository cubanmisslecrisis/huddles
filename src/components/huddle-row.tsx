import { Users, Flame } from 'lucide-react';
import type { HuddleVM } from '@/lib/view';
import { huddleStatusColor, huddleStatusLabel } from '@/lib/theme';
import { distanceLabel } from '@/lib/avatar';

export function HuddleRow({ huddle, onSelect }: { huddle: HuddleVM; onSelect: () => void }) {
  const color = huddleStatusColor(huddle.status);
  const title =
    huddle.memberNames.length > 0
      ? `${huddle.memberNames[0]}${huddle.memberCount > 1 ? ` +${huddle.memberCount - 1}` : ''}`
      : `Huddle of ${huddle.memberCount}`;
  const meta =
    `${huddleStatusLabel(huddle.status)}` +
    (huddle.distanceMeters != null ? ` · ${distanceLabel(huddle.distanceMeters)}` : '') +
    ` · ${Math.round(huddle.warmth)}° warmth`;

  return (
    <button onClick={onSelect} className="flex w-full items-center gap-3 text-left">
      <span
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
        style={{ background: `color-mix(in oklab, ${color} 16%, transparent)` }}
      >
        <Flame className="h-5 w-5" style={{ color }} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-sm font-bold text-foreground">{title}</p>
          <span className="flex items-center gap-0.5 text-xs font-semibold text-muted-foreground">
            <Users className="h-3 w-3" /> {huddle.memberCount}
          </span>
        </div>
        <p className="truncate text-xs text-muted-foreground">{meta}</p>
      </div>
      <span className="shrink-0 rounded-full px-4 py-1.5 text-sm font-bold text-white" style={{ background: color }}>
        {huddle.includesMe ? "You're in" : huddle.status === 'active' ? 'Active' : 'View'}
      </span>
    </button>
  );
}
