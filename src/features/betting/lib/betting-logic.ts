import type { Bet, BetParticipant, BettingTotals } from '../types'

/**
 * Compute per-player betting totals for a tournament.
 *
 * - `totalWagered` only counts bets that are accepted/won/lost/paid
 *   (pending and rejected bets aren't "real money" yet).
 * - `betCount` counts every bet the player is involved in, regardless of status.
 * - `betsWon` / `betsLost` count only resolved bets (won/lost/paid).
 *
 * `bets` should already be scoped to the tournament; this helper does not
 * filter by tournament. Pass `participants` for ALL bets — the function
 * indexes by `betId` internally.
 */
export function computeBettingTotals(
  bets: Bet[],
  participants: BetParticipant[],
  playerId: string
): BettingTotals {
  const myParticipantBetIds = new Set(
    participants.filter((p) => p.playerId === playerId).map((p) => p.betId)
  )

  const involved = bets.filter(
    (b) => b.createdByPlayerId === playerId || myParticipantBetIds.has(b.id)
  )

  const active = involved.filter(
    (b) =>
      b.status === 'accepted' ||
      b.status === 'won' ||
      b.status === 'lost' ||
      b.status === 'paid'
  )

  const resolved = involved.filter(
    (b) => b.status === 'won' || b.status === 'lost' || b.status === 'paid'
  )

  return {
    playerId,
    totalWagered: active.reduce((sum, b) => sum + b.amount, 0),
    betCount: involved.length,
    betsWon: resolved.filter((b) => b.winnerId === playerId).length,
    betsLost: resolved.filter(
      (b) => b.winnerId != null && b.winnerId !== playerId
    ).length,
  }
}
