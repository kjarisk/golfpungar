/// <reference types="vitest/globals" />

const { from } = vi.hoisted(() => ({ from: vi.fn() }))
vi.mock('@/lib/supabase', () => ({ supabase: { from } }))

const { addEvent } = vi.hoisted(() => ({ addEvent: vi.fn() }))
vi.mock('@/features/feed', () => ({
  useFeedStore: { getState: () => ({ addEvent }) },
}))

import {
  createPlayer,
  fetchPlayers,
  removePlayer,
  updatePlayer,
} from './players-api'

interface Result {
  data: unknown
  error: unknown
}

/** A chainable Supabase query-builder mock that resolves to `result`. */
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
  id: 'p1',
  tournament_id: 't1',
  user_id: 'u1',
  display_name: 'Kjartan',
  nickname: 'Kjarri',
  email: 'kjartan@test.com',
  group_handicap: 18,
  active: true,
  created_at: '2026-01-15T10:00:00Z',
}

const PLAYER = {
  id: 'p1',
  tournamentId: 't1',
  userId: 'u1',
  displayName: 'Kjartan',
  nickname: 'Kjarri',
  email: 'kjartan@test.com',
  groupHandicap: 18,
  active: true,
  createdAt: '2026-01-15T10:00:00Z',
}

beforeEach(() => {
  from.mockReset()
  addEvent.mockReset()
})

describe('fetchPlayers', () => {
  it('maps Supabase rows to Player objects', async () => {
    from.mockReturnValue(query({ data: [ROW], error: null }))
    const players = await fetchPlayers()
    expect(players).toEqual([PLAYER])
  })

  it('maps null nickname/email/user_id to undefined/empty', async () => {
    from.mockReturnValue(
      query({
        data: [{ ...ROW, nickname: null, email: null, user_id: null }],
        error: null,
      })
    )
    const [p] = await fetchPlayers()
    expect(p.nickname).toBeUndefined()
    expect(p.email).toBeUndefined()
    expect(p.userId).toBe('')
  })

  it('throws when Supabase returns an error', async () => {
    from.mockReturnValue(query({ data: null, error: new Error('boom') }))
    await expect(fetchPlayers()).rejects.toThrow('boom')
  })
})

describe('createPlayer', () => {
  it('inserts and returns the created player', async () => {
    from.mockReturnValue(query({ data: ROW, error: null }))
    const player = await createPlayer('t1', {
      displayName: 'Kjartan',
      nickname: 'Kjarri',
      email: 'kjartan@test.com',
      groupHandicap: 18,
    })
    expect(player).toEqual(PLAYER)
    expect(from).toHaveBeenCalledWith('players')
  })

  it('throws when the insert fails', async () => {
    from.mockReturnValue(query({ data: null, error: new Error('denied') }))
    await expect(
      createPlayer('t1', { displayName: 'X', groupHandicap: 18 })
    ).rejects.toThrow('denied')
  })
})

describe('updatePlayer', () => {
  it('updates and returns the player', async () => {
    from.mockReturnValue(query({ data: ROW, error: null }))
    const player = await updatePlayer('p1', { displayName: 'Kjartan' })
    expect(player).toEqual(PLAYER)
  })

  it('throws when the update fails', async () => {
    from
      .mockReturnValueOnce(query({ data: ROW, error: null })) // lookup
      .mockReturnValueOnce(query({ data: null, error: new Error('nope') }))
    await expect(updatePlayer('p1', { displayName: 'X' })).rejects.toThrow(
      'nope'
    )
  })

  it('posts a handicap-changed feed event when the handicap changes', async () => {
    from
      .mockReturnValueOnce(query({ data: ROW, error: null })) // lookup (hcp 18)
      .mockReturnValueOnce(
        query({ data: { ...ROW, group_handicap: 16 }, error: null })
      )
    await updatePlayer('p1', { groupHandicap: 16 })
    expect(addEvent).toHaveBeenCalledTimes(1)
    expect(addEvent.mock.calls[0][0]).toMatchObject({
      type: 'handicap_changed',
      playerId: 'p1',
    })
  })

  it('does NOT post a feed event when the handicap is unchanged', async () => {
    from
      .mockReturnValueOnce(query({ data: ROW, error: null })) // lookup (hcp 18)
      .mockReturnValueOnce(query({ data: ROW, error: null }))
    await updatePlayer('p1', { groupHandicap: 18 })
    expect(addEvent).not.toHaveBeenCalled()
  })

  it('does NOT post a feed event for non-handicap updates', async () => {
    from
      .mockReturnValueOnce(query({ data: ROW, error: null })) // lookup
      .mockReturnValueOnce(query({ data: ROW, error: null }))
    await updatePlayer('p1', { displayName: 'NewName' })
    expect(addEvent).not.toHaveBeenCalled()
  })
})

describe('removePlayer', () => {
  it('resolves when the soft delete succeeds', async () => {
    from.mockReturnValue(query({ data: null, error: null }))
    await expect(removePlayer('p1')).resolves.toBeUndefined()
  })

  it('throws when the soft delete fails', async () => {
    from.mockReturnValue(query({ data: null, error: new Error('denied') }))
    await expect(removePlayer('p1')).rejects.toThrow('denied')
  })
})
