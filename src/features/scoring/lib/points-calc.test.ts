/// <reference types="vitest/globals" />
import { awardPoints, DEFAULT_POINTS } from './points-calc'
import type { Scorecard } from '../types'

function makeScorecard(
  id: string,
  roundId: string,
  playerId: string,
  opts: {
    grossTotal?: number
    netTotal?: number | null
    stablefordPoints?: number | null
  } = {}
): Scorecard {
  return {
    id,
    roundId,
    playerId,
    holeStrokes: [],
    grossTotal: opts.grossTotal ?? 0,
    netTotal: opts.netTotal ?? null,
    stablefordPoints: opts.stablefordPoints ?? null,
    isComplete: true,
  }
}

describe('awardPoints', () => {
  it('returns empty for no scorecards', () => {
    expect(awardPoints([], 'stableford')).toEqual([])
  })

  it('awards points in stableford order (descending)', () => {
    const cards = [
      makeScorecard('s1', 'r1', 'p1', { stablefordPoints: 30 }),
      makeScorecard('s2', 'r1', 'p2', { stablefordPoints: 36 }),
      makeScorecard('s3', 'r1', 'p3', { stablefordPoints: 33 }),
    ]

    const result = awardPoints(cards, 'stableford')

    // p2 (36) = 1st = 15pts, p3 (33) = 2nd = 12pts, p1 (30) = 3rd = 10pts
    expect(result).toHaveLength(3)

    const p2 = result.find((r) => r.participantId === 'p2')
    expect(p2?.placing).toBe(1)
    expect(p2?.pointsAwarded).toBe(15)

    const p3 = result.find((r) => r.participantId === 'p3')
    expect(p3?.placing).toBe(2)
    expect(p3?.pointsAwarded).toBe(12)

    const p1 = result.find((r) => r.participantId === 'p1')
    expect(p1?.placing).toBe(3)
    expect(p1?.pointsAwarded).toBe(10)
  })

  it('awards points in handicap order (ascending net total)', () => {
    const cards = [
      makeScorecard('s1', 'r1', 'p1', { netTotal: 72 }),
      makeScorecard('s2', 'r1', 'p2', { netTotal: 68 }),
      makeScorecard('s3', 'r1', 'p3', { netTotal: 75 }),
    ]

    const result = awardPoints(cards, 'handicap')

    const p2 = result.find((r) => r.participantId === 'p2')
    expect(p2?.placing).toBe(1)
    expect(p2?.pointsAwarded).toBe(15)

    const p1 = result.find((r) => r.participantId === 'p1')
    expect(p1?.placing).toBe(2)
  })

  it('awards points in scramble order (ascending gross total)', () => {
    const cards = [
      makeScorecard('s1', 'r1', 'p1', { grossTotal: 70 }),
      makeScorecard('s2', 'r1', 'p2', { grossTotal: 65 }),
    ]

    const result = awardPoints(cards, 'scramble')

    const p2 = result.find((r) => r.participantId === 'p2')
    expect(p2?.placing).toBe(1)
    expect(p2?.pointsAwarded).toBe(15)
  })

  it('handles ties by sharing average points', () => {
    const cards = [
      makeScorecard('s1', 'r1', 'p1', { stablefordPoints: 36 }),
      makeScorecard('s2', 'r1', 'p2', { stablefordPoints: 36 }),
      makeScorecard('s3', 'r1', 'p3', { stablefordPoints: 30 }),
    ]

    const result = awardPoints(cards, 'stableford')

    // p1 and p2 tied for 1st: share (15 + 12) / 2 = 13.5
    const p1 = result.find((r) => r.participantId === 'p1')
    const p2 = result.find((r) => r.participantId === 'p2')
    expect(p1?.placing).toBe(1)
    expect(p2?.placing).toBe(1)
    expect(p1?.pointsAwarded).toBe(13.5)
    expect(p2?.pointsAwarded).toBe(13.5)

    // p3 is 3rd
    const p3 = result.find((r) => r.participantId === 'p3')
    expect(p3?.placing).toBe(3)
    expect(p3?.pointsAwarded).toBe(10)
  })

  it('awards 0 points to players outside the table', () => {
    const cards = Array.from({ length: 12 }, (_, i) =>
      makeScorecard(`s${i}`, 'r1', `p${i}`, { stablefordPoints: 40 - i })
    )

    const result = awardPoints(cards, 'stableford')

    // Default table has 10 entries. 11th and 12th get 0.
    const p10 = result.find((r) => r.participantId === 'p10')
    expect(p10?.placing).toBe(11)
    expect(p10?.pointsAwarded).toBe(0)

    const p11 = result.find((r) => r.participantId === 'p11')
    expect(p11?.placing).toBe(12)
    expect(p11?.pointsAwarded).toBe(0)
  })

  it('uses custom points table', () => {
    const cards = [
      makeScorecard('s1', 'r1', 'p1', { stablefordPoints: 36 }),
      makeScorecard('s2', 'r1', 'p2', { stablefordPoints: 30 }),
    ]

    const customTable = [100, 50]
    const result = awardPoints(cards, 'stableford', customTable)

    const p1 = result.find((r) => r.participantId === 'p1')
    expect(p1?.pointsAwarded).toBe(100)

    const p2 = result.find((r) => r.participantId === 'p2')
    expect(p2?.pointsAwarded).toBe(50)
  })

  it('three-way tie shares correctly', () => {
    const cards = [
      makeScorecard('s1', 'r1', 'p1', { stablefordPoints: 36 }),
      makeScorecard('s2', 'r1', 'p2', { stablefordPoints: 36 }),
      makeScorecard('s3', 'r1', 'p3', { stablefordPoints: 36 }),
    ]

    const result = awardPoints(cards, 'stableford')

    // 3-way tie for 1st: share (15 + 12 + 10) / 3 = 12.3 (rounded to 1 decimal)
    const shared = Math.round(((15 + 12 + 10) / 3) * 10) / 10 // 12.3
    for (const rp of result) {
      expect(rp.placing).toBe(1)
      expect(rp.pointsAwarded).toBe(shared)
    }
  })

  it('uses teamId when playerId is absent', () => {
    const card: Scorecard = {
      id: 's1',
      roundId: 'r1',
      teamId: 'team-1',
      holeStrokes: [],
      grossTotal: 65,
      netTotal: null,
      stablefordPoints: null,
      isComplete: true,
    }

    const result = awardPoints([card], 'scramble')
    expect(result[0].participantId).toBe('team-1')
  })

  it('default points table has 10 entries', () => {
    expect(DEFAULT_POINTS).toHaveLength(10)
    expect(DEFAULT_POINTS[0]).toBe(15)
    expect(DEFAULT_POINTS[9]).toBe(2)
  })
})
