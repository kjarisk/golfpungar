import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  createScorecard,
  fetchScorecards,
  removeScorecard,
  setScorecardHoles,
  type RawScorecard,
} from './scorecards-api'
import type { Scorecard } from '../types'
import {
  calculateGrossTotal,
  calculateNetTotal,
  calculateStablefordTotal,
  isScorecardComplete,
} from '../lib/scoring-calc'
import { useRounds } from '@/features/rounds'
import { useHoles } from '@/features/courses'
import { usePlayers } from '@/features/players'
import type { Hole } from '@/features/courses'
import type { Round } from '@/features/rounds'
import type { Player } from '@/features/players'

export const scorecardsQueryKey = ['scorecards'] as const

function useRawScorecards() {
  return useQuery({
    queryKey: scorecardsQueryKey,
    queryFn: fetchScorecards,
  })
}

function enrich(
  raw: RawScorecard,
  rounds: Round[],
  holes: Hole[],
  players: Player[]
): Scorecard {
  const round = rounds.find((r) => r.id === raw.roundId)
  const courseHoles = round
    ? holes
        .filter((h) => h.courseId === round.courseId)
        .sort((a, b) => a.holeNumber - b.holeNumber)
    : []
  const player = raw.playerId
    ? players.find((p) => p.id === raw.playerId)
    : undefined
  const handicap = player?.groupHandicap ?? 0
  const grossTotal = calculateGrossTotal(raw.holeStrokes)
  const netTotal =
    courseHoles.length > 0
      ? calculateNetTotal(raw.holeStrokes, courseHoles, handicap)
      : null
  const stablefordPoints =
    round?.format === 'stableford' && courseHoles.length > 0
      ? calculateStablefordTotal(raw.holeStrokes, courseHoles, handicap)
      : null
  return {
    id: raw.id,
    roundId: raw.roundId,
    playerId: raw.playerId,
    teamId: raw.teamId,
    holeStrokes: raw.holeStrokes,
    grossTotal,
    netTotal,
    stablefordPoints,
    isComplete: isScorecardComplete(raw.holeStrokes),
  }
}

/**
 * Returns enriched scorecards (with computed gross/net/stableford). This is
 * THE hook consumers use; raw rows are an internal detail.
 */
export function useScorecards() {
  const raw = useRawScorecards()
  const { data: rounds = [] } = useRounds()
  const { data: holes = [] } = useHoles()
  const { data: players = [] } = usePlayers()

  const data = useMemo(() => {
    if (!raw.data) return undefined
    return raw.data.map((rs) => enrich(rs, rounds, holes, players))
  }, [raw.data, rounds, holes, players])

  return { ...raw, data }
}

export function useScorecardsByRound(
  roundId: string | null | undefined
): Scorecard[] {
  const { data: scorecards = [] } = useScorecards()
  return scorecards.filter((sc) => sc.roundId === roundId)
}

export function useScorecardForPlayer(
  roundId: string | null | undefined,
  playerId: string | null | undefined
): Scorecard | undefined {
  const { data: scorecards = [] } = useScorecards()
  return scorecards.find(
    (sc) => sc.roundId === roundId && sc.playerId === playerId
  )
}

export function useScorecardForTeam(
  roundId: string | null | undefined,
  teamId: string | null | undefined
): Scorecard | undefined {
  const { data: scorecards = [] } = useScorecards()
  return scorecards.find((sc) => sc.roundId === roundId && sc.teamId === teamId)
}

export function useCreateScorecard() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createScorecard,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: scorecardsQueryKey })
    },
  })
}

/**
 * Optimistic mutation: patches the cache immediately so the score grid
 * reflects the tap with no perceived latency, then writes through.
 */
export function useSetScorecardHoles() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: setScorecardHoles,
    onMutate: async ({ scorecardId, holeStrokes, isComplete }) => {
      await queryClient.cancelQueries({ queryKey: scorecardsQueryKey })
      const previous =
        queryClient.getQueryData<RawScorecard[]>(scorecardsQueryKey)
      queryClient.setQueryData<RawScorecard[]>(scorecardsQueryKey, (old) =>
        old?.map((sc) =>
          sc.id === scorecardId ? { ...sc, holeStrokes, isComplete } : sc
        )
      )
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(scorecardsQueryKey, context.previous)
      }
      toast.error('Could not save score')
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: scorecardsQueryKey })
    },
  })
}

/**
 * Higher-level helper that wraps `useSetScorecardHoles`: caller passes the
 * single hole change; we look up the current strokes from the cache,
 * splice in the new value, recompute completeness, and call the mutation.
 */
export function useSetHoleStroke() {
  const queryClient = useQueryClient()
  const setHoles = useSetScorecardHoles()

  return (input: {
    scorecardId: string
    holeIndex: number
    strokes: number | null
  }) => {
    const cache =
      queryClient.getQueryData<RawScorecard[]>(scorecardsQueryKey) ?? []
    const current = cache.find((sc) => sc.id === input.scorecardId)
    if (!current) return
    const next = [...current.holeStrokes]
    next[input.holeIndex] = input.strokes
    setHoles.mutate({
      scorecardId: input.scorecardId,
      holeStrokes: next,
      isComplete: isScorecardComplete(next),
    })
  }
}

export function useRemoveScorecard() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: removeScorecard,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: scorecardsQueryKey })
    },
  })
}
