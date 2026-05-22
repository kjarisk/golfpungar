import { supabase } from '@/lib/supabase'
import type { HoleStroke, Scorecard } from '../types'

interface ScorecardRow {
  id: string
  round_id: string
  player_id: string | null
  team_id: string | null
  hole_strokes: HoleStroke[]
  is_complete: boolean
  created_at: string
}

/**
 * A scorecard exactly as it lives in the DB — raw strokes only. The exported
 * `Scorecard` type (with computed totals) is what consumers see; that comes
 * from `useScorecards()` after enrichment.
 */
export interface RawScorecard {
  id: string
  roundId: string
  playerId?: string
  teamId?: string
  holeStrokes: HoleStroke[]
  isComplete: boolean
  createdAt: string
}

const COLUMNS =
  'id, round_id, player_id, team_id, hole_strokes, is_complete, created_at'

function toRaw(row: ScorecardRow): RawScorecard {
  return {
    id: row.id,
    roundId: row.round_id,
    playerId: row.player_id ?? undefined,
    teamId: row.team_id ?? undefined,
    holeStrokes: row.hole_strokes,
    isComplete: row.is_complete,
    createdAt: row.created_at,
  }
}

export async function fetchScorecards(): Promise<RawScorecard[]> {
  const { data, error } = await supabase
    .from('scorecards')
    .select(COLUMNS)
    .order('created_at')
  if (error) throw error
  return (data as unknown as ScorecardRow[]).map(toRaw)
}

export interface CreateScorecardInput {
  roundId: string
  playerId?: string
  teamId?: string
  holesPlayed: 9 | 18
}

export async function createScorecard(
  input: CreateScorecardInput
): Promise<RawScorecard> {
  const { data, error } = await supabase
    .from('scorecards')
    .insert({
      round_id: input.roundId,
      player_id: input.playerId ?? null,
      team_id: input.teamId ?? null,
      hole_strokes: Array(input.holesPlayed).fill(null),
      is_complete: false,
    })
    .select(COLUMNS)
    .single()
  if (error) throw error
  return toRaw(data as unknown as ScorecardRow)
}

export interface SetScorecardHolesInput {
  scorecardId: string
  holeStrokes: HoleStroke[]
  isComplete: boolean
}

export async function setScorecardHoles(
  input: SetScorecardHolesInput
): Promise<void> {
  const { error } = await supabase
    .from('scorecards')
    .update({
      hole_strokes: input.holeStrokes,
      is_complete: input.isComplete,
    })
    .eq('id', input.scorecardId)
  if (error) throw error
}

export async function removeScorecard(id: string): Promise<void> {
  const { error } = await supabase.from('scorecards').delete().eq('id', id)
  if (error) throw error
}

// Re-export the consumer type for convenience.
export type { Scorecard }
