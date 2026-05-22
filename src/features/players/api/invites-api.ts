import { supabase } from '@/lib/supabase'
import type { Invite, InviteStatus } from '../types'

interface InviteRow {
  id: string
  tournament_id: string
  email: string
  role: 'admin' | 'player'
  token: string
  expires_at: string
  accepted_at: string | null
  status: InviteStatus
  linked_person_id: string | null
}

const COLUMNS =
  'id, tournament_id, email, role, token, expires_at, accepted_at, status, linked_person_id'

function toInvite(row: InviteRow): Invite {
  return {
    id: row.id,
    tournamentId: row.tournament_id,
    email: row.email,
    role: row.role,
    token: row.token,
    expiresAt: row.expires_at,
    acceptedAt: row.accepted_at ?? undefined,
    status: row.status,
    linkedPersonId: row.linked_person_id ?? undefined,
  }
}

export async function fetchInvites(): Promise<Invite[]> {
  const { data, error } = await supabase.from('invites').select(COLUMNS)
  if (error) throw error
  return data.map(toInvite)
}

/**
 * Record an invite. The magic-link signup itself is handled by Supabase auth;
 * the `handle_new_user` DB trigger reads pending invites on signup to set the
 * new user's role and link them to the matching person row — so there is no
 * client-side "accept invite" step.
 */
export async function sendInvite(
  tournamentId: string,
  email: string,
  role: 'admin' | 'player' = 'player'
): Promise<Invite> {
  const { data, error } = await supabase
    .from('invites')
    .insert({
      tournament_id: tournamentId,
      email: email.trim().toLowerCase(),
      role,
      token: crypto.randomUUID(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
    })
    .select(COLUMNS)
    .single()
  if (error) throw error
  return toInvite(data)
}
