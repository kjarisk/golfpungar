import { create } from 'zustand'
import type { Scorecard, RoundPoints } from '../types'
import type { Hole } from '@/features/courses'
import {
  calculateGrossTotal,
  calculateNetTotal,
  calculateStablefordTotal,
  isScorecardComplete,
} from '../lib/scoring-calc'
import { awardPoints, DEFAULT_POINTS } from '../lib/points-calc'
import type { RoundFormat } from '@/features/rounds'
import { useRoundsStore } from '@/features/rounds'

interface ScoringState {
  scorecards: Scorecard[]
  roundPoints: RoundPoints[]

  // Derived
  getScorecardsByRound: (roundId: string) => Scorecard[]
  getScorecardForPlayer: (
    roundId: string,
    playerId: string
  ) => Scorecard | undefined
  getScorecardForTeam: (
    roundId: string,
    teamId: string
  ) => Scorecard | undefined
  getPointsByRound: (roundId: string) => RoundPoints[]

  // Actions
  createScorecard: (
    roundId: string,
    holesPlayed: 9 | 18,
    playerId?: string,
    teamId?: string
  ) => Scorecard
  setHoleStroke: (
    scorecardId: string,
    holeIndex: number,
    strokes: number | null,
    holes: Hole[],
    groupHandicap: number,
    format: RoundFormat
  ) => void
  setWholeRoundTotal: (scorecardId: string, grossTotal: number) => void
  recalculatePoints: (
    roundId: string,
    format: RoundFormat,
    pointsTable?: number[]
  ) => void
  removeScorecard: (scorecardId: string) => void
}

let nextScorecardId = 1

export const useScoringStore = create<ScoringState>((set, get) => ({
  scorecards: [],
  roundPoints: [],

  getScorecardsByRound: (roundId) =>
    get().scorecards.filter((sc) => sc.roundId === roundId),

  getScorecardForPlayer: (roundId, playerId) =>
    get().scorecards.find(
      (sc) => sc.roundId === roundId && sc.playerId === playerId
    ),

  getScorecardForTeam: (roundId, teamId) =>
    get().scorecards.find(
      (sc) => sc.roundId === roundId && sc.teamId === teamId
    ),

  getPointsByRound: (roundId) =>
    get().roundPoints.filter((rp) => rp.roundId === roundId),

  createScorecard: (roundId, holesPlayed, playerId, teamId) => {
    const scorecard: Scorecard = {
      id: `scorecard-${String(nextScorecardId++).padStart(3, '0')}`,
      roundId,
      playerId,
      teamId,
      holeStrokes: Array(holesPlayed).fill(null),
      grossTotal: 0,
      netTotal: null,
      stablefordPoints: null,
      isComplete: false,
    }

    set((state) => ({
      scorecards: [...state.scorecards, scorecard],
    }))

    return scorecard
  },

  setHoleStroke: (
    scorecardId,
    holeIndex,
    strokes,
    holes,
    groupHandicap,
    format
  ) => {
    // Find roundId before state update for auto-recalculation
    const scorecard = get().scorecards.find((sc) => sc.id === scorecardId)
    const roundId = scorecard?.roundId

    set((state) => ({
      scorecards: state.scorecards.map((sc) => {
        if (sc.id !== scorecardId) return sc

        const newStrokes = [...sc.holeStrokes]
        newStrokes[holeIndex] = strokes

        const grossTotal = calculateGrossTotal(newStrokes)
        const netTotal = calculateNetTotal(newStrokes, holes, groupHandicap)
        const stablefordPoints =
          format === 'stableford'
            ? calculateStablefordTotal(newStrokes, holes, groupHandicap)
            : null

        return {
          ...sc,
          holeStrokes: newStrokes,
          grossTotal,
          netTotal,
          stablefordPoints,
          isComplete: isScorecardComplete(newStrokes),
        }
      }),
    }))

    // Auto-recalculate points after every stroke entry
    if (roundId) {
      const round = useRoundsStore
        .getState()
        .rounds.find((r) => r.id === roundId)
      get().recalculatePoints(roundId, format, round?.pointsTable)
    }
  },

  setWholeRoundTotal: (scorecardId, grossTotal) => {
    set((state) => ({
      scorecards: state.scorecards.map((sc) =>
        sc.id === scorecardId ? { ...sc, grossTotal, isComplete: false } : sc
      ),
    }))
  },

  recalculatePoints: (roundId, format, pointsTable = DEFAULT_POINTS) => {
    const scorecards = get().scorecards.filter((sc) => sc.roundId === roundId)
    const newPoints = awardPoints(scorecards, format, pointsTable)

    set((state) => ({
      roundPoints: [
        ...state.roundPoints.filter((rp) => rp.roundId !== roundId),
        ...newPoints,
      ],
    }))
  },

  removeScorecard: (scorecardId) => {
    set((state) => ({
      scorecards: state.scorecards.filter((sc) => sc.id !== scorecardId),
    }))
  },
}))
