"use client"

import type { ReactNode, KeyboardEvent } from "react"
import { cn } from "@/lib/utils"
import { huddleSelectableRow } from "@/lib/ui-styles"

export function SelectableCard({
  onSelect,
  className,
  children,
}: {
  onSelect: () => void
  className?: string
  children: ReactNode
}) {
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      onSelect()
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={onKeyDown}
      className={cn(huddleSelectableRow, "cursor-pointer", className)}
    >
      {children}
    </div>
  )
}
