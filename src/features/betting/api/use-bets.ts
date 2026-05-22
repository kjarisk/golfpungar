import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  acceptBet,
  confirmPaid,
  createBet,
  fetchBetParticipants,
  fetchBets,
  rejectBet,
  removeBet,
  resolveBet,
} from './bets-api'
import type { Bet, BetParticipant, BetStatus } from '../types'

export const betsQueryKey = ['bets'] as const
export const betParticipantsQueryKey = ['bet-participants'] as const

export function useBets() {
  return useQuery({ queryKey: betsQueryKey, queryFn: fetchBets })
}

export function useBetParticipants() {
  return useQuery({
    queryKey: betParticipantsQueryKey,
    queryFn: fetchBetParticipants,
  })
}

// --- derived selectors ---

export function useBetsByTournament(
  tournamentId: string | null | undefined
): Bet[] {
  const { data: bets = [] } = useBets()
  return useMemo(
    () => bets.filter((b) => b.tournamentId === tournamentId),
    [bets, tournamentId]
  )
}

export function useBetsByStatus(
  tournamentId: string | null | undefined,
  status: BetStatus
): Bet[] {
  const { data: bets = [] } = useBets()
  return useMemo(
    () =>
      bets.filter(
        (b) => b.tournamentId === tournamentId && b.status === status
      ),
    [bets, tournamentId, status]
  )
}

export function useBetsForPlayer(
  tournamentId: string | null | undefined,
  playerId: string | null | undefined
): Bet[] {
  const { data: bets = [] } = useBets()
  const { data: participants = [] } = useBetParticipants()
  return useMemo(() => {
    if (!playerId) return []
    const myBetIds = new Set(
      participants.filter((p) => p.playerId === playerId).map((p) => p.betId)
    )
    return bets.filter(
      (b) =>
        b.tournamentId === tournamentId &&
        (b.createdByPlayerId === playerId || myBetIds.has(b.id))
    )
  }, [bets, participants, tournamentId, playerId])
}

export function useParticipantsForBet(
  betId: string | null | undefined
): BetParticipant[] {
  const { data: participants = [] } = useBetParticipants()
  return useMemo(
    () => participants.filter((p) => p.betId === betId),
    [participants, betId]
  )
}

// --- mutations ---

/**
 * Bet status transitions ripple to participants (and vice versa), so every
 * lifecycle mutation invalidates BOTH caches on settle.
 */
function useInvalidateBoth() {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: betsQueryKey })
    void queryClient.invalidateQueries({ queryKey: betParticipantsQueryKey })
  }
}

export function useCreateBet() {
  const invalidate = useInvalidateBoth()
  return useMutation({
    mutationFn: createBet,
    onSettled: invalidate,
  })
}

export function useAcceptBet() {
  const invalidate = useInvalidateBoth()
  return useMutation({
    mutationFn: acceptBet,
    onSettled: invalidate,
  })
}

export function useRejectBet() {
  const invalidate = useInvalidateBoth()
  return useMutation({
    mutationFn: rejectBet,
    onSettled: invalidate,
  })
}

export function useResolveBet() {
  const invalidate = useInvalidateBoth()
  return useMutation({
    mutationFn: resolveBet,
    onSettled: invalidate,
  })
}

export function useConfirmPaid() {
  const invalidate = useInvalidateBoth()
  return useMutation({
    mutationFn: confirmPaid,
    onSettled: invalidate,
  })
}

export function useRemoveBet() {
  const invalidate = useInvalidateBoth()
  return useMutation({
    mutationFn: removeBet,
    onSettled: invalidate,
  })
}
