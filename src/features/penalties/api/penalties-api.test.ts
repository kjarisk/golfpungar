/// <reference types="vitest/globals" />

const { from } = vi.hoisted(() => ({ from: vi.fn() }))
vi.mock('@/lib/supabase', () => ({ supabase: { from } }))

import { createPenalty, fetchPenalties, removePenalty } from './penalties-api'

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
  id: 'le-1',
  tournament_id: 't1',
  player_id: 'p1',
  kind: 'penalty',
  amount: 3,
  note: 'Late to tee',
  round_id: 'r1',
  created_at: '2026-05-01T10:00:00Z',
}

const ENTRY = {
  id: 'le-1',
  tournamentId: 't1',
  playerId: 'p1',
  kind: 'penalty' as const,
  amount: 3,
  note: 'Late to tee',
  roundId: 'r1',
  createdAt: '2026-05-01T10:00:00Z',
}

beforeEach(() => {
  from.mockReset()
})

describe('fetchPenalties', () => {
  it('maps Supabase rows to LedgerEntry objects', async () => {
    from.mockReturnValue(query({ data: [ROW], error: null }))
    const entries = await fetchPenalties()
    expect(entries).toEqual([ENTRY])
  })

  it('throws when Supabase returns an error', async () => {
    from.mockReturnValue(query({ data: null, error: new Error('boom') }))
    await expect(fetchPenalties()).rejects.toThrow('boom')
  })
})

describe('createPenalty', () => {
  it('inserts and returns the created entry', async () => {
    from.mockReturnValue(query({ data: ROW, error: null }))
    const entry = await createPenalty({
      tournamentId: 't1',
      playerId: 'p1',
      amount: 3,
      note: 'Late to tee',
      roundId: 'r1',
    })
    expect(entry).toEqual(ENTRY)
    expect(from).toHaveBeenCalledWith('ledger_entries')
  })

  it('throws when the insert fails', async () => {
    from.mockReturnValue(query({ data: null, error: new Error('denied') }))
    await expect(
      createPenalty({
        tournamentId: 't1',
        playerId: 'p1',
        amount: 1,
        note: 'X',
      })
    ).rejects.toThrow('denied')
  })
})

describe('removePenalty', () => {
  it('throws when the delete fails', async () => {
    from.mockReturnValue(query({ data: null, error: new Error('denied') }))
    await expect(removePenalty('le-1')).rejects.toThrow('denied')
  })

  it('resolves when the delete succeeds', async () => {
    from.mockReturnValue(query({ data: null, error: null }))
    await expect(removePenalty('le-1')).resolves.toBeUndefined()
  })
})
