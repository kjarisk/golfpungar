import type { Hole } from '@/features/courses'
import type { HoleStroke } from '../types'

/**
 * Calculate how many handicap strokes a player receives on a given hole.
 *
 * A player with groupHandicap N receives 1 extra stroke on the N holes
 * with the lowest strokeIndex. If handicap > 18, they receive 2 strokes
 * on the (handicap - 18) hardest holes, and 1 on the rest.
 */
export function handicapStrokesForHole(
  groupHandicap: number,
  strokeIndex: number,
  totalHoles: 9 | 18
): number {
  if (groupHandicap <= 0) return 0

  // For 9-hole rounds, halve the handicap (rounded)
  const effectiveHandicap =
    totalHoles === 9 ? Math.round(groupHandicap / 2) : groupHandicap

  if (effectiveHandicap >= totalHoles * 2) {
    // Extremely high handicap: 2 strokes on every hole
    return 2
  }

  if (effectiveHandicap > totalHoles) {
    // More than 1 stroke per hole on hardest holes
    const extraStrokeHoles = effectiveHandicap - totalHoles
    // Holes with strokeIndex <= extraStrokeHoles get 2 strokes
    return strokeIndex <= extraStrokeHoles ? 2 : 1
  }

  // Standard: 1 stroke on holes where strokeIndex <= handicap
  return strokeIndex <= effectiveHandicap ? 1 : 0
}

/**
 * Calculate net strokes for a single hole.
 */
export function netStrokesForHole(
  grossStrokes: number,
  groupHandicap: number,
  hole: Hole,
  totalHoles: 9 | 18
): number {
  const hcpStrokes = handicapStrokesForHole(
    groupHandicap,
    hole.strokeIndex,
    totalHoles
  )
  return grossStrokes - hcpStrokes
}

/**
 * Standard stableford points for a hole based on net score vs par.
 *
 * Net double-bogey or worse = 0
 * Net bogey = 1
 * Net par = 2
 * Net birdie = 3
 * Net eagle = 4
 * Net albatross = 5
 */
export function stablefordPointsForHole(
  grossStrokes: number | null,
  par: number,
  groupHandicap: number,
  strokeIndex: number,
  totalHoles: 9 | 18
): number {
  if (grossStrokes === null) return 0

  const hcpStrokes = handicapStrokesForHole(
    groupHandicap,
    strokeIndex,
    totalHoles
  )
  const netStrokes = grossStrokes - hcpStrokes
  const diff = netStrokes - par // positive = over par

  // 2 (par) - diff, minimum 0
  const points = 2 - diff
  return Math.max(0, points)
}

/**
 * Calculate total stableford points for a round.
 */
export function calculateStablefordTotal(
  holeStrokes: HoleStroke[],
  holes: Hole[],
  groupHandicap: number
): number {
  const totalHoles = holes.length as 9 | 18
  let total = 0

  for (let i = 0; i < holes.length; i++) {
    const strokes = holeStrokes[i]
    if (strokes === null) continue

    total += stablefordPointsForHole(
      strokes,
      holes[i].par,
      groupHandicap,
      holes[i].strokeIndex,
      totalHoles
    )
  }

  return total
}

/**
 * Calculate gross total from hole strokes (sum of non-null entries).
 */
export function calculateGrossTotal(holeStrokes: HoleStroke[]): number {
  return holeStrokes.reduce<number>((sum, s) => (s !== null ? sum + s : sum), 0)
}

/**
 * Calculate net total from hole strokes and handicap.
 */
export function calculateNetTotal(
  holeStrokes: HoleStroke[],
  holes: Hole[],
  groupHandicap: number
): number {
  const totalHoles = holes.length as 9 | 18
  let total = 0

  for (let i = 0; i < holes.length; i++) {
    const strokes = holeStrokes[i]
    if (strokes === null) continue

    total += netStrokesForHole(strokes, groupHandicap, holes[i], totalHoles)
  }

  return total
}

/**
 * Check if all holes have been entered.
 */
export function isScorecardComplete(holeStrokes: HoleStroke[]): boolean {
  return holeStrokes.every((s) => s !== null)
}
