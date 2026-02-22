/**
 * Pure-function logic for snake (3-putt) tracking and side-event aggregation.
 * Kept separate from the store for easy unit testing.
 */
import type {
  SideEventLog,
  SideEventTotals,
  LastSnakeInGroup,
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

/**
 * Count snake occurrences per player within a set of events.
 */
export function countSnakesByPlayer(
  events: SideEventLog[]
): Map<string, number> {
  const counts = new Map<string, number>()
  for (const e of events) {
    if (e.type === 'snake') {
      counts.set(e.playerId, (counts.get(e.playerId) ?? 0) + 1)
    }
  }
  return counts
}

/**
 * Aggregate side event totals for a list of players across a tournament.
 */
export function aggregateTotals(
  events: SideEventLog[],
  tournamentId: string,
  playerIds: string[]
): SideEventTotals[] {
  const tournamentEvents = events.filter((e) => e.tournamentId === tournamentId)

  return playerIds.map((playerId) => {
    const playerEvents = tournamentEvents.filter((e) => e.playerId === playerId)

    const countType = (type: SideEventType) =>
      playerEvents.filter((e) => e.type === type).length

    const longestDriveEvents = playerEvents.filter(
      (e) => e.type === 'longest_drive_meters' && e.value != null
    )
    const bestDrive =
      longestDriveEvents.length > 0
        ? Math.max(...longestDriveEvents.map((e) => e.value!))
        : null

    const longestPuttEvents = playerEvents.filter(
      (e) => e.type === 'longest_putt' && e.value != null
    )
    const bestPutt =
      longestPuttEvents.length > 0
        ? Math.max(...longestPuttEvents.map((e) => e.value!))
        : null

    const ntpEvents = playerEvents.filter(
      (e) => e.type === 'nearest_to_pin' && e.value != null
    )
    const bestNtp =
      ntpEvents.length > 0 ? Math.min(...ntpEvents.map((e) => e.value!)) : null

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

/**
 * Get the longest drive leaderboard — best drive per player, sorted descending.
 */
export function longestDriveLeaderboard(
  events: SideEventLog[],
  tournamentId: string
): { playerId: string; meters: number; eventId: string }[] {
  const driveEvents = events.filter(
    (e) =>
      e.tournamentId === tournamentId &&
      e.type === 'longest_drive_meters' &&
      e.value != null
  )

  const bestByPlayer = new Map<string, { meters: number; eventId: string }>()

  for (const event of driveEvents) {
    const existing = bestByPlayer.get(event.playerId)
    if (!existing || event.value! > existing.meters) {
      bestByPlayer.set(event.playerId, {
        meters: event.value!,
        eventId: event.id,
      })
    }
  }

  return Array.from(bestByPlayer.entries())
    .map(([playerId, data]) => ({
      playerId,
      meters: data.meters,
      eventId: data.eventId,
    }))
    .sort((a, b) => b.meters - a.meters)
}

/**
 * Group longest drive counts per player.
 * Returns sorted by count descending.
 */
export function groupLongestDriveLeaderboard(
  events: SideEventLog[],
  tournamentId: string
): { playerId: string; count: number }[] {
  const glDrives = events.filter(
    (e) => e.tournamentId === tournamentId && e.type === 'group_longest_drive'
  )

  const counts = new Map<string, number>()
  for (const e of glDrives) {
    counts.set(e.playerId, (counts.get(e.playerId) ?? 0) + 1)
  }

  return Array.from(counts.entries())
    .map(([playerId, count]) => ({ playerId, count }))
    .sort((a, b) => b.count - a.count)
}

/**
 * Longest putt leaderboard — best putt per player, sorted descending (longest wins).
 */
export function longestPuttLeaderboard(
  events: SideEventLog[],
  tournamentId: string
): { playerId: string; meters: number; eventId: string }[] {
  const puttEvents = events.filter(
    (e) =>
      e.tournamentId === tournamentId &&
      e.type === 'longest_putt' &&
      e.value != null
  )

  const bestByPlayer = new Map<string, { meters: number; eventId: string }>()

  for (const event of puttEvents) {
    const existing = bestByPlayer.get(event.playerId)
    if (!existing || event.value! > existing.meters) {
      bestByPlayer.set(event.playerId, {
        meters: event.value!,
        eventId: event.id,
      })
    }
  }

  return Array.from(bestByPlayer.entries())
    .map(([playerId, data]) => ({
      playerId,
      meters: data.meters,
      eventId: data.eventId,
    }))
    .sort((a, b) => b.meters - a.meters)
}

/**
 * Nearest to pin leaderboard — best (closest) per player, sorted ascending (shortest wins).
 */
export function nearestToPinLeaderboard(
  events: SideEventLog[],
  tournamentId: string
): { playerId: string; meters: number; eventId: string }[] {
  const ntpEvents = events.filter(
    (e) =>
      e.tournamentId === tournamentId &&
      e.type === 'nearest_to_pin' &&
      e.value != null
  )

  const bestByPlayer = new Map<string, { meters: number; eventId: string }>()

  for (const event of ntpEvents) {
    const existing = bestByPlayer.get(event.playerId)
    if (!existing || event.value! < existing.meters) {
      bestByPlayer.set(event.playerId, {
        meters: event.value!,
        eventId: event.id,
      })
    }
  }

  return Array.from(bestByPlayer.entries())
    .map(([playerId, data]) => ({
      playerId,
      meters: data.meters,
      eventId: data.eventId,
    }))
    .sort((a, b) => a.meters - b.meters)
}
