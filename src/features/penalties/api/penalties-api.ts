import { supabase } from '@/lib/supabase'
import type { CreatePenaltyInput, LedgerEntry } from '../types'

interface LedgerEntryRow {
  id: string
  tournament_id: string
  player_id: string
  kind: 'penalty'
  amount: number
  note: string
  round_id: string | null
  created_at: string
}

const COLUMNS =
  'id, tournament_id, player_id, kind, amount, note, round_id, created_at'

function toLedgerEntry(row: LedgerEntryRow): LedgerEntry {
  return {
    id: row.id,
    tournamentId: row.tournament_id,
    playerId: row.player_id,
    kind: row.kind,
    amount: Number(row.amount),
    note: row.note ?? '',
    roundId: row.round_id ?? undefined,
    createdAt: row.created_at,
  }
}

export async function fetchPenalties(): Promise<LedgerEntry[]> {
  const { data, error } = await supabase
    .from('ledger_entries')
    .select(COLUMNS)
    .order('created_at')
  if (error) throw error
  return (data as unknown as LedgerEntryRow[]).map(toLedgerEntry)
}

export async function createPenalty(
  input: CreatePenaltyInput
): Promise<LedgerEntry> {
  const { data, error } = await supabase
    .from('ledger_entries')
    .insert({
      tournament_id: input.tournamentId,
      player_id: input.playerId,
      kind: 'penalty',
      amount: input.amount,
      note: input.note,
      round_id: input.roundId ?? null,
    })
    .select(COLUMNS)
    .single()
  if (error) throw error
  return toLedgerEntry(data as unknown as LedgerEntryRow)
}

export async function removePenalty(id: string): Promise<void> {
  const { error } = await supabase.from('ledger_entries').delete().eq('id', id)
  if (error) throw error
}
