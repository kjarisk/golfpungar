import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { CreatePlayerInput, UpdatePlayerInput } from '../types'
import {
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
    mutationFn: ({
      tournamentId,
      input,
    }: {
      tournamentId: string
      input: CreatePlayerInput
    }) => createPlayer(tournamentId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: playersQueryKey })
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
