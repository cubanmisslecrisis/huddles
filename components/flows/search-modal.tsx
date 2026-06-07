"use client"

import { useMemo, useState } from "react"
import { Search } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { huddleInput, typeLinkAction, typeListTitle, typeSectionLabelMuted } from "@/lib/ui-styles"
import { cn } from "@/lib/utils"
import type { EntityData } from "@/lib/entity-lookup"
import type { Selection } from "@/lib/selection"

type Result = {
  id: string
  title: string
  subtitle: string
  avatar?: string
  selection: Exclude<Selection, null>
}

type Group = { label: string; items: Result[] }

function buildGroups(query: string, data: EntityData): Group[] {
  const q = query.trim().toLowerCase()
  const match = (s: string) => !q || s.toLowerCase().includes(q)

  const friendItems: Result[] = data.friends
    .filter((f) => match(f.name) || match(f.placeName ?? ""))
    .map((f) => ({
      id: f.id,
      title: f.name,
      subtitle: f.placeName ? `At ${f.placeName}` : f.lastSeenLabel,
      avatar: f.avatar,
      selection: { kind: "friend", id: f.id },
    }))

  const huddleItems: Result[] = data.huddles
    .filter((h) => match(h.name) || match(h.placeName))
    .map((h) => ({
      id: h.id,
      title: h.name,
      subtitle: `${h.memberCount} people · ${h.placeName}`,
      avatar: h.thumbnail,
      selection: { kind: "huddle", id: h.id },
    }))

  const placeItems: Result[] = data.recommendations
    .filter((r) => match(r.placeName) || match(r.category))
    .map((r) => ({
      id: r.id,
      title: r.placeName,
      subtitle: `${r.category} · ${r.distanceLabel}`,
      avatar: r.thumbnail,
      selection: { kind: "pin", id: r.pinId },
    }))

  const savedItems: Result[] = data.yourPicks
    .filter((p) => match(p.name) || match(p.category))
    .map((p) => ({
      id: p.id,
      title: p.name,
      subtitle: `${p.category} · ${p.distanceLabel}`,
      avatar: p.thumbnail,
      selection: { kind: "pin", id: p.pinId },
    }))

  return [
    { label: "Friends", items: friendItems },
    { label: "Places", items: placeItems },
    { label: "Huddles", items: huddleItems },
    { label: "Saved", items: savedItems },
  ].filter((g) => g.items.length > 0)
}

export function SearchModal({
  open,
  onOpenChange,
  onPick,
  entityData,
  mobile,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPick: (s: Exclude<Selection, null>) => void
  entityData: EntityData
  mobile?: boolean
}) {
  const [query, setQuery] = useState("")
  const groups = useMemo(() => buildGroups(query, entityData), [query, entityData])

  const pick = (s: Exclude<Selection, null>) => {
    onPick(s)
    onOpenChange(false)
    setQuery("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={!mobile}
        className={cn(
          mobile
            ? "inset-0 top-0 left-0 h-dvh max-h-none w-full max-w-none translate-x-0 translate-y-0 rounded-none p-0 pt-[calc(env(safe-area-inset-top,0px))] sm:max-w-none"
            : "max-w-xl p-5"
        )}
      >
        <div className={cn("flex flex-col gap-3", mobile && "h-full p-4")}>
          <div className="relative flex items-center">
            <Search className="pointer-events-none absolute left-4 z-10 h-5 w-5 text-muted-foreground" />
            <Input
              autoFocus
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search friends, places, huddles..."
              className={cn(huddleInput, "pl-12", mobile && "pr-16")}
            />
            {mobile && (
              <button
                onClick={() => onOpenChange(false)}
                className={`absolute right-3 ${typeLinkAction}`}
              >
                Cancel
              </button>
            )}
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
            {groups.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No results found.</p>
            ) : (
              groups.map((g) => (
                <div key={g.label}>
                  <p className={`mb-1.5 ${typeSectionLabelMuted}`}>
                    {g.label}
                  </p>
                  <div className="flex flex-col">
                    {g.items.map((it) => (
                      <button
                        key={`${g.label}-${it.id}`}
                        onClick={() => pick(it.selection)}
                        className="flex items-center gap-3 rounded-2xl px-2 py-2 text-left transition hover:bg-secondary"
                      >
                        <img
                          src={it.avatar || "/placeholder.svg"}
                          alt=""
                          className="h-10 w-10 rounded-full object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <p className={`truncate ${typeListTitle}`}>{it.title}</p>
                          <p className="truncate text-xs text-muted-foreground">{it.subtitle}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
