import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createPenalty, fetchPenalties, removePenalty } from './penalties-api'
import type { LedgerEntry } from '../types'

export const penaltiesQueryKey = ['penalties'] as const

export function usePenalties() {
  return useQuery({
    queryKey: penaltiesQueryKey,
    queryFn: fetchPenalties,
  })
}

export function usePenaltiesByTournament(
  tournamentId: string | null | undefined
): LedgerEntry[] {
  const { data: entries = [] } = usePenalties()
  if (!tournamentId) return []
  return entries.filter((e) => e.tournamentId === tournamentId)
}

export function usePenaltiesByPlayer(
  tournamentId: string | null | undefined,
  playerId: string | null | undefined
): LedgerEntry[] {
  const { data: entries = [] } = usePenalties()
  if (!tournamentId || !playerId) return []
  return entries.filter(
    (e) => e.tournamentId === tournamentId && e.playerId === playerId
  )
}

export function useCreatePenalty() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createPenalty,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: penaltiesQueryKey })
    },
  })
}

export function useRemovePenalty() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: removePenalty,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: penaltiesQueryKey })
    },
  })
}
