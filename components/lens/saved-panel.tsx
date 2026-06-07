"use client"

import { useState } from "react"
import { resolvePlaceKind, type EntityData } from "@/lib/entity-lookup"
import type { SavedPlace } from "@/lib/huddles-data"
import { getSavedPanelData } from "@/lib/saved-places"
import {
  LensPanelHeader,
  LensPanelList,
  PanelCard,
  lensPanelRowClass,
  lensPanelThumbClass,
  lensPanelTitleClass,
  lensPanelSubtitleClass,
  lensPanelMetaClass,
  PlaceMapIcon,
} from "@/components/panel-ui"
import { Button } from "@/components/ui/button"
import { SelectableCard } from "@/components/selectable-card"
import type { Selection } from "@/lib/selection"
import {
  typeBodyMuted,
  typeEmptyState,
  typeTabLabel,
  claySurfaceVar,
  radiusControl,
  shadowClay,
} from "@/lib/ui-styles"

const FILTERS = ["All", "Cafe", "Food", "Work", "Bars", "Gym", "Events"]

function SavedEmptyState({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
      <p className={typeEmptyState}>{title}</p>
      <p className={`mt-1 ${typeBodyMuted}`}>{subtitle}</p>
    </div>
  )
}

export function SavedPanel({
  onSelect,
  bare = false,
  savedPlaces,
  entityData,
}: {
  onSelect: (s: Selection) => void
  bare?: boolean
  savedPlaces: SavedPlace[]
  entityData: EntityData
}) {
  const [source, setSource] = useState<"saved" | "picks" | "friends">("saved")
  const [filter, setFilter] = useState("All")

  const data = getSavedPanelData(source, filter, savedPlaces, entityData)

  const rows = (() => {
    if (data.kind === "friends-empty") {
      return (
        <SavedEmptyState
          title="No friend picks here yet"
          subtitle="Try another category or check a different circle."
        />
      )
    }
    if (data.kind === "saved" && data.rows.length === 0) {
      return (
        <SavedEmptyState title="No saved places found" subtitle="Try changing your filter." />
      )
    }
    if (data.kind === "friends-filtered-empty") {
      return (
        <SavedEmptyState
          title="No friend picks found"
          subtitle="Try changing your filter or check a different circle."
        />
      )
    }
    if (data.kind === "saved") {
      return data.rows.map((p) => (
        <div key={p.id} className={lensPanelRowClass}>
          <SelectableCard
            onSelect={() => onSelect({ kind: "pin", id: p.pinId })}
            className="flex min-w-0 flex-1 items-center gap-3 text-left"
          >
            <PlaceMapIcon
              kind={resolvePlaceKind({ pinId: p.pinId, category: p.category }, entityData)}
              className={lensPanelThumbClass}
            />
            <div className="min-w-0 flex-1">
              <p className={lensPanelTitleClass}>{p.name}</p>
              <p className={lensPanelSubtitleClass}>
                {p.category} · {p.distanceLabel}
              </p>
            </div>
          </SelectableCard>
        </div>
      ))
    }
    if (data.kind === "friends") {
      return data.rows.map((r) => (
        <div key={r.id} className={lensPanelRowClass}>
          <SelectableCard onSelect={() => {}} className="flex min-w-0 flex-1 items-center gap-3 text-left">
            <PlaceMapIcon kind={resolvePlaceKind({ category: r.category }, entityData)} className={lensPanelThumbClass} />
            <div className="min-w-0 flex-1">
              <p className={lensPanelTitleClass}>{r.name}</p>
              <p className={lensPanelSubtitleClass}>
                {r.category} · {r.distanceLabel}
              </p>
              <p className={lensPanelMetaClass}>{r.by} recommends</p>
            </div>
          </SelectableCard>
        </div>
      ))
    }
    return null
  })()

  return (
    <PanelCard bare={bare} className={bare ? "flex flex-col" : "flex h-full flex-col"}>
      <LensPanelHeader title="Saved" />

      <div className={`mt-5 flex items-center gap-1 ${radiusControl} border-0 bg-card p-1 ${shadowClay} ${claySurfaceVar}`}>
        {(
          [
            { id: "saved", label: "Saved" },
            { id: "picks", label: "Picks" },
            { id: "friends", label: "Friends" },
          ] as const
        ).map((s) => {
          const isActive = source === s.id
          return (
            <Button
              key={s.id}
              onClick={() => setSource(s.id)}
              variant="ghost"
              size="sm"
              clay={false}
              aria-pressed={isActive}
              className={`lens-panel-tab relative flex-1 rounded-lg border-0 bg-transparent ${typeTabLabel} ${claySurfaceVar} active:scale-100`}
            >
              {s.label}
            </Button>
          )
        })}
      </div>

      <div className="-mb-1 mt-4">
        <div className="no-scrollbar overflow-x-auto">
          <div className="flex w-max min-w-full gap-1.5 px-1 pb-4 pt-1">
            {FILTERS.map((f) => {
              const isActive = filter === f
              return (
                <Button
                  key={f}
                  onClick={() => setFilter(f)}
                  variant={isActive ? "default" : "pill"}
                  size="pillSm"
                  clay={isActive ? "soft" : "gentle"}
                  aria-pressed={isActive}
                  className={`shrink-0 border-0 ${typeTabLabel} ${!isActive ? `text-muted-foreground ${claySurfaceVar}` : ""}`}
                >
                  {f}
                </Button>
              )
            })}
          </div>
        </div>
      </div>

      <LensPanelList>
        {data.kind === "picks" ? (
          <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
            <SavedEmptyState
              title="You haven't added any picks yet"
              subtitle="Share your first pick with EEG Fam."
            />
            <Button variant="brandBlue" size="pill" className={`mt-4 h-8 border-0 px-4 ${typeTabLabel}`}>
              Add pick
            </Button>
          </div>
        ) : (
          rows
        )}
      </LensPanelList>
    </PanelCard>
  )
}
