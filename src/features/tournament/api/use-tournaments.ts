import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Tournament, TournamentStatus } from '../types'
import { useActiveTournamentStore } from '../state/active-tournament-store'
import {
  createTournament,
  fetchTournaments,
  removeTournament,
  setTournamentStatus,
  updateTournament,
  type UpdateTournamentInput,
} from './tournaments-api'

export const tournamentsQueryKey = ['tournaments'] as const

export function useTournaments() {
  return useQuery({ queryKey: tournamentsQueryKey, queryFn: fetchTournaments })
}

export function useTournament(id: string | null | undefined) {
  const { data: tournaments } = useTournaments()
  return tournaments?.find((t) => t.id === id)
}

/**
 * The active tournament: the user's selection when still valid, otherwise a
 * sensible default — the most recent non-done tournament, else the most recent.
 * Returns undefined while the query is loading or when there are none.
 */
export function useActiveTournament(): Tournament | undefined {
  const { data: tournaments = [] } = useTournaments()
  const selectedId = useActiveTournamentStore((s) => s.selectedTournamentId)
  const selected = tournaments.find((t) => t.id === selectedId)
  if (selected) return selected
  return tournaments.find((t) => t.status !== 'done') ?? tournaments[0]
}

export function useSetActiveTournament() {
  return useActiveTournamentStore((s) => s.setActiveTournament)
}

export function useCreateTournament() {
  const queryClient = useQueryClient()
  const setActive = useActiveTournamentStore((s) => s.setActiveTournament)
  return useMutation({
    mutationFn: createTournament,
    onSuccess: (tournament) => {
      setActive(tournament.id)
      void queryClient.invalidateQueries({ queryKey: tournamentsQueryKey })
    },
  })
}

export function useUpdateTournament() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string
      updates: UpdateTournamentInput
    }) => updateTournament(id, updates),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tournamentsQueryKey })
    },
  })
}

export function useSetTournamentStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: TournamentStatus }) =>
      setTournamentStatus(id, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tournamentsQueryKey })
    },
  })
}

export function useRemoveTournament() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: removeTournament,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tournamentsQueryKey })
    },
  })
}
