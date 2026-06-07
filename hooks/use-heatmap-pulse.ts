"use client"

import { useEffect, useState } from "react"

const PULSE_CYCLE_MS = 4500

/** Breathing spread factor for heatmap radius (~0.84–1.0), one cycle every 4.5s. */
export function useHeatmapPulse(enabled: boolean) {
  const [pulse, setPulse] = useState(1)

  useEffect(() => {
    if (!enabled) {
      setPulse(1)
      return
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reducedMotion) return

    let frame = 0
    const start = Date.now()

    const animate = () => {
      const elapsed = (Date.now() - start) % PULSE_CYCLE_MS
      const progress = elapsed / PULSE_CYCLE_MS
      setPulse(0.92 + Math.sin(progress * Math.PI * 2) * 0.08)
      frame = requestAnimationFrame(animate)
    }

    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [enabled])

  return pulse
}
