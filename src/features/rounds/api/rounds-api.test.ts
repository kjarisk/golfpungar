/// <reference types="vitest/globals" />

const { from } = vi.hoisted(() => ({ from: vi.fn() }))
vi.mock('@/lib/supabase', () => ({ supabase: { from } }))

import {
  fetchRounds,
  fetchGroups,
  fetchTeams,
  createRound,
  updateGroups,
  setRoundStatus,
  removeRound,
  restoreRound,
  addTeamsToRound,
  updateTeamName,
  removeTeam,
  removeTeamsByRound,
} from './rounds-api'

interface Result {
  data: unknown
  error: unknown
}

/**
 * A chainable Supabase query-builder mock that resolves to `result`.
 * Awaiting the chain (via `then`) resolves the same way regardless of how
 * many `select`/`eq`/`order` calls preceded it, which covers nested-select
 * queries used by `fetchGroups`/`fetchTeams`.
 */
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
  chain.maybeSingle = vi.fn(() => Promise.resolve(result))
  chain.then = (resolve: (value: Result) => unknown) =>
    Promise.resolve(result).then(resolve)
  return chain
}

beforeEach(() => {
  from.mockReset()
})

const ROUND_ROW = {
  id: 'r1',
  tournament_id: 't1',
  course_id: 'c1',
  name: 'Day 1 Morning',
  date_time: '2026-05-20T08:00:00Z',
  format: 'stableford' as const,
  holes_played: 18,
  status: 'upcoming' as const,
  points_table: [10, 8, 6],
  deleted: false,
  created_at: '2026-05-01T00:00:00Z',
}

describe('fetchRounds', () => {
  it('maps Supabase rows to Round objects', async () => {
    from.mockReturnValue(query({ data: [ROUND_ROW], error: null }))
    const rounds = await fetchRounds()
    expect(rounds).toEqual([
      {
        id: 'r1',
        tournamentId: 't1',
        courseId: 'c1',
        name: 'Day 1 Morning',
        dateTime: '2026-05-20T08:00:00Z',
        format: 'stableford',
        holesPlayed: 18,
        status: 'upcoming',
        pointsTable: [10, 8, 6],
        deleted: false,
        createdAt: '2026-05-01T00:00:00Z',
      },
    ])
  })

  it('maps null date_time and points_table to undefined', async () => {
    from.mockReturnValue(
      query({
        data: [{ ...ROUND_ROW, date_time: null, points_table: null }],
        error: null,
      })
    )
    const [round] = await fetchRounds()
    expect(round.dateTime).toBeUndefined()
    expect(round.pointsTable).toBeUndefined()
  })

  it('normalizes a non-9 holes_played value to 18', async () => {
    from.mockReturnValue(
      query({ data: [{ ...ROUND_ROW, holes_played: 9 }], error: null })
    )
    const [round] = await fetchRounds()
    expect(round.holesPlayed).toBe(9)
  })

  it('throws when Supabase returns an error', async () => {
    from.mockReturnValue(query({ data: null, error: new Error('boom') }))
    await expect(fetchRounds()).rejects.toThrow('boom')
  })
})

describe('fetchGroups', () => {
  it('assembles playerIds from the group_members join table', async () => {
    from.mockReturnValue(
      query({
        data: [
          {
            id: 'g1',
            round_id: 'r1',
            name: 'Group 1',
            created_at: '2026-05-01T00:00:00Z',
            group_members: [{ player_id: 'p1' }, { player_id: 'p2' }],
          },
        ],
        error: null,
      })
    )
    const groups = await fetchGroups()
    expect(groups).toEqual([
      { id: 'g1', roundId: 'r1', name: 'Group 1', playerIds: ['p1', 'p2'] },
    ])
  })

  it('returns an empty playerIds array when the join table is empty', async () => {
    from.mockReturnValue(
      query({
        data: [
          {
            id: 'g1',
            round_id: 'r1',
            name: 'Group 1',
            created_at: '2026-05-01T00:00:00Z',
            group_members: [],
          },
        ],
        error: null,
      })
    )
    const [group] = await fetchGroups()
    expect(group.playerIds).toEqual([])
  })

  it('throws when Supabase returns an error', async () => {
    from.mockReturnValue(query({ data: null, error: new Error('boom') }))
    await expect(fetchGroups()).rejects.toThrow('boom')
  })
})

describe('fetchTeams', () => {
  it('assembles playerIds from the team_members join table', async () => {
    from.mockReturnValue(
      query({
        data: [
          {
            id: 'tm1',
            round_id: 'r1',
            name: 'Team A',
            created_at: '2026-05-01T00:00:00Z',
            team_members: [{ player_id: 'p1' }, { player_id: 'p2' }],
          },
        ],
        error: null,
      })
    )
    const teams = await fetchTeams()
    expect(teams).toEqual([
      { id: 'tm1', roundId: 'r1', name: 'Team A', playerIds: ['p1', 'p2'] },
    ])
  })

  it('throws when Supabase returns an error', async () => {
    from.mockReturnValue(query({ data: null, error: new Error('boom') }))
    await expect(fetchTeams()).rejects.toThrow('boom')
  })
})

describe('createRound', () => {
  it('inserts the round, its groups and group members', async () => {
    from
      .mockReturnValueOnce(query({ data: ROUND_ROW, error: null })) // round insert
      .mockReturnValueOnce(query({ data: { id: 'g1' }, error: null })) // group insert
      .mockReturnValueOnce(query({ data: null, error: null })) // group members insert

    const round = await createRound('t1', {
      courseId: 'c1',
      name: 'Day 1 Morning',
      format: 'stableford',
      holesPlayed: 18,
      groups: [{ name: 'Group 1', playerIds: ['p1', 'p2'] }],
    })

    expect(round.id).toBe('r1')
    expect(from).toHaveBeenCalledTimes(3)
  })

  it('inserts teams and team members when teams are supplied', async () => {
    from
      .mockReturnValueOnce(query({ data: ROUND_ROW, error: null })) // round insert
      .mockReturnValueOnce(query({ data: { id: 'g1' }, error: null })) // group insert
      .mockReturnValueOnce(query({ data: null, error: null })) // group members
      .mockReturnValueOnce(query({ data: { id: 'tm1' }, error: null })) // team insert
      .mockReturnValueOnce(query({ data: null, error: null })) // team members

    await createRound('t1', {
      courseId: 'c1',
      name: 'Scramble Day',
      format: 'scramble',
      holesPlayed: 18,
      groups: [{ name: 'Group 1', playerIds: ['p1', 'p2'] }],
      teams: [{ name: 'Team A', playerIds: ['p1', 'p2'] }],
    })

    expect(from).toHaveBeenCalledTimes(5)
  })

  it('skips the group members insert when a group has no players', async () => {
    from
      .mockReturnValueOnce(query({ data: ROUND_ROW, error: null })) // round insert
      .mockReturnValueOnce(query({ data: { id: 'g1' }, error: null })) // group insert

    await createRound('t1', {
      courseId: 'c1',
      name: 'Empty Group',
      format: 'stableford',
      holesPlayed: 18,
      groups: [{ name: 'Group 1', playerIds: [] }],
    })

    // round insert + group insert only — no members insert
    expect(from).toHaveBeenCalledTimes(2)
  })

  it('issues a compensating delete when the group insert fails', async () => {
    const deleteChain = query({ data: null, error: null })
    from
      .mockReturnValueOnce(query({ data: ROUND_ROW, error: null })) // round insert
      .mockReturnValueOnce(
        query({ data: null, error: new Error('group insert failed') })
      ) // group insert fails
      .mockReturnValueOnce(deleteChain) // compensating delete

    await expect(
      createRound('t1', {
        courseId: 'c1',
        name: 'Orphan Round',
        format: 'stableford',
        holesPlayed: 18,
        groups: [{ name: 'Group 1', playerIds: ['p1'] }],
      })
    ).rejects.toThrow('group insert failed')

    expect(from).toHaveBeenCalledTimes(3)
    expect(deleteChain.delete).toHaveBeenCalled()
    expect(deleteChain.eq).toHaveBeenCalledWith('id', 'r1')
  })

  it('throws when the round insert fails', async () => {
    from.mockReturnValueOnce(
      query({ data: null, error: new Error('insert denied') })
    )
    await expect(
      createRound('t1', {
        courseId: 'c1',
        name: 'Nope',
        format: 'stableford',
        holesPlayed: 18,
        groups: [],
      })
    ).rejects.toThrow('insert denied')
  })
})

describe('updateGroups', () => {
  it('deletes existing groups then re-inserts the new ones', async () => {
    const deleteChain = query({ data: null, error: null })
    from
      .mockReturnValueOnce(deleteChain) // delete groups by round
      .mockReturnValueOnce(query({ data: { id: 'g1' }, error: null })) // group insert
      .mockReturnValueOnce(query({ data: null, error: null })) // group members insert

    await updateGroups('r1', [{ name: 'Group 1', playerIds: ['p1', 'p2'] }])

    expect(deleteChain.delete).toHaveBeenCalled()
    expect(deleteChain.eq).toHaveBeenCalledWith('round_id', 'r1')
    expect(from).toHaveBeenCalledTimes(3)
  })

  it('throws when the delete fails', async () => {
    from.mockReturnValueOnce(
      query({ data: null, error: new Error('delete failed') })
    )
    await expect(updateGroups('r1', [])).rejects.toThrow('delete failed')
  })
})

describe('setRoundStatus', () => {
  it('updates the round status', async () => {
    const chain = query({ data: null, error: null })
    from.mockReturnValue(chain)
    await setRoundStatus('r1', 'active')
    expect(chain.update).toHaveBeenCalledWith({ status: 'active' })
    expect(chain.eq).toHaveBeenCalledWith('id', 'r1')
  })

  it('throws when the update fails', async () => {
    from.mockReturnValue(query({ data: null, error: new Error('boom') }))
    await expect(setRoundStatus('r1', 'completed')).rejects.toThrow('boom')
  })
})

describe('removeRound', () => {
  it('soft-deletes the round and resets its status', async () => {
    const chain = query({ data: null, error: null })
    from.mockReturnValue(chain)
    await removeRound('r1')
    expect(chain.update).toHaveBeenCalledWith({
      deleted: true,
      status: 'upcoming',
    })
    expect(chain.eq).toHaveBeenCalledWith('id', 'r1')
  })

  it('throws when the update fails', async () => {
    from.mockReturnValue(query({ data: null, error: new Error('boom') }))
    await expect(removeRound('r1')).rejects.toThrow('boom')
  })
})

describe('restoreRound', () => {
  it('clears the deleted flag', async () => {
    const chain = query({ data: null, error: null })
    from.mockReturnValue(chain)
    await restoreRound('r1')
    expect(chain.update).toHaveBeenCalledWith({ deleted: false })
    expect(chain.eq).toHaveBeenCalledWith('id', 'r1')
  })

  it('throws when the update fails', async () => {
    from.mockReturnValue(query({ data: null, error: new Error('boom') }))
    await expect(restoreRound('r1')).rejects.toThrow('boom')
  })
})

describe('addTeamsToRound', () => {
  it('inserts teams and their members', async () => {
    from
      .mockReturnValueOnce(query({ data: { id: 'tm1' }, error: null })) // team insert
      .mockReturnValueOnce(query({ data: null, error: null })) // team members insert

    await addTeamsToRound('r1', [{ name: 'Team A', playerIds: ['p1', 'p2'] }])
    expect(from).toHaveBeenCalledTimes(2)
  })

  it('throws when the team insert fails', async () => {
    from.mockReturnValueOnce(
      query({ data: null, error: new Error('team insert failed') })
    )
    await expect(
      addTeamsToRound('r1', [{ name: 'Team A', playerIds: ['p1'] }])
    ).rejects.toThrow('team insert failed')
  })
})

describe('updateTeamName', () => {
  it('updates the team name', async () => {
    const chain = query({ data: null, error: null })
    from.mockReturnValue(chain)
    await updateTeamName('tm1', 'New Name')
    expect(chain.update).toHaveBeenCalledWith({ name: 'New Name' })
    expect(chain.eq).toHaveBeenCalledWith('id', 'tm1')
  })

  it('throws when the update fails', async () => {
    from.mockReturnValue(query({ data: null, error: new Error('boom') }))
    await expect(updateTeamName('tm1', 'x')).rejects.toThrow('boom')
  })
})

describe('removeTeam', () => {
  it('deletes the team by id', async () => {
    const chain = query({ data: null, error: null })
    from.mockReturnValue(chain)
    await removeTeam('tm1')
    expect(chain.delete).toHaveBeenCalled()
    expect(chain.eq).toHaveBeenCalledWith('id', 'tm1')
  })

  it('throws when the delete fails', async () => {
    from.mockReturnValue(query({ data: null, error: new Error('boom') }))
    await expect(removeTeam('tm1')).rejects.toThrow('boom')
  })
})

describe('removeTeamsByRound', () => {
  it('deletes all teams for a round', async () => {
    const chain = query({ data: null, error: null })
    from.mockReturnValue(chain)
    await removeTeamsByRound('r1')
    expect(chain.delete).toHaveBeenCalled()
    expect(chain.eq).toHaveBeenCalledWith('round_id', 'r1')
  })

  it('throws when the delete fails', async () => {
    from.mockReturnValue(query({ data: null, error: new Error('boom') }))
    await expect(removeTeamsByRound('r1')).rejects.toThrow('boom')
  })
})
