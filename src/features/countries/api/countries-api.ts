import { supabase } from '@/lib/supabase'
import type { Country } from '../types'

interface CountryRow {
  id: string
  name: string
  created_at: string
}

function toCountry(row: CountryRow): Country {
  return { id: row.id, name: row.name, createdAt: row.created_at }
}

export async function fetchCountries(): Promise<Country[]> {
  const { data, error } = await supabase
    .from('countries')
    .select('id, name, created_at')
    .order('name')
  if (error) throw error
  return data.map(toCountry)
}

/**
 * Create a country, or return the existing one when a country with the same
 * name already exists (case-insensitive) — mirrors the old store's dedup.
 */
export async function createCountry(name: string): Promise<Country> {
  const trimmed = name.trim()
  if (!trimmed) throw new Error('Country name is required')

  const { data: existing, error: lookupError } = await supabase
    .from('countries')
    .select('id, name, created_at')
    .ilike('name', trimmed)
    .maybeSingle()
  if (lookupError) throw lookupError
  if (existing) return toCountry(existing)

  const { data, error } = await supabase
    .from('countries')
    .insert({ name: trimmed })
    .select('id, name, created_at')
    .single()
  if (error) throw error
  return toCountry(data)
}

export async function deleteCountry(id: string): Promise<void> {
  const { error } = await supabase.from('countries').delete().eq('id', id)
  if (error) throw error
}
