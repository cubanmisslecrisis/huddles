import type { CSSProperties } from "react"
import type { ActivityItem, Huddle, PlacePin } from "@/lib/huddles-data"

/**
 * ## Color access rules
 *
 * | Context | Use |
 * |---------|-----|
 * | Static JSX `className` | Tailwind semantic (`bg-card`, `text-muted-foreground`) or brand utilities (`bg-red`, `text-warmth`) |
 * | Config arrays, inline `style`, Mapbox | `brandColor()`, `huddleAccentColor()`, `pinColor()` |
 * | Dynamic surfaces with clay | `brandClaySurface()` |
 * | Layer toggle tints | `brandTintBackground()` |
 * | Text on brand fills | `onBrandForeground()` |
 *
 * Do not use raw `var(--color-*)` strings outside this file.
 */

export type BrandColor =
  | "pink"
  | "blue"
  | "green"
  | "orange"
  | "yellow"
  | "red"
  | "warmth"
  | "purple"
  | "gray"

const brandColors: Record<BrandColor, string> = {
  pink: "var(--color-pink)",
  blue: "var(--color-blue)",
  green: "var(--color-green)",
  orange: "var(--color-orange)",
  yellow: "var(--color-yellow)",
  red: "var(--color-red)",
  warmth: "var(--color-warmth)",
  purple: "var(--color-purple)",
  gray: "var(--color-border)",
}

const brandForegrounds: Partial<Record<BrandColor, string>> = {
  yellow: "var(--yellow-foreground)",
}

export function brandColor(color: BrandColor): string {
  return brandColors[color]
}

export function semanticColor(
  name: "foreground" | "background" | "card" | "secondary" | "border"
): string {
  const map = {
    foreground: "var(--color-foreground)",
    background: "var(--color-background)",
    card: "var(--color-card)",
    secondary: "var(--color-secondary)",
    border: "var(--color-border)",
  } as const
  return map[name]
}

export function onBrandForeground(color: BrandColor): string {
  return brandForegrounds[color] ?? "#fff"
}

/** @deprecated Use `onBrandForeground("yellow")` */
export const onYellow = onBrandForeground("yellow")

export function claySurface(background: string): CSSProperties {
  return {
    background,
    "--clay-color": background,
  } as CSSProperties
}

export function brandClaySurface(color: BrandColor): CSSProperties {
  return claySurface(brandColor(color))
}

export function brandTintBackground(color: string, mix = 0.16): string {
  return `color-mix(in oklab, ${color} ${Math.round(mix * 100)}%, var(--color-secondary))`
}

export function huddleAccentColor(color: Huddle["color"]): string {
  return color === "red" ? brandColors.red : brandColors.orange
}

export function pinColor(color: PlacePin["color"]): string {
  return brandColors[color]
}

export function activityBadgeColor(color: ActivityItem["badgeColor"]): string {
  return brandColors[color]
}

/**
 * Mapbox heatmap gradient stops (rgba). Mapbox paint props cannot read CSS vars;
 * values are tuned to match brand warmth/orange in globals.css.
 */
export const mapWarmthHeatmapGradient = [
  "interpolate",
  ["linear"],
  ["heatmap-density"],
  0,
  "rgba(250, 137, 39, 0)",
  0.15,
  "rgba(255, 210, 160, 0.45)",
  0.35,
  "rgba(255, 170, 90, 0.65)",
  0.55,
  "rgba(250, 137, 39, 0.8)",
  0.75,
  "rgba(235, 95, 25, 0.9)",
  1,
  "rgba(200, 55, 10, 1)",
] as const
