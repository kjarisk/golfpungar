import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchInvites, sendInvite } from './invites-api'

export const invitesQueryKey = ['invites'] as const

export function useInvites() {
  return useQuery({ queryKey: invitesQueryKey, queryFn: fetchInvites })
}

export function useTournamentInvites(tournamentId: string | null | undefined) {
  const { data: invites = [] } = useInvites()
  return invites.filter((i) => i.tournamentId === tournamentId)
}

export function useSendInvite() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      tournamentId,
      email,
      role,
    }: {
      tournamentId: string
      email: string
      role?: 'admin' | 'player'
    }) => sendInvite(tournamentId, email, role),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: invitesQueryKey })
    },
  })
}
