"use client"

import type { ReactNode } from "react"
import { Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { huddleSearchBar } from "@/lib/ui-styles"

export function HuddleSearchBar({
  placeholder = "Search friends, places, huddles...",
  className,
  children,
  inputClassName,
  readOnly,
  onActivate,
}: {
  placeholder?: string
  className?: string
  children?: ReactNode
  inputClassName?: string
  readOnly?: boolean
  onActivate?: () => void
}) {
  return (
    <div className={cn(huddleSearchBar, onActivate && "cursor-pointer", className)}>
      <Search className="pointer-events-none h-5 w-5 shrink-0 text-muted-foreground mr-3" />
      <input
        type="search"
        placeholder={placeholder}
        readOnly={readOnly}
        onFocus={(e) => {
          if (!onActivate) return
          onActivate()
          e.target.blur()
        }}
        onClick={() => onActivate?.()}
        className={cn(
          "min-w-0 flex-1 h-full border-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground focus:ring-0 focus:outline-none",
          onActivate && "cursor-pointer",
          inputClassName
        )}
      />
      {children ? <div className="flex shrink-0 items-center gap-1">{children}</div> : null}
    </div>
  )
}
