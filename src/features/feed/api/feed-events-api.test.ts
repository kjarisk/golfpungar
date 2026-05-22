/// <reference types="vitest/globals" />

const { from } = vi.hoisted(() => ({ from: vi.fn() }))
vi.mock('@/lib/supabase', () => ({ supabase: { from } }))
const { invalidateQueries } = vi.hoisted(() => ({
  invalidateQueries: vi.fn(),
}))
vi.mock('@/lib/query-client', () => ({
  queryClient: { invalidateQueries },
}))

import {
  createFeedEvent,
  fetchFeedEvents,
  emitFeedEvent,
} from './feed-events-api'

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
  id: 'fe-1',
  tournament_id: 't1',
  type: 'announcement',
  message: 'Tee times moved to 9am',
  player_id: null,
  round_id: null,
  team_id: null,
  created_at: '2026-05-01T10:00:00Z',
}

const EVENT = {
  id: 'fe-1',
  tournamentId: 't1',
  type: 'announcement' as const,
  message: 'Tee times moved to 9am',
  playerId: undefined,
  roundId: undefined,
  teamId: undefined,
  createdAt: '2026-05-01T10:00:00Z',
}

beforeEach(() => {
  from.mockReset()
  invalidateQueries.mockReset()
})

describe('fetchFeedEvents', () => {
  it('maps Supabase rows to FeedEvent objects', async () => {
    from.mockReturnValue(query({ data: [ROW], error: null }))
    const events = await fetchFeedEvents()
    expect(events).toEqual([EVENT])
  })

  it('throws when Supabase returns an error', async () => {
    from.mockReturnValue(query({ data: null, error: new Error('boom') }))
    await expect(fetchFeedEvents()).rejects.toThrow('boom')
  })
})

describe('createFeedEvent', () => {
  it('inserts and returns the created event', async () => {
    from.mockReturnValue(query({ data: ROW, error: null }))
    const event = await createFeedEvent({
      tournamentId: 't1',
      type: 'announcement',
      message: 'Tee times moved to 9am',
    })
    expect(event).toEqual(EVENT)
    expect(from).toHaveBeenCalledWith('feed_events')
  })

  it('throws when the insert fails', async () => {
    from.mockReturnValue(query({ data: null, error: new Error('denied') }))
    await expect(
      createFeedEvent({
        tournamentId: 't1',
        type: 'announcement',
        message: 'X',
      })
    ).rejects.toThrow('denied')
  })
})

describe('emitFeedEvent', () => {
  it('invalidates the feed-events cache on success', async () => {
    from.mockReturnValue(query({ data: ROW, error: null }))
    emitFeedEvent({
      tournamentId: 't1',
      type: 'announcement',
      message: 'Tee times moved to 9am',
    })
    // Wait for the microtasks to flush
    await new Promise((r) => setTimeout(r, 0))
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['feed-events'],
    })
  })

  it('logs but does not throw when the insert fails', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    from.mockReturnValue(query({ data: null, error: new Error('boom') }))
    emitFeedEvent({
      tournamentId: 't1',
      type: 'announcement',
      message: 'X',
    })
    await new Promise((r) => setTimeout(r, 0))
    expect(consoleError).toHaveBeenCalled()
    expect(invalidateQueries).not.toHaveBeenCalled()
    consoleError.mockRestore()
  })
})
