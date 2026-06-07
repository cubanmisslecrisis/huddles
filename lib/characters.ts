"use client"

import { createContext, useContext } from "react"

export type Character = {
  id: string
  path: string
  persona: string
  desc: string
}

export const CHARACTERS: Character[] = [
  {
    id: "sensei",
    path: "/characters/sensei.webp",
    persona: "The Anchor",
    desc: "Wise and still. Friends orbit you — where you sit, the huddle forms.",
  },
  {
    id: "gary",
    path: "/characters/gary.webp",
    persona: "The Connector",
    desc: "You engineer the moment. One text from you and everyone shows up.",
  },
  {
    id: "rookie",
    path: "/characters/rookie.webp",
    persona: "The Explorer",
    desc: "Never the same spot twice. You keep the squad moving and guessing.",
  },
  {
    id: "bookworm",
    path: "/characters/bookworm.webp",
    persona: "The Loyalist",
    desc: "Deep hangs with a tight crew. You show up, every time, no excuses.",
  },
  {
    id: "hippie",
    path: "/characters/hippie.webp",
    persona: "The Social Butterfly",
    desc: "Effortlessly social. You make strangers feel like old friends.",
  },
  {
    id: "klutzy",
    path: "/characters/klutzy.webp",
    persona: "The Night Owl",
    desc: "Late nights, last to leave. Your best hangouts start after midnight.",
  },
  {
    id: "cadence",
    path: "/characters/cadence.webp",
    persona: "The Trendsetter",
    desc: "You find the spot before it blows up. The squad just follows the vibe.",
  },
  {
    id: "herbert",
    path: "/characters/herbert.webp",
    persona: "The Legend",
    desc: "Larger than life. When you show up, the energy in the room shifts.",
  },
]

export const CharacterKeysContext = createContext<string[]>([])

export function useCharacterFor(key: string): Character {
  const allKeys = useContext(CharacterKeysContext)
  if (allKeys.length > 0) {
    const idx = allKeys.indexOf(key)
    if (idx !== -1) return CHARACTERS[idx % CHARACTERS.length]
  }
  let h = 0
  for (let i = 0; i < key.length; i++) h = (Math.imul(h, 31) + key.charCodeAt(i)) >>> 0
  return CHARACTERS[h % CHARACTERS.length]
}

export function characterFor(key: string): Character {
  let h = 0
  for (let i = 0; i < key.length; i++) h = (Math.imul(h, 31) + key.charCodeAt(i)) >>> 0
  return CHARACTERS[h % CHARACTERS.length]
}
