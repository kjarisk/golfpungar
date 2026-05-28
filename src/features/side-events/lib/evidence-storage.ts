import { supabase } from '@/lib/supabase'

const BUCKET = 'evidence'
const SIGNED_URL_TTL_SECONDS = 60 * 60 // 60 minutes
const TARGET_MAX_BYTES = 500 * 1024 // 500 KB
const MAX_DIMENSION = 1600 // px — longest edge after downscale

/**
 * Object path within the evidence bucket. The first segment is the tournament
 * id, which the storage RLS policies check via private.is_tournament_member.
 */
export function buildEvidencePath(
  tournamentId: string,
  sideEventLogId: string
): string {
  return `${tournamentId}/${sideEventLogId}/${crypto.randomUUID()}.jpg`
}

/**
 * Downscale + re-encode an image to JPEG, aiming to stay under ~500 KB so
 * on-course uploads over mobile data are quick. Falls back to the original
 * file if the browser can't decode it (e.g. HEIC without support).
 */
export async function compressImage(file: File): Promise<Blob> {
  const bitmap = await loadBitmap(file)
  if (!bitmap) return file

  const scale = Math.min(
    1,
    MAX_DIMENSION / Math.max(bitmap.width, bitmap.height)
  )
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) return file
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)

  // Step quality down until under target (or we hit a floor).
  for (const quality of [0.8, 0.6, 0.45, 0.3]) {
    const blob = await canvasToBlob(canvas, quality)
    if (blob && (blob.size <= TARGET_MAX_BYTES || quality === 0.3)) {
      return blob
    }
  }
  return file
}

/**
 * Compress + upload an evidence photo to the private bucket. Returns the
 * storage path (NOT a URL) — store this in evidence_images.image_url and
 * resolve a signed URL at display time via getEvidenceSignedUrl.
 */
export async function uploadEvidenceImage(args: {
  tournamentId: string
  sideEventLogId: string
  file: File
}): Promise<string> {
  const { tournamentId, sideEventLogId, file } = args
  const blob = await compressImage(file)
  const path = buildEvidencePath(tournamentId, sideEventLogId)
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: 'image/jpeg',
    upsert: false,
  })
  if (error) throw error
  return path
}

/** Resolve a time-limited signed URL for a stored evidence path. */
export async function getEvidenceSignedUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS)
  if (error) throw error
  return data.signedUrl
}

/**
 * Resolve signed URLs for many stored paths at once, returned as a
 * path → URL map. Paths that fail to sign are omitted.
 */
export async function getEvidenceSignedUrls(
  paths: string[]
): Promise<Record<string, string>> {
  if (paths.length === 0) return {}
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(paths, SIGNED_URL_TTL_SECONDS)
  if (error) throw error
  const map: Record<string, string> = {}
  for (const entry of data ?? []) {
    if (entry.signedUrl && entry.path) map[entry.path] = entry.signedUrl
  }
  return map
}

async function loadBitmap(file: File): Promise<ImageBitmap | null> {
  if (typeof createImageBitmap !== 'function') return null
  try {
    return await createImageBitmap(file)
  } catch {
    return null
  }
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  quality: number
): Promise<Blob | null> {
  return new Promise((resolve) =>
    canvas.toBlob((blob) => resolve(blob), 'image/jpeg', quality)
  )
}
