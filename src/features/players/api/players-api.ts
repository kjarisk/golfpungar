import { supabase } from '@/lib/supabase'
import { useFeedStore } from '@/features/feed'
import type { Database } from '@/lib/supabase-types'
import type { Player, CreatePlayerInput, UpdatePlayerInput } from '../types'

interface PlayerRow {
  id: string
  tournament_id: string
  user_id: string | null
  display_name: string
  nickname: string | null
  email: string | null
  group_handicap: number
  active: boolean
  created_at: string
}

const COLUMNS =
  'id, tournament_id, user_id, display_name, nickname, email, group_handicap, active, created_at'

function toPlayer(row: PlayerRow): Player {
  return {
    id: row.id,
    tournamentId: row.tournament_id,
    userId: row.user_id ?? '',
    displayName: row.display_name,
    nickname: row.nickname ?? undefined,
    email: row.email ?? undefined,
    groupHandicap: Number(row.group_handicap),
    active: row.active,
    createdAt: row.created_at,
  }
}

export async function fetchPlayers(): Promise<Player[]> {
  const { data, error } = await supabase
    .from('players')
    .select(COLUMNS)
    .order('created_at')
  if (error) throw error
  return data.map(toPlayer)
}

export async function createPlayer(
  tournamentId: string,
  input: CreatePlayerInput
): Promise<Player> {
  const { data, error } = await supabase
    .from('players')
    .insert({
      tournament_id: tournamentId,
      display_name: input.displayName,
      nickname: input.nickname || null,
      email: input.email || null,
      group_handicap: input.groupHandicap,
      active: true,
    })
    .select(COLUMNS)
    .single()
  if (error) throw error
  return toPlayer(data)
}

export async function updatePlayer(
  id: string,
  updates: UpdatePlayerInput
): Promise<Player> {
  const { data: current } = await supabase
    .from('players')
    .select(COLUMNS)
    .eq('id', id)
    .maybeSingle()

  const patch: Database['public']['Tables']['players']['Update'] = {}
  if ('displayName' in updates) patch.display_name = updates.displayName
  if ('nickname' in updates) patch.nickname = updates.nickname || null
  if ('email' in updates) patch.email = updates.email || null
  if ('groupHandicap' in updates) patch.group_handicap = updates.groupHandicap
  if ('active' in updates) patch.active = updates.active

  const { data, error } = await supabase
    .from('players')
    .update(patch)
    .eq('id', id)
    .select(COLUMNS)
    .single()
  if (error) throw error
  const updated = toPlayer(data)

  // Handicap-change feed event. The feed store is still Zustand (until Phase 28).
  if (
    current &&
    updates.groupHandicap !== undefined &&
    Number(current.group_handicap) !== updates.groupHandicap
  ) {
    useFeedStore.getState().addEvent({
      tournamentId: updated.tournamentId,
      type: 'handicap_changed',
      message: `${updated.displayName} handicap changed: ${Number(current.group_handicap)} → ${updates.groupHandicap}`,
      playerId: updated.id,
    })
  }
  return updated
}

/** Soft delete — players are deactivated, never hard-deleted. */
export async function removePlayer(id: string): Promise<void> {
  const { error } = await supabase
    .from('players')
    .update({ active: false })
    .eq('id', id)
  if (error) throw error
}
