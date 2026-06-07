import {
  isClusterExempt,
  modelKey,
  type MapMarkerModel,
  type MarkerDisplayMode,
} from "@/lib/map-markers-model"
import type { Selection } from "@/lib/selection"
import type { LayerKey } from "@/lib/huddles-data"
import type { MapProject } from "@/lib/map-projection"

const CLUSTER_RADIUS_PX = 60

export type ResolvedMarker = MapMarkerModel & {
  displayMode: MarkerDisplayMode
  key: string
}

function screenDistance(
  a: { x: number; y: number },
  b: { x: number; y: number }
): number {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return Math.sqrt(dx * dx + dy * dy)
}

function centroidLngLat(members: MapMarkerModel[]): { lng: number; lat: number } {
  const sum = members.reduce(
    (acc, m) => ({ lng: acc.lng + m.lng, lat: acc.lat + m.lat }),
    { lng: 0, lat: 0 }
  )
  return { lng: sum.lng / members.length, lat: sum.lat / members.length }
}

export function clusterMarkers(
  models: Array<MapMarkerModel & { displayMode: MarkerDisplayMode }>,
  project: MapProject,
  ctx: { selection: Selection; layers: Record<LayerKey, boolean> }
): ResolvedMarker[] {
  const layoutCtx = { layers: ctx.layers, selection: ctx.selection }
  const visible = models.filter((m) => m.displayMode !== "hidden")
  const exempt = visible.filter((m) => isClusterExempt(m, layoutCtx))
  const exemptKeys = new Set(exempt.map((m) => modelKey(m)))
  const clusterable = visible.filter((m) => !exemptKeys.has(modelKey(m)))

  const withScreen = clusterable
    .map((m) => {
      const pt = project(m.lng, m.lat)
      return pt ? { model: m, screen: pt } : null
    })
    .filter((x): x is { model: (typeof clusterable)[0]; screen: { x: number; y: number } } => x !== null)

  const used = new Set<string>()
  const clusters: ResolvedMarker[] = []

  for (let i = 0; i < withScreen.length; i++) {
    const key = modelKey(withScreen[i].model)
    if (used.has(key)) continue

    const group = [withScreen[i]]
    used.add(key)

    for (let j = i + 1; j < withScreen.length; j++) {
      const otherKey = modelKey(withScreen[j].model)
      if (used.has(otherKey)) continue
      if (screenDistance(withScreen[i].screen, withScreen[j].screen) <= CLUSTER_RADIUS_PX) {
        group.push(withScreen[j])
        used.add(otherKey)
      }
    }

    if (group.length >= 2) {
      const members = group.map((g) => g.model)
      const center = centroidLngLat(members)
      const clusterId = members.map((m) => m.id).sort().join("-")
      clusters.push({
        id: clusterId,
        kind: "cluster",
        lng: center.lng,
        lat: center.lat,
        priority: Math.min(...members.map((m) => m.priority)),
        layer: members[0].layer,
        clusterMembers: members,
        displayMode: "cluster",
        key: `cluster-${clusterId}`,
      })
    }
  }

  const clusteredKeys = new Set(
    clusters.flatMap((c) => (c.clusterMembers ?? []).map((m) => modelKey(m)))
  )

  const singles: ResolvedMarker[] = visible
    .filter((m) => !clusteredKeys.has(modelKey(m)) && !exemptKeys.has(modelKey(m)))
    .map((m) => ({
      ...m,
      key: modelKey(m),
    }))

  const exemptResolved: ResolvedMarker[] = exempt.map((m) => ({
    ...m,
    key: modelKey(m),
  }))

  return [...exemptResolved, ...singles, ...clusters]
}
