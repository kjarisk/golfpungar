/// <reference types="vitest/globals" />

const { from } = vi.hoisted(() => ({ from: vi.fn() }))
vi.mock('@/lib/supabase', () => ({ supabase: { from } }))

import {
  createPerson,
  fetchPersons,
  removePerson,
  updatePerson,
} from './persons-api'

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
  id: 'pn1',
  display_name: 'Kjartan',
  nickname: 'Kjarri',
  email: 'kjartan@test.com',
  user_id: 'u1',
  created_at: '2026-01-15T10:00:00Z',
}

const PERSON = {
  id: 'pn1',
  displayName: 'Kjartan',
  nickname: 'Kjarri',
  email: 'kjartan@test.com',
  userId: 'u1',
  createdAt: '2026-01-15T10:00:00Z',
}

beforeEach(() => {
  from.mockReset()
})

describe('fetchPersons', () => {
  it('maps Supabase rows to Person objects', async () => {
    from.mockReturnValue(query({ data: [ROW], error: null }))
    const persons = await fetchPersons()
    expect(persons).toEqual([PERSON])
  })

  it('maps null nickname/email/user_id to undefined', async () => {
    from.mockReturnValue(
      query({
        data: [{ ...ROW, nickname: null, email: null, user_id: null }],
        error: null,
      })
    )
    const [p] = await fetchPersons()
    expect(p.nickname).toBeUndefined()
    expect(p.email).toBeUndefined()
    expect(p.userId).toBeUndefined()
  })

  it('throws when Supabase returns an error', async () => {
    from.mockReturnValue(query({ data: null, error: new Error('boom') }))
    await expect(fetchPersons()).rejects.toThrow('boom')
  })
})

describe('createPerson', () => {
  it('inserts and returns the created person', async () => {
    from.mockReturnValue(query({ data: ROW, error: null }))
    const person = await createPerson({
      displayName: 'Kjartan',
      nickname: 'Kjarri',
      email: 'kjartan@test.com',
    })
    expect(person).toEqual(PERSON)
    expect(from).toHaveBeenCalledWith('persons')
  })

  it('throws when the insert fails (e.g. unique email index)', async () => {
    from.mockReturnValue(
      query({ data: null, error: new Error('duplicate key') })
    )
    await expect(createPerson({ displayName: 'X' })).rejects.toThrow(
      'duplicate key'
    )
  })
})

describe('updatePerson', () => {
  it('updates and returns the person', async () => {
    from.mockReturnValue(query({ data: ROW, error: null }))
    const person = await updatePerson('pn1', { displayName: 'Kjartan' })
    expect(person).toEqual(PERSON)
  })

  it('throws when the update fails', async () => {
    from.mockReturnValue(query({ data: null, error: new Error('nope') }))
    await expect(updatePerson('pn1', { displayName: 'X' })).rejects.toThrow(
      'nope'
    )
  })
})

describe('removePerson', () => {
  it('resolves when the delete succeeds', async () => {
    from.mockReturnValue(query({ data: null, error: null }))
    await expect(removePerson('pn1')).resolves.toBeUndefined()
  })

  it('throws when the delete fails', async () => {
    from.mockReturnValue(query({ data: null, error: new Error('denied') }))
    await expect(removePerson('pn1')).rejects.toThrow('denied')
  })
})
