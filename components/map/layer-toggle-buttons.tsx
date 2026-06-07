"use client"

import { Button } from "@/components/ui/button"
import { brandTintBackground } from "@/lib/theme"
import { layerIconAnimation, layerIcons } from "@/lib/map-layer-icons"
import { layers, type LayerKey } from "@/lib/huddles-data"

export function LayerToggleButtons({
  activeLayers,
  onToggleLayer,
}: {
  activeLayers: Record<LayerKey, boolean>
  onToggleLayer: (k: LayerKey) => void
}) {
  return (
    <>
      {layers.map((l) => {
        const Icon = layerIcons[l.key]
        const on = activeLayers[l.key]
        const iconAnim = layerIconAnimation(l.key)

        return (
          <Button
            key={l.key}
            variant={on ? "secondary" : "ghost"}
            size="pillSm"
            clay={false}
            onClick={() => onToggleLayer(l.key)}
            aria-pressed={on}
            className={`group ${
              on
                ? "text-foreground shadow-sm transition-all duration-200 ease-out hover:scale-[1.04] hover:-translate-y-px active:scale-[0.98]"
                : "text-muted-foreground transition-all duration-200 ease-out hover:scale-[1.04] hover:-translate-y-px hover:bg-secondary/80 active:scale-[0.98]"
            }`}
            style={on ? { background: brandTintBackground(l.color) } : undefined}
          >
            <Icon
              className={`h-4 w-4 transition-transform duration-300 ease-out ${iconAnim}`}
              style={{ color: on ? l.color : undefined }}
              fill={on ? "currentColor" : "none"}
            />
            <span className="hidden lg:inline">{l.label}</span>
          </Button>
        )
      })}
    </>
  )
}
