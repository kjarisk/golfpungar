import { supabase } from '@/lib/supabase'
import type { Announcement, CreateAnnouncementInput } from '../types'

interface AnnouncementRow {
  id: string
  tournament_id: string
  created_by: string | null
  message: string
  created_at: string
}

const COLUMNS = 'id, tournament_id, created_by, message, created_at'

function toAnnouncement(row: AnnouncementRow): Announcement {
  return {
    id: row.id,
    tournamentId: row.tournament_id,
    createdByUserId: row.created_by ?? '',
    message: row.message,
    createdAt: row.created_at,
  }
}

export async function fetchAnnouncements(): Promise<Announcement[]> {
  const { data, error } = await supabase
    .from('announcements')
    .select(COLUMNS)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data as unknown as AnnouncementRow[]).map(toAnnouncement)
}

export async function createAnnouncement(
  input: CreateAnnouncementInput
): Promise<Announcement> {
  const { data, error } = await supabase
    .from('announcements')
    .insert({
      tournament_id: input.tournamentId,
      created_by: input.createdByUserId,
      message: input.message,
    })
    .select(COLUMNS)
    .single()
  if (error) throw error
  return toAnnouncement(data as unknown as AnnouncementRow)
}

export async function removeAnnouncement(id: string): Promise<void> {
  const { error } = await supabase.from('announcements').delete().eq('id', id)
  if (error) throw error
}
