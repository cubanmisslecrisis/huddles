import type { ActivityItem, FriendPresence, Huddle, Recommendation } from "@/lib/huddles-data"

type DemoActivityInput = {
  friends: FriendPresence[]
  huddles: Huddle[]
  recommendations: Recommendation[]
}

function pick<T>(items: T[], index: number): T | undefined {
  if (items.length === 0) return undefined
  return items[index % items.length]
}

function activeFriends(friends: FriendPresence[]) {
  return friends.filter((f) => f.status === "online" || f.status === "nearby")
}

function friendsForReco(reco: Recommendation, friends: FriendPresence[]) {
  return friends.filter((f) => reco.recommendedBy.includes(f.avatar))
}

function distanceSnippet(friend: FriendPresence) {
  return friend.distanceLabel?.split(" · ")[0] ?? "nearby"
}

export function buildDemoActivity({
  friends,
  huddles,
  recommendations,
}: DemoActivityInput): ActivityItem[] {
  const active = activeFriends(friends)
  const items: ActivityItem[] = []
  let seq = 0
  const id = () => `demo-activity-${++seq}`

  const activeHuddle = huddles.find((h) => h.status === "active") ?? huddles[0]
  if (activeHuddle) {
    items.push({
      id: id(),
      type: "huddle_started",
      section: "now",
      actor: activeHuddle.name,
      actorAvatars: activeHuddle.memberAvatars.slice(0, 3),
      title: `${activeHuddle.name} started`,
      context: `${activeHuddle.memberCount} people · ${activeHuddle.placeName}`,
      activityAt: activeHuddle.startedAtLabel ?? "Started recently",
      badgeColor: "blue",
      actionLabel: "Join",
    })
  }

  const pinger = pick(active, 1) ?? pick(friends, 0)
  const pingPlace = recommendations[0]?.placeName ?? pinger?.placeName ?? "nearby"
  if (pinger) {
    items.push({
      id: id(),
      type: "ping",
      section: "now",
      actor: pinger.name,
      actorAvatars: [pinger.avatar],
      title: `${pinger.name} pinged you`,
      context: `${pingPlace} · ${distanceSnippet(pinger)}`,
      activityAt: "2:30 PM",
      badgeColor: "pink",
      actionLabel: "Join",
    })
  }

  const formingHuddle = huddles.find((h) => h.status === "forming") ?? pick(huddles, 1)
  const joiner = pick(active, 2) ?? pick(friends, 1)
  if (joiner && formingHuddle) {
    items.push({
      id: id(),
      type: "friend_joined",
      section: "coming_up",
      actor: joiner.name,
      actorAvatars: [joiner.avatar],
      title: `${joiner.name} joined ${formingHuddle.name}`,
      context: `${formingHuddle.timeLabel ?? "Today"} · ${formingHuddle.placeName}`,
      activityAt: "Joined 1:45 PM",
      badgeColor: "orange",
    })
  }

  const reco = pick(recommendations, 1) ?? recommendations[0]
  if (reco) {
    const recFriends = friendsForReco(reco, friends).slice(0, 2)
    const names =
      recFriends.length > 0
        ? recFriends.map((f) => f.name).join(" + ")
        : `${reco.recommendedBy.length} friends`
    const avatars = recFriends.length > 0 ? recFriends.map((f) => f.avatar) : reco.recommendedBy.slice(0, 2)

    items.push({
      id: id(),
      type: "recommendation",
      section: "coming_up",
      actor: names,
      actorAvatars: avatars,
      title: `${names} recommended ${reco.placeName}`,
      context: `${reco.category} · ${reco.distanceLabel}`,
      activityAt: "3:20 PM",
      badgeColor: "pink",
    })
  }

  const savedReco = pick(recommendations, 2) ?? recommendations[0]
  const saver = pick(active, 0) ?? pick(friends, 2)
  if (saver && savedReco) {
    items.push({
      id: id(),
      type: "place_saved",
      section: "recent",
      actor: saver.name,
      actorAvatars: [saver.avatar],
      title: `${saver.name} saved ${savedReco.placeName}`,
      context: `${savedReco.category} · ${savedReco.distanceLabel}`,
      activityAt: "11:15 AM",
      badgeColor: "green",
    })
  }

  const extraReco = pick(recommendations, 3)
  const extraFriend = pick(active, 3) ?? pick(friends, 3)
  if (extraFriend && extraReco) {
    items.push({
      id: id(),
      type: "recommendation",
      section: "recent",
      actor: extraFriend.name,
      actorAvatars: [extraFriend.avatar],
      title: `${extraFriend.name} recommended ${extraReco.placeName}`,
      context: `${extraReco.category} · ${extraReco.distanceLabel}`,
      activityAt: "10:05 AM",
      badgeColor: "green",
    })
  }

  return items
}
