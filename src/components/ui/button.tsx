import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// Variant/size maps ported from the skeleton's shadcn button; rendered over a native
// <button> (no @base-ui dependency).
export const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-xl border border-transparent text-sm font-semibold whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        outline: 'border-border bg-card text-foreground shadow-sm hover:bg-secondary',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-secondary text-foreground',
        destructive: 'bg-destructive/10 text-destructive hover:bg-destructive/20',
        link: 'text-primary underline-offset-4 hover:underline',
        brand: 'bg-pink text-white shadow-sm hover:brightness-105',
        brandBlue: 'bg-blue text-white shadow-sm hover:brightness-105',
        brandOrange: 'bg-orange text-white shadow-sm hover:brightness-105',
        pill: 'rounded-full border-border bg-card font-bold shadow-sm hover:bg-secondary',
      },
      size: {
        default: 'h-9 gap-1.5 px-3',
        sm: 'h-8 gap-1 rounded-lg px-2.5 text-xs',
        lg: 'h-11 gap-2 rounded-2xl px-4 text-sm',
        icon: 'size-9 rounded-2xl',
        'icon-lg': 'size-11 rounded-2xl',
        pill: 'h-9 gap-1.5 rounded-full px-3.5',
        pillLg: 'h-11 gap-2 rounded-full px-4',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export function Button({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<'button'> & VariantProps<typeof buttonVariants>) {
  return (
    <button data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />
  );
}
