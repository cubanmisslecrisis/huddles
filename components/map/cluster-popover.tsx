"use client"

import { useEffect, useRef } from "react"
import type { MapMarkerModel } from "@/lib/map-markers-model"
import { selectionFromModel } from "@/lib/map-markers-model"
import type { Selection } from "@/lib/selection"
import { markerSubtitle, markerTitle } from "@/lib/marker-labels"
import { typeBodyStrong, typePopoverSection, huddlePopoverFloat, radiusControl, huddleSelectableRow } from "@/lib/ui-styles"

export function ClusterPopover({
  members,
  onSelect,
  onClose,
}: {
  members: MapMarkerModel[]
  onSelect: (s: Selection) => void
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("mousedown", handleClick)
    document.addEventListener("keydown", handleKey)
    return () => {
      document.removeEventListener("mousedown", handleClick)
      document.removeEventListener("keydown", handleKey)
    }
  }, [onClose])

  const sorted = [...members].sort((a, b) => a.priority - b.priority)

  return (
    <div
      ref={ref}
      className={huddlePopoverFloat}
      role="dialog"
      aria-label="Nearby places"
    >
      <p className={`px-2 pb-1 ${typePopoverSection}`}>Here</p>
      <ul className="flex flex-col gap-0.5">
        {sorted.map((m) => (
          <li key={`${m.kind}-${m.id}`}>
            <button
              type="button"
              className={`flex w-full flex-col ${radiusControl} px-2 py-1.5 text-left transition-colors ${huddleSelectableRow}`}
              onClick={() => {
                const sel = selectionFromModel(m)
                if (sel) onSelect(sel)
                onClose()
              }}
            >
              <span className={typeBodyStrong}>{markerTitle(m)}</span>
              {markerSubtitle(m) && (
                <span className="text-xs text-muted-foreground">{markerSubtitle(m)}</span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
