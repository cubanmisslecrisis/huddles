"use client"

import { useState } from "react"
import type { FriendPresence } from "@/lib/huddles-data"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ResponsiveSheet } from "@/components/flows/responsive-sheet"
import { typeListTitle } from "@/lib/ui-styles"

const radiusOptions = ["Nearby", "0.5 mi", "1 mi", "2 mi"] as const

export function PingNearbySheet({
  open,
  onOpenChange,
  mobile,
  friends,
  onPing,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  mobile?: boolean
  friends: FriendPresence[]
  onPing: () => void
}) {
  const nearby = friends.filter((f) => f.status !== "stale")
  const [radius, setRadius] = useState<(typeof radiusOptions)[number]>("Nearby")
  const [selected, setSelected] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(nearby.map((f) => [f.id, true]))
  )

  const toggle = (id: string) => setSelected((prev) => ({ ...prev, [id]: !prev[id] }))

  const handlePing = () => {
    onPing()
    onOpenChange(false)
  }

  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={onOpenChange}
      mobile={mobile}
      clay
      title="Ping Friends"
      footer={
        <>
          <Button variant="outline" size="lg" clay="gentle" className="flex-1 border-0" onClick={handlePing}>
            Ping selected
          </Button>
          <Button variant="brandGreen" size="lg" clay="gentle" className="flex-1 border-0" onClick={handlePing}>
            Ping all nearby
          </Button>
        </>
      }
    >
      <div className="-m-2 flex flex-wrap gap-2 p-2">
        {radiusOptions.map((r) => {
          const isActive = radius === r
          return (
            <Button
              key={r}
              onClick={() => setRadius(r)}
              variant={isActive ? "default" : "secondary"}
              size="pill"
              clay={isActive ? "soft" : "gentle"}
              aria-pressed={isActive}
              className="shrink-0 border-0"
            >
              {r}
            </Button>
          )
        })}
      </div>

      <div className="flex flex-col divide-y divide-border">
        {nearby.map((f) => (
          <label key={f.id} className="flex cursor-pointer items-center gap-3 py-3">
            <img src={f.avatar || "/placeholder.svg"} alt="" className="h-10 w-10 rounded-full object-cover" />
            <div className="min-w-0 flex-1">
              <p className={typeListTitle}>{f.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {f.distanceLabel}
                {f.placeName ? ` · At ${f.placeName}` : ""}
              </p>
            </div>
            <Checkbox checked={!!selected[f.id]} onCheckedChange={() => toggle(f.id)} />
          </label>
        ))}
      </div>
    </ResponsiveSheet>
  )
}
