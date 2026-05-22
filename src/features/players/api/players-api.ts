import { supabase } from '@/lib/supabase'
import { emitFeedEvent } from '@/features/feed'
import type { Database } from '@/lib/supabase-types'
import type { Player, UpdatePlayerInput } from '../types'

interface JoinedPersonRow {
  display_name: string
  nickname: string | null
  email: string | null
  user_id: string | null
}

interface PlayerRow {
  id: string
  tournament_id: string
  person_id: string
  group_handicap: number
  active: boolean
  created_at: string
  persons: JoinedPersonRow | null
}

const COLUMNS =
  'id, tournament_id, person_id, group_handicap, active, created_at, persons!inner(display_name, nickname, email, user_id)'

function toPlayer(row: PlayerRow): Player {
  return {
    id: row.id,
    tournamentId: row.tournament_id,
    personId: row.person_id,
    userId: row.persons?.user_id ?? '',
    displayName: row.persons?.display_name ?? '',
    nickname: row.persons?.nickname ?? undefined,
    email: row.persons?.email ?? undefined,
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
  return (data as unknown as PlayerRow[]).map(toPlayer)
}

export async function createPlayer({
  tournamentId,
  personId,
  groupHandicap,
}: {
  tournamentId: string
  personId: string
  groupHandicap: number
}): Promise<Player> {
  const { data, error } = await supabase
    .from('players')
    .insert({
      tournament_id: tournamentId,
      person_id: personId,
      group_handicap: groupHandicap,
      active: true,
    })
    .select(COLUMNS)
    .single()
  if (error) throw error
  return toPlayer(data as unknown as PlayerRow)
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
  if ('groupHandicap' in updates) patch.group_handicap = updates.groupHandicap
  if ('active' in updates) patch.active = updates.active

  const { data, error } = await supabase
    .from('players')
    .update(patch)
    .eq('id', id)
    .select(COLUMNS)
    .single()
  if (error) throw error
  const updated = toPlayer(data as unknown as PlayerRow)

  // Handicap-change feed event (fire-and-forget — feed write should never
  // block a player update).
  if (
    current &&
    updates.groupHandicap !== undefined &&
    Number((current as unknown as PlayerRow).group_handicap) !==
      updates.groupHandicap
  ) {
    emitFeedEvent({
      tournamentId: updated.tournamentId,
      type: 'handicap_changed',
      message: `${updated.displayName} handicap changed: ${Number((current as unknown as PlayerRow).group_handicap)} → ${updates.groupHandicap}`,
      playerId: updated.id,
    })
  }
  return updated
}

/**
 * Hard delete — the row goes away entirely so the same person can be re-added
 * later without colliding with the `unique(tournament_id, person_id)` constraint.
 * The `active` column stays in the schema for future "temporary leave" use.
 */
export async function removePlayer(id: string): Promise<void> {
  const { error } = await supabase.from('players').delete().eq('id', id)
  if (error) throw error
}
