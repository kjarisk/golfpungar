/**
 * Pure-function logic for snake (3-putt) tracking.
 * Kept separate from the store for easy unit testing.
 */
import type { SideEventLog, LastSnakeInGroup } from '../types'

/**
 * Determine who holds the "last snake" in a given group for a round.
 *
 * Rules (from outline §5):
 * - A snake = 3 putts on a hole
 * - "Last snake in group" = derived from the latest snake timestamp
 *   within each group
 * - If no snakes in the group, playerId is null
 */
export function deriveLastSnakeInGroup(
  events: SideEventLog[],
  roundId: string,
  groupId: string,
  groupPlayerIds: string[]
): LastSnakeInGroup {
  const snakes = events
    .filter(
      (e) =>
        e.roundId === roundId &&
        e.type === 'snake' &&
        groupPlayerIds.includes(e.playerId)
    )
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

  const latest = snakes[0] ?? null

  return {
    groupId,
    roundId,
    playerId: latest?.playerId ?? null,
    holeNumber: latest?.holeNumber,
  }
}
