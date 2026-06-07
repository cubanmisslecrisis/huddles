"use client"

import { HuddlesLogo } from "@/components/huddles-logo"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import type { GeoStatus } from "@/hooks/use-live-huddles-data"

export function JoinScreen({
  nameInput,
  roomInput,
  geo,
  onNameChange,
  onRoomChange,
  onJoin,
}: {
  nameInput: string
  roomInput: string
  geo: GeoStatus
  onNameChange: (v: string) => void
  onRoomChange: (v: string) => void
  onJoin: (name: string, roomCode: string) => void
}) {
  return (
    <div className="flex h-dvh flex-col items-center justify-center gap-6 bg-background px-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <HuddlesLogo />
        <p className="max-w-xs text-sm text-muted-foreground">
          Share your location. Gather nearby. Make warmth.
        </p>
      </div>
      <form
        className="flex w-full max-w-xs flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault()
          const name = nameInput.trim()
          const roomCode = roomInput.trim() || "demo"
          if (!name) return
          onJoin(name, roomCode)
        }}
      >
        <div className="flex flex-col gap-2">
          <label htmlFor="join-name" className="text-xs font-medium text-muted-foreground">
            Your Name
          </label>
          <Input
            id="join-name"
            autoFocus
            placeholder="Your name"
            value={nameInput}
            onChange={(e) => onNameChange(e.target.value)}
            className="h-12 rounded-2xl"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="join-room" className="text-xs font-medium text-muted-foreground">
            Room Code
          </label>
          <Input
            id="join-room"
            placeholder="Room code"
            value={roomInput}
            onChange={(e) => onRoomChange(e.target.value)}
            className="h-12 rounded-2xl"
          />
        </div>
        <Button type="submit" variant="brandRed" size="lg" className="h-12 text-base font-bold">
          Get Started
        </Button>
      </form>
      <p className="text-xs text-muted-foreground">
        {geo === "locating" ? "Getting your location…" : "We only use your location while you're in a room."}
      </p>
    </div>
  )
}
