import type { Round, RoundStatus } from '../types'

/** Status sort priority: active first, upcoming next, completed last */
const STATUS_ORDER: Record<RoundStatus, number> = {
  active: 0,
  upcoming: 1,
  completed: 2,
}

/**
 * Sort rounds by status priority (active → upcoming → completed).
 * Within the same status:
 * - Active/upcoming: newest first (most recently created)
 * - Completed: oldest first (earliest completed rounds at top)
 *
 * Returns a new sorted array (does not mutate input).
 */
export function sortRounds(rounds: Round[]): Round[] {
  return [...rounds].sort((a, b) => {
    const orderDiff = STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
    if (orderDiff !== 0) return orderDiff
    if (a.status === 'completed') {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })
}
