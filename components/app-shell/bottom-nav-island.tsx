"use client"

import { Plus } from "lucide-react"
import { navTabs, type Lens } from "@/lib/nav-tabs"
import { shadowClay, claySurfaceVar } from "@/lib/ui-styles"
import { Button } from "@/components/ui/button"
import { renderTabIcon } from "@/components/left-nav-rail"
import { PingIcon } from "@/components/ping-icon"

export function BottomNavIsland({
  active,
  onChange,
  onPing,
  onAdd,
}: {
  active: Lens
  onChange: (lens: Lens) => void
  onPing: () => void
  onAdd: () => void
}) {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-0 z-40 flex items-end justify-between gap-2 px-4"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)" }}
    >
      <nav
        aria-label="Primary"
        className={`pointer-events-auto flex items-center gap-3 rounded-full border-0 bg-card px-5 py-2.5 ${shadowClay} ${claySurfaceVar}`}
      >
        {navTabs.map((t) => {
          const isActive = active === t.key
          return (
            <Button
              key={t.key}
              onClick={() => onChange(t.key)}
              aria-current={isActive ? "page" : undefined}
              aria-label={t.label}
              variant={isActive ? "brandRed" : "outline"}
              size="icon-xl"
              className={`group rounded-full ${!isActive ? claySurfaceVar : ""}`}
            >
              {renderTabIcon(t, isActive)}
            </Button>
          )
        })}
      </nav>

      <div className="pointer-events-auto flex flex-col items-center gap-2.5 pb-2.5">
        <Button
          onClick={onPing}
          aria-label="Ping Friends"
          variant="outline"
          size="icon-xl"
          className={`group rounded-full ${claySurfaceVar}`}
        >
          <PingIcon className="h-6 w-6 scale-[1.2] transition-transform duration-300 ease-out group-hover:scale-[1.4] group-hover:-rotate-12" />
        </Button>
        <Button
          onClick={onAdd}
          aria-label="Add to Map"
          variant="brandRed"
          size="icon-xl"
          className="rounded-full"
        >
          <Plus className="h-7 w-7 transition-transform duration-300 ease-out group-hover:scale-125 group-hover:rotate-90" strokeWidth={2.6} />
        </Button>
      </div>
    </div>
  )
}
