import { supabase } from '@/lib/supabase'
import { useFeedStore } from '@/features/feed'
import { createPerson, removePerson } from '@/features/persons/api/persons-api'
import type { Person } from '@/features/persons'
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

/**
 * Create a person and immediately add them as a player to the tournament.
 * If the player insert fails, the just-created person is rolled back
 * (compensating delete) so we don't leave an orphan pool entry.
 */
export async function addNewPersonToTournament({
  tournamentId,
  displayName,
  nickname,
  email,
  groupHandicap,
}: {
  tournamentId: string
  displayName: string
  nickname?: string
  email?: string
  groupHandicap: number
}): Promise<{ person: Person; player: Player }> {
  const person = await createPerson({ displayName, nickname, email })
  try {
    const player = await createPlayer({
      tournamentId,
      personId: person.id,
      groupHandicap,
    })
    return { person, player }
  } catch (err) {
    // Compensating delete — we don't want a stranded person row.
    try {
      await removePerson(person.id)
    } catch {
      // Swallow — the original error is more useful to surface.
    }
    throw err
  }
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

  // Handicap-change feed event. The feed store is still Zustand (until Phase 28).
  if (
    current &&
    updates.groupHandicap !== undefined &&
    Number((current as unknown as PlayerRow).group_handicap) !==
      updates.groupHandicap
  ) {
    useFeedStore.getState().addEvent({
      tournamentId: updated.tournamentId,
      type: 'handicap_changed',
      message: `${updated.displayName} handicap changed: ${Number((current as unknown as PlayerRow).group_handicap)} → ${updates.groupHandicap}`,
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
