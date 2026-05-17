import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/features/auth'
import type { Database } from '@/lib/supabase-types'
import type {
  Tournament,
  TournamentStatus,
  CreateTournamentInput,
} from '../types'

type TournamentUpdate = Database['public']['Tables']['tournaments']['Update']

interface TournamentRow {
  id: string
  name: string
  location: string | null
  country_id: string | null
  start_date: string
  end_date: string
  status: TournamentStatus
  created_by: string | null
  created_at: string
}

const COLUMNS =
  'id, name, location, country_id, start_date, end_date, status, created_by, created_at'

function toTournament(row: TournamentRow): Tournament {
  return {
    id: row.id,
    name: row.name,
    location: row.location ?? undefined,
    countryId: row.country_id ?? undefined,
    startDate: row.start_date,
    endDate: row.end_date,
    status: row.status,
    createdByUserId: row.created_by ?? '',
    createdAt: row.created_at,
  }
}

export interface UpdateTournamentInput {
  name?: string
  location?: string
  countryId?: string
  startDate?: string
  endDate?: string
}

export async function fetchTournaments(): Promise<Tournament[]> {
  const { data, error } = await supabase
    .from('tournaments')
    .select(COLUMNS)
    .order('start_date', { ascending: false })
  if (error) throw error
  return data.map(toTournament)
}

export async function createTournament(
  input: CreateTournamentInput
): Promise<Tournament> {
  const userId = useAuthStore.getState().user?.id ?? null
  const { data, error } = await supabase
    .from('tournaments')
    .insert({
      name: input.name,
      location: input.location ?? null,
      country_id: input.countryId ?? null,
      start_date: input.startDate,
      end_date: input.endDate,
      status: 'draft',
      created_by: userId,
    })
    .select(COLUMNS)
    .single()
  if (error) throw error
  return toTournament(data)
}

export async function updateTournament(
  id: string,
  updates: UpdateTournamentInput
): Promise<Tournament> {
  const patch: TournamentUpdate = {}
  if ('name' in updates) patch.name = updates.name
  if ('location' in updates) patch.location = updates.location || null
  if ('countryId' in updates) patch.country_id = updates.countryId || null
  if ('startDate' in updates) patch.start_date = updates.startDate
  if ('endDate' in updates) patch.end_date = updates.endDate
  const { data, error } = await supabase
    .from('tournaments')
    .update(patch)
    .eq('id', id)
    .select(COLUMNS)
    .single()
  if (error) throw error
  return toTournament(data)
}

export async function setTournamentStatus(
  id: string,
  status: TournamentStatus
): Promise<void> {
  const { error } = await supabase
    .from('tournaments')
    .update({ status })
    .eq('id', id)
  if (error) throw error
}

export async function removeTournament(id: string): Promise<void> {
  const { error } = await supabase.from('tournaments').delete().eq('id', id)
  if (error) throw error
}
