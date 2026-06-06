import { Trophy } from 'lucide-react';
import type { ScoreVM } from '@/lib/view';
import { Avatar } from '@/components/Avatar';
import { PanelCard } from '@/components/panel-ui';

export function RankingsPanel({ board, bare = false }: { board: ScoreVM[]; bare?: boolean }) {
  return (
    <PanelCard bare={bare} className={bare ? 'flex flex-col' : 'flex h-full flex-col'}>
      <div className="flex items-center gap-2">
        <Trophy className="h-6 w-6 text-pink" />
        <h2 className="font-heading text-2xl font-black text-foreground">City Leaderboard</h2>
      </div>

      {board.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">No warmth points yet — form a huddle to start scoring.</p>
      ) : (
        <ol className="mt-3 flex flex-col gap-2">
          {board.map((s, i) => (
            <li
              key={s.key}
              className={`flex items-center gap-3 rounded-2xl px-2.5 py-2 ${s.isMe ? 'bg-pink/10' : ''}`}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-black text-foreground">
                {i + 1}
              </span>
              <Avatar name={s.name} colorKey={s.key} size={38} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-foreground">
                  {s.name}
                  {s.isMe ? ' (you)' : ''}
                </p>
                <p className="text-xs text-muted-foreground">{s.huddlesJoined} huddles</p>
              </div>
              <span className="shrink-0 rounded-full bg-warmth/15 px-3 py-1 text-sm font-black text-warmth">
                {s.warmthPoints}°
              </span>
            </li>
          ))}
        </ol>
      )}
    </PanelCard>
  );
}
