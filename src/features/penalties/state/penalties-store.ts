import { create } from 'zustand'
import type { LedgerEntry, CreatePenaltyInput, PenaltyTotals } from '../types'

interface PenaltiesState {
  entries: LedgerEntry[]

  // Queries
  getEntriesByTournament: (tournamentId: string) => LedgerEntry[]
  getEntriesByPlayer: (tournamentId: string, playerId: string) => LedgerEntry[]
  getEntriesByRound: (tournamentId: string, roundId: string) => LedgerEntry[]

  // Aggregation
  getTotalsForTournament: (
    tournamentId: string,
    playerIds: string[]
  ) => PenaltyTotals[]
  getPenaltyKing: (
    tournamentId: string,
    playerIds: string[]
  ) => PenaltyTotals | null

  // Actions
  addPenalty: (input: CreatePenaltyInput) => LedgerEntry
  removePenalty: (entryId: string) => void
}

let nextEntryId = 1

export const usePenaltiesStore = create<PenaltiesState>((set, get) => ({
  entries: [],

  // --- Queries ---

  getEntriesByTournament: (tournamentId) =>
    get().entries.filter((e) => e.tournamentId === tournamentId),

  getEntriesByPlayer: (tournamentId, playerId) =>
    get().entries.filter(
      (e) => e.tournamentId === tournamentId && e.playerId === playerId
    ),

  getEntriesByRound: (tournamentId, roundId) =>
    get().entries.filter(
      (e) => e.tournamentId === tournamentId && e.roundId === roundId
    ),

  // --- Aggregation ---

  getTotalsForTournament: (tournamentId, playerIds) => {
    const entries = get().entries.filter((e) => e.tournamentId === tournamentId)

    return playerIds.map((playerId) => {
      const playerEntries = entries.filter((e) => e.playerId === playerId)
      return {
        playerId,
        totalAmount: playerEntries.reduce((sum, e) => sum + e.amount, 0),
        entryCount: playerEntries.length,
      }
    })
  },

  getPenaltyKing: (tournamentId, playerIds) => {
    const totals = get().getTotalsForTournament(tournamentId, playerIds)
    const withPenalties = totals.filter((t) => t.totalAmount > 0)

    if (withPenalties.length === 0) return null

    return withPenalties.reduce((king, t) =>
      t.totalAmount > king.totalAmount ? t : king
    )
  },

  // --- Actions ---

  addPenalty: (input) => {
    const entry: LedgerEntry = {
      id: `penalty-${String(nextEntryId++).padStart(3, '0')}`,
      tournamentId: input.tournamentId,
      playerId: input.playerId,
      kind: 'penalty',
      amount: input.amount,
      note: input.note,
      roundId: input.roundId,
      createdAt: new Date().toISOString(),
    }

    set((state) => ({
      entries: [...state.entries, entry],
    }))

    return entry
  },

  removePenalty: (entryId) => {
    set((state) => ({
      entries: state.entries.filter((e) => e.id !== entryId),
    }))
  },
}))
