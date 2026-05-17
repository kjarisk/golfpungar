/// <reference types="vitest/globals" />

const { from } = vi.hoisted(() => ({ from: vi.fn() }))
vi.mock('@/lib/supabase', () => ({ supabase: { from } }))

const { getState } = vi.hoisted(() => ({
  getState: vi.fn(() => ({ user: { id: 'u-1' } })),
}))
vi.mock('@/features/auth', () => ({
  useAuthStore: { getState },
}))

import {
  createTournament,
  fetchTournaments,
  removeTournament,
  setTournamentStatus,
  updateTournament,
} from './tournaments-api'

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
  chain.single = vi.fn(() => Promise.resolve(result))
  chain.then = (resolve: (value: Result) => unknown) =>
    Promise.resolve(result).then(resolve)
  return chain
}

const ROW = {
  id: 't1',
  name: 'Spain 2026',
  location: 'Marbella',
  country_id: 'c1',
  start_date: '2026-06-15',
  end_date: '2026-06-20',
  status: 'live',
  created_by: 'u-1',
  created_at: '2026-01-15T10:00:00Z',
}

const TOURNAMENT = {
  id: 't1',
  name: 'Spain 2026',
  location: 'Marbella',
  countryId: 'c1',
  startDate: '2026-06-15',
  endDate: '2026-06-20',
  status: 'live',
  createdByUserId: 'u-1',
  createdAt: '2026-01-15T10:00:00Z',
}

beforeEach(() => {
  from.mockReset()
})

describe('fetchTournaments', () => {
  it('maps Supabase rows to Tournament objects', async () => {
    from.mockReturnValue(query({ data: [ROW], error: null }))
    const tournaments = await fetchTournaments()
    expect(tournaments).toEqual([TOURNAMENT])
  })

  it('maps null location/country to undefined', async () => {
    from.mockReturnValue(
      query({
        data: [{ ...ROW, location: null, country_id: null }],
        error: null,
      })
    )
    const [t] = await fetchTournaments()
    expect(t.location).toBeUndefined()
    expect(t.countryId).toBeUndefined()
  })

  it('throws when Supabase returns an error', async () => {
    from.mockReturnValue(query({ data: null, error: new Error('boom') }))
    await expect(fetchTournaments()).rejects.toThrow('boom')
  })
})

describe('createTournament', () => {
  it('inserts and returns the created tournament', async () => {
    from.mockReturnValue(query({ data: ROW, error: null }))
    const tournament = await createTournament({
      name: 'Spain 2026',
      location: 'Marbella',
      countryId: 'c1',
      startDate: '2026-06-15',
      endDate: '2026-06-20',
    })
    expect(tournament).toEqual(TOURNAMENT)
    expect(from).toHaveBeenCalledWith('tournaments')
  })

  it('throws when the insert fails', async () => {
    from.mockReturnValue(query({ data: null, error: new Error('denied') }))
    await expect(
      createTournament({
        name: 'X',
        startDate: '2026-01-01',
        endDate: '2026-01-02',
      })
    ).rejects.toThrow('denied')
  })
})

describe('updateTournament', () => {
  it('updates and returns the tournament', async () => {
    from.mockReturnValue(query({ data: ROW, error: null }))
    const tournament = await updateTournament('t1', { name: 'Spain 2026' })
    expect(tournament).toEqual(TOURNAMENT)
  })

  it('throws when the update fails', async () => {
    from.mockReturnValue(query({ data: null, error: new Error('nope') }))
    await expect(updateTournament('t1', { name: 'X' })).rejects.toThrow('nope')
  })
})

describe('setTournamentStatus', () => {
  it('resolves when the status update succeeds', async () => {
    from.mockReturnValue(query({ data: null, error: null }))
    await expect(setTournamentStatus('t1', 'done')).resolves.toBeUndefined()
  })

  it('throws when the status update fails', async () => {
    from.mockReturnValue(query({ data: null, error: new Error('fail') }))
    await expect(setTournamentStatus('t1', 'done')).rejects.toThrow('fail')
  })
})

describe('removeTournament', () => {
  it('resolves when the delete succeeds', async () => {
    from.mockReturnValue(query({ data: null, error: null }))
    await expect(removeTournament('t1')).resolves.toBeUndefined()
  })

  it('throws when the delete fails', async () => {
    from.mockReturnValue(query({ data: null, error: new Error('denied') }))
    await expect(removeTournament('t1')).rejects.toThrow('denied')
  })
})
