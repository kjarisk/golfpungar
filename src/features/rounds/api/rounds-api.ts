import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase-types'
import type {
  Round,
  Group,
  Team,
  CreateRoundInput,
  RoundStatus,
} from '../types'

export interface UpdateRoundInput {
  name?: string
  dateTime?: string
  format?: Round['format']
  holesPlayed?: Round['holesPlayed']
  courseId?: string
  pointsTable?: number[]
}

export interface GroupInput {
  name: string
  playerIds: string[]
}

export interface TeamInput {
  name: string
  playerIds: string[]
}

interface RoundRow {
  id: string
  tournament_id: string
  course_id: string
  name: string
  date_time: string | null
  format: Round['format']
  holes_played: number
  status: RoundStatus
  points_table: number[] | null
  deleted: boolean
  created_at: string
}

const ROUND_COLUMNS =
  'id, tournament_id, course_id, name, date_time, format, holes_played, status, points_table, deleted, created_at'

function toRound(row: RoundRow): Round {
  return {
    id: row.id,
    tournamentId: row.tournament_id,
    courseId: row.course_id,
    name: row.name,
    dateTime: row.date_time ?? undefined,
    format: row.format,
    holesPlayed: row.holes_played === 9 ? 9 : 18,
    status: row.status,
    pointsTable: row.points_table ?? undefined,
    deleted: row.deleted,
    createdAt: row.created_at,
  }
}

export async function fetchRounds(): Promise<Round[]> {
  const { data, error } = await supabase
    .from('rounds')
    .select(ROUND_COLUMNS)
    .order('created_at')
  if (error) throw error
  return data.map(toRound)
}

export async function fetchGroups(): Promise<Group[]> {
  const { data, error } = await supabase
    .from('groups')
    .select('id, round_id, name, created_at, group_members(player_id)')
    .order('created_at')
  if (error) throw error
  return (data ?? []).map((g) => ({
    id: g.id,
    roundId: g.round_id,
    name: g.name,
    playerIds: (g.group_members ?? []).map((m) => m.player_id),
  }))
}

export async function fetchTeams(): Promise<Team[]> {
  const { data, error } = await supabase
    .from('teams')
    .select('id, round_id, name, created_at, team_members(player_id)')
    .order('created_at')
  if (error) throw error
  return (data ?? []).map((t) => ({
    id: t.id,
    roundId: t.round_id,
    name: t.name,
    playerIds: (t.team_members ?? []).map((m) => m.player_id),
  }))
}

async function insertGroups(
  roundId: string,
  groups: GroupInput[]
): Promise<void> {
  for (const g of groups) {
    const { data: group, error } = await supabase
      .from('groups')
      .insert({ round_id: roundId, name: g.name })
      .select('id')
      .single()
    if (error) throw error
    if (g.playerIds.length > 0) {
      const { error: memberError } = await supabase
        .from('group_members')
        .insert(
          g.playerIds.map((pid) => ({ group_id: group.id, player_id: pid }))
        )
      if (memberError) throw memberError
    }
  }
}

async function insertTeams(roundId: string, teams: TeamInput[]): Promise<void> {
  for (const t of teams) {
    const { data: team, error } = await supabase
      .from('teams')
      .insert({ round_id: roundId, name: t.name })
      .select('id')
      .single()
    if (error) throw error
    if (t.playerIds.length > 0) {
      const { error: memberError } = await supabase
        .from('team_members')
        .insert(
          t.playerIds.map((pid) => ({ team_id: team.id, player_id: pid }))
        )
      if (memberError) throw memberError
    }
  }
}

export async function createRound(
  tournamentId: string,
  input: CreateRoundInput
): Promise<Round> {
  const { data: round, error } = await supabase
    .from('rounds')
    .insert({
      tournament_id: tournamentId,
      course_id: input.courseId,
      name: input.name,
      date_time: input.dateTime ?? null,
      format: input.format,
      holes_played: input.holesPlayed,
      points_table: input.pointsTable ?? null,
      status: 'upcoming',
    })
    .select(ROUND_COLUMNS)
    .single()
  if (error) throw error

  try {
    await insertGroups(round.id, input.groups)
    if (input.teams && input.teams.length > 0) {
      await insertTeams(round.id, input.teams)
    }
  } catch (e) {
    // compensating delete — children cascade
    await supabase.from('rounds').delete().eq('id', round.id)
    throw e
  }
  return toRound(round)
}

export async function updateRound(
  roundId: string,
  input: UpdateRoundInput
): Promise<void> {
  const patch: Database['public']['Tables']['rounds']['Update'] = {}
  if ('name' in input) patch.name = input.name
  if ('dateTime' in input) patch.date_time = input.dateTime ?? null
  if ('format' in input) patch.format = input.format
  if ('holesPlayed' in input) patch.holes_played = input.holesPlayed
  if ('courseId' in input) patch.course_id = input.courseId
  if ('pointsTable' in input) patch.points_table = input.pointsTable ?? null
  const { error } = await supabase
    .from('rounds')
    .update(patch)
    .eq('id', roundId)
  if (error) throw error
}

/** Replace all groups for a round (members cascade on delete). */
export async function updateGroups(
  roundId: string,
  groupInputs: GroupInput[]
): Promise<void> {
  const { error } = await supabase
    .from('groups')
    .delete()
    .eq('round_id', roundId)
  if (error) throw error
  await insertGroups(roundId, groupInputs)
}

export async function setRoundStatus(
  roundId: string,
  status: RoundStatus
): Promise<void> {
  const { error } = await supabase
    .from('rounds')
    .update({ status })
    .eq('id', roundId)
  if (error) throw error
}

/** Soft delete. */
export async function removeRound(id: string): Promise<void> {
  const { error } = await supabase
    .from('rounds')
    .update({ deleted: true, status: 'upcoming' })
    .eq('id', id)
  if (error) throw error
}

export async function restoreRound(id: string): Promise<void> {
  const { error } = await supabase
    .from('rounds')
    .update({ deleted: false })
    .eq('id', id)
  if (error) throw error
}

export async function addTeamsToRound(
  roundId: string,
  teams: TeamInput[]
): Promise<void> {
  await insertTeams(roundId, teams)
}

export async function updateTeamName(
  teamId: string,
  name: string
): Promise<void> {
  const { error } = await supabase
    .from('teams')
    .update({ name })
    .eq('id', teamId)
  if (error) throw error
}

export async function removeTeam(teamId: string): Promise<void> {
  const { error } = await supabase.from('teams').delete().eq('id', teamId)
  if (error) throw error
}

export async function removeTeamsByRound(roundId: string): Promise<void> {
  const { error } = await supabase
    .from('teams')
    .delete()
    .eq('round_id', roundId)
  if (error) throw error
}
