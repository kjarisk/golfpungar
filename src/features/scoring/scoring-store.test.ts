/// <reference types="vitest/globals" />
import { useScoringStore } from './state/scoring-store'
import type { Hole } from '@/features/courses'

function makeHole(num: number, par: number, si: number): Hole {
  return {
    id: `hole-${num}`,
    courseId: 'course-001',
    holeNumber: num,
    par,
    strokeIndex: si,
  }
}

const HOLES_9: Hole[] = [
  makeHole(1, 4, 1),
  makeHole(2, 5, 3),
  makeHole(3, 3, 5),
  makeHole(4, 4, 7),
  makeHole(5, 4, 9),
  makeHole(6, 4, 2),
  makeHole(7, 3, 4),
  makeHole(8, 5, 6),
  makeHole(9, 4, 8),
]

describe('Scoring Store', () => {
  beforeEach(() => {
    useScoringStore.setState({
      scorecards: [],
      roundPoints: [],
    })
  })

  it('starts empty', () => {
    const { scorecards, roundPoints } = useScoringStore.getState()
    expect(scorecards).toHaveLength(0)
    expect(roundPoints).toHaveLength(0)
  })

  it('creates a scorecard with empty holes', () => {
    const sc = useScoringStore
      .getState()
      .createScorecard('round-1', 18, 'player-1')

    expect(sc.roundId).toBe('round-1')
    expect(sc.playerId).toBe('player-1')
    expect(sc.holeStrokes).toHaveLength(18)
    expect(sc.holeStrokes.every((s) => s === null)).toBe(true)
    expect(sc.grossTotal).toBe(0)
    expect(sc.isComplete).toBe(false)
  })

  it('creates a 9-hole scorecard', () => {
    const sc = useScoringStore
      .getState()
      .createScorecard('round-1', 9, 'player-1')

    expect(sc.holeStrokes).toHaveLength(9)
  })

  it('creates a team scorecard', () => {
    const sc = useScoringStore
      .getState()
      .createScorecard('round-1', 18, undefined, 'team-1')

    expect(sc.teamId).toBe('team-1')
    expect(sc.playerId).toBeUndefined()
  })

  it('sets a hole stroke and recalculates totals', () => {
    const sc = useScoringStore
      .getState()
      .createScorecard('round-1', 9, 'player-1')

    useScoringStore
      .getState()
      .setHoleStroke(sc.id, 0, 4, HOLES_9, 0, 'stableford')

    const updated = useScoringStore.getState().scorecards[0]
    expect(updated.holeStrokes[0]).toBe(4)
    expect(updated.grossTotal).toBe(4)
    expect(updated.isComplete).toBe(false)
  })

  it('calculates stableford points for stableford format', () => {
    const sc = useScoringStore
      .getState()
      .createScorecard('round-1', 9, 'player-1')

    // Enter par on hole 1 (par 4)
    useScoringStore
      .getState()
      .setHoleStroke(sc.id, 0, 4, HOLES_9, 0, 'stableford')

    const updated = useScoringStore.getState().scorecards[0]
    expect(updated.stablefordPoints).toBe(2) // par = 2 stableford pts
  })

  it('does not calculate stableford for handicap format', () => {
    const sc = useScoringStore
      .getState()
      .createScorecard('round-1', 9, 'player-1')

    useScoringStore
      .getState()
      .setHoleStroke(sc.id, 0, 4, HOLES_9, 0, 'handicap')

    const updated = useScoringStore.getState().scorecards[0]
    expect(updated.stablefordPoints).toBeNull()
  })

  it('marks scorecard complete when all holes entered', () => {
    const sc = useScoringStore
      .getState()
      .createScorecard('round-1', 9, 'player-1')

    // Enter all 9 holes
    for (let i = 0; i < 9; i++) {
      useScoringStore
        .getState()
        .setHoleStroke(sc.id, i, HOLES_9[i].par, HOLES_9, 0, 'stableford')
    }

    const updated = useScoringStore.getState().scorecards[0]
    expect(updated.isComplete).toBe(true)
    expect(updated.grossTotal).toBe(36) // sum of pars
    expect(updated.stablefordPoints).toBe(18) // 9 holes * 2 pts
  })

  it('clears a hole stroke by setting null', () => {
    const sc = useScoringStore
      .getState()
      .createScorecard('round-1', 9, 'player-1')

    useScoringStore
      .getState()
      .setHoleStroke(sc.id, 0, 4, HOLES_9, 0, 'stableford')
    useScoringStore
      .getState()
      .setHoleStroke(sc.id, 0, null, HOLES_9, 0, 'stableford')

    const updated = useScoringStore.getState().scorecards[0]
    expect(updated.holeStrokes[0]).toBeNull()
    expect(updated.grossTotal).toBe(0)
  })

  it('sets whole round total', () => {
    const sc = useScoringStore
      .getState()
      .createScorecard('round-1', 18, 'player-1')

    useScoringStore.getState().setWholeRoundTotal(sc.id, 85)

    const updated = useScoringStore.getState().scorecards[0]
    expect(updated.grossTotal).toBe(85)
  })

  it('recalculates points for a round', () => {
    // Create 3 scorecards with different stableford totals
    const sc1 = useScoringStore
      .getState()
      .createScorecard('round-1', 9, 'player-1')
    const sc2 = useScoringStore
      .getState()
      .createScorecard('round-1', 9, 'player-2')
    const sc3 = useScoringStore
      .getState()
      .createScorecard('round-1', 9, 'player-3')

    // Enter all pars for player 1 (36 stb pts for 18 holes, 18 for 9)
    for (let i = 0; i < 9; i++) {
      useScoringStore
        .getState()
        .setHoleStroke(sc1.id, i, HOLES_9[i].par, HOLES_9, 0, 'stableford')
    }

    // Enter all bogeys for player 2
    for (let i = 0; i < 9; i++) {
      useScoringStore
        .getState()
        .setHoleStroke(sc2.id, i, HOLES_9[i].par + 1, HOLES_9, 0, 'stableford')
    }

    // Enter all birdies for player 3
    for (let i = 0; i < 9; i++) {
      useScoringStore
        .getState()
        .setHoleStroke(sc3.id, i, HOLES_9[i].par - 1, HOLES_9, 0, 'stableford')
    }

    useScoringStore.getState().recalculatePoints('round-1', 'stableford')

    const points = useScoringStore.getState().getPointsByRound('round-1')
    expect(points).toHaveLength(3)

    // Player 3 (birdies = 27 stb) should be 1st
    const p3 = points.find((rp) => rp.participantId === 'player-3')
    expect(p3?.placing).toBe(1)
    expect(p3?.pointsAwarded).toBe(15)

    // Player 1 (pars = 18 stb) should be 2nd
    const p1 = points.find((rp) => rp.participantId === 'player-1')
    expect(p1?.placing).toBe(2)
    expect(p1?.pointsAwarded).toBe(12)

    // Player 2 (bogeys = 9 stb) should be 3rd
    const p2 = points.find((rp) => rp.participantId === 'player-2')
    expect(p2?.placing).toBe(3)
    expect(p2?.pointsAwarded).toBe(10)
  })

  it('removes a scorecard', () => {
    const sc = useScoringStore
      .getState()
      .createScorecard('round-1', 9, 'player-1')

    useScoringStore.getState().removeScorecard(sc.id)
    expect(useScoringStore.getState().scorecards).toHaveLength(0)
  })

  it('finds scorecard for player', () => {
    useScoringStore.getState().createScorecard('round-1', 9, 'player-1')
    useScoringStore.getState().createScorecard('round-1', 9, 'player-2')

    const found = useScoringStore
      .getState()
      .getScorecardForPlayer('round-1', 'player-1')
    expect(found).toBeDefined()
    expect(found?.playerId).toBe('player-1')

    const notFound = useScoringStore
      .getState()
      .getScorecardForPlayer('round-1', 'player-99')
    expect(notFound).toBeUndefined()
  })

  it('finds scorecard for team', () => {
    useScoringStore
      .getState()
      .createScorecard('round-1', 9, undefined, 'team-1')

    const found = useScoringStore
      .getState()
      .getScorecardForTeam('round-1', 'team-1')
    expect(found).toBeDefined()
    expect(found?.teamId).toBe('team-1')
  })

  it('creates a team scorecard with no playerId', () => {
    const sc = useScoringStore
      .getState()
      .createScorecard('round-1', 18, undefined, 'team-1')

    expect(sc.teamId).toBe('team-1')
    expect(sc.playerId).toBeUndefined()
    expect(sc.holeStrokes).toHaveLength(18)
  })

  it('team scorecards participate in points calculation', () => {
    // Create two team scorecards
    const sc1 = useScoringStore
      .getState()
      .createScorecard('round-1', 9, undefined, 'team-1')
    const sc2 = useScoringStore
      .getState()
      .createScorecard('round-1', 9, undefined, 'team-2')

    // Enter scores for team 1 (better)
    for (let i = 0; i < 9; i++) {
      useScoringStore
        .getState()
        .setHoleStroke(sc1.id, i, HOLES_9[i].par, HOLES_9, 0, 'scramble')
    }
    // Enter scores for team 2 (worse)
    for (let i = 0; i < 9; i++) {
      useScoringStore
        .getState()
        .setHoleStroke(sc2.id, i, HOLES_9[i].par + 1, HOLES_9, 0, 'scramble')
    }

    useScoringStore.getState().recalculatePoints('round-1', 'scramble')

    const points = useScoringStore.getState().getPointsByRound('round-1')
    expect(points).toHaveLength(2)

    // team-1 should place 1st (lower gross), team-2 should place 2nd
    const team1Points = points.find((p) => p.participantId === 'team-1')
    const team2Points = points.find((p) => p.participantId === 'team-2')
    expect(team1Points?.placing).toBe(1)
    expect(team2Points?.placing).toBe(2)
    expect(team1Points!.pointsAwarded).toBeGreaterThan(
      team2Points!.pointsAwarded
    )
  })
})
