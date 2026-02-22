import { useAuthStore } from '@/features/auth'
import { usePlayersStore } from '@/features/players'
import { useTournamentStore } from '@/features/tournament'

/**
 * Returns the current player ID (not userId) for the logged-in user
 * within the active tournament. Returns null if no match found.
 */
export function useCurrentPlayerId(): string | null {
  const userId = useAuthStore((s) => s.user?.id ?? null)
  const tournament = useTournamentStore((s) => s.activeTournament())
  const players = usePlayersStore((s) => s.players)

  if (!userId || !tournament) return null

  const player = players.find(
    (p) => p.userId === userId && p.tournamentId === tournament.id
  )
  return player?.id ?? null
}
