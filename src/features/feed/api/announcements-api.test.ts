/// <reference types="vitest/globals" />

const { from } = vi.hoisted(() => ({ from: vi.fn() }))
vi.mock('@/lib/supabase', () => ({ supabase: { from } }))

import {
  createAnnouncement,
  fetchAnnouncements,
  removeAnnouncement,
} from './announcements-api'

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
  id: 'a-1',
  tournament_id: 't1',
  created_by: 'u1',
  message: 'Tee times moved to 9am',
  created_at: '2026-05-01T10:00:00Z',
}

const ANNOUNCEMENT = {
  id: 'a-1',
  tournamentId: 't1',
  createdByUserId: 'u1',
  message: 'Tee times moved to 9am',
  createdAt: '2026-05-01T10:00:00Z',
}

beforeEach(() => {
  from.mockReset()
})

describe('fetchAnnouncements', () => {
  it('maps Supabase rows to Announcement objects', async () => {
    from.mockReturnValue(query({ data: [ROW], error: null }))
    const items = await fetchAnnouncements()
    expect(items).toEqual([ANNOUNCEMENT])
  })

  it('maps a null created_by to an empty string', async () => {
    from.mockReturnValue(
      query({ data: [{ ...ROW, created_by: null }], error: null })
    )
    const [a] = await fetchAnnouncements()
    expect(a.createdByUserId).toBe('')
  })

  it('throws when Supabase returns an error', async () => {
    from.mockReturnValue(query({ data: null, error: new Error('boom') }))
    await expect(fetchAnnouncements()).rejects.toThrow('boom')
  })
})

describe('createAnnouncement', () => {
  it('inserts and returns the announcement', async () => {
    from.mockReturnValue(query({ data: ROW, error: null }))
    const a = await createAnnouncement({
      tournamentId: 't1',
      createdByUserId: 'u1',
      message: 'Tee times moved to 9am',
    })
    expect(a).toEqual(ANNOUNCEMENT)
    expect(from).toHaveBeenCalledWith('announcements')
  })

  it('throws when the insert fails', async () => {
    from.mockReturnValue(query({ data: null, error: new Error('denied') }))
    await expect(
      createAnnouncement({
        tournamentId: 't1',
        createdByUserId: 'u1',
        message: 'X',
      })
    ).rejects.toThrow('denied')
  })
})

describe('removeAnnouncement', () => {
  it('throws when the delete fails', async () => {
    from.mockReturnValue(query({ data: null, error: new Error('denied') }))
    await expect(removeAnnouncement('a-1')).rejects.toThrow('denied')
  })

  it('resolves when the delete succeeds', async () => {
    from.mockReturnValue(query({ data: null, error: null }))
    await expect(removeAnnouncement('a-1')).resolves.toBeUndefined()
  })
})
