import type { Scorecard, RoundPoints } from '../types'

/** Default top-10 points table */
export const DEFAULT_POINTS: number[] = [15, 12, 10, 8, 7, 6, 5, 4, 3, 2]

interface ScorecardWithSort {
  scorecard: Scorecard
  /** The value used for ranking. Lower is better for stroke play / net total.
   *  Higher is better for stableford. */
  sortValue: number
}

/**
 * Given scorecards for a round, compute placings and award points.
 *
 * For stableford: rank by stablefordPoints descending (higher = better).
 * For handicap/bestball: rank by netTotal ascending (lower = better).
 * For scramble: rank by grossTotal ascending (lower = better).
 *
 * Ties share the average of their placing points (e.g. two tied for 1st
 * share (1st + 2nd) / 2 points).
 */
export function awardPoints(
  scorecards: Scorecard[],
  format: 'stableford' | 'handicap' | 'bestball' | 'scramble',
  pointsTable: number[] = DEFAULT_POINTS
): RoundPoints[] {
  if (scorecards.length === 0) return []

  // Build sortable list
  const items: ScorecardWithSort[] = scorecards.map((sc) => ({
    scorecard: sc,
    sortValue: getSortValue(sc, format),
  }))

  // Sort: for stableford, higher is better (descending).
  // For everything else, lower is better (ascending).
  const isDescending = format === 'stableford'

  items.sort((a, b) =>
    isDescending ? b.sortValue - a.sortValue : a.sortValue - b.sortValue
  )

  // Assign placings with tie handling
  const results: RoundPoints[] = []
  let i = 0

  while (i < items.length) {
    // Find all tied at this position
    let j = i + 1
    while (j < items.length && items[j].sortValue === items[i].sortValue) {
      j++
    }

    const tiedCount = j - i
    const placing = i + 1 // 1-based

    // Average the points across tied placings
    let totalPoints = 0
    for (let k = i; k < j; k++) {
      const pointsIndex = k // 0-based index into points table
      totalPoints +=
        pointsIndex < pointsTable.length ? pointsTable[pointsIndex] : 0
    }
    const sharedPoints =
      tiedCount > 0 ? Math.round((totalPoints / tiedCount) * 10) / 10 : 0

    for (let k = i; k < j; k++) {
      const sc = items[k].scorecard
      const participantId = sc.playerId ?? sc.teamId ?? ''

      results.push({
        id: `rp-${sc.roundId}-${participantId}`,
        roundId: sc.roundId,
        participantId,
        placing,
        pointsAwarded: sharedPoints,
      })
    }

    i = j
  }

  return results
}

function getSortValue(
  sc: Scorecard,
  format: 'stableford' | 'handicap' | 'bestball' | 'scramble'
): number {
  switch (format) {
    case 'stableford':
      return sc.stablefordPoints ?? 0
    case 'handicap':
    case 'bestball':
      return sc.netTotal ?? sc.grossTotal
    case 'scramble':
      return sc.grossTotal
  }
}
