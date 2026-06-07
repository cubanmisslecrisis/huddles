"use client"

import { useState } from "react"
import { MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { brandColor } from "@/lib/theme"
import { ResponsiveSheet } from "@/components/flows/responsive-sheet"
import { useSpacetimeDB } from "spacetimedb/react"
import { DbConnection } from "@/lib/module_bindings"

export function AddToMapSheet({
  open,
  onOpenChange,
  mobile,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  mobile?: boolean
}) {
  const [placeName, setPlaceName] = useState("")
  const [note, setNote] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { getConnection } = useSpacetimeDB()

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setPlaceName("")
      setNote("")
      setError(null)
    }
    onOpenChange(isOpen)
  }

  const handleSavePlace = async () => {
    if (!placeName.trim()) {
      setError("Place name cannot be empty")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const conn = getConnection() as DbConnection | null
      if (!conn) throw new Error("Not connected to database")

      await conn.reducers.savePlace({
        placeName: placeName.trim(),
        note: note.trim() || undefined,
      })
      handleOpenChange(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save place"
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const color = brandColor("blue")

  return (
    <ResponsiveSheet open={open} onOpenChange={handleOpenChange} mobile={mobile} clay title="Add to Map">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
            style={{ background: `color-mix(in oklab, ${color} 18%, transparent)` }}
          >
            <MapPin className="h-5 w-5" style={{ color }} />
          </span>
          <div className="min-w-0 flex-1">
            <span className="block text-sm font-bold">Save a place</span>
            <span className="block text-xs font-medium text-muted-foreground">Mark your current location on the map</span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-muted-foreground">Place name *</label>
          <Input
            value={placeName}
            onChange={(e) => setPlaceName(e.target.value)}
            placeholder="e.g., Coffee House, Pizza Palace, Park"
            disabled={isSubmitting}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-muted-foreground">Note (optional)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Why are you saving this place?"
            className="w-full rounded-2xl border border-border bg-card p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue"
            rows={3}
            disabled={isSubmitting}
          />
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <Button
          variant="brandBlue"
          size="lg"
          onClick={handleSavePlace}
          disabled={isSubmitting || !placeName.trim()}
        >
          {isSubmitting ? "Saving..." : "Save Place"}
        </Button>
      </div>
    </ResponsiveSheet>
  )
}
