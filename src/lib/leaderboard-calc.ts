/**
 * Leaderboard calculation functions.
 *
 * Pure functions that compute leaderboard standings from scoring and side-event data.
 * Used by the Leaderboards page to derive all leaderboard views.
 */
import type { RoundPoints, Scorecard } from '@/features/scoring'
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

// --- Longest Putt Leaderboard ---

export interface LongestPuttEntry {
  playerId: string
  meters: number
  eventId: string
  placing: number
}

/**
 * Longest putt leaderboard with placings (longest wins).
 */
export function computeLongestPuttLeaderboard(
  putts: { playerId: string; meters: number; eventId: string }[]
): LongestPuttEntry[] {
  const sorted = [...putts].sort((a, b) => b.meters - a.meters)

  let currentPlacing = 1
  return sorted.map((entry, index) => {
    if (index > 0 && entry.meters < sorted[index - 1].meters) {
      currentPlacing = index + 1
    }
    return { ...entry, placing: currentPlacing }
  })
}

// --- Nearest to Pin Leaderboard ---

export interface NearestToPinEntry {
  playerId: string
  meters: number
  eventId: string
  placing: number
}

/**
 * Nearest to pin leaderboard with placings (closest wins — ascending).
 */
export function computeNearestToPinLeaderboard(
  shots: { playerId: string; meters: number; eventId: string }[]
): NearestToPinEntry[] {
  const sorted = [...shots].sort((a, b) => a.meters - b.meters)

  let currentPlacing = 1
  return sorted.map((entry, index) => {
    if (index > 0 && entry.meters > sorted[index - 1].meters) {
      currentPlacing = index + 1
    }
    return { ...entry, placing: currentPlacing }
  })
}

// --- Gross Tournament Leaderboard ---

export interface GrossLeaderboardEntry {
  playerId: string
  /** Sum of grossTotal across all rounds */
  grossTotal: number
  /** Number of rounds with scorecards */
  roundsPlayed: number
  /** 1-based placing (lowest total wins) */
  placing: number
}

/**
 * Compute the gross total tournament leaderboard.
 * Sums each player's grossTotal across all their individual scorecards
 * (team scorecards are excluded). Lowest total wins.
 * Players with 0 rounds played are excluded from the leaderboard.
 */
export function computeGrossLeaderboard(
  scorecards: Scorecard[],
  playerIds: string[]
): GrossLeaderboardEntry[] {
  const entries = playerIds
    .map((playerId) => {
      const playerCards = scorecards.filter(
        (sc) => sc.playerId === playerId && sc.grossTotal > 0
      )
      return {
        playerId,
        grossTotal: playerCards.reduce((sum, sc) => sum + sc.grossTotal, 0),
        roundsPlayed: playerCards.length,
      }
    })
    .filter((e) => e.roundsPlayed > 0)
    .sort((a, b) => a.grossTotal - b.grossTotal)

  // Assign placings with ties (same total = same placing)
  let currentPlacing = 1
  return entries.map((entry, index) => {
    if (index > 0 && entry.grossTotal > entries[index - 1].grossTotal) {
      currentPlacing = index + 1
    }
    return { ...entry, placing: currentPlacing }
  })
}

// --- Net Tournament Leaderboard ---

export interface NetLeaderboardEntry {
  playerId: string
  /** Sum of netTotal across all rounds */
  netTotal: number
  /** Number of rounds with scorecards that have net totals */
  roundsPlayed: number
  /** 1-based placing (lowest total wins) */
  placing: number
}

/**
 * Compute the net total tournament leaderboard.
 * Sums each player's netTotal across all their individual scorecards
 * (team scorecards and scorecards without net totals are excluded).
 * Lowest total wins.
 */
export function computeNetLeaderboard(
  scorecards: Scorecard[],
  playerIds: string[]
): NetLeaderboardEntry[] {
  const entries = playerIds
    .map((playerId) => {
      const playerCards = scorecards.filter(
        (sc) => sc.playerId === playerId && sc.netTotal != null
      )
      return {
        playerId,
        netTotal: playerCards.reduce((sum, sc) => sum + (sc.netTotal ?? 0), 0),
        roundsPlayed: playerCards.length,
      }
    })
    .filter((e) => e.roundsPlayed > 0)
    .sort((a, b) => a.netTotal - b.netTotal)

  // Assign placings with ties (same total = same placing)
  let currentPlacing = 1
  return entries.map((entry, index) => {
    if (index > 0 && entry.netTotal > entries[index - 1].netTotal) {
      currentPlacing = index + 1
    }
    return { ...entry, placing: currentPlacing }
  })
}
