/**
 * Pure-function logic for side-event aggregation. Lives separately from the
 * query hooks so derivation logic stays testable without rendering or a cache.
 */
import type {
  SideEventLog,
  LastSnakeInGroup,
  SideEventTotals,
  SideEventType,
} from '../types'

/**
 * Determine who holds the "last snake" in a given group for a round.
 *
 * Rules (from outline §5):
 * - A snake = 3 putts on a hole
 * - "Last snake in group" = derived from the latest snake timestamp
 *   within each group
 * - If no snakes in the group, playerId is null
 */
export function deriveLastSnakeInGroup(
  events: SideEventLog[],
  roundId: string,
  groupId: string,
  groupPlayerIds: string[]
): LastSnakeInGroup {
  const snakes = events
    .filter(
      (e) =>
        e.roundId === roundId &&
        e.type === 'snake' &&
        groupPlayerIds.includes(e.playerId)
    )
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

  const latest = snakes[0] ?? null

  return {
    groupId,
    roundId,
    playerId: latest?.playerId ?? null,
    holeNumber: latest?.holeNumber,
  }
}

/** Compute per-player totals for a tournament (events array already filtered). */
export function computeSideEventTotals(
  events: SideEventLog[],
  tournamentId: string,
  playerIds: string[]
): SideEventTotals[] {
  const scoped = events.filter((e) => e.tournamentId === tournamentId)
  return playerIds.map((playerId) => {
    const playerEvents = scoped.filter((e) => e.playerId === playerId)
    const countType = (type: SideEventType) =>
      playerEvents.filter((e) => e.type === type).length

    const longestDrive = playerEvents.filter(
      (e) => e.type === 'longest_drive_meters' && e.value != null
    )
    const bestDrive =
      longestDrive.length > 0
        ? Math.max(...longestDrive.map((e) => e.value!))
        : null

    const longestPutt = playerEvents.filter(
      (e) => e.type === 'longest_putt' && e.value != null
    )
    const bestPutt =
      longestPutt.length > 0
        ? Math.max(...longestPutt.map((e) => e.value!))
        : null

    const ntp = playerEvents.filter(
      (e) => e.type === 'nearest_to_pin' && e.value != null
    )
    const bestNtp =
      ntp.length > 0 ? Math.min(...ntp.map((e) => e.value!)) : null

    return {
      playerId,
      birdies: countType('birdie'),
      eagles: countType('eagle'),
      holeInOnes: countType('hio'),
      albatrosses: countType('albatross'),
      bunkerSaves: countType('bunker_save'),
      snakes: countType('snake'),
      snopp: countType('snopp'),
      groupLongestDrives: countType('group_longest_drive'),
      longestDriveMeters: bestDrive,
      longestPuttMeters: bestPutt,
      nearestToPinMeters: bestNtp,
      gir: countType('gir'),
    }
  })
}

/** Longest drive leaderboard — one best entry per player, longest first. */
export function computeLongestDriveBest(
  events: SideEventLog[],
  tournamentId: string
): { playerId: string; meters: number; eventId: string }[] {
  return bestPerPlayer(events, tournamentId, 'longest_drive_meters', 'desc')
}

/** Longest putt leaderboard — one best per player, longest first. */
export function computeLongestPuttBest(
  events: SideEventLog[],
  tournamentId: string
): { playerId: string; meters: number; eventId: string }[] {
  return bestPerPlayer(events, tournamentId, 'longest_putt', 'desc')
}

/** Nearest-to-pin leaderboard — one best per player, closest (lowest) first. */
export function computeNearestToPinBest(
  events: SideEventLog[],
  tournamentId: string
): { playerId: string; meters: number; eventId: string }[] {
  return bestPerPlayer(events, tournamentId, 'nearest_to_pin', 'asc')
}

function bestPerPlayer(
  events: SideEventLog[],
  tournamentId: string,
  type: SideEventType,
  direction: 'asc' | 'desc'
) {
  const scoped = events.filter(
    (e) => e.tournamentId === tournamentId && e.type === type && e.value != null
  )
  const best = new Map<string, { meters: number; eventId: string }>()
  for (const event of scoped) {
    const existing = best.get(event.playerId)
    const better =
      !existing ||
      (direction === 'desc'
        ? event.value! > existing.meters
        : event.value! < existing.meters)
    if (better)
      best.set(event.playerId, { meters: event.value!, eventId: event.id })
  }
  return Array.from(best.entries())
    .map(([playerId, d]) => ({
      playerId,
      meters: d.meters,
      eventId: d.eventId,
    }))
    .sort((a, b) =>
      direction === 'desc' ? b.meters - a.meters : a.meters - b.meters
    )
}
