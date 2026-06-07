"use client"

import { Smile, UserCog, Eye, Bell, Users, Lock, CircleUser, ChevronRight, LogOut } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { ResponsiveSheet } from "@/components/flows/responsive-sheet"
import { Button } from "@/components/ui/button"
import { typeBodyStrong } from "@/lib/ui-styles"

const items: { label: string; icon: LucideIcon }[] = [
  { label: "Customize avatar", icon: Smile },
  { label: "Edit profile", icon: UserCog },
  { label: "Visibility settings", icon: Eye },
  { label: "Notification settings", icon: Bell },
  { label: "Circle settings", icon: Users },
  { label: "Privacy", icon: Lock },
  { label: "Account", icon: CircleUser },
]

export function ProfileSettings({
  open,
  onOpenChange,
  mobile,
  me,
  onLeave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  mobile?: boolean
  me: {
    id: string
    name: string
    avatar: string
    roomName?: string
    roomCode?: string
    warmthPoints?: number
    huddlesJoined?: number
  }
  onLeave: () => void
}) {
  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={onOpenChange}
      mobile={mobile}
      clay
      title={
        <span className="flex items-center gap-3">
          <img
            src={me.avatar || "/placeholder.svg"}
            alt=""
            className="h-11 w-11 rounded-full object-cover ring-2 ring-red ring-offset-2 ring-offset-card"
          />
          <span>
            <span className="block font-bold">{me.name}</span>
            {me.roomCode ? (
              <span className="block text-xs font-medium text-muted-foreground">
                {me.roomName} · {me.warmthPoints ?? 0} warmth · {me.huddlesJoined ?? 0} huddles
              </span>
            ) : null}
          </span>
        </span>
      }
    >
      <div className="flex flex-col">
        {items.map((it) => {
          const Icon = it.icon
          return (
            <button
              key={it.label}
              onClick={() => onOpenChange(false)}
              className="flex items-center gap-3 rounded-2xl px-2 py-3 text-left transition hover:bg-secondary"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
                <Icon className="h-5 w-5 text-foreground" strokeWidth={2.2} />
              </span>
              <span className={`flex-1 ${typeBodyStrong}`}>{it.label}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          )
        })}
        <Button
          variant="outline"
          size="lg"
          className="mt-4 w-full border-0"
          onClick={() => {
            onLeave()
            onOpenChange(false)
          }}
        >
          <LogOut className="h-4 w-4" />
          Leave room
        </Button>
      </div>
    </ResponsiveSheet>
  )
}
