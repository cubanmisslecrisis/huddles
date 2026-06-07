"use client"

import { useEffect, useState } from "react"

const MOBILE_QUERY = "(max-width: 1023px)"

/**
 * Returns `true` below the `lg` breakpoint, `false` at/above it, and
 * `undefined` before mount so the shell selection stays deterministic
 * across SSR/hydration and never mounts two Mapbox instances at once.
 */
export function useIsMobile(): boolean | undefined {
  const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined)

  useEffect(() => {
    const mql = window.matchMedia(MOBILE_QUERY)
    const update = () => setIsMobile(mql.matches)
    update()
    mql.addEventListener("change", update)
    return () => mql.removeEventListener("change", update)
  }, [])

  return isMobile
}
