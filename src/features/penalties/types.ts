// Types for the penalties/ledger feature
// Based on: outline.md §5 "Penalties" + §6 "LedgerEntry"

/** A penalty ledger entry */
export interface LedgerEntry {
  id: string
  tournamentId: string
  /** The player who received the penalty */
  playerId: string
  /** Kind of ledger entry (currently only 'penalty') */
  kind: 'penalty'
  /** Penalty amount (positive number, e.g. 1 = one penalty point) */
  amount: number
  /** Optional note describing the penalty */
  note: string
  /** Which round this penalty relates to (optional) */
  roundId?: string
  /** ISO timestamp */
  createdAt: string
}

/** Input for creating a penalty */
export interface CreatePenaltyInput {
  tournamentId: string
  playerId: string
  amount: number
  note: string
  roundId?: string
}

/** Penalty totals per player */
export interface PenaltyTotals {
  playerId: string
  totalAmount: number
  entryCount: number
}
