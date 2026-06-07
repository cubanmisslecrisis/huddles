import type { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/ui/button';

export function SectionHeader({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="font-heading text-base font-extrabold uppercase tracking-wide text-foreground">{title}</h2>
      {action && (
        <Button
          variant="ghost"
          size="sm"
          clay={false}
          onClick={onAction}
          className="h-auto px-0 font-semibold text-muted-foreground hover:bg-transparent hover:text-foreground"
        >
          {action}
        </Button>
      )}
    </div>
  );
}

export function PanelCard({
  children,
  className,
  bare = false,
}: {
  children: ReactNode;
  className?: string;
  /** Drop the bordered-card chrome when already inside a container (e.g. a bottom sheet). */
  bare?: boolean;
}) {
  const base = bare ? '' : 'rounded-2xl border border-border bg-card p-4 shadow-[0_4px_14px_rgba(20,20,20,0.05)]';
  return <section className={`${base} ${className ?? ''}`}>{children}</section>;
}

export function PingButton({ onClick }: { onClick?: () => void }) {
  return (
    <Button
      variant="brand"
      size="pill"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
        <path d="M4 12h2M9 6v12M15 3v18M20 9v6" />
      </svg>
      Ping
    </Button>
  );
}

export function AvatarStack({ people, size = 6 }: { people: { key: string; name: string }[]; size?: number }) {
  return (
    <div className="flex -space-x-2">
      {people.map((p) => (
        <Avatar key={p.key} name={p.name} colorKey={p.key} size={size * 4} className="border-2 border-card" />
      ))}
    </div>
  );
}

export function FooterButton({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <Button
      variant="outline"
      size="lg"
      onClick={onClick}
      className="w-full rounded-2xl font-bold border-0 [--clay-color:var(--color-border)]"
    >
      {label}
      <ChevronRight className="h-4 w-4" />
    </Button>
  );
}
