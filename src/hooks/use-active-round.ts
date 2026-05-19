import { useActiveTournament } from '@/features/tournament'
import { useActiveRound as useActiveRoundForTournament } from '@/features/rounds'

/**
 * Returns the currently active round for the active tournament, if any.
 * An active round has status 'active'. When several rounds are active, the
 * most recently created one is returned.
 */
export function useActiveRound() {
  const tournament = useActiveTournament()
  return useActiveRoundForTournament(tournament?.id)
}
