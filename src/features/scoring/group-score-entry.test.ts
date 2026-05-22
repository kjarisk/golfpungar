/// <reference types="vitest/globals" />
import type { SideEventLog, CreateSideEventInput } from '@/features/side-events'
import {
  awardPoints,
  calculateGrossTotal,
  calculateNetTotal,
  calculateStablefordTotal,
  isScorecardComplete,
  type Scorecard,
} from '@/features/scoring'
import type { Hole } from '@/features/courses'
import type { HoleStroke } from '@/features/scoring'

function makeHole(num: number, par: number, si: number): Hole {
  return {
    id: `hole-${num}`,
    courseId: 'course-001',
    holeNumber: num,
    par,
    strokeIndex: si,
  }
}

const HOLES_18: Hole[] = [
  makeHole(1, 4, 7),
  makeHole(2, 4, 11),
  makeHole(3, 3, 15),
  makeHole(4, 5, 1),
  makeHole(5, 4, 3),
  makeHole(6, 3, 17),
  makeHole(7, 4, 5),
  makeHole(8, 4, 9),
  makeHole(9, 5, 13),
  makeHole(10, 4, 8),
  makeHole(11, 3, 16),
  makeHole(12, 4, 2),
  makeHole(13, 5, 10),
  makeHole(14, 4, 4),
  makeHole(15, 3, 18),
  makeHole(16, 4, 6),
  makeHole(17, 4, 12),
  makeHole(18, 5, 14),
]

/**
 * Helper to build an enriched Scorecard the way `useScorecards()` would —
 * raw strokes + computed totals. Mirrors the enrich() function in
 * `api/use-scorecards.ts` for the test environment.
 */
function makeScorecard(args: {
  id: string
  roundId: string
  playerId?: string
  teamId?: string
  holeStrokes: HoleStroke[]
  holes: Hole[]
  groupHandicap?: number
  format?: 'stableford' | 'handicap' | 'scramble' | 'bestball'
}): Scorecard {
  const handicap = args.groupHandicap ?? 0
  const grossTotal = calculateGrossTotal(args.holeStrokes)
  const netTotal =
    args.holes.length > 0
      ? calculateNetTotal(args.holeStrokes, args.holes, handicap)
      : null
  const stablefordPoints =
    args.format === 'stableford' && args.holes.length > 0
      ? calculateStablefordTotal(args.holeStrokes, args.holes, handicap)
      : null
  return {
    id: args.id,
    roundId: args.roundId,
    playerId: args.playerId,
    teamId: args.teamId,
    holeStrokes: args.holeStrokes,
    grossTotal,
    netTotal,
    stablefordPoints,
    isComplete: isScorecardComplete(args.holeStrokes),
  }
}

/**
 * Lightweight in-memory side-events sink for tests — mirrors the queue shape
 * the old Zustand store provided so the scoring tests remain a unit test of
 * the side-event modelling (not the persistence path).
 */
let SIDE_EVENTS: SideEventLog[] = []
let nextSideEventId = 1
function logEvent(input: CreateSideEventInput): SideEventLog {
  const event: SideEventLog = {
    id: `side-event-${nextSideEventId++}`,
    tournamentId: input.tournamentId,
    roundId: input.roundId,
    holeNumber: input.holeNumber,
    playerId: input.playerId,
    type: input.type,
    value: input.value,
    createdAt: new Date().toISOString(),
    createdByPlayerId: input.createdByPlayerId,
  }
  SIDE_EVENTS = [...SIDE_EVENTS, event]
  return event
}
function getEventsByRound(roundId: string): SideEventLog[] {
  return SIDE_EVENTS.filter((e) => e.roundId === roundId)
}

describe('Group Score Entry', () => {
  beforeEach(() => {
    SIDE_EVENTS = []
    nextSideEventId = 1
  })

  describe('individual format — group-based scoring', () => {
    it('enriches scorecards correctly per player with own handicap', () => {
      const sc1 = makeScorecard({
        id: 'sc-1',
        roundId: 'round-1',
        playerId: 'player-1',
        holeStrokes: [4, ...Array(17).fill(null)],
        holes: HOLES_18,
        groupHandicap: 10,
        format: 'handicap',
      })
      const sc2 = makeScorecard({
        id: 'sc-2',
        roundId: 'round-1',
        playerId: 'player-2',
        holeStrokes: [5, ...Array(17).fill(null)],
        holes: HOLES_18,
        groupHandicap: 15,
        format: 'handicap',
      })

      expect(sc1.holeStrokes[0]).toBe(4)
      expect(sc2.holeStrokes[0]).toBe(5)
      expect(sc1.holeStrokes[1]).toBeNull()
      expect(sc2.holeStrokes[1]).toBeNull()
    })

    it('auto-calculates gross for each player in group independently', () => {
      const sc1 = makeScorecard({
        id: 'sc-1',
        roundId: 'round-1',
        playerId: 'player-1',
        holeStrokes: [4, 5, 3, ...Array(15).fill(null)],
        holes: HOLES_18,
        groupHandicap: 10,
        format: 'handicap',
      })
      const sc2 = makeScorecard({
        id: 'sc-2',
        roundId: 'round-1',
        playerId: 'player-2',
        holeStrokes: [5, 6, 4, ...Array(15).fill(null)],
        holes: HOLES_18,
        groupHandicap: 15,
        format: 'handicap',
      })

      expect(sc1.grossTotal).toBe(12) // 4+5+3
      expect(sc2.grossTotal).toBe(15) // 5+6+4
    })
  })

  describe('team format — team column scoring', () => {
    it('creates team scorecards with teamId', () => {
      const sc = makeScorecard({
        id: 'sc-team-1',
        roundId: 'round-1',
        teamId: 'team-1',
        holeStrokes: Array(18).fill(null),
        holes: HOLES_18,
        format: 'scramble',
      })

      expect(sc.teamId).toBe('team-1')
      expect(sc.playerId).toBeUndefined()
      expect(sc.holeStrokes).toHaveLength(18)
    })

    it('enters strokes on team scorecard', () => {
      const sc = makeScorecard({
        id: 'sc-team-1',
        roundId: 'round-1',
        teamId: 'team-1',
        holeStrokes: [4, ...Array(17).fill(null)],
        holes: HOLES_18,
        groupHandicap: 12,
        format: 'scramble',
      })

      expect(sc.holeStrokes[0]).toBe(4)
      expect(sc.grossTotal).toBe(4)
    })

    it('multiple team scorecards in same round are independent', () => {
      const sc1 = makeScorecard({
        id: 'sc-1',
        roundId: 'round-1',
        teamId: 'team-1',
        holeStrokes: [3, ...Array(17).fill(null)],
        holes: HOLES_18,
        groupHandicap: 10,
        format: 'scramble',
      })
      const sc2 = makeScorecard({
        id: 'sc-2',
        roundId: 'round-1',
        teamId: 'team-2',
        holeStrokes: [5, ...Array(17).fill(null)],
        holes: HOLES_18,
        groupHandicap: 14,
        format: 'scramble',
      })

      expect(sc1.grossTotal).toBe(3)
      expect(sc2.grossTotal).toBe(5)
    })

    it('points calc uses teamId as participantId for team scorecards', () => {
      // Fill all 18 holes par for team-1, +1 for team-2
      const team1Strokes = HOLES_18.map((h) => h.par)
      const team2Strokes = HOLES_18.map((h) => h.par + 1)
      const sc1 = makeScorecard({
        id: 'sc-1',
        roundId: 'round-1',
        teamId: 'team-1',
        holeStrokes: team1Strokes,
        holes: HOLES_18,
        groupHandicap: 10,
        format: 'scramble',
      })
      const sc2 = makeScorecard({
        id: 'sc-2',
        roundId: 'round-1',
        teamId: 'team-2',
        holeStrokes: team2Strokes,
        holes: HOLES_18,
        groupHandicap: 14,
        format: 'scramble',
      })

      const points = awardPoints([sc1, sc2], 'scramble')
      expect(points.length).toBeGreaterThanOrEqual(2)

      const t1Points = points.find((p) => p.participantId === 'team-1')
      const t2Points = points.find((p) => p.participantId === 'team-2')
      expect(t1Points).toBeDefined()
      expect(t2Points).toBeDefined()
      expect(t1Points!.placing).toBeLessThan(t2Points!.placing)
    })
  })

  describe('side events scoped to group', () => {
    it('logs side event for a specific player on a hole', () => {
      const event = logEvent({
        tournamentId: 'tournament-1',
        roundId: 'round-1',
        holeNumber: 5,
        playerId: 'player-1',
        type: 'birdie',
        createdByPlayerId: 'player-1',
      })

      expect(event.type).toBe('birdie')
      expect(event.holeNumber).toBe(5)
      expect(event.playerId).toBe('player-1')
    })

    it('filters events by round for group display', () => {
      logEvent({
        tournamentId: 'tournament-1',
        roundId: 'round-1',
        holeNumber: 3,
        playerId: 'player-1',
        type: 'birdie',
        createdByPlayerId: 'player-1',
      })
      logEvent({
        tournamentId: 'tournament-1',
        roundId: 'round-1',
        holeNumber: 7,
        playerId: 'player-2',
        type: 'snake',
        createdByPlayerId: 'player-2',
      })
      logEvent({
        tournamentId: 'tournament-1',
        roundId: 'round-2',
        holeNumber: 1,
        playerId: 'player-1',
        type: 'eagle',
        createdByPlayerId: 'player-1',
      })

      const r1Events = getEventsByRound('round-1')
      const r2Events = getEventsByRound('round-2')

      expect(r1Events).toHaveLength(2)
      expect(r2Events).toHaveLength(1)
    })

    it('multiple side events on same hole for different players', () => {
      logEvent({
        tournamentId: 'tournament-1',
        roundId: 'round-1',
        holeNumber: 5,
        playerId: 'player-1',
        type: 'birdie',
        createdByPlayerId: 'player-1',
      })
      logEvent({
        tournamentId: 'tournament-1',
        roundId: 'round-1',
        holeNumber: 5,
        playerId: 'player-2',
        type: 'snake',
        createdByPlayerId: 'player-2',
      })

      const events = getEventsByRound('round-1')
      const hole5Events = events.filter((e) => e.holeNumber === 5)
      expect(hole5Events).toHaveLength(2)

      const p1Events = hole5Events.filter((e) => e.playerId === 'player-1')
      const p2Events = hole5Events.filter((e) => e.playerId === 'player-2')
      expect(p1Events[0].type).toBe('birdie')
      expect(p2Events[0].type).toBe('snake')
    })

    it('snopp can be logged multiple times per hole per player', () => {
      logEvent({
        tournamentId: 'tournament-1',
        roundId: 'round-1',
        holeNumber: 3,
        playerId: 'player-1',
        type: 'snopp',
        createdByPlayerId: 'player-1',
      })
      logEvent({
        tournamentId: 'tournament-1',
        roundId: 'round-1',
        holeNumber: 3,
        playerId: 'player-1',
        type: 'snopp',
        createdByPlayerId: 'player-1',
      })

      const events = getEventsByRound('round-1')
      const snoppEvents = events.filter(
        (e) =>
          e.holeNumber === 3 && e.playerId === 'player-1' && e.type === 'snopp'
      )
      expect(snoppEvents).toHaveLength(2)
    })
  })
})
