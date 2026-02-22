// Types for the betting feature
// Based on: outline.md §4.7 "Betting", §5 "Bets", §6 "Bet" + "BetParticipant"

/** Bet scope — round-specific or tournament-wide */
export type BetScope = 'round' | 'tournament'

/**
 * Metric that the bet is targeting.
 * 'head_to_head' is a special case — lower score wins between two players.
 */
export type BetMetric =
  | 'most_points'
  | 'most_birdies'
  | 'head_to_head'
  | 'custom'

/**
 * Bet status lifecycle:
 *   pending → accepted → won/lost → paid
 *   pending → rejected
 *
 * 'paid' requires confirmation from ALL parties (creator + all participants).
 */
export type BetStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'won'
  | 'lost'
  | 'paid'

/** A bet created by a player */
export interface Bet {
  id: string
  tournamentId: string
  /** The player who created the bet */
  createdByPlayerId: string
  /** Round-specific or tournament-wide */
  scope: BetScope
  /** What the bet is about */
  metricKey: BetMetric
  /** Custom description when metricKey is 'custom' */
  customDescription?: string
  /** Required when scope is 'round' */
  roundId?: string
  /** Bet amount (arbitrary number, e.g. units/currency) */
  amount: number
  /** Current status of the bet */
  status: BetStatus
  /** The winner's playerId (set when resolved) */
  winnerId?: string
  /** Whether the creator has confirmed payment (for paid flow) */
  creatorPaidConfirmed: boolean
  /** ISO timestamp */
  createdAt: string
}

/** A participant in a bet (the opponents invited by the creator) */
export interface BetParticipant {
  id: string
  betId: string
  playerId: string
  /** Whether the participant has accepted the bet */
  accepted: boolean | null // null = no response yet
  /** Whether the participant has confirmed payment (for paid flow) */
  paidConfirmed: boolean
}

/** Input for creating a new bet */
export interface CreateBetInput {
  tournamentId: string
  createdByPlayerId: string
  scope: BetScope
  metricKey: BetMetric
  customDescription?: string
  roundId?: string
  amount: number
  /** Player IDs of opponents to invite */
  opponentIds: string[]
}

/** Aggregated betting totals per player */
export interface BettingTotals {
  playerId: string
  /** Total amount wagered across all bets (created + participated) */
  totalWagered: number
  /** Number of bets involved in */
  betCount: number
  /** Number of bets won */
  betsWon: number
  /** Number of bets lost */
  betsLost: number
}
