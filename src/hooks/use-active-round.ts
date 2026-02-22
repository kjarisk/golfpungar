import { useTournamentStore } from '@/features/tournament'
import { useRoundsStore } from '@/features/rounds'

/**
 * Returns the currently active round for the active tournament, if any.
 * An active round has status 'active'. Only one active round per tournament is allowed.
 */
export function useActiveRound() {
  const tournament = useTournamentStore((s) => s.activeTournament())
  const getActiveRound = useRoundsStore((s) => s.getActiveRound)
  return tournament ? getActiveRound(tournament.id) : undefined
}
