"use client"

import { useCallback, useRef, useState } from "react"
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { typeButton, typeButtonBold, claySurfaceVar } from "@/lib/ui-styles"

const MIN_SQUISH_MS = 120

const buttonVariants = cva(
  `group/button inline-flex shrink-0 items-center justify-center rounded-xl border-0 ${typeButton} whitespace-nowrap outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4`,
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [--clay-color:var(--primary)]",
        outline:
          `border border-border bg-card text-foreground ${claySurfaceVar}`,
        secondary:
          "bg-secondary text-secondary-foreground [--clay-color:var(--color-secondary)]",
        ghost: `text-foreground ${claySurfaceVar}`,
        destructive:
          "bg-destructive/10 text-destructive",
        link: "text-primary underline-offset-4 hover:underline",
        brand:
          "bg-pink text-white [--clay-color:var(--pink)]",
        brandBlue:
          "bg-blue text-white [--clay-color:var(--blue)]",
        brandOrange:
          "bg-orange text-white [--clay-color:var(--orange)]",
        brandRed:
          "bg-red text-white [--clay-color:var(--red)]",
        brandGreen:
          "bg-green text-white [--clay-color:var(--green)]",
        pill:
          `rounded-full border border-border bg-card ${typeButtonBold} ${claySurfaceVar}`,
      },
      size: {
        default: "h-9 gap-1.5 px-3",
        sm: "h-8 gap-1 rounded-lg px-2.5 text-xs",
        lg: "h-11 gap-2 rounded-2xl px-4 text-sm",
        icon: "size-9 rounded-2xl",
        "icon-lg": "size-11 rounded-2xl",
        "icon-xl": "size-14 rounded-2xl",
        pill: "h-9 gap-1.5 rounded-full px-3.5",
        pillSm: "h-7 gap-1 rounded-full px-3 text-xs",
        pillLg: "h-11 gap-2 rounded-full px-4",
      },
      clay: {
        true: "shadow-clay transition-transform duration-500 ease-[cubic-bezier(0.4,2.5,0.4,0.9)] hover:scale-x-[0.95] hover:scale-y-[1.08] data-pressed:not-aria-[haspopup]:scale-x-[1.15] data-pressed:not-aria-[haspopup]:scale-y-[0.85]",
        soft: "shadow-clay transition-transform duration-500 ease-[cubic-bezier(0.4,2.5,0.4,0.9)] hover:scale-x-[0.96] hover:scale-y-[1.06] data-pressed:not-aria-[haspopup]:scale-x-[1.08] data-pressed:not-aria-[haspopup]:scale-y-[0.91]",
        gentle:
          "shadow-clay transition-transform duration-500 ease-[cubic-bezier(0.4,2.5,0.4,0.9)] hover:scale-x-[0.97] hover:scale-y-[1.05] data-pressed:not-aria-[haspopup]:scale-x-[1.04] data-pressed:not-aria-[haspopup]:scale-y-[0.95]",
        static: "shadow-clay",
        false: "transition-all active:not-aria-[haspopup]:scale-[0.98]",
      },
    },
    compoundVariants: [
      {
        clay: false,
        variant: "default",
        className: "hover:bg-primary/90",
      },
      {
        clay: false,
        variant: "outline",
        className: "hover:bg-secondary",
      },
      {
        clay: false,
        variant: "secondary",
        className: "hover:bg-secondary/80",
      },
      {
        clay: false,
        variant: "ghost",
        className: "hover:bg-secondary",
      },
      {
        clay: false,
        variant: "destructive",
        className: "hover:bg-destructive/20",
      },
      {
        clay: false,
        variant: "brand",
        className: "hover:brightness-105",
      },
      {
        clay: false,
        variant: "brandBlue",
        className: "hover:brightness-105",
      },
      {
        clay: false,
        variant: "brandOrange",
        className: "hover:brightness-105",
      },
      {
        clay: false,
        variant: "brandRed",
        className: "hover:brightness-105",
      },
      {
        clay: false,
        variant: "brandGreen",
        className: "hover:brightness-105",
      },
      {
        clay: false,
        variant: "pill",
        className: "hover:bg-secondary",
      },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
      clay: true,
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  clay = true,
  children,
  disabled,
  onPointerDown,
  onPointerUp,
  onPointerCancel,
  onKeyDown,
  onKeyUp,
  onBlur,
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  const hasClaySquish = clay === true || clay === "soft" || clay === "gentle"
  const [pressed, setPressed] = useState(false)
  const isPressedRef = useRef(false)
  const pressStartRef = useRef(0)
  const releaseTimerRef = useRef<number | null>(null)

  const clearReleaseTimer = useCallback(() => {
    if (releaseTimerRef.current !== null) {
      window.clearTimeout(releaseTimerRef.current)
      releaseTimerRef.current = null
    }
  }, [])

  const beginPress = useCallback(() => {
    clearReleaseTimer()
    isPressedRef.current = true
    pressStartRef.current = Date.now()
    setPressed(true)
  }, [clearReleaseTimer])

  const endPress = useCallback(() => {
    if (!isPressedRef.current) return
    isPressedRef.current = false
    clearReleaseTimer()
    const remaining = Math.max(0, MIN_SQUISH_MS - (Date.now() - pressStartRef.current))
    releaseTimerRef.current = window.setTimeout(() => {
      setPressed(false)
      releaseTimerRef.current = null
    }, remaining)
  }, [clearReleaseTimer])

  const cancelPress = useCallback(() => {
    isPressedRef.current = false
    clearReleaseTimer()
    setPressed(false)
  }, [clearReleaseTimer])

  return (
    <ButtonPrimitive
      data-slot="button"
      data-pressed={pressed ? "" : undefined}
      disabled={disabled}
      className={cn(buttonVariants({ variant, size, clay, className }))}
      onPointerDown={(event) => {
        onPointerDown?.(event)
        if (!hasClaySquish || disabled || event.button !== 0) return
        event.currentTarget.setPointerCapture(event.pointerId)
        beginPress()
      }}
      onPointerUp={(event) => {
        onPointerUp?.(event)
        if (!hasClaySquish || disabled) return
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId)
        }
        endPress()
      }}
      onPointerCancel={(event) => {
        onPointerCancel?.(event)
        if (!hasClaySquish || disabled) return
        cancelPress()
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event)
        if (!hasClaySquish || disabled) return
        if (event.key === " " || event.key === "Enter") beginPress()
      }}
      onKeyUp={(event) => {
        onKeyUp?.(event)
        if (!hasClaySquish || disabled) return
        if (event.key === " " || event.key === "Enter") endPress()
      }}
      onBlur={(event) => {
        onBlur?.(event)
        if (!hasClaySquish || disabled) return
        cancelPress()
      }}
      {...props}
    >
      {hasClaySquish ? (
        <span
          className={cn(
            "inline-flex items-center justify-center gap-[inherit] size-full transition-transform duration-500 ease-[cubic-bezier(0.4,2.5,0.4,0.9)]",
            clay === true &&
              "group-hover/button:scale-x-[1.05] group-hover/button:scale-y-[0.93] group-data-pressed/button:scale-x-[0.87] group-data-pressed/button:scale-y-[1.18]",
            clay === "soft" &&
              "group-hover/button:scale-x-[1.04] group-hover/button:scale-y-[0.95] group-data-pressed/button:scale-x-[0.94] group-data-pressed/button:scale-y-[1.10]",
            clay === "gentle" &&
              "group-hover/button:scale-x-[1.025] group-hover/button:scale-y-[0.975] group-data-pressed/button:scale-x-[0.98] group-data-pressed/button:scale-y-[1.05]"
          )}
        >
          {children}
        </span>
      ) : (
        children
      )}
    </ButtonPrimitive>
  )
}

export { Button, buttonVariants }
