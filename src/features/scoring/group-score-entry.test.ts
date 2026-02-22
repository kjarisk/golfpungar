/// <reference types="vitest/globals" />
import { useScoringStore } from './state/scoring-store'
import { useRoundsStore } from '@/features/rounds/state/rounds-store'
import { useSideEventsStore } from '@/features/side-events/state/side-events-store'
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

describe('Group Score Entry', () => {
  beforeEach(() => {
    useScoringStore.setState({ scorecards: [], roundPoints: [] })
    useRoundsStore.setState({
      rounds: [],
      groups: [],
      teams: [],
      pointsConfigs: [],
    })
    useSideEventsStore.setState({ events: [], images: [] })
  })

  describe('individual format — group-based scoring', () => {
    it('creates scorecards for multiple players in a group', () => {
      const store = useScoringStore.getState()
      const sc1 = store.createScorecard('round-1', 18, 'player-1')
      const sc2 = store.createScorecard('round-1', 18, 'player-2')
      const sc3 = store.createScorecard('round-1', 18, 'player-3')
      const sc4 = store.createScorecard('round-1', 18, 'player-4')

      const all = useScoringStore.getState().getScorecardsByRound('round-1')
      expect(all).toHaveLength(4)
      expect(all.map((s) => s.playerId)).toEqual([
        'player-1',
        'player-2',
        'player-3',
        'player-4',
      ])
    })

    it('enters scores for different players in same group independently', () => {
      const store = useScoringStore.getState()
      const sc1 = store.createScorecard('round-1', 18, 'player-1')
      const sc2 = store.createScorecard('round-1', 18, 'player-2')

      // Player 1 scores 4 on hole 1
      useScoringStore
        .getState()
        .setHoleStroke(sc1.id, 0, 4, HOLES_18, 10, 'handicap')
      // Player 2 scores 5 on hole 1
      useScoringStore
        .getState()
        .setHoleStroke(sc2.id, 0, 5, HOLES_18, 15, 'handicap')

      const updated1 = useScoringStore
        .getState()
        .getScorecardForPlayer('round-1', 'player-1')
      const updated2 = useScoringStore
        .getState()
        .getScorecardForPlayer('round-1', 'player-2')

      expect(updated1?.holeStrokes[0]).toBe(4)
      expect(updated2?.holeStrokes[0]).toBe(5)
      // Other holes remain null
      expect(updated1?.holeStrokes[1]).toBeNull()
      expect(updated2?.holeStrokes[1]).toBeNull()
    })

    it('auto-calculates gross for each player in group independently', () => {
      const store = useScoringStore.getState()
      const sc1 = store.createScorecard('round-1', 18, 'player-1')
      const sc2 = store.createScorecard('round-1', 18, 'player-2')

      // Enter first 3 holes for player 1: 4, 5, 3
      useScoringStore
        .getState()
        .setHoleStroke(sc1.id, 0, 4, HOLES_18, 10, 'handicap')
      useScoringStore
        .getState()
        .setHoleStroke(sc1.id, 1, 5, HOLES_18, 10, 'handicap')
      useScoringStore
        .getState()
        .setHoleStroke(sc1.id, 2, 3, HOLES_18, 10, 'handicap')

      // Enter first 3 holes for player 2: 5, 6, 4
      useScoringStore
        .getState()
        .setHoleStroke(sc2.id, 0, 5, HOLES_18, 15, 'handicap')
      useScoringStore
        .getState()
        .setHoleStroke(sc2.id, 1, 6, HOLES_18, 15, 'handicap')
      useScoringStore
        .getState()
        .setHoleStroke(sc2.id, 2, 4, HOLES_18, 15, 'handicap')

      const p1 = useScoringStore
        .getState()
        .getScorecardForPlayer('round-1', 'player-1')
      const p2 = useScoringStore
        .getState()
        .getScorecardForPlayer('round-1', 'player-2')

      expect(p1?.grossTotal).toBe(12) // 4+5+3
      expect(p2?.grossTotal).toBe(15) // 5+6+4
    })

    it('group scorecards do not interfere across rounds', () => {
      const store = useScoringStore.getState()
      store.createScorecard('round-1', 18, 'player-1')
      store.createScorecard('round-2', 18, 'player-1')

      const r1 = useScoringStore.getState().getScorecardsByRound('round-1')
      const r2 = useScoringStore.getState().getScorecardsByRound('round-2')
      expect(r1).toHaveLength(1)
      expect(r2).toHaveLength(1)
      expect(r1[0].id).not.toBe(r2[0].id)
    })
  })

  describe('team format — team column scoring', () => {
    it('creates team scorecards with teamId', () => {
      const store = useScoringStore.getState()
      const sc = store.createScorecard('round-1', 18, undefined, 'team-1')

      expect(sc.teamId).toBe('team-1')
      expect(sc.playerId).toBeUndefined()
      expect(sc.holeStrokes).toHaveLength(18)
    })

    it('retrieves team scorecard via getScorecardForTeam', () => {
      const store = useScoringStore.getState()
      store.createScorecard('round-1', 18, undefined, 'team-1')
      store.createScorecard('round-1', 18, undefined, 'team-2')

      const t1 = useScoringStore
        .getState()
        .getScorecardForTeam('round-1', 'team-1')
      const t2 = useScoringStore
        .getState()
        .getScorecardForTeam('round-1', 'team-2')

      expect(t1).toBeDefined()
      expect(t2).toBeDefined()
      expect(t1?.teamId).toBe('team-1')
      expect(t2?.teamId).toBe('team-2')
    })

    it('enters strokes on team scorecard', () => {
      const store = useScoringStore.getState()
      const sc = store.createScorecard('round-1', 18, undefined, 'team-1')

      // Team scores 4 on hole 1 (using avg handicap 12)
      useScoringStore
        .getState()
        .setHoleStroke(sc.id, 0, 4, HOLES_18, 12, 'scramble')

      const updated = useScoringStore
        .getState()
        .getScorecardForTeam('round-1', 'team-1')

      expect(updated?.holeStrokes[0]).toBe(4)
      expect(updated?.grossTotal).toBe(4)
    })

    it('multiple team scorecards in same round are independent', () => {
      const store = useScoringStore.getState()
      const sc1 = store.createScorecard('round-1', 18, undefined, 'team-1')
      const sc2 = store.createScorecard('round-1', 18, undefined, 'team-2')

      useScoringStore
        .getState()
        .setHoleStroke(sc1.id, 0, 3, HOLES_18, 10, 'scramble')
      useScoringStore
        .getState()
        .setHoleStroke(sc2.id, 0, 5, HOLES_18, 14, 'scramble')

      const t1 = useScoringStore
        .getState()
        .getScorecardForTeam('round-1', 'team-1')
      const t2 = useScoringStore
        .getState()
        .getScorecardForTeam('round-1', 'team-2')

      expect(t1?.holeStrokes[0]).toBe(3)
      expect(t2?.holeStrokes[0]).toBe(5)
      expect(t1?.grossTotal).toBe(3)
      expect(t2?.grossTotal).toBe(5)
    })

    it('points calc uses teamId as participantId for team scorecards', () => {
      const store = useScoringStore.getState()
      const sc1 = store.createScorecard('round-1', 18, undefined, 'team-1')
      const sc2 = store.createScorecard('round-1', 18, undefined, 'team-2')

      // Fill all 18 holes for both teams
      for (let i = 0; i < 18; i++) {
        useScoringStore
          .getState()
          .setHoleStroke(sc1.id, i, HOLES_18[i].par, HOLES_18, 10, 'scramble')
        useScoringStore
          .getState()
          .setHoleStroke(
            sc2.id,
            i,
            HOLES_18[i].par + 1,
            HOLES_18,
            14,
            'scramble'
          )
      }

      // Recalculate points
      useScoringStore.getState().recalculatePoints('round-1', 'scramble')

      const points = useScoringStore.getState().getPointsByRound('round-1')
      expect(points.length).toBeGreaterThanOrEqual(2)

      // Team-1 played par (lower score), team-2 played +1 each
      const t1Points = points.find((p) => p.participantId === 'team-1')
      const t2Points = points.find((p) => p.participantId === 'team-2')
      expect(t1Points).toBeDefined()
      expect(t2Points).toBeDefined()
      expect(t1Points!.placing).toBeLessThan(t2Points!.placing)
    })
  })

  describe('side events scoped to group', () => {
    it('logs side event for a specific player on a hole', () => {
      const sideStore = useSideEventsStore.getState()
      const event = sideStore.logEvent({
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
      const sideStore = useSideEventsStore.getState()

      // Events in round 1
      sideStore.logEvent({
        tournamentId: 'tournament-1',
        roundId: 'round-1',
        holeNumber: 3,
        playerId: 'player-1',
        type: 'birdie',
        createdByPlayerId: 'player-1',
      })
      sideStore.logEvent({
        tournamentId: 'tournament-1',
        roundId: 'round-1',
        holeNumber: 7,
        playerId: 'player-2',
        type: 'snake',
        createdByPlayerId: 'player-2',
      })

      // Event in round 2 (different round)
      sideStore.logEvent({
        tournamentId: 'tournament-1',
        roundId: 'round-2',
        holeNumber: 1,
        playerId: 'player-1',
        type: 'eagle',
        createdByPlayerId: 'player-1',
      })

      const r1Events = useSideEventsStore.getState().getEventsByRound('round-1')
      const r2Events = useSideEventsStore.getState().getEventsByRound('round-2')

      expect(r1Events).toHaveLength(2)
      expect(r2Events).toHaveLength(1)
    })

    it('multiple side events on same hole for different players', () => {
      const sideStore = useSideEventsStore.getState()

      sideStore.logEvent({
        tournamentId: 'tournament-1',
        roundId: 'round-1',
        holeNumber: 5,
        playerId: 'player-1',
        type: 'birdie',
        createdByPlayerId: 'player-1',
      })
      sideStore.logEvent({
        tournamentId: 'tournament-1',
        roundId: 'round-1',
        holeNumber: 5,
        playerId: 'player-2',
        type: 'snake',
        createdByPlayerId: 'player-2',
      })

      const events = useSideEventsStore.getState().getEventsByRound('round-1')
      const hole5Events = events.filter((e) => e.holeNumber === 5)
      expect(hole5Events).toHaveLength(2)

      const p1Events = hole5Events.filter((e) => e.playerId === 'player-1')
      const p2Events = hole5Events.filter((e) => e.playerId === 'player-2')
      expect(p1Events[0].type).toBe('birdie')
      expect(p2Events[0].type).toBe('snake')
    })

    it('snopp can be logged multiple times per hole per player', () => {
      const sideStore = useSideEventsStore.getState()

      sideStore.logEvent({
        tournamentId: 'tournament-1',
        roundId: 'round-1',
        holeNumber: 3,
        playerId: 'player-1',
        type: 'snopp',
        createdByPlayerId: 'player-1',
      })
      sideStore.logEvent({
        tournamentId: 'tournament-1',
        roundId: 'round-1',
        holeNumber: 3,
        playerId: 'player-1',
        type: 'snopp',
        createdByPlayerId: 'player-1',
      })

      const events = useSideEventsStore.getState().getEventsByRound('round-1')
      const snoppEvents = events.filter(
        (e) =>
          e.holeNumber === 3 && e.playerId === 'player-1' && e.type === 'snopp'
      )
      expect(snoppEvents).toHaveLength(2)
    })
  })
})
