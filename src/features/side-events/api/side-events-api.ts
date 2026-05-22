import { supabase } from '@/lib/supabase'
import type {
  CreateSideEventInput,
  SideEventLog,
  SideEventType,
} from '../types'

interface SideEventRow {
  id: string
  tournament_id: string
  round_id: string | null
  hole_number: number | null
  player_id: string
  type: SideEventType
  value: number | null
  created_by_player_id: string | null
  created_at: string
}

const COLUMNS =
  'id, tournament_id, round_id, hole_number, player_id, type, value, created_by_player_id, created_at'

function toSideEvent(row: SideEventRow): SideEventLog {
  return {
    id: row.id,
    tournamentId: row.tournament_id,
    roundId: row.round_id ?? undefined,
    holeNumber: row.hole_number ?? undefined,
    playerId: row.player_id,
    type: row.type,
    value: row.value ?? undefined,
    createdAt: row.created_at,
    createdByPlayerId: row.created_by_player_id ?? '',
  }
}

export async function fetchSideEvents(): Promise<SideEventLog[]> {
  const { data, error } = await supabase
    .from('side_event_logs')
    .select(COLUMNS)
    .order('created_at')
  if (error) throw error
  return (data as unknown as SideEventRow[]).map(toSideEvent)
}

export async function createSideEvent(
  input: CreateSideEventInput
): Promise<SideEventLog> {
  const { data, error } = await supabase
    .from('side_event_logs')
    .insert({
      tournament_id: input.tournamentId,
      round_id: input.roundId ?? null,
      hole_number: input.holeNumber ?? null,
      player_id: input.playerId,
      type: input.type,
      value: input.value ?? null,
      created_by_player_id: input.createdByPlayerId,
    })
    .select(COLUMNS)
    .single()
  if (error) throw error
  return toSideEvent(data as unknown as SideEventRow)
}

export async function removeSideEvent(id: string): Promise<void> {
  const { error } = await supabase.from('side_event_logs').delete().eq('id', id)
  if (error) throw error
}
