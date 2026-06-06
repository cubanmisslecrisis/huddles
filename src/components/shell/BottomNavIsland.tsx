import { Search, Plus } from 'lucide-react';
import { navTabs, type Lens } from '@/lib/nav-tabs';

export function BottomNavIsland({
  active,
  onChange,
  onSearch,
  onAdd,
}: {
  active: Lens;
  onChange: (lens: Lens) => void;
  onSearch: () => void;
  onAdd: () => void;
}) {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-0 z-40 flex items-end justify-between gap-2 px-4"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
    >
      <nav
        aria-label="Primary"
        className="pointer-events-auto flex h-[68px] items-center gap-1 rounded-[32px] border border-border bg-card/95 px-2 shadow-[0_8px_24px_rgba(20,20,20,0.12)] backdrop-blur-md"
      >
        {navTabs.map((t) => {
          const Icon = t.icon;
          const isActive = active === t.key;
          return (
            <button
              key={t.key}
              onClick={() => onChange(t.key)}
              aria-current={isActive ? 'page' : undefined}
              className="flex min-w-[60px] flex-col items-center gap-0.5 rounded-3xl px-2 py-2 transition"
              style={isActive ? { background: `color-mix(in oklab, ${t.color} 12%, transparent)` } : undefined}
            >
              <Icon
                className="h-[22px] w-[22px]"
                style={{ color: isActive ? t.color : 'var(--color-foreground)' }}
                strokeWidth={2.3}
              />
              <span className="text-[11px] font-bold" style={{ color: isActive ? t.color : 'var(--color-foreground)' }}>
                {t.label}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="pointer-events-auto flex flex-col items-center gap-2.5">
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
  );
}
