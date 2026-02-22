import { create } from 'zustand'
import type {
  Bet,
  BetParticipant,
  BetStatus,
  BettingTotals,
  CreateBetInput,
} from '../types'

interface BettingState {
  bets: Bet[]
  participants: BetParticipant[]

  // Queries
  getBetsByTournament: (tournamentId: string) => Bet[]
  getBetsByStatus: (tournamentId: string, status: BetStatus) => Bet[]
  getBetsForPlayer: (tournamentId: string, playerId: string) => Bet[]
  getParticipantsForBet: (betId: string) => BetParticipant[]
  getBetById: (betId: string) => Bet | undefined

  // Aggregation
  getTotalsForTournament: (
    tournamentId: string,
    playerIds: string[]
  ) => BettingTotals[]
  getBiggestBettor: (
    tournamentId: string,
    playerIds: string[]
  ) => BettingTotals | null

  // Actions
  createBet: (input: CreateBetInput) => Bet
  acceptBet: (betId: string, playerId: string) => void
  rejectBet: (betId: string, playerId: string) => void
  resolveBet: (betId: string, winnerId: string) => void
  confirmPaid: (betId: string, playerId: string) => void
  removeBet: (betId: string) => void
}

let nextBetId = 1
let nextParticipantId = 1

export const useBettingStore = create<BettingState>((set, get) => ({
  bets: [],
  participants: [],

  // --- Queries ---

  getBetsByTournament: (tournamentId) =>
    get().bets.filter((b) => b.tournamentId === tournamentId),

  getBetsByStatus: (tournamentId, status) =>
    get().bets.filter(
      (b) => b.tournamentId === tournamentId && b.status === status
    ),

  getBetsForPlayer: (tournamentId, playerId) => {
    const participantBetIds = get()
      .participants.filter((p) => p.playerId === playerId)
      .map((p) => p.betId)

    return get().bets.filter(
      (b) =>
        b.tournamentId === tournamentId &&
        (b.createdByPlayerId === playerId || participantBetIds.includes(b.id))
    )
  },

  getParticipantsForBet: (betId) =>
    get().participants.filter((p) => p.betId === betId),

  getBetById: (betId) => get().bets.find((b) => b.id === betId),

  // --- Aggregation ---

  getTotalsForTournament: (tournamentId, playerIds) => {
    const bets = get().bets.filter((b) => b.tournamentId === tournamentId)
    const participants = get().participants

    return playerIds.map((playerId) => {
      // Bets where this player is creator or participant
      const participantBetIds = participants
        .filter((p) => p.playerId === playerId)
        .map((p) => p.betId)

      const involvedBets = bets.filter(
        (b) =>
          b.createdByPlayerId === playerId || participantBetIds.includes(b.id)
      )

      // Only count accepted or resolved bets for wagered amount
      const activeBets = involvedBets.filter(
        (b) =>
          b.status === 'accepted' ||
          b.status === 'won' ||
          b.status === 'lost' ||
          b.status === 'paid'
      )

      return {
        playerId,
        totalWagered: activeBets.reduce((sum, b) => sum + b.amount, 0),
        betCount: involvedBets.length,
        betsWon: involvedBets.filter(
          (b) =>
            (b.status === 'won' ||
              b.status === 'lost' ||
              b.status === 'paid') &&
            b.winnerId === playerId
        ).length,
        betsLost: involvedBets.filter(
          (b) =>
            (b.status === 'won' ||
              b.status === 'lost' ||
              b.status === 'paid') &&
            b.winnerId != null &&
            b.winnerId !== playerId
        ).length,
      }
    })
  },

  getBiggestBettor: (tournamentId, playerIds) => {
    const totals = get().getTotalsForTournament(tournamentId, playerIds)
    const withBets = totals.filter((t) => t.totalWagered > 0)

    if (withBets.length === 0) return null

    return withBets.reduce((biggest, t) =>
      t.totalWagered > biggest.totalWagered ? t : biggest
    )
  },

  // --- Actions ---

  createBet: (input) => {
    const bet: Bet = {
      id: `bet-${String(nextBetId++).padStart(3, '0')}`,
      tournamentId: input.tournamentId,
      createdByPlayerId: input.createdByPlayerId,
      scope: input.scope,
      metricKey: input.metricKey,
      customDescription: input.customDescription,
      roundId: input.roundId,
      amount: input.amount,
      status: 'pending',
      creatorPaidConfirmed: false,
      createdAt: new Date().toISOString(),
    }

    const newParticipants: BetParticipant[] = input.opponentIds.map(
      (playerId) => ({
        id: `bp-${String(nextParticipantId++).padStart(3, '0')}`,
        betId: bet.id,
        playerId,
        accepted: null,
        paidConfirmed: false,
      })
    )

    set((state) => ({
      bets: [...state.bets, bet],
      participants: [...state.participants, ...newParticipants],
    }))

    return bet
  },

  acceptBet: (betId, playerId) => {
    set((state) => {
      const newParticipants = state.participants.map((p) =>
        p.betId === betId && p.playerId === playerId
          ? { ...p, accepted: true }
          : p
      )

      // If all participants have accepted, move bet to 'accepted'
      const betParticipants = newParticipants.filter((p) => p.betId === betId)
      const allAccepted = betParticipants.every((p) => p.accepted === true)

      const newBets = state.bets.map((b) =>
        b.id === betId && allAccepted
          ? { ...b, status: 'accepted' as const }
          : b
      )

      return { bets: newBets, participants: newParticipants }
    })
  },

  rejectBet: (betId, playerId) => {
    set((state) => ({
      participants: state.participants.map((p) =>
        p.betId === betId && p.playerId === playerId
          ? { ...p, accepted: false }
          : p
      ),
      bets: state.bets.map((b) =>
        b.id === betId ? { ...b, status: 'rejected' as const } : b
      ),
    }))
  },

  resolveBet: (betId, winnerId) => {
    set((state) => ({
      bets: state.bets.map((b) => {
        if (b.id !== betId) return b
        const isCreatorWinner = b.createdByPlayerId === winnerId
        const newStatus: BetStatus = isCreatorWinner ? 'won' : 'lost'
        return {
          ...b,
          winnerId,
          status: newStatus,
        }
      }),
    }))
  },

  confirmPaid: (betId, playerId) => {
    set((state) => {
      const bet = state.bets.find((b) => b.id === betId)
      if (!bet) return state
      // Only allow paid confirmation on resolved bets
      if (bet.status !== 'won' && bet.status !== 'lost') return state

      const isCreator = bet.createdByPlayerId === playerId

      // Update creator's confirmation on the bet, or participant's on the participant record
      const newBets = state.bets.map((b) => {
        if (b.id !== betId) return b
        return isCreator ? { ...b, creatorPaidConfirmed: true } : b
      })

      const newParticipants = isCreator
        ? state.participants
        : state.participants.map((p) =>
            p.betId === betId && p.playerId === playerId
              ? { ...p, paidConfirmed: true }
              : p
          )

      // Check if ALL parties have confirmed paid
      const updatedBet = newBets.find((b) => b.id === betId)!
      const betParticipants = newParticipants.filter((p) => p.betId === betId)
      const allPaid =
        updatedBet.creatorPaidConfirmed &&
        betParticipants.every((p) => p.paidConfirmed)

      // If all confirmed, move to 'paid' status
      const finalBets = allPaid
        ? newBets.map((b) =>
            b.id === betId ? { ...b, status: 'paid' as const } : b
          )
        : newBets

      return { bets: finalBets, participants: newParticipants }
    })
  },

  removeBet: (betId) => {
    set((state) => ({
      bets: state.bets.filter((b) => b.id !== betId),
      participants: state.participants.filter((p) => p.betId !== betId),
    }))
  },
}))
