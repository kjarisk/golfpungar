import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { personsQueryKey } from '@/features/persons'
import type { UpdatePlayerInput } from '../types'
import {
  addNewPersonToTournament,
  createPlayer,
  fetchPlayers,
  removePlayer,
  updatePlayer,
} from './players-api'

export const playersQueryKey = ['players'] as const

export function usePlayers() {
  return useQuery({ queryKey: playersQueryKey, queryFn: fetchPlayers })
}

export function useActivePlayers(tournamentId: string | null | undefined) {
  const { data: players = [] } = usePlayers()
  return players.filter((p) => p.tournamentId === tournamentId && p.active)
}

export function useCreatePlayer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createPlayer,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: playersQueryKey })
    },
  })
}

export function useAddNewPersonToTournament() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: addNewPersonToTournament,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: playersQueryKey })
      void queryClient.invalidateQueries({ queryKey: personsQueryKey })
    },
  })
}

export function useUpdatePlayer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdatePlayerInput }) =>
      updatePlayer(id, updates),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: playersQueryKey })
    },
  })
}

export function useRemovePlayer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: removePlayer,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: playersQueryKey })
    },
  })
}
