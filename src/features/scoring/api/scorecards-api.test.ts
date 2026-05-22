/// <reference types="vitest/globals" />

const { from } = vi.hoisted(() => ({ from: vi.fn() }))
vi.mock('@/lib/supabase', () => ({ supabase: { from } }))

import {
  createScorecard,
  fetchScorecards,
  removeScorecard,
  setScorecardHoles,
} from './scorecards-api'

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

beforeEach(() => {
  from.mockReset()
})

describe('fetchScorecards', () => {
  it('maps Supabase rows to RawScorecard objects', async () => {
    from.mockReturnValue(
      query({
        data: [
          {
            id: 'sc-1',
            round_id: 'round-1',
            player_id: 'player-1',
            team_id: null,
            hole_strokes: [4, 5, null],
            is_complete: false,
            created_at: '2026-01-01T00:00:00Z',
          },
          {
            id: 'sc-2',
            round_id: 'round-1',
            player_id: null,
            team_id: 'team-1',
            hole_strokes: [3, 4, 5],
            is_complete: true,
            created_at: '2026-01-02T00:00:00Z',
          },
        ],
        error: null,
      })
    )
    const scorecards = await fetchScorecards()
    expect(scorecards).toEqual([
      {
        id: 'sc-1',
        roundId: 'round-1',
        playerId: 'player-1',
        teamId: undefined,
        holeStrokes: [4, 5, null],
        isComplete: false,
        createdAt: '2026-01-01T00:00:00Z',
      },
      {
        id: 'sc-2',
        roundId: 'round-1',
        playerId: undefined,
        teamId: 'team-1',
        holeStrokes: [3, 4, 5],
        isComplete: true,
        createdAt: '2026-01-02T00:00:00Z',
      },
    ])
  })

  it('throws when Supabase returns an error', async () => {
    from.mockReturnValue(query({ data: null, error: new Error('boom') }))
    await expect(fetchScorecards()).rejects.toThrow('boom')
  })
})

describe('createScorecard', () => {
  it('inserts a scorecard with an empty hole_strokes array of the requested length', async () => {
    from.mockReturnValue(
      query({
        data: {
          id: 'sc-new',
          round_id: 'round-1',
          player_id: 'player-1',
          team_id: null,
          hole_strokes: Array(18).fill(null),
          is_complete: false,
          created_at: '2026-01-03T00:00:00Z',
        },
        error: null,
      })
    )
    const sc = await createScorecard({
      roundId: 'round-1',
      playerId: 'player-1',
      holesPlayed: 18,
    })
    expect(sc).toEqual({
      id: 'sc-new',
      roundId: 'round-1',
      playerId: 'player-1',
      teamId: undefined,
      holeStrokes: Array(18).fill(null),
      isComplete: false,
      createdAt: '2026-01-03T00:00:00Z',
    })
    expect(from).toHaveBeenCalledWith('scorecards')
  })

  it('supports team scorecards', async () => {
    from.mockReturnValue(
      query({
        data: {
          id: 'sc-team',
          round_id: 'round-1',
          player_id: null,
          team_id: 'team-1',
          hole_strokes: Array(9).fill(null),
          is_complete: false,
          created_at: '2026-01-04T00:00:00Z',
        },
        error: null,
      })
    )
    const sc = await createScorecard({
      roundId: 'round-1',
      teamId: 'team-1',
      holesPlayed: 9,
    })
    expect(sc.teamId).toBe('team-1')
    expect(sc.playerId).toBeUndefined()
    expect(sc.holeStrokes).toHaveLength(9)
  })

  it('throws when insert fails', async () => {
    from.mockReturnValue(
      query({ data: null, error: new Error('insert failed') })
    )
    await expect(
      createScorecard({ roundId: 'round-1', playerId: 'p1', holesPlayed: 18 })
    ).rejects.toThrow('insert failed')
  })
})

describe('setScorecardHoles', () => {
  it('updates hole_strokes and is_complete', async () => {
    const update = vi.fn(() => chain)
    const eq = vi.fn(() => Promise.resolve({ data: null, error: null }))
    const chain: Record<string, unknown> = { update, eq }
    from.mockReturnValue(chain)

    await setScorecardHoles({
      scorecardId: 'sc-1',
      holeStrokes: [4, 5, 3],
      isComplete: false,
    })

    expect(from).toHaveBeenCalledWith('scorecards')
    expect(update).toHaveBeenCalledWith({
      hole_strokes: [4, 5, 3],
      is_complete: false,
    })
    expect(eq).toHaveBeenCalledWith('id', 'sc-1')
  })

  it('throws when update fails', async () => {
    from.mockReturnValue(
      query({ data: null, error: new Error('update failed') })
    )
    await expect(
      setScorecardHoles({
        scorecardId: 'sc-1',
        holeStrokes: [],
        isComplete: false,
      })
    ).rejects.toThrow('update failed')
  })
})

describe('removeScorecard', () => {
  it('throws when delete fails', async () => {
    from.mockReturnValue(query({ data: null, error: new Error('denied') }))
    await expect(removeScorecard('sc-1')).rejects.toThrow('denied')
  })

  it('resolves when delete succeeds', async () => {
    from.mockReturnValue(query({ data: null, error: null }))
    await expect(removeScorecard('sc-1')).resolves.toBeUndefined()
  })
})
