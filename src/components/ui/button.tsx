import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// Variant/size maps ported from the skeleton's shadcn button; rendered over a native
// <button> (no @base-ui dependency). The `clay` variant is the claymorphic look:
// a soft `shadow-clay` (tinted by each variant's `--clay-color`) plus a springy
// hover/press squish. `clay` defaults to true so the whole app inherits the look.
export const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-xl border border-transparent text-sm font-semibold whitespace-nowrap outline-none select-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground [--clay-color:var(--primary)]',
        outline: 'border-border bg-card text-foreground [--clay-color:var(--color-border)]',
        secondary: 'bg-secondary text-secondary-foreground [--clay-color:var(--color-secondary)]',
        ghost: 'text-foreground [--clay-color:var(--color-border)]',
        destructive: 'bg-destructive/10 text-destructive',
        link: 'text-primary underline-offset-4 hover:underline',
        brand: 'bg-pink text-white [--clay-color:var(--pink)]',
        brandBlue: 'bg-blue text-white [--clay-color:var(--blue)]',
        brandOrange: 'bg-orange text-white [--clay-color:var(--orange)]',
        brandRed: 'bg-red text-white [--clay-color:var(--red)]',
        pill: 'rounded-full border-border bg-card font-bold [--clay-color:var(--color-border)]',
      },
      size: {
        default: 'h-9 gap-1.5 px-3',
        sm: 'h-8 gap-1 rounded-lg px-2.5 text-xs',
        lg: 'h-11 gap-2 rounded-2xl px-4 text-sm',
        icon: 'size-9 rounded-2xl',
        'icon-lg': 'size-11 rounded-2xl',
        'icon-xl': 'size-14 rounded-2xl',
        pill: 'h-9 gap-1.5 rounded-full px-3.5',
        pillSm: 'h-7 gap-1 rounded-full px-3 text-xs',
        pillLg: 'h-11 gap-2 rounded-full px-4',
      },
      clay: {
        true: 'shadow-clay transition-transform duration-500 ease-[cubic-bezier(0.4,2.5,0.4,0.9)] hover:scale-x-[0.95] hover:scale-y-[1.08] active:scale-x-[1.15] active:scale-y-[0.85]',
        static: 'shadow-clay',
        false: 'transition-all active:scale-[0.98]',
      },
    },
    compoundVariants: [
      { clay: false, variant: 'default', className: 'hover:bg-primary/90' },
      { clay: false, variant: 'outline', className: 'shadow-sm hover:bg-secondary' },
      { clay: false, variant: 'secondary', className: 'hover:bg-secondary/80' },
      { clay: false, variant: 'ghost', className: 'hover:bg-secondary' },
      { clay: false, variant: 'destructive', className: 'hover:bg-destructive/20' },
      { clay: false, variant: 'brand', className: 'shadow-sm hover:brightness-105' },
      { clay: false, variant: 'brandBlue', className: 'shadow-sm hover:brightness-105' },
      { clay: false, variant: 'brandOrange', className: 'shadow-sm hover:brightness-105' },
      { clay: false, variant: 'brandRed', className: 'shadow-sm hover:brightness-105' },
      { clay: false, variant: 'pill', className: 'shadow-sm hover:bg-secondary' },
    ],
    defaultVariants: {
      variant: 'default',
      size: 'default',
      clay: true,
    },
  }
);

export function Button({
  className,
  variant = 'default',
  size = 'default',
  clay = true,
  children,
  ...props
}: React.ComponentProps<'button'> & VariantProps<typeof buttonVariants>) {
  return (
    <button data-slot="button" className={cn(buttonVariants({ variant, size, clay, className }))} {...props}>
      {clay === true ? (
        <span className="inline-flex items-center justify-center gap-[inherit] size-full transition-transform duration-500 ease-[cubic-bezier(0.4,2.5,0.4,0.9)] group-hover/button:scale-x-[1.05] group-hover/button:scale-y-[0.93] group-active/button:scale-x-[0.87] group-active/button:scale-y-[1.18]">
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
