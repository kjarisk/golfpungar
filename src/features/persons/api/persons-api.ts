import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase-types'
import type { Person, CreatePersonInput, UpdatePersonInput } from '../types'

interface PersonRow {
  id: string
  display_name: string
  nickname: string | null
  email: string | null
  user_id: string | null
  current_handicap: number
  created_at: string
}

const COLUMNS =
  'id, display_name, nickname, email, user_id, current_handicap, created_at'

function toPerson(row: PersonRow): Person {
  return {
    id: row.id,
    displayName: row.display_name,
    nickname: row.nickname ?? undefined,
    email: row.email ?? undefined,
    userId: row.user_id ?? undefined,
    currentHandicap: Number(row.current_handicap),
    createdAt: row.created_at,
  }
}

export async function fetchPersons(): Promise<Person[]> {
  const { data, error } = await supabase
    .from('persons')
    .select(COLUMNS)
    .order('display_name')
  if (error) throw error
  return data.map(toPerson)
}

export async function createPerson(input: CreatePersonInput): Promise<Person> {
  const { data, error } = await supabase
    .from('persons')
    .insert({
      display_name: input.displayName,
      nickname: input.nickname || null,
      email: input.email || null,
      current_handicap: input.currentHandicap ?? 18,
    })
    .select(COLUMNS)
    .single()
  if (error) throw error
  return toPerson(data)
}

export async function updatePerson(
  id: string,
  updates: UpdatePersonInput
): Promise<Person> {
  const patch: Database['public']['Tables']['persons']['Update'] = {}
  if ('displayName' in updates) patch.display_name = updates.displayName
  if ('nickname' in updates) patch.nickname = updates.nickname || null
  if ('email' in updates) patch.email = updates.email || null
  if ('currentHandicap' in updates)
    patch.current_handicap = updates.currentHandicap
  const { data, error } = await supabase
    .from('persons')
    .update(patch)
    .eq('id', id)
    .select(COLUMNS)
    .single()
  if (error) throw error
  return toPerson(data)
}

export async function removePerson(id: string): Promise<void> {
  const { error } = await supabase.from('persons').delete().eq('id', id)
  if (error) throw error
}
