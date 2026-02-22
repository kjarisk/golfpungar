import { describe, it, expect } from 'vitest'
import {
  computeTotalPointsLeaderboard,
  computeRoundLeaderboard,
  computeSideLeaderboard,
  computeLongestDriveLeaderboard,
  computeLongestPuttLeaderboard,
  computeNearestToPinLeaderboard,
  computeGrossLeaderboard,
  computeNetLeaderboard,
} from './leaderboard-calc'
import type { RoundPoints, Scorecard } from '@/features/scoring'
import type { SideEventTotals } from '@/features/side-events'

// --- computeTotalPointsLeaderboard ---

describe('computeTotalPointsLeaderboard', () => {
  it('returns empty array when no players', () => {
    const result = computeTotalPointsLeaderboard([], [])
    expect(result).toEqual([])
  })

  it('sums points across rounds and ranks descending', () => {
    const roundPoints: RoundPoints[] = [
      {
        id: 'rp1',
        roundId: 'r1',
        participantId: 'p1',
        placing: 1,
        pointsAwarded: 15,
      },
      {
        id: 'rp2',
        roundId: 'r1',
        participantId: 'p2',
        placing: 2,
        pointsAwarded: 12,
      },
      {
        id: 'rp3',
        roundId: 'r2',
        participantId: 'p1',
        placing: 2,
        pointsAwarded: 12,
      },
      {
        id: 'rp4',
        roundId: 'r2',
        participantId: 'p2',
        placing: 1,
        pointsAwarded: 15,
      },
    ]

    const result = computeTotalPointsLeaderboard(roundPoints, ['p1', 'p2'])
    expect(result).toHaveLength(2)
    // Both have 27 points total — tied at placing 1
    expect(result[0].totalPoints).toBe(27)
    expect(result[1].totalPoints).toBe(27)
    expect(result[0].placing).toBe(1)
    expect(result[1].placing).toBe(1)
  })

  it('ranks players with different totals correctly', () => {
    const roundPoints: RoundPoints[] = [
      {
        id: 'rp1',
        roundId: 'r1',
        participantId: 'p1',
        placing: 1,
        pointsAwarded: 15,
      },
      {
        id: 'rp2',
        roundId: 'r1',
        participantId: 'p2',
        placing: 2,
        pointsAwarded: 12,
      },
      {
        id: 'rp3',
        roundId: 'r1',
        participantId: 'p3',
        placing: 3,
        pointsAwarded: 10,
      },
      {
        id: 'rp4',
        roundId: 'r2',
        participantId: 'p1',
        placing: 1,
        pointsAwarded: 15,
      },
      {
        id: 'rp5',
        roundId: 'r2',
        participantId: 'p2',
        placing: 3,
        pointsAwarded: 10,
      },
      {
        id: 'rp6',
        roundId: 'r2',
        participantId: 'p3',
        placing: 2,
        pointsAwarded: 12,
      },
    ]

    const result = computeTotalPointsLeaderboard(roundPoints, [
      'p1',
      'p2',
      'p3',
    ])
    expect(result[0]).toMatchObject({
      playerId: 'p1',
      totalPoints: 30,
      placing: 1,
    })
    expect(result[1]).toMatchObject({
      playerId: 'p2',
      totalPoints: 22,
      placing: 2,
    })
    expect(result[2]).toMatchObject({
      playerId: 'p3',
      totalPoints: 22,
      placing: 2,
    })
  })

  it('includes round breakdown', () => {
    const roundPoints: RoundPoints[] = [
      {
        id: 'rp1',
        roundId: 'r1',
        participantId: 'p1',
        placing: 1,
        pointsAwarded: 15,
      },
      {
        id: 'rp2',
        roundId: 'r2',
        participantId: 'p1',
        placing: 3,
        pointsAwarded: 10,
      },
    ]

    const result = computeTotalPointsLeaderboard(roundPoints, ['p1'])
    expect(result[0].roundBreakdown).toEqual([
      { roundId: 'r1', points: 15 },
      { roundId: 'r2', points: 10 },
    ])
  })

  it('gives 0 points to players with no round points', () => {
    const result = computeTotalPointsLeaderboard([], ['p1', 'p2'])
    expect(result[0].totalPoints).toBe(0)
    expect(result[1].totalPoints).toBe(0)
    expect(result[0].placing).toBe(1)
    expect(result[1].placing).toBe(1)
  })
})

// --- computeRoundLeaderboard ---

describe('computeRoundLeaderboard', () => {
  it('returns sorted entries with scorecard data', () => {
    const roundPoints: RoundPoints[] = [
      {
        id: 'rp1',
        roundId: 'r1',
        participantId: 'p1',
        placing: 2,
        pointsAwarded: 12,
      },
      {
        id: 'rp2',
        roundId: 'r1',
        participantId: 'p2',
        placing: 1,
        pointsAwarded: 15,
      },
    ]
    const scorecards = [
      { playerId: 'p1', grossTotal: 82, netTotal: 70, stablefordPoints: null },
      { playerId: 'p2', grossTotal: 75, netTotal: 68, stablefordPoints: null },
    ]

    const result = computeRoundLeaderboard(roundPoints, scorecards)
    expect(result).toHaveLength(2)
    expect(result[0].participantId).toBe('p2')
    expect(result[0].placing).toBe(1)
    expect(result[0].grossTotal).toBe(75)
    expect(result[1].participantId).toBe('p1')
    expect(result[1].placing).toBe(2)
  })

  it('handles missing scorecards gracefully', () => {
    const roundPoints: RoundPoints[] = [
      {
        id: 'rp1',
        roundId: 'r1',
        participantId: 'p1',
        placing: 1,
        pointsAwarded: 15,
      },
    ]

    const result = computeRoundLeaderboard(roundPoints, [])
    expect(result[0].grossTotal).toBe(0)
    expect(result[0].netTotal).toBeNull()
  })
})

// --- computeSideLeaderboard ---

describe('computeSideLeaderboard', () => {
  const makeTotals = (playerId: string, birdies: number): SideEventTotals => ({
    playerId,
    birdies,
    eagles: 0,
    holeInOnes: 0,
    albatrosses: 0,
    bunkerSaves: 0,
    snakes: 0,
    snopp: 0,
    groupLongestDrives: 0,
    longestDriveMeters: null,
    longestPuttMeters: null,
    nearestToPinMeters: null,
    gir: 0,
  })

  it('returns empty array when no players have counts', () => {
    const totals = [makeTotals('p1', 0), makeTotals('p2', 0)]
    const result = computeSideLeaderboard(totals, (t) => t.birdies)
    expect(result).toEqual([])
  })

  it('ranks by count descending with tie handling', () => {
    const totals = [
      makeTotals('p1', 3),
      makeTotals('p2', 5),
      makeTotals('p3', 3),
    ]

    const result = computeSideLeaderboard(totals, (t) => t.birdies)
    expect(result).toHaveLength(3)
    expect(result[0]).toMatchObject({ playerId: 'p2', count: 5, placing: 1 })
    expect(result[1]).toMatchObject({ playerId: 'p1', count: 3, placing: 2 })
    expect(result[2]).toMatchObject({ playerId: 'p3', count: 3, placing: 2 })
  })

  it('works with different selectors (snakes)', () => {
    const totals: SideEventTotals[] = [
      { ...makeTotals('p1', 0), snakes: 4 },
      { ...makeTotals('p2', 0), snakes: 2 },
    ]

    const result = computeSideLeaderboard(totals, (t) => t.snakes)
    expect(result[0]).toMatchObject({ playerId: 'p1', count: 4, placing: 1 })
  })
})

// --- computeLongestDriveLeaderboard ---

describe('computeLongestDriveLeaderboard', () => {
  it('returns empty array when no drives', () => {
    const result = computeLongestDriveLeaderboard([])
    expect(result).toEqual([])
  })

  it('ranks by meters descending with placings', () => {
    const drives = [
      { playerId: 'p1', meters: 290, eventId: 'e1' },
      { playerId: 'p2', meters: 315, eventId: 'e2' },
      { playerId: 'p3', meters: 290, eventId: 'e3' },
    ]

    const result = computeLongestDriveLeaderboard(drives)
    expect(result[0]).toMatchObject({ playerId: 'p2', meters: 315, placing: 1 })
    expect(result[1]).toMatchObject({ playerId: 'p1', meters: 290, placing: 2 })
    expect(result[2]).toMatchObject({ playerId: 'p3', meters: 290, placing: 2 })
  })
})

// --- computeLongestPuttLeaderboard ---

describe('computeLongestPuttLeaderboard', () => {
  it('returns empty array when no putts', () => {
    const result = computeLongestPuttLeaderboard([])
    expect(result).toEqual([])
  })

  it('ranks by meters descending with placings (longest wins)', () => {
    const putts = [
      { playerId: 'p1', meters: 12, eventId: 'e1' },
      { playerId: 'p2', meters: 18, eventId: 'e2' },
      { playerId: 'p3', meters: 12, eventId: 'e3' },
    ]

    const result = computeLongestPuttLeaderboard(putts)
    expect(result[0]).toMatchObject({ playerId: 'p2', meters: 18, placing: 1 })
    expect(result[1]).toMatchObject({ playerId: 'p1', meters: 12, placing: 2 })
    expect(result[2]).toMatchObject({ playerId: 'p3', meters: 12, placing: 2 })
  })
})

// --- computeNearestToPinLeaderboard ---

describe('computeNearestToPinLeaderboard', () => {
  it('returns empty array when no shots', () => {
    const result = computeNearestToPinLeaderboard([])
    expect(result).toEqual([])
  })

  it('ranks by meters ascending with placings (closest wins)', () => {
    const shots = [
      { playerId: 'p1', meters: 3.5, eventId: 'e1' },
      { playerId: 'p2', meters: 1.2, eventId: 'e2' },
      { playerId: 'p3', meters: 3.5, eventId: 'e3' },
    ]

    const result = computeNearestToPinLeaderboard(shots)
    expect(result[0]).toMatchObject({ playerId: 'p2', meters: 1.2, placing: 1 })
    expect(result[1]).toMatchObject({ playerId: 'p1', meters: 3.5, placing: 2 })
    expect(result[2]).toMatchObject({ playerId: 'p3', meters: 3.5, placing: 2 })
  })

  it('handles single entry', () => {
    const shots = [{ playerId: 'p1', meters: 2.0, eventId: 'e1' }]

    const result = computeNearestToPinLeaderboard(shots)
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ playerId: 'p1', meters: 2.0, placing: 1 })
  })
})

// --- Helper: make a minimal Scorecard ---

function makeScorecard(
  overrides: Partial<Scorecard> & Pick<Scorecard, 'roundId'>
): Scorecard {
  return {
    id: `sc-${Math.random().toString(36).slice(2, 6)}`,
    holeStrokes: [],
    grossTotal: 0,
    netTotal: null,
    stablefordPoints: null,
    isComplete: false,
    ...overrides,
  }
}

// --- computeGrossLeaderboard ---

describe('computeGrossLeaderboard', () => {
  it('returns empty array when no scorecards exist', () => {
    const result = computeGrossLeaderboard([], ['p1', 'p2'])
    expect(result).toEqual([])
  })

  it('sums gross totals across rounds and ranks lowest first', () => {
    const scorecards: Scorecard[] = [
      makeScorecard({ roundId: 'r1', playerId: 'p1', grossTotal: 82 }),
      makeScorecard({ roundId: 'r1', playerId: 'p2', grossTotal: 75 }),
      makeScorecard({ roundId: 'r2', playerId: 'p1', grossTotal: 78 }),
      makeScorecard({ roundId: 'r2', playerId: 'p2', grossTotal: 80 }),
    ]

    const result = computeGrossLeaderboard(scorecards, ['p1', 'p2'])
    expect(result).toHaveLength(2)
    // p2: 75 + 80 = 155 (1st), p1: 82 + 78 = 160 (2nd)
    expect(result[0]).toMatchObject({
      playerId: 'p2',
      grossTotal: 155,
      roundsPlayed: 2,
      placing: 1,
    })
    expect(result[1]).toMatchObject({
      playerId: 'p1',
      grossTotal: 160,
      roundsPlayed: 2,
      placing: 2,
    })
  })

  it('handles ties (same gross total = same placing)', () => {
    const scorecards: Scorecard[] = [
      makeScorecard({ roundId: 'r1', playerId: 'p1', grossTotal: 80 }),
      makeScorecard({ roundId: 'r1', playerId: 'p2', grossTotal: 80 }),
      makeScorecard({ roundId: 'r1', playerId: 'p3', grossTotal: 85 }),
    ]

    const result = computeGrossLeaderboard(scorecards, ['p1', 'p2', 'p3'])
    expect(result[0].placing).toBe(1)
    expect(result[1].placing).toBe(1)
    expect(result[2].placing).toBe(3) // skips 2
  })

  it('excludes players with no scorecards', () => {
    const scorecards: Scorecard[] = [
      makeScorecard({ roundId: 'r1', playerId: 'p1', grossTotal: 80 }),
    ]

    const result = computeGrossLeaderboard(scorecards, ['p1', 'p2'])
    expect(result).toHaveLength(1)
    expect(result[0].playerId).toBe('p1')
  })

  it('excludes team scorecards (no playerId)', () => {
    const scorecards: Scorecard[] = [
      makeScorecard({ roundId: 'r1', teamId: 'team-1', grossTotal: 70 }),
      makeScorecard({ roundId: 'r1', playerId: 'p1', grossTotal: 80 }),
    ]

    const result = computeGrossLeaderboard(scorecards, ['p1'])
    expect(result).toHaveLength(1)
    expect(result[0].grossTotal).toBe(80)
  })

  it('excludes scorecards with zero gross total', () => {
    const scorecards: Scorecard[] = [
      makeScorecard({ roundId: 'r1', playerId: 'p1', grossTotal: 0 }),
      makeScorecard({ roundId: 'r2', playerId: 'p1', grossTotal: 80 }),
    ]

    const result = computeGrossLeaderboard(scorecards, ['p1'])
    expect(result).toHaveLength(1)
    expect(result[0].roundsPlayed).toBe(1)
    expect(result[0].grossTotal).toBe(80)
  })
})

// --- computeNetLeaderboard ---

describe('computeNetLeaderboard', () => {
  it('returns empty array when no scorecards exist', () => {
    const result = computeNetLeaderboard([], ['p1', 'p2'])
    expect(result).toEqual([])
  })

  it('sums net totals across rounds and ranks lowest first', () => {
    const scorecards: Scorecard[] = [
      makeScorecard({ roundId: 'r1', playerId: 'p1', netTotal: 70 }),
      makeScorecard({ roundId: 'r1', playerId: 'p2', netTotal: 68 }),
      makeScorecard({ roundId: 'r2', playerId: 'p1', netTotal: 72 }),
      makeScorecard({ roundId: 'r2', playerId: 'p2', netTotal: 75 }),
    ]

    const result = computeNetLeaderboard(scorecards, ['p1', 'p2'])
    expect(result).toHaveLength(2)
    // p1: 70 + 72 = 142 (1st), p2: 68 + 75 = 143 (2nd)
    expect(result[0]).toMatchObject({
      playerId: 'p1',
      netTotal: 142,
      roundsPlayed: 2,
      placing: 1,
    })
    expect(result[1]).toMatchObject({
      playerId: 'p2',
      netTotal: 143,
      roundsPlayed: 2,
      placing: 2,
    })
  })

  it('handles ties (same net total = same placing)', () => {
    const scorecards: Scorecard[] = [
      makeScorecard({ roundId: 'r1', playerId: 'p1', netTotal: 70 }),
      makeScorecard({ roundId: 'r1', playerId: 'p2', netTotal: 70 }),
      makeScorecard({ roundId: 'r1', playerId: 'p3', netTotal: 75 }),
    ]

    const result = computeNetLeaderboard(scorecards, ['p1', 'p2', 'p3'])
    expect(result[0].placing).toBe(1)
    expect(result[1].placing).toBe(1)
    expect(result[2].placing).toBe(3)
  })

  it('excludes scorecards with null netTotal', () => {
    const scorecards: Scorecard[] = [
      makeScorecard({ roundId: 'r1', playerId: 'p1', netTotal: null }),
      makeScorecard({ roundId: 'r1', playerId: 'p2', netTotal: 68 }),
    ]

    const result = computeNetLeaderboard(scorecards, ['p1', 'p2'])
    expect(result).toHaveLength(1)
    expect(result[0].playerId).toBe('p2')
  })

  it('excludes players with no net scorecards', () => {
    const scorecards: Scorecard[] = [
      makeScorecard({ roundId: 'r1', playerId: 'p1', netTotal: 70 }),
    ]

    const result = computeNetLeaderboard(scorecards, ['p1', 'p2'])
    expect(result).toHaveLength(1)
  })

  it('handles mixed null and non-null net totals for same player', () => {
    const scorecards: Scorecard[] = [
      makeScorecard({ roundId: 'r1', playerId: 'p1', netTotal: 70 }),
      makeScorecard({ roundId: 'r2', playerId: 'p1', netTotal: null }),
      makeScorecard({ roundId: 'r3', playerId: 'p1', netTotal: 72 }),
    ]

    const result = computeNetLeaderboard(scorecards, ['p1'])
    expect(result).toHaveLength(1)
    expect(result[0].netTotal).toBe(142)
    expect(result[0].roundsPlayed).toBe(2) // only rounds with net totals
  })
})
