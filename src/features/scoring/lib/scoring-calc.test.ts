/// <reference types="vitest/globals" />
import {
  handicapStrokesForHole,
  stablefordPointsForHole,
  calculateStablefordTotal,
  calculateGrossTotal,
  calculateNetTotal,
  isScorecardComplete,
} from './scoring-calc'
import type { Hole } from '@/features/courses'

// Helper to create a hole
function makeHole(num: number, par: number, si: number): Hole {
  return {
    id: `hole-${num}`,
    courseId: 'course-001',
    holeNumber: num,
    par,
    strokeIndex: si,
  }
}

// Standard 18-hole course for tests
const HOLES_18: Hole[] = [
  makeHole(1, 4, 11),
  makeHole(2, 5, 3),
  makeHole(3, 3, 17),
  makeHole(4, 4, 7),
  makeHole(5, 4, 1),
  makeHole(6, 4, 13),
  makeHole(7, 3, 15),
  makeHole(8, 5, 5),
  makeHole(9, 4, 9),
  makeHole(10, 4, 12),
  makeHole(11, 5, 4),
  makeHole(12, 3, 18),
  makeHole(13, 4, 8),
  makeHole(14, 4, 2),
  makeHole(15, 4, 14),
  makeHole(16, 3, 16),
  makeHole(17, 5, 6),
  makeHole(18, 4, 10),
]

describe('handicapStrokesForHole', () => {
  it('returns 0 for handicap 0', () => {
    expect(handicapStrokesForHole(0, 1, 18)).toBe(0)
    expect(handicapStrokesForHole(0, 18, 18)).toBe(0)
  })

  it('gives 1 stroke on holes where SI <= handicap', () => {
    // HCP 10 should get 1 stroke on SI 1-10, 0 on SI 11-18
    expect(handicapStrokesForHole(10, 1, 18)).toBe(1)
    expect(handicapStrokesForHole(10, 10, 18)).toBe(1)
    expect(handicapStrokesForHole(10, 11, 18)).toBe(0)
    expect(handicapStrokesForHole(10, 18, 18)).toBe(0)
  })

  it('gives 1 stroke on all holes for handicap 18', () => {
    for (let si = 1; si <= 18; si++) {
      expect(handicapStrokesForHole(18, si, 18)).toBe(1)
    }
  })

  it('gives 2 strokes on hardest holes for handicap > 18', () => {
    // HCP 22: 2 strokes on SI 1-4, 1 stroke on SI 5-18
    expect(handicapStrokesForHole(22, 1, 18)).toBe(2)
    expect(handicapStrokesForHole(22, 4, 18)).toBe(2)
    expect(handicapStrokesForHole(22, 5, 18)).toBe(1)
    expect(handicapStrokesForHole(22, 18, 18)).toBe(1)
  })

  it('halves handicap for 9-hole rounds', () => {
    // HCP 18 -> effective 9, so SI 1-9 get 1 stroke
    expect(handicapStrokesForHole(18, 1, 9)).toBe(1)
    expect(handicapStrokesForHole(18, 9, 9)).toBe(1)
  })

  it('handles negative handicap (scratch+)', () => {
    expect(handicapStrokesForHole(-2, 1, 18)).toBe(0)
  })
})

describe('stablefordPointsForHole', () => {
  it('returns 2 for net par', () => {
    // Par 4, HCP 0, strokes 4 => net 4, diff 0 => 2 pts
    expect(stablefordPointsForHole(4, 4, 0, 1, 18)).toBe(2)
  })

  it('returns 3 for net birdie', () => {
    // Par 4, HCP 0, strokes 3 => net 3 => 3 pts
    expect(stablefordPointsForHole(3, 4, 0, 1, 18)).toBe(3)
  })

  it('returns 1 for net bogey', () => {
    expect(stablefordPointsForHole(5, 4, 0, 1, 18)).toBe(1)
  })

  it('returns 0 for net double bogey or worse', () => {
    expect(stablefordPointsForHole(6, 4, 0, 1, 18)).toBe(0)
    expect(stablefordPointsForHole(8, 4, 0, 1, 18)).toBe(0)
  })

  it('returns 4 for net eagle', () => {
    expect(stablefordPointsForHole(2, 4, 0, 1, 18)).toBe(4)
  })

  it('returns 5 for net albatross', () => {
    expect(stablefordPointsForHole(1, 4, 0, 1, 18)).toBe(5)
  })

  it('accounts for handicap strokes', () => {
    // Par 4, HCP 18 (gets 1 stroke on SI 1), gross 5
    // Net = 5 - 1 = 4. Diff = 0. => 2 pts (net par)
    expect(stablefordPointsForHole(5, 4, 18, 1, 18)).toBe(2)
  })

  it('returns 0 for null strokes', () => {
    expect(stablefordPointsForHole(null, 4, 0, 1, 18)).toBe(0)
  })
})

describe('calculateStablefordTotal', () => {
  it('sums stableford points across all holes', () => {
    // All pars: each hole = 2 pts => 18 * 2 = 36
    const allPars = HOLES_18.map((h) => h.par)
    const total = calculateStablefordTotal(allPars, HOLES_18, 0)
    expect(total).toBe(36)
  })

  it('skips null holes', () => {
    const strokes = Array(18).fill(null)
    strokes[0] = 4 // Hole 1 is par 4, SI 11
    const total = calculateStablefordTotal(strokes, HOLES_18, 0)
    expect(total).toBe(2) // just par on hole 1
  })

  it('accounts for handicap across round', () => {
    // HCP 18 player shooting all gross 5s on par 4 holes
    // Gets 1 stroke on every hole -> net 4 on par 4 = 2 pts each
    // But par 3 holes: gross 5, net 4, diff +1 => 1 pt
    // Par 5 holes: gross 5, net 4, diff -1 => 3 pts
    const allFives = Array(18).fill(5)
    const total = calculateStablefordTotal(allFives, HOLES_18, 18)
    // Count by par: par3 (4 holes) => 1pt each = 4
    //               par4 (10 holes) => 2pts each = 20
    //               par5 (4 holes) => 3pts each = 12
    // Total = 36
    expect(total).toBe(36)
  })
})

describe('calculateGrossTotal', () => {
  it('sums non-null strokes', () => {
    expect(calculateGrossTotal([4, 5, 3, null, 4])).toBe(16)
  })

  it('returns 0 for all nulls', () => {
    expect(calculateGrossTotal([null, null, null])).toBe(0)
  })

  it('sums all strokes when complete', () => {
    expect(calculateGrossTotal([4, 4, 4])).toBe(12)
  })
})

describe('calculateNetTotal', () => {
  it('subtracts handicap strokes from gross', () => {
    // Par 4, SI 1, HCP 1: gets 1 stroke on this hole only
    const holes = [makeHole(1, 4, 1)]
    // Gross 5, net = 5 - 1 = 4
    expect(calculateNetTotal([5], holes, 1)).toBe(4)
  })

  it('skips null holes', () => {
    const holes = [makeHole(1, 4, 1), makeHole(2, 4, 2)]
    expect(calculateNetTotal([5, null], holes, 1)).toBe(4)
  })
})

describe('isScorecardComplete', () => {
  it('returns true when all filled', () => {
    expect(isScorecardComplete([4, 5, 3])).toBe(true)
  })

  it('returns false with any null', () => {
    expect(isScorecardComplete([4, null, 3])).toBe(false)
  })

  it('returns false when all null', () => {
    expect(isScorecardComplete([null, null])).toBe(false)
  })
})
