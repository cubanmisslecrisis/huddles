import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

export type SheetState = 'peek' | 'half' | 'full';

const PEEK_PX = 180;

/** Distance (px) from the top of the viewport for each snap state. */
function offsetsFor(viewportH: number): Record<SheetState, number> {
  return {
    peek: Math.max(viewportH - PEEK_PX, 0),
    half: Math.round(viewportH * 0.5),
    full: Math.round(viewportH * 0.1),
  };
}

const ORDER: SheetState[] = ['peek', 'half', 'full'];

export function BottomSheet({
  state,
  onStateChange,
  children,
  header,
}: {
  state: SheetState;
  onStateChange: (s: SheetState) => void;
  children: ReactNode;
  header?: ReactNode;
}) {
  const [viewportH, setViewportH] = useState(0);
  const [dragY, setDragY] = useState<number | null>(null);
  const dragStart = useRef<{ y: number; base: number } | null>(null);

  useEffect(() => {
    const update = () => setViewportH(window.innerHeight);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const offsets = offsetsFor(viewportH || 800);
  const top = dragY ?? offsets[state];

  const snapTo = useCallback(
    (y: number) => {
      let best: SheetState = state;
      let bestDist = Infinity;
      for (const s of ORDER) {
        const d = Math.abs(offsets[s] - y);
        if (d < bestDist) {
          bestDist = d;
          best = s;
        }
      }
      onStateChange(best);
    },
    [offsets, onStateChange, state]
  );

  const onPointerDown = (e: React.PointerEvent) => {
    dragStart.current = { y: e.clientY, base: offsets[state] };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragStart.current) return;
    const delta = e.clientY - dragStart.current.y;
    const next = Math.min(Math.max(dragStart.current.base + delta, offsets.full), offsets.peek);
    setDragY(next);
  };

  const onPointerUp = () => {
    if (dragStart.current && dragY !== null) snapTo(dragY);
    dragStart.current = null;
    setDragY(null);
  };

  return (
    <div role="dialog" aria-modal="false" className="pointer-events-none fixed inset-x-0 bottom-0 z-30" style={{ top: 0 }}>
      <div
        className="pointer-events-auto absolute inset-x-0 bottom-0 flex flex-col rounded-t-[28px] border border-border bg-card shadow-[0_-8px_32px_rgba(20,20,20,0.16)]"
        style={{ top, transition: dragY === null ? 'top 0.32s cubic-bezier(0.32,0.72,0,1)' : 'none' }}
      >
        <div
          className="shrink-0 cursor-grab touch-none select-none pt-2.5 active:cursor-grabbing"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <div className="mx-auto h-1.5 w-10 rounded-full bg-border" />
          {header && <div className="px-4 pb-1 pt-3">{header}</div>}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[calc(env(safe-area-inset-bottom,0px)+112px)] pt-2">
          {children}
        </div>
      </div>
    </div>
  );
}
