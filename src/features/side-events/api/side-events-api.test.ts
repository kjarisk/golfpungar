/// <reference types="vitest/globals" />

const { from } = vi.hoisted(() => ({ from: vi.fn() }))
vi.mock('@/lib/supabase', () => ({ supabase: { from } }))

import {
  createSideEvent,
  fetchSideEvents,
  removeSideEvent,
} from './side-events-api'

interface Result {
  data: unknown
  error: unknown
}

function query(result: Result) {
  const chain: Record<string, unknown> = {}
  for (const method of [
    'select',
    'order',
    'insert',
    'update',
    'eq',
    'delete',
  ]) {
    chain[method] = vi.fn(() => chain)
  }
  chain.maybeSingle = vi.fn(() => Promise.resolve(result))
  chain.single = vi.fn(() => Promise.resolve(result))
  chain.then = (resolve: (value: Result) => unknown) =>
    Promise.resolve(result).then(resolve)
  return chain
}

const ROW = {
  id: 'se-1',
  tournament_id: 't1',
  round_id: 'r1',
  hole_number: 5,
  player_id: 'p1',
  type: 'birdie',
  value: null,
  created_by_player_id: 'p1',
  created_at: '2026-05-01T10:00:00Z',
}

const EVENT = {
  id: 'se-1',
  tournamentId: 't1',
  roundId: 'r1',
  holeNumber: 5,
  playerId: 'p1',
  type: 'birdie',
  value: undefined,
  createdByPlayerId: 'p1',
  createdAt: '2026-05-01T10:00:00Z',
}

beforeEach(() => {
  from.mockReset()
})

describe('fetchSideEvents', () => {
  it('maps Supabase rows to SideEventLog objects', async () => {
    from.mockReturnValue(query({ data: [ROW], error: null }))
    const events = await fetchSideEvents()
    expect(events).toEqual([EVENT])
  })

  it('throws when Supabase returns an error', async () => {
    from.mockReturnValue(query({ data: null, error: new Error('boom') }))
    await expect(fetchSideEvents()).rejects.toThrow('boom')
  })
})

describe('createSideEvent', () => {
  it('inserts and returns the created event', async () => {
    from.mockReturnValue(query({ data: ROW, error: null }))
    const event = await createSideEvent({
      tournamentId: 't1',
      roundId: 'r1',
      holeNumber: 5,
      playerId: 'p1',
      type: 'birdie',
      createdByPlayerId: 'p1',
    })
    expect(event).toEqual(EVENT)
    expect(from).toHaveBeenCalledWith('side_event_logs')
  })

  it('passes a numeric value through for distance events', async () => {
    from.mockReturnValue(
      query({
        data: { ...ROW, type: 'longest_drive_meters', value: 285 },
        error: null,
      })
    )
    const event = await createSideEvent({
      tournamentId: 't1',
      playerId: 'p1',
      type: 'longest_drive_meters',
      value: 285,
      createdByPlayerId: 'p1',
    })
    expect(event.value).toBe(285)
    expect(event.type).toBe('longest_drive_meters')
  })
})

describe('removeSideEvent', () => {
  it('throws when the delete fails', async () => {
    from.mockReturnValue(query({ data: null, error: new Error('denied') }))
    await expect(removeSideEvent('se-1')).rejects.toThrow('denied')
  })

  it('resolves when the delete succeeds', async () => {
    from.mockReturnValue(query({ data: null, error: null }))
    await expect(removeSideEvent('se-1')).resolves.toBeUndefined()
  })
})
