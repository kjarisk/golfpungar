/// <reference types="vitest/globals" />

const { from } = vi.hoisted(() => ({ from: vi.fn() }))
vi.mock('@/lib/supabase', () => ({ supabase: { from } }))

import { fetchInvites, sendInvite } from './invites-api'

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
  id: 'i1',
  tournament_id: 't1',
  email: 'friend@test.com',
  role: 'player' as const,
  token: 'tok-1',
  expires_at: '2026-06-01T00:00:00Z',
  accepted_at: null,
  status: 'pending' as const,
  linked_person_id: null,
}

const INVITE = {
  id: 'i1',
  tournamentId: 't1',
  email: 'friend@test.com',
  role: 'player' as const,
  token: 'tok-1',
  expiresAt: '2026-06-01T00:00:00Z',
  acceptedAt: undefined,
  status: 'pending' as const,
  linkedPersonId: undefined,
}

beforeEach(() => {
  from.mockReset()
})

describe('fetchInvites', () => {
  it('maps Supabase rows to Invite objects', async () => {
    from.mockReturnValue(query({ data: [ROW], error: null }))
    const invites = await fetchInvites()
    expect(invites).toEqual([INVITE])
  })

  it('maps accepted_at/linked_person_id to undefined when null', async () => {
    from.mockReturnValue(query({ data: [ROW], error: null }))
    const [i] = await fetchInvites()
    expect(i.acceptedAt).toBeUndefined()
    expect(i.linkedPersonId).toBeUndefined()
  })

  it('throws when Supabase returns an error', async () => {
    from.mockReturnValue(query({ data: null, error: new Error('boom') }))
    await expect(fetchInvites()).rejects.toThrow('boom')
  })
})

describe('sendInvite', () => {
  it('inserts and returns the created invite', async () => {
    from.mockReturnValue(query({ data: ROW, error: null }))
    const invite = await sendInvite('t1', 'friend@test.com')
    expect(invite).toEqual(INVITE)
    expect(from).toHaveBeenCalledWith('invites')
  })

  it('normalizes the email to trimmed lowercase', async () => {
    const chain = query({ data: ROW, error: null })
    from.mockReturnValue(chain)
    await sendInvite('t1', '  FRIEND@TEST.COM ')
    const insertArg = (chain.insert as ReturnType<typeof vi.fn>).mock
      .calls[0][0]
    expect(insertArg.email).toBe('friend@test.com')
  })

  it('throws when the insert fails', async () => {
    from.mockReturnValue(query({ data: null, error: new Error('denied') }))
    await expect(sendInvite('t1', 'friend@test.com')).rejects.toThrow('denied')
  })
})
