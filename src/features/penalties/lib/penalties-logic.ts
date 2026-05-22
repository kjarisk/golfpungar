import type { LedgerEntry, PenaltyTotals } from '../types'

/** Per-player penalty totals for a tournament. */
export function computePenaltyTotals(
  entries: LedgerEntry[],
  tournamentId: string,
  playerIds: string[]
): PenaltyTotals[] {
  const scoped = entries.filter((e) => e.tournamentId === tournamentId)
  return playerIds.map((playerId) => {
    const mine = scoped.filter((e) => e.playerId === playerId)
    return {
      playerId,
      totalAmount: mine.reduce((sum, e) => sum + e.amount, 0),
      entryCount: mine.length,
    }
  })
}

/** Player with the highest total penalty amount, or null if none. */
export function computePenaltyKing(
  entries: LedgerEntry[],
  tournamentId: string,
  playerIds: string[]
): PenaltyTotals | null {
  const totals = computePenaltyTotals(entries, tournamentId, playerIds).filter(
    (t) => t.totalAmount > 0
  )
  if (totals.length === 0) return null
  return totals.reduce((king, t) =>
    t.totalAmount > king.totalAmount ? t : king
  )
}
