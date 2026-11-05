import type { Player } from '@/features/players'
import type { Team } from '@/features/rounds'

/** Look up a player's display name by ID. Returns fallback if not found. */
export function getPlayerName(
  players: Player[],
  playerId: string,
  fallback = 'Unknown'
): string {
  return players.find((p) => p.id === playerId)?.displayName ?? fallback
}

/**
 * Look up a participant name — checks players first, then teams.
 * Useful for leaderboards and scorecards where participantId could be either.
 */
export function getParticipantName(
  players: Player[],
  teams: Team[],
  participantId: string,
  fallback = 'Unknown'
): string {
  const player = players.find((p) => p.id === participantId)
  if (player) return player.displayName
  const team = teams.find((t) => t.id === participantId)
  if (team) return team.name
  return fallback
}
