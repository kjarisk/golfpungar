import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Round, CreateRoundInput, RoundStatus } from '../types'
import {
  addTeamsToRound,
  createRound,
  fetchGroups,
  fetchRounds,
  fetchTeams,
  removeRound,
  removeTeam,
  removeTeamsByRound,
  restoreRound,
  setRoundStatus,
  updateGroups,
  updateRound,
  updateTeamName,
  type GroupInput,
  type TeamInput,
  type UpdateRoundInput,
} from './rounds-api'

export const roundsQueryKey = ['rounds'] as const
export const groupsQueryKey = ['groups'] as const
export const teamsQueryKey = ['teams'] as const

// --- Query hooks ---

export function useRounds() {
  return useQuery({ queryKey: roundsQueryKey, queryFn: fetchRounds })
}

export function useGroups() {
  return useQuery({ queryKey: groupsQueryKey, queryFn: fetchGroups })
}

export function useTeams() {
  return useQuery({ queryKey: teamsQueryKey, queryFn: fetchTeams })
}

// --- Derived hooks ---

export function useRoundsByTournament(tournamentId: string | null | undefined) {
  const { data: rounds = [] } = useRounds()
  return rounds.filter((r) => r.tournamentId === tournamentId && !r.deleted)
}

export function useDeletedRounds(tournamentId: string | null | undefined) {
  const { data: rounds = [] } = useRounds()
  return rounds.filter((r) => r.tournamentId === tournamentId && r.deleted)
}

export function useGroupsByRound(roundId: string | null | undefined) {
  const { data: groups = [] } = useGroups()
  return groups.filter((g) => g.roundId === roundId)
}

export function useTeamsByRound(roundId: string | null | undefined) {
  const { data: teams = [] } = useTeams()
  return teams.filter((t) => t.roundId === roundId)
}

/**
 * The most recently-created non-deleted active round for a tournament.
 * Multiple active rounds are allowed — `fetchRounds` orders by `created_at`
 * ascending, so the last match is the newest.
 */
export function useActiveRound(
  tournamentId: string | null | undefined
): Round | undefined {
  const { data: rounds = [] } = useRounds()
  const matches = rounds.filter(
    (r) =>
      r.tournamentId === tournamentId && r.status === 'active' && !r.deleted
  )
  return matches[matches.length - 1]
}

// --- Mutation hooks ---

export function useCreateRound() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      tournamentId,
      input,
    }: {
      tournamentId: string
      input: CreateRoundInput
    }) => createRound(tournamentId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: roundsQueryKey })
      void queryClient.invalidateQueries({ queryKey: groupsQueryKey })
      void queryClient.invalidateQueries({ queryKey: teamsQueryKey })
    },
  })
}

export function useUpdateRound() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      roundId,
      input,
    }: {
      roundId: string
      input: UpdateRoundInput
    }) => updateRound(roundId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: roundsQueryKey })
    },
  })
}

export function useUpdateGroups() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      roundId,
      groups,
    }: {
      roundId: string
      groups: GroupInput[]
    }) => updateGroups(roundId, groups),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: groupsQueryKey })
    },
  })
}

export function useSetRoundStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      roundId,
      status,
    }: {
      roundId: string
      status: RoundStatus
    }) => setRoundStatus(roundId, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: roundsQueryKey })
    },
  })
}

export function useRemoveRound() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: removeRound,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: roundsQueryKey })
    },
  })
}

export function useRestoreRound() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: restoreRound,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: roundsQueryKey })
    },
  })
}

export function useAddTeamsToRound() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ roundId, teams }: { roundId: string; teams: TeamInput[] }) =>
      addTeamsToRound(roundId, teams),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: teamsQueryKey })
    },
  })
}

export function useUpdateTeamName() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ teamId, name }: { teamId: string; name: string }) =>
      updateTeamName(teamId, name),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: teamsQueryKey })
    },
  })
}

export function useRemoveTeam() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: removeTeam,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: teamsQueryKey })
    },
  })
}

export function useRemoveTeamsByRound() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: removeTeamsByRound,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: teamsQueryKey })
    },
  })
}
