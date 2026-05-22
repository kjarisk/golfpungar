import { supabase } from '@/lib/supabase'
import type { EvidenceImage } from '../types'

interface EvidenceImageRow {
  id: string
  side_event_log_id: string
  image_url: string
  created_at: string
}

const COLUMNS = 'id, side_event_log_id, image_url, created_at'

function toEvidenceImage(row: EvidenceImageRow): EvidenceImage {
  return {
    id: row.id,
    sideEventLogId: row.side_event_log_id,
    imageUrl: row.image_url,
    createdAt: row.created_at,
  }
}

export async function fetchEvidenceImages(): Promise<EvidenceImage[]> {
  const { data, error } = await supabase
    .from('evidence_images')
    .select(COLUMNS)
    .order('created_at')
  if (error) throw error
  return (data as unknown as EvidenceImageRow[]).map(toEvidenceImage)
}

export interface CreateEvidenceImageInput {
  sideEventLogId: string
  imageUrl: string
}

export async function createEvidenceImage(
  input: CreateEvidenceImageInput
): Promise<EvidenceImage> {
  const { data, error } = await supabase
    .from('evidence_images')
    .insert({
      side_event_log_id: input.sideEventLogId,
      image_url: input.imageUrl,
    })
    .select(COLUMNS)
    .single()
  if (error) throw error
  return toEvidenceImage(data as unknown as EvidenceImageRow)
}

export async function removeEvidenceImage(id: string): Promise<void> {
  const { error } = await supabase.from('evidence_images').delete().eq('id', id)
  if (error) throw error
}
