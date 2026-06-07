"use client"

import { Bookmark } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PingIcon } from "@/components/ping-icon"
import { typeButtonBold } from "@/lib/ui-styles"

export const panelShellClass = (bare: boolean) => (bare ? "flex flex-col" : "flex h-full flex-col")
export const panelRowActionShellClass = "shrink-0 pr-1.5"

type PanelRowActionVariant = "brandBlue" | "brand" | "brandRed" | "brandGreen"

/** Right-panel row actions: Join = red, Save = blue, Ping = green. */
export function panelActionVariant(label: string): PanelRowActionVariant {
  switch (label) {
    case "Join":
      return "brandRed"
    case "Save":
      return "brandBlue"
    case "Ping":
      return "brandGreen"
    default:
      return "brandBlue"
  }
}

export function PanelRowAction({
  label,
  variant,
  onClick,
}: {
  label: string
  variant?: PanelRowActionVariant
  onClick?: () => void
}) {
  const resolvedVariant = variant ?? panelActionVariant(label)

  return (
    <div className={panelRowActionShellClass} onClick={(e) => e.stopPropagation()}>
      <Button variant={resolvedVariant} size="pill" className={typeButtonBold} onClick={onClick}>
        {label === "Ping" ? <PingIcon /> : label === "Save" ? <Bookmark className="h-4 w-4" /> : null}
        {label}
      </Button>
    </div>
  )
}
