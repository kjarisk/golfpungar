/**
 * Pure-function logic for computing trophy standings.
 *
 * Trophies are derived from live data — they are NOT stored as static records.
 * This module takes data from each source (points, side events, penalties, bets)
 * and produces a TrophyStanding for each predefined trophy.
 */
import type { TrophyStanding } from '../types'
import { TROPHY_DEFINITIONS } from '../types'
import type { RoundPoints, Scorecard } from '@/features/scoring'
import type { SideEventTotals } from '@/features/side-events'
import type { PenaltyTotals } from '@/features/penalties'
import type { BettingTotals } from '@/features/betting'
import {
  computeTotalPointsLeaderboard,
  computeGrossLeaderboard,
  computeNetLeaderboard,
  computeSideLeaderboard,
} from '@/lib/leaderboard-calc'

/** Icon mapping for trophy sourceKeys */
const ICON_MAP: Record<string, string> = {
  total_points: 'trophy',
  gross_total: 'hash',
  net_total: 'hash',
  birdies: 'bird',
  eagles: 'zap',
  snakes: 'skull',
  snopp: 'flame',
  longest_drive: 'ruler',
  longest_putt: 'ruler',
  nearest_to_pin: 'crosshair',
  gir: 'circle-dot',
  bunker_saves: 'target',
  group_longest_drives: 'star',
  penalties: 'alert-triangle',
  biggest_bettor: 'circle-dollar-sign',
}

export interface TrophyComputeInput {
  tournamentId: string
  playerIds: string[]
  allRoundPoints: RoundPoints[]
  allScorecards: Scorecard[]
  sideTotals: SideEventTotals[]
  longestDrives: { playerId: string; meters: number }[]
  longestPutts: { playerId: string; meters: number }[]
  nearestToPins: { playerId: string; meters: number }[]
  penaltyTotals: PenaltyTotals[]
  bettingTotals: BettingTotals[]
}

/**
 * Compute all trophy standings from the provided data.
 * Returns one TrophyStanding per TROPHY_DEFINITIONS entry.
 */
export function computeTrophyStandings(
  input: TrophyComputeInput
): TrophyStanding[] {
  const {
    tournamentId,
    playerIds,
    allRoundPoints,
    allScorecards,
    sideTotals,
    longestDrives,
    longestPutts,
    nearestToPins,
    penaltyTotals,
    bettingTotals,
  } = input

  return TROPHY_DEFINITIONS.map((def, index) => {
    const trophy = {
      id: `trophy-${String(index + 1).padStart(3, '0')}`,
      tournamentId,
      name: def.name,
      sourceType: def.sourceType,
      sourceKey: def.sourceKey,
    }

    const result = computeLeaderForKey(def.sourceKey, {
      playerIds,
      allRoundPoints,
      allScorecards,
      sideTotals,
      longestDrives,
      longestPutts,
      nearestToPins,
      penaltyTotals,
      bettingTotals,
    })

    return {
      trophy,
      leaderId: result.leaderId,
      leaderValue: result.leaderValue,
      icon: ICON_MAP[def.sourceKey] ?? 'trophy',
    }
  })
}

interface LeaderResult {
  leaderId: string | null
  leaderValue: string | null
}

function computeLeaderForKey(
  sourceKey: string,
  data: Omit<TrophyComputeInput, 'tournamentId'>
): LeaderResult {
  const {
    playerIds,
    allRoundPoints,
    allScorecards,
    sideTotals,
    longestDrives,
    longestPutts,
    nearestToPins,
    penaltyTotals,
    bettingTotals,
  } = data

  switch (sourceKey) {
    // Points-based
    case 'total_points': {
      const board = computeTotalPointsLeaderboard(allRoundPoints, playerIds)
      const leader = board.find((e) => e.placing === 1 && e.totalPoints > 0)
      return leader
        ? { leaderId: leader.playerId, leaderValue: `${leader.totalPoints}p` }
        : { leaderId: null, leaderValue: null }
    }
    case 'gross_total': {
      const board = computeGrossLeaderboard(allScorecards, playerIds)
      const leader = board[0]
      return leader
        ? { leaderId: leader.playerId, leaderValue: `${leader.grossTotal}` }
        : { leaderId: null, leaderValue: null }
    }
    case 'net_total': {
      const board = computeNetLeaderboard(allScorecards, playerIds)
      const leader = board[0]
      return leader
        ? { leaderId: leader.playerId, leaderValue: `${leader.netTotal}` }
        : { leaderId: null, leaderValue: null }
    }

    // Count-based side events
    case 'birdies':
      return countLeader(sideTotals, (t) => t.birdies)
    case 'eagles':
      return countLeader(sideTotals, (t) => t.eagles)
    case 'snakes':
      return countLeader(sideTotals, (t) => t.snakes)
    case 'snopp':
      return countLeader(sideTotals, (t) => t.snopp)
    case 'gir':
      return countLeader(sideTotals, (t) => t.gir)
    case 'bunker_saves':
      return countLeader(sideTotals, (t) => t.bunkerSaves)
    case 'group_longest_drives':
      return countLeader(sideTotals, (t) => t.groupLongestDrives)

    // Distance-based side events
    case 'longest_drive': {
      if (longestDrives.length === 0)
        return { leaderId: null, leaderValue: null }
      const best = longestDrives[0] // already sorted descending
      return { leaderId: best.playerId, leaderValue: `${best.meters}m` }
    }
    case 'longest_putt': {
      if (longestPutts.length === 0)
        return { leaderId: null, leaderValue: null }
      const best = longestPutts[0]
      return { leaderId: best.playerId, leaderValue: `${best.meters}m` }
    }
    case 'nearest_to_pin': {
      if (nearestToPins.length === 0)
        return { leaderId: null, leaderValue: null }
      const best = nearestToPins[0] // sorted ascending (closest first)
      return { leaderId: best.playerId, leaderValue: `${best.meters}m` }
    }

    // Penalties
    case 'penalties': {
      const withPenalties = penaltyTotals.filter((t) => t.totalAmount > 0)
      if (withPenalties.length === 0)
        return { leaderId: null, leaderValue: null }
      const king = withPenalties.reduce((max, t) =>
        t.totalAmount > max.totalAmount ? t : max
      )
      return {
        leaderId: king.playerId,
        leaderValue: `${king.totalAmount}`,
      }
    }

    // Betting
    case 'biggest_bettor': {
      const withBets = bettingTotals.filter((t) => t.totalWagered > 0)
      if (withBets.length === 0) return { leaderId: null, leaderValue: null }
      const biggest = withBets.reduce((max, t) =>
        t.totalWagered > max.totalWagered ? t : max
      )
      return {
        leaderId: biggest.playerId,
        leaderValue: `${biggest.totalWagered}`,
      }
    }

    default:
      return { leaderId: null, leaderValue: null }
  }
}

/**
 * Helper for count-based side event trophies.
 * Uses computeSideLeaderboard to properly handle ties.
 */
function countLeader(
  sideTotals: SideEventTotals[],
  selector: (t: SideEventTotals) => number
): LeaderResult {
  const board = computeSideLeaderboard(sideTotals, selector)
  const leader = board.find((e) => e.placing === 1)
  return leader
    ? { leaderId: leader.playerId, leaderValue: `${leader.count}` }
    : { leaderId: null, leaderValue: null }
}
