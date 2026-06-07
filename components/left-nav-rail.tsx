"use client"

import { Plus } from "lucide-react"
import { navTabs as tabs, type Lens } from "@/lib/nav-tabs"
import { brandColor, semanticColor } from "@/lib/theme"
import { claySurfaceVar } from "@/lib/ui-styles"
import { Button } from "@/components/ui/button"
import { HuddlesLogo } from "@/components/huddles-logo"
import { PingIcon } from "@/components/ping-icon"

export type { Lens }

export function renderTabIcon(t: typeof tabs[0], isActive: boolean) {
  const { key, icon: Icon, animClass } = t
  const displayColor = isActive ? "#ffffff" : semanticColor("foreground")

  if (isActive && key === "map") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`h-6 w-6 shrink-0 ${animClass}`}
        style={{ color: displayColor }}
      >
        <defs>
          <mask id="map-filled-mask">
            <rect width="24" height="24" fill="white" stroke="none" />
            <circle cx="12" cy="10" r="3.2" fill="black" stroke="none" />
          </mask>
        </defs>
        <path
          d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"
          mask="url(#map-filled-mask)"
        />
      </svg>
    )
  }

  return (
    <Icon
      className={`h-6 w-6 shrink-0 ${animClass}`}
      style={{ color: displayColor }}
      fill={isActive ? "currentColor" : "none"}
      strokeWidth={2.4}
    />
  )
}

export function LeftNavRail({
  active,
  onChange,
  onAdd,
  onPing,
  onOpenProfile,
  me,
}: {
  active: Lens
  onChange: (lens: Lens) => void
  onAdd: () => void
  onPing: () => void
  onOpenProfile: () => void
  me: { id: string; name: string; avatar: string }
}) {
  return (
    <nav
      aria-label="Primary"
      className="flex w-24 shrink-0 flex-col items-center gap-4 py-0"
    >
      <div className="flex w-24 shrink-0 justify-center items-center h-20 overflow-visible">
        <HuddlesLogo className="h-11 w-auto" style={{ color: brandColor("red") }} />
      </div>

      <div className="flex w-full flex-col items-center gap-4">
        {tabs.map((t) => {
          const Icon = t.icon
          const isActive = active === t.key
          return (
            <Button
              key={t.key}
              onClick={() => onChange(t.key)}
              aria-current={isActive ? "page" : undefined}
              aria-label={t.label}
              variant={isActive ? "brandRed" : "outline"}
              size="icon-xl"
              className={`group ${!isActive ? claySurfaceVar : ""}`}
            >
              {renderTabIcon(t, isActive)}
            </Button>
          )
        })}
      </div>

      <div className="mt-auto flex flex-col items-center gap-4">
        <Button
          onClick={onAdd}
          aria-label="Add to Map"
          variant="brandRed"
          size="icon-xl"
          className="group rounded-full"
        >
          <Plus className="h-7 w-7 transition-transform duration-300 ease-out group-hover:scale-125 group-hover:rotate-90" strokeWidth={2.6} />
        </Button>

        <Button
          onClick={onPing}
          aria-label="Ping Friends"
          variant="outline"
          size="icon-xl"
          className={`group rounded-full ${claySurfaceVar}`}
        >
          <PingIcon className="h-6 w-6 scale-[1.2] transition-transform duration-300 ease-out group-hover:scale-[1.4] group-hover:-rotate-12" />
        </Button>


        <div className="pt-2">
          <Button
            variant="ghost"
            aria-label="Your profile"
            className="h-14 w-14 rounded-full p-0"
            onClick={onOpenProfile}
          >
            <img
              src={me.avatar || "/placeholder.svg"}
              alt="Your profile"
              className="h-14 w-14 rounded-full object-cover ring-2 ring-red ring-offset-2 ring-offset-background"
            />
          </Button>
        </div>
      </div>
    </nav>
  )
}
