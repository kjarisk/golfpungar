import { useAuthStore } from '@/features/auth'
import { usePlayers } from '@/features/players'
import { useActiveTournament } from '@/features/tournament'

/**
 * Returns the current player ID (not userId) for the logged-in user
 * within the active tournament. Returns null if no match found.
 */
export function useCurrentPlayerId(): string | null {
  const userId = useAuthStore((s) => s.user?.id ?? null)
  const tournament = useActiveTournament()
  const { data: players = [] } = usePlayers()

  if (!userId || !tournament) return null

  const player = players.find(
    (p) => p.userId === userId && p.tournamentId === tournament.id
  )
  return player?.id ?? null
}
