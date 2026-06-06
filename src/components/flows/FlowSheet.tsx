import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

// A modal bottom sheet for the flows (Ping / Add / Profile). Mobile-only — the
// skeleton's responsive sheet+dialog collapses to just this.
export function FlowSheet({
  open,
  onOpenChange,
  title,
  children,
  footer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/30 supports-[backdrop-filter]:backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      <div className="absolute inset-x-0 bottom-0 max-h-[88dvh] overflow-y-auto rounded-t-[28px] border border-border bg-card p-5 pb-[calc(env(safe-area-inset-bottom,0px)+20px)] shadow-[0_-8px_32px_rgba(20,20,20,0.16)]">
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-border" />
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="min-w-0 font-heading text-2xl font-black text-foreground">{title}</div>
          <Button variant="secondary" size="icon" className="shrink-0 rounded-full" onClick={() => onOpenChange(false)} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>
        {children}
        {footer && <div className="mt-4 flex gap-2">{footer}</div>}
      </div>
    </div>
  );
}
