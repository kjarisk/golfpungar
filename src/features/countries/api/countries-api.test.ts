/// <reference types="vitest/globals" />

const { from } = vi.hoisted(() => ({ from: vi.fn() }))
vi.mock('@/lib/supabase', () => ({ supabase: { from } }))

import { createCountry, deleteCountry, fetchCountries } from './countries-api'

interface Result {
  data: unknown
  error: unknown
}

/** A chainable Supabase query-builder mock that resolves to `result`. */
function query(result: Result) {
  const chain: Record<string, unknown> = {}
  for (const method of ['select', 'order', 'ilike', 'insert', 'eq', 'delete']) {
    chain[method] = vi.fn(() => chain)
  }
  chain.maybeSingle = vi.fn(() => Promise.resolve(result))
  chain.single = vi.fn(() => Promise.resolve(result))
  chain.then = (resolve: (value: Result) => unknown) =>
    Promise.resolve(result).then(resolve)
  return chain
}

beforeEach(() => {
  from.mockReset()
})

describe('fetchCountries', () => {
  it('maps Supabase rows to Country objects', async () => {
    from.mockReturnValue(
      query({
        data: [{ id: 'c1', name: 'Spain', created_at: '2026-01-01T00:00:00Z' }],
        error: null,
      })
    )
    const countries = await fetchCountries()
    expect(countries).toEqual([
      { id: 'c1', name: 'Spain', createdAt: '2026-01-01T00:00:00Z' },
    ])
  })

  it('throws when Supabase returns an error', async () => {
    from.mockReturnValue(query({ data: null, error: new Error('boom') }))
    await expect(fetchCountries()).rejects.toThrow('boom')
  })
})

describe('createCountry', () => {
  it('rejects an empty name', async () => {
    await expect(createCountry('   ')).rejects.toThrow(/required/i)
    expect(from).not.toHaveBeenCalled()
  })

  it('returns the existing country instead of inserting a duplicate', async () => {
    from.mockReturnValueOnce(
      query({
        data: { id: 'c1', name: 'Spain', created_at: '2026-01-01T00:00:00Z' },
        error: null,
      })
    )
    const country = await createCountry('spain')
    expect(country.id).toBe('c1')
    expect(from).toHaveBeenCalledTimes(1) // lookup only, no insert
  })

  it('inserts and returns a new country when none exists', async () => {
    from
      .mockReturnValueOnce(query({ data: null, error: null })) // lookup miss
      .mockReturnValueOnce(
        query({
          data: {
            id: 'c2',
            name: 'Italy',
            created_at: '2026-02-02T00:00:00Z',
          },
          error: null,
        })
      )
    const country = await createCountry('Italy')
    expect(country).toEqual({
      id: 'c2',
      name: 'Italy',
      createdAt: '2026-02-02T00:00:00Z',
    })
    expect(from).toHaveBeenCalledTimes(2)
  })
})

describe('deleteCountry', () => {
  it('throws when the delete fails', async () => {
    from.mockReturnValue(query({ data: null, error: new Error('denied') }))
    await expect(deleteCountry('c1')).rejects.toThrow('denied')
  })

  it('resolves when the delete succeeds', async () => {
    from.mockReturnValue(query({ data: null, error: null }))
    await expect(deleteCountry('c1')).resolves.toBeUndefined()
  })
})
