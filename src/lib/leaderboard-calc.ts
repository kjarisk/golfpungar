/**
 * Leaderboard calculation functions.
 *
 * Pure functions that compute leaderboard standings from scoring and side-event data.
 * Used by the Leaderboards page to derive all leaderboard views.
 */
import type { RoundPoints } from '@/features/scoring'
import type { SideEventTotals } from '@/features/side-events'

// --- Total Points Leaderboard ---

export interface TotalPointsEntry {
  playerId: string
  totalPoints: number
  /** Points per round: { roundId, points } */
  roundBreakdown: { roundId: string; points: number }[]
  /** 1-based placing in the overall tournament */
  placing: number
}

/**
 * Compute the total points leaderboard across all rounds.
 * Sums up all RoundPoints for each player, then ranks them.
 */
export function computeTotalPointsLeaderboard(
  allRoundPoints: RoundPoints[],
  playerIds: string[]
): TotalPointsEntry[] {
  // Build totals per player
  const playerTotals = playerIds.map((playerId) => {
    const playerPoints = allRoundPoints.filter(
      (rp) => rp.participantId === playerId
    )
    const totalPoints = playerPoints.reduce(
      (sum, rp) => sum + rp.pointsAwarded,
      0
    )
    const roundBreakdown = playerPoints.map((rp) => ({
      roundId: rp.roundId,
      points: rp.pointsAwarded,
    }))
    return { playerId, totalPoints, roundBreakdown }
  })

  // Sort by total points descending
  playerTotals.sort((a, b) => b.totalPoints - a.totalPoints)

  // Assign placings (handle ties: same points = same placing)
  let currentPlacing = 1
  return playerTotals.map((entry, index) => {
    if (index > 0 && entry.totalPoints < playerTotals[index - 1].totalPoints) {
      currentPlacing = index + 1
    }
    return { ...entry, placing: currentPlacing }
  })
}

// --- Round Leaderboard ---

export interface RoundLeaderboardEntry {
  participantId: string
  placing: number
  pointsAwarded: number
  grossTotal: number
  netTotal: number | null
  stablefordPoints: number | null
}

/**
 * Build a round leaderboard from RoundPoints + scorecards for display.
 */
export function computeRoundLeaderboard(
  roundPoints: RoundPoints[],
  scorecards: {
    playerId?: string
    teamId?: string
    grossTotal: number
    netTotal: number | null
    stablefordPoints: number | null
  }[]
): RoundLeaderboardEntry[] {
  return [...roundPoints]
    .sort((a, b) => a.placing - b.placing)
    .map((rp) => {
      const sc = scorecards.find(
        (s) => (s.playerId ?? s.teamId) === rp.participantId
      )
      return {
        participantId: rp.participantId,
        placing: rp.placing,
        pointsAwarded: rp.pointsAwarded,
        grossTotal: sc?.grossTotal ?? 0,
        netTotal: sc?.netTotal ?? null,
        stablefordPoints: sc?.stablefordPoints ?? null,
      }
    })
}

// --- Side Competition Leaderboards ---

export interface SideCompetitionEntry {
  playerId: string
  count: number
  placing: number
}

/**
 * Generic side competition leaderboard from totals.
 * Pass a selector function to extract the relevant count from SideEventTotals.
 */
export function computeSideLeaderboard(
  totals: SideEventTotals[],
  selector: (t: SideEventTotals) => number
): SideCompetitionEntry[] {
  const entries = totals
    .map((t) => ({ playerId: t.playerId, count: selector(t) }))
    .filter((e) => e.count > 0)
    .sort((a, b) => b.count - a.count)

  // Assign placings with ties
  let currentPlacing = 1
  return entries.map((entry, index) => {
    if (index > 0 && entry.count < entries[index - 1].count) {
      currentPlacing = index + 1
    }
    return { ...entry, placing: currentPlacing }
  })
}

export interface LongestDriveEntry {
  playerId: string
  meters: number
  eventId: string
  placing: number
}

/**
 * Longest drive leaderboard with placings.
 */
export function computeLongestDriveLeaderboard(
  drives: { playerId: string; meters: number; eventId: string }[]
): LongestDriveEntry[] {
  const sorted = [...drives].sort((a, b) => b.meters - a.meters)

  let currentPlacing = 1
  return sorted.map((entry, index) => {
    if (index > 0 && entry.meters < sorted[index - 1].meters) {
      currentPlacing = index + 1
    }
    return { ...entry, placing: currentPlacing }
  })
}
