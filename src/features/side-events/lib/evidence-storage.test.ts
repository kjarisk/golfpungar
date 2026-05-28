/// <reference types="vitest/globals" />

const { upload, createSignedUrl, from } = vi.hoisted(() => {
  const upload = vi.fn()
  const createSignedUrl = vi.fn()
  const from = vi.fn(() => ({ upload, createSignedUrl }))
  return { upload, createSignedUrl, from }
})
vi.mock('@/lib/supabase', () => ({ supabase: { storage: { from } } }))

import {
  buildEvidencePath,
  uploadEvidenceImage,
  getEvidenceSignedUrl,
} from './evidence-storage'

beforeEach(() => {
  upload.mockReset()
  createSignedUrl.mockReset()
  from.mockClear()
})

describe('buildEvidencePath', () => {
  it('puts the tournament id first so storage RLS can check membership', () => {
    const path = buildEvidencePath('t-1', 'se-9')
    expect(path).toMatch(/^t-1\/se-9\/[\w-]+\.jpg$/)
  })

  it('generates a unique path per call', () => {
    expect(buildEvidencePath('t', 's')).not.toBe(buildEvidencePath('t', 's'))
  })
})

describe('uploadEvidenceImage', () => {
  it('uploads to the evidence bucket and returns the storage path', async () => {
    upload.mockResolvedValue({ error: null })
    // createImageBitmap is undefined in jsdom → compressImage returns the file as-is.
    const file = new File(['x'], 'drive.jpg', { type: 'image/jpeg' })
    const path = await uploadEvidenceImage({
      tournamentId: 't-1',
      sideEventLogId: 'se-9',
      file,
    })
    expect(from).toHaveBeenCalledWith('evidence')
    expect(upload).toHaveBeenCalledTimes(1)
    const [uploadedPath, , opts] = upload.mock.calls[0]
    expect(uploadedPath).toBe(path)
    expect(path).toMatch(/^t-1\/se-9\//)
    expect(opts).toMatchObject({ contentType: 'image/jpeg', upsert: false })
  })

  it('throws when the upload fails', async () => {
    upload.mockResolvedValue({ error: new Error('denied') })
    const file = new File(['x'], 'drive.jpg', { type: 'image/jpeg' })
    await expect(
      uploadEvidenceImage({ tournamentId: 't', sideEventLogId: 's', file })
    ).rejects.toThrow('denied')
  })
})

describe('getEvidenceSignedUrl', () => {
  it('returns the signed URL for a stored path', async () => {
    createSignedUrl.mockResolvedValue({
      data: { signedUrl: 'https://signed/x' },
      error: null,
    })
    const url = await getEvidenceSignedUrl('t-1/se-9/abc.jpg')
    expect(createSignedUrl).toHaveBeenCalledWith('t-1/se-9/abc.jpg', 3600)
    expect(url).toBe('https://signed/x')
  })

  it('throws when signing fails', async () => {
    createSignedUrl.mockResolvedValue({ data: null, error: new Error('nope') })
    await expect(getEvidenceSignedUrl('p')).rejects.toThrow('nope')
  })
})
