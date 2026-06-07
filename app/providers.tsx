"use client"

import { SpacetimeDBAppProvider } from "@/components/providers/spacetimedb-provider"
import { HuddlesLiveProvider } from "@/components/providers/huddles-live-provider"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SpacetimeDBAppProvider>
      <HuddlesLiveProvider>{children}</HuddlesLiveProvider>
    </SpacetimeDBAppProvider>
  )
}
