"use client"

import { useLayoutEffect, useRef, useState } from "react"
import type { ActivityItem } from "@/lib/huddles-data"
import {
  LensPanelHeader,
  LensPanelList,
  PanelCard,
  lensPanelRowClass,
  lensPanelTitleClass,
  lensPanelSubtitleClass,
  lensPanelMetaClass,
  StackedAvatars,
} from "@/components/panel-ui"
import { typePanelMeta } from "@/lib/ui-styles"
import { panelShellClass, PanelRowAction } from "@/components/lens/panel-shared"

function ActivityTitle({ text, className }: { text: string; className: string }) {
  const ref = useRef<HTMLParagraphElement>(null)
  const [display, setDisplay] = useState(text)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return

    const overflows = (value: string) => {
      el.textContent = value
      return el.scrollWidth > el.clientWidth
    }

    const fit = () => {
      const full = text.trimEnd()
      if (!overflows(full)) {
        setDisplay(full)
        return
      }

      let lo = 0
      let hi = full.length
      while (lo < hi) {
        const mid = Math.ceil((lo + hi) / 2)
        const slice = full.slice(0, mid).replace(/\s+$/, "")
        if (overflows(`${slice}...`)) hi = mid - 1
        else lo = mid
      }

      const slice = full.slice(0, lo).replace(/\s+$/, "")
      setDisplay(`${slice}...`)
    }

    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(el)
    return () => observer.disconnect()
  }, [text])

  return (
    <p ref={ref} className={`overflow-hidden whitespace-nowrap ${className}`}>
      {display}
    </p>
  )
}

function ActivityRow({ item }: { item: ActivityItem }) {
  return (
    <div className={lensPanelRowClass}>
      <StackedAvatars avatars={item.actorAvatars} />
      <div className="min-w-0 flex-1">
        <ActivityTitle text={item.title} className={lensPanelTitleClass} />
        <p className={lensPanelSubtitleClass}>{item.context}</p>
        <p className={lensPanelMetaClass}>{item.activityAt}</p>
      </div>
      {item.actionLabel && <PanelRowAction label={item.actionLabel} />}
    </div>
  )
}

export function ActivityPanel({
  bare = false,
  activity,
  activeHuddles,
  friendsOut,
}: {
  bare?: boolean
  activity: ActivityItem[]
  activeHuddles: number
  friendsOut: number
}) {
  return (
    <PanelCard bare={bare} className={panelShellClass(!!bare)}>
      <LensPanelHeader title="Today">
        <p className={typePanelMeta}>
          {activeHuddles} huddle{activeHuddles === 1 ? "" : "s"} · {friendsOut} active
        </p>
      </LensPanelHeader>

      <LensPanelList>
        {activity.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing yet — activity shows up as people join, huddle, and ping.</p>
        ) : null}
        {activity.map((item) => (
          <ActivityRow key={item.id} item={item} />
        ))}
      </LensPanelList>
    </PanelCard>
  )
}
