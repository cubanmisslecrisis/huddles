import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

// Tiny controlled checkbox (button + aria) — replaces the skeleton's @base-ui checkbox.
export function Checkbox({
  checked = false,
  onCheckedChange,
  className,
}: {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={() => onCheckedChange?.(!checked)}
      className={cn(
        'flex size-5 shrink-0 items-center justify-center rounded-md border border-input bg-card transition-colors outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30',
        checked && 'border-pink bg-pink text-white',
        className
      )}
    >
      {checked && <Check className="size-3.5" strokeWidth={3} />}
    </button>
  );
}
