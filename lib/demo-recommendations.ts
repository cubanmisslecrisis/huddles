import type { PlacePin, Recommendation } from "@/lib/huddles-data"
import { distanceLabel, distanceMeters } from "@/lib/avatar"
import { placeMapIconSrc } from "@/lib/pin-kinds"

type DemoPlaceTemplate = {
  slug: string
  placeName: string
  category: string
  kind: PlacePin["kind"]
  color: PlacePin["color"]
  lat: number
  lng: number
}

/** Real NYC venues — demo room defaults near Herald Square (40.748, -73.986). */
const CATALOG: DemoPlaceTemplate[] = [
  { slug: "blue-bottle", placeName: "Blue Bottle Coffee", category: "Café", kind: "cafe", color: "yellow", lat: 40.75404, lng: -73.98447 },
  { slug: "stumptown", placeName: "Stumptown Coffee Roasters", category: "Café", kind: "cafe", color: "yellow", lat: 40.74585, lng: -73.98812 },
  { slug: "arabica", placeName: "% Arabica", category: "Café", kind: "cafe", color: "yellow", lat: 40.75552, lng: -73.98692 },
  { slug: "gregorys", placeName: "Gregory's Coffee", category: "Café", kind: "cafe", color: "yellow", lat: 40.75058, lng: -73.98628 },
  { slug: "katz", placeName: "Katz's Delicatessen", category: "Deli", kind: "food", color: "orange", lat: 40.72229, lng: -73.98738 },
  { slug: "joes", placeName: "Joe's Pizza", category: "Pizza", kind: "food", color: "orange", lat: 40.73057, lng: -73.99962 },
  { slug: "los-tacos", placeName: "Los Tacos No. 1", category: "Tacos", kind: "food", color: "orange", lat: 40.74235, lng: -74.00585 },
  { slug: "russ", placeName: "Russ & Daughters Cafe", category: "Bakery", kind: "food", color: "orange", lat: 40.72230, lng: -73.98670 },
  { slug: "mcsorleys", placeName: "McSorley's Old Ale House", category: "Bar", kind: "bar", color: "purple", lat: 40.72867, lng: -73.98972 },
  { slug: "death-co", placeName: "Death & Co", category: "Cocktail Bar", kind: "bar", color: "pink", lat: 40.72616, lng: -73.98467 },
  { slug: "fifth-rooftop", placeName: "230 Fifth", category: "Rooftop Bar", kind: "bar", color: "pink", lat: 40.74407, lng: -73.98867 },
  { slug: "blue-note", placeName: "Blue Note Jazz Club", category: "Live Music", kind: "bar", color: "pink", lat: 40.73085, lng: -74.00063 },
  { slug: "high-line", placeName: "The High Line", category: "Park", kind: "park", color: "green", lat: 40.73982, lng: -74.00724 },
  { slug: "madison-park", placeName: "Madison Square Park", category: "Park", kind: "park", color: "green", lat: 40.74289, lng: -73.98875 },
  { slug: "bowlmor", placeName: "Bowlmor Chelsea Piers", category: "Bowling", kind: "gym", color: "blue", lat: 40.75172, lng: -74.00818 },
  { slug: "equinox", placeName: "Equinox Flatiron", category: "Gym", kind: "gym", color: "blue", lat: 40.74105, lng: -73.98961 },
  { slug: "moma", placeName: "Museum of Modern Art", category: "Museum", kind: "museum", color: "yellow", lat: 40.76143, lng: -73.97762 },
  { slug: "chelsea", placeName: "Chelsea Market", category: "Market", kind: "shop", color: "pink", lat: 40.74244, lng: -74.00614 },
]

const RECS_PER_PERSON = 3

export type DemoPerson = {
  id: string
  name: string
  avatar: string
  lat: number
  lng: number
}

type ViewerLoc = { lat: number; lng: number }

function hashId(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0
  return Math.abs(h)
}

function distanceFromViewer(place: DemoPlaceTemplate, viewer: ViewerLoc | null): string {
  if (!viewer) return ""
  return distanceLabel(distanceMeters(viewer.lat, viewer.lng, place.lat, place.lng))
}

export function buildDemoRecommendationData(
  people: DemoPerson[],
  viewerLoc: ViewerLoc | null = null
): {
  pins: PlacePin[]
  recommendations: Recommendation[]
} {
  if (people.length === 0) return { pins: [], recommendations: [] }

  const assignments = new Map<string, { template: DemoPlaceTemplate; recommenders: DemoPerson[] }>()

  for (const person of people) {
    const base = hashId(person.id)
    for (let j = 0; j < RECS_PER_PERSON; j++) {
      const template = CATALOG[(base + j) % CATALOG.length]
      const entry = assignments.get(template.slug) ?? { template, recommenders: [] }
      entry.recommenders.push(person)
      assignments.set(template.slug, entry)
    }
  }

  const pins: PlacePin[] = []
  const recommendations: Recommendation[] = []

  for (const { template, recommenders } of assignments.values()) {
    const pinId = `place-${template.slug}`
    const primary = recommenders[0]
    const dist = distanceFromViewer(template, viewerLoc)

    pins.push({
      id: pinId,
      kind: template.kind,
      label: template.placeName,
      category: template.category,
      distanceLabel: dist,
      lng: template.lng,
      lat: template.lat,
      color: template.color,
      authorId: primary.id,
      authorName: primary.name,
      authorAvatar: primary.avatar,
      createdAtLabel: "Recently",
    })

    recommendations.push({
      id: `reco-${template.slug}`,
      pinId,
      placeName: template.placeName,
      category: template.category,
      distanceLabel: dist,
      recommendedBy: recommenders.map((p) => p.avatar),
      thumbnail: placeMapIconSrc(template.kind),
    })
  }

  return { pins, recommendations }
}

export function getRecentRecommendationsForFriend(
  friendId: string,
  data: {
    pins: PlacePin[]
    recommendations: Recommendation[]
    friends: { id: string; avatar: string }[]
    me?: { id: string; avatar: string }
  }
): string[] {
  const avatar =
    data.friends.find((f) => f.id === friendId)?.avatar ??
    (data.me?.id === friendId ? data.me.avatar : undefined)
  if (avatar) {
    const fromRecos = data.recommendations
      .filter((r) => r.recommendedBy.includes(avatar))
      .map((r) => r.placeName)
    if (fromRecos.length > 0) return fromRecos
  }

  return data.pins
    .filter((p) => p.authorId === friendId && p.label)
    .map((p) => p.label!)
}
