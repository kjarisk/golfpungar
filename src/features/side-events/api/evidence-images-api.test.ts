/// <reference types="vitest/globals" />

const { from } = vi.hoisted(() => ({ from: vi.fn() }))
vi.mock('@/lib/supabase', () => ({ supabase: { from } }))

import {
  createEvidenceImage,
  fetchEvidenceImages,
  removeEvidenceImage,
} from './evidence-images-api'

interface Result {
  data: unknown
  error: unknown
}

function query(result: Result) {
  const chain: Record<string, unknown> = {}
  for (const method of ['select', 'order', 'insert', 'eq', 'delete']) {
    chain[method] = vi.fn(() => chain)
  }
  chain.maybeSingle = vi.fn(() => Promise.resolve(result))
  chain.single = vi.fn(() => Promise.resolve(result))
  chain.then = (resolve: (value: Result) => unknown) =>
    Promise.resolve(result).then(resolve)
  return chain
}

const ROW = {
  id: 'ev-1',
  side_event_log_id: 'se-1',
  image_url: 'https://example.com/p.jpg',
  created_at: '2026-05-01T10:00:00Z',
}

const IMAGE = {
  id: 'ev-1',
  sideEventLogId: 'se-1',
  imageUrl: 'https://example.com/p.jpg',
  createdAt: '2026-05-01T10:00:00Z',
}

beforeEach(() => {
  from.mockReset()
})

describe('fetchEvidenceImages', () => {
  it('maps rows to EvidenceImage objects', async () => {
    from.mockReturnValue(query({ data: [ROW], error: null }))
    const images = await fetchEvidenceImages()
    expect(images).toEqual([IMAGE])
  })

  it('throws when Supabase returns an error', async () => {
    from.mockReturnValue(query({ data: null, error: new Error('boom') }))
    await expect(fetchEvidenceImages()).rejects.toThrow('boom')
  })
})

describe('createEvidenceImage', () => {
  it('inserts and returns the created row', async () => {
    from.mockReturnValue(query({ data: ROW, error: null }))
    const img = await createEvidenceImage({
      sideEventLogId: 'se-1',
      imageUrl: 'https://example.com/p.jpg',
    })
    expect(img).toEqual(IMAGE)
    expect(from).toHaveBeenCalledWith('evidence_images')
  })
})

describe('removeEvidenceImage', () => {
  it('throws when the delete fails', async () => {
    from.mockReturnValue(query({ data: null, error: new Error('denied') }))
    await expect(removeEvidenceImage('ev-1')).rejects.toThrow('denied')
  })

  it('resolves when the delete succeeds', async () => {
    from.mockReturnValue(query({ data: null, error: null }))
    await expect(removeEvidenceImage('ev-1')).resolves.toBeUndefined()
  })
})
