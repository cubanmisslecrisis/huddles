export const MARKER_SIZES = {
  tiny: 28,
  pin: 44,
  avatar: 48,
  chip: 36,
  card: 180,
  cluster: 48,
} as const

export const markerSizeClasses = {
  tiny: "h-7 w-7",
  pin: "h-11 w-11",
  avatar: "h-12 w-12",
  chip: "h-9",
  card: "max-w-[180px]",
  cluster: "h-12 w-12",
} as const
