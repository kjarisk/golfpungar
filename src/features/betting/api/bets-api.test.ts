/// <reference types="vitest/globals" />

const { from } = vi.hoisted(() => ({ from: vi.fn() }))
vi.mock('@/lib/supabase', () => ({ supabase: { from } }))

const { emitFeedEvent } = vi.hoisted(() => ({ emitFeedEvent: vi.fn() }))
vi.mock('@/features/feed', () => ({ emitFeedEvent }))

const { getQueryData } = vi.hoisted(() => ({ getQueryData: vi.fn() }))
vi.mock('@/lib/query-client', () => ({
  queryClient: { getQueryData },
}))

vi.mock('@/features/players', () => ({
  playersQueryKey: ['players'] as const,
}))

import {
  acceptBet,
  confirmPaid,
  createBet,
  fetchBetParticipants,
  fetchBets,
  rejectBet,
  removeBet,
  resolveBet,
} from './bets-api'

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

const BET_ROW = {
  id: 'b1',
  tournament_id: 't1',
  created_by_player_id: 'p1',
  scope: 'tournament',
  metric_key: 'most_points',
  custom_description: null,
  round_id: null,
  amount: 10,
  status: 'pending',
  winner_id: null,
  creator_paid_confirmed: false,
  created_at: '2026-05-01T00:00:00Z',
}

const PARTICIPANT_ROW = {
  id: 'bp1',
  bet_id: 'b1',
  player_id: 'p2',
  accepted: null,
  paid_confirmed: false,
}

beforeEach(() => {
  from.mockReset()
  emitFeedEvent.mockReset()
  getQueryData.mockReset()
  getQueryData.mockReturnValue([
    { id: 'p1', displayName: 'Kjartan' },
    { id: 'p2', displayName: 'Magnus' },
    { id: 'p3', displayName: 'Helgi' },
  ])
})

// --- fetch ---

describe('fetchBets', () => {
  it('maps rows to Bet objects', async () => {
    from.mockReturnValue(query({ data: [BET_ROW], error: null }))
    const bets = await fetchBets()
    expect(bets).toEqual([
      {
        id: 'b1',
        tournamentId: 't1',
        createdByPlayerId: 'p1',
        scope: 'tournament',
        metricKey: 'most_points',
        customDescription: undefined,
        roundId: undefined,
        amount: 10,
        status: 'pending',
        winnerId: undefined,
        creatorPaidConfirmed: false,
        createdAt: '2026-05-01T00:00:00Z',
      },
    ])
  })

  it('throws when Supabase returns an error', async () => {
    from.mockReturnValue(query({ data: null, error: new Error('boom') }))
    await expect(fetchBets()).rejects.toThrow('boom')
  })
})

describe('fetchBetParticipants', () => {
  it('maps rows to BetParticipant objects', async () => {
    from.mockReturnValue(query({ data: [PARTICIPANT_ROW], error: null }))
    const ps = await fetchBetParticipants()
    expect(ps).toEqual([
      {
        id: 'bp1',
        betId: 'b1',
        playerId: 'p2',
        accepted: null,
        paidConfirmed: false,
      },
    ])
  })

  it('throws on error', async () => {
    from.mockReturnValue(query({ data: null, error: new Error('nope') }))
    await expect(fetchBetParticipants()).rejects.toThrow('nope')
  })
})

// --- createBet ---

describe('createBet', () => {
  it('inserts the bet and a participant per opponent', async () => {
    const betChain = query({ data: BET_ROW, error: null })
    const partChain = query({ data: null, error: null })
    from.mockReturnValueOnce(betChain) // bets insert
    from.mockReturnValueOnce(partChain) // bet_participants insert

    const bet = await createBet({
      tournamentId: 't1',
      createdByPlayerId: 'p1',
      scope: 'tournament',
      metricKey: 'most_points',
      amount: 10,
      opponentIds: ['p2', 'p3'],
    })

    expect(bet.id).toBe('b1')
    expect(from).toHaveBeenNthCalledWith(1, 'bets')
    expect(from).toHaveBeenNthCalledWith(2, 'bet_participants')
    // The participants insert should have been called with one row per opponent.
    expect(partChain.insert).toHaveBeenCalledWith([
      { bet_id: 'b1', player_id: 'p2', accepted: null, paid_confirmed: false },
      { bet_id: 'b1', player_id: 'p3', accepted: null, paid_confirmed: false },
    ])
    // Feed event emitted.
    expect(emitFeedEvent).toHaveBeenCalledTimes(1)
    expect(emitFeedEvent.mock.calls[0][0]).toMatchObject({
      tournamentId: 't1',
      type: 'bet',
      playerId: 'p1',
    })
  })

  it('compensating-deletes the bet when participant insert fails', async () => {
    const betChain = query({ data: BET_ROW, error: null }) // bets insert OK
    const partChain = query({
      data: null,
      error: new Error('participants boom'),
    })
    const delChain = query({ data: null, error: null }) // compensating delete
    from
      .mockReturnValueOnce(betChain)
      .mockReturnValueOnce(partChain)
      .mockReturnValueOnce(delChain)

    await expect(
      createBet({
        tournamentId: 't1',
        createdByPlayerId: 'p1',
        scope: 'tournament',
        metricKey: 'most_points',
        amount: 10,
        opponentIds: ['p2'],
      })
    ).rejects.toThrow('participants boom')

    expect(from).toHaveBeenNthCalledWith(3, 'bets') // delete on bets
    expect(delChain.delete).toHaveBeenCalled()
    expect(delChain.eq).toHaveBeenCalledWith('id', 'b1')
    // No feed event when the create failed.
    expect(emitFeedEvent).not.toHaveBeenCalled()
  })
})

// --- acceptBet ---

describe('acceptBet', () => {
  it('flips a participant to accepted and leaves the bet pending when others have not responded', async () => {
    const updateChain = query({ data: null, error: null })
    const fetchPartsChain = query({
      data: [{ accepted: true }, { accepted: null }],
      error: null,
    })
    const fetchBetChain = query({ data: BET_ROW, error: null })
    from
      .mockReturnValueOnce(updateChain) // participants update
      .mockReturnValueOnce(fetchPartsChain) // participants re-fetch
      .mockReturnValueOnce(fetchBetChain) // bet fetch

    await acceptBet({ betId: 'b1', playerId: 'p2' })

    // No status-update call to bets should have happened (only the one initial fetch).
    expect(from).toHaveBeenCalledTimes(3)
    expect(updateChain.update).toHaveBeenCalledWith({ accepted: true })
    expect(emitFeedEvent).toHaveBeenCalledTimes(1)
  })

  it('flips the bet to accepted when every participant has accepted', async () => {
    const updateChain = query({ data: null, error: null })
    const fetchPartsChain = query({
      data: [{ accepted: true }, { accepted: true }],
      error: null,
    })
    const fetchBetChain = query({ data: BET_ROW, error: null })
    const updateBetChain = query({ data: null, error: null })
    from
      .mockReturnValueOnce(updateChain)
      .mockReturnValueOnce(fetchPartsChain)
      .mockReturnValueOnce(fetchBetChain)
      .mockReturnValueOnce(updateBetChain)

    await acceptBet({ betId: 'b1', playerId: 'p3' })

    expect(from).toHaveBeenCalledTimes(4)
    expect(updateBetChain.update).toHaveBeenCalledWith({ status: 'accepted' })
  })
})

// --- rejectBet ---

describe('rejectBet', () => {
  it('flips participant to accepted=false AND sets bet status to rejected', async () => {
    const updatePartChain = query({ data: null, error: null })
    const updateBetChain = query({ data: null, error: null })
    const fetchBetChain = query({ data: BET_ROW, error: null })
    from
      .mockReturnValueOnce(updatePartChain)
      .mockReturnValueOnce(updateBetChain)
      .mockReturnValueOnce(fetchBetChain)

    await rejectBet({ betId: 'b1', playerId: 'p2' })

    expect(updatePartChain.update).toHaveBeenCalledWith({ accepted: false })
    expect(updateBetChain.update).toHaveBeenCalledWith({ status: 'rejected' })
    expect(emitFeedEvent).toHaveBeenCalledTimes(1)
  })
})

// --- resolveBet ---

describe('resolveBet', () => {
  it('marks the bet won when the creator wins', async () => {
    const fetchBetChain = query({ data: BET_ROW, error: null })
    const updateChain = query({ data: null, error: null })
    const partsChain = query({
      data: [{ player_id: 'p2' }],
      error: null,
    })
    from
      .mockReturnValueOnce(fetchBetChain)
      .mockReturnValueOnce(updateChain)
      .mockReturnValueOnce(partsChain)

    await resolveBet({ betId: 'b1', winnerId: 'p1' })

    expect(updateChain.update).toHaveBeenCalledWith({
      winner_id: 'p1',
      status: 'won',
    })
  })

  it('marks the bet lost when a participant wins', async () => {
    const fetchBetChain = query({ data: BET_ROW, error: null })
    const updateChain = query({ data: null, error: null })
    const partsChain = query({
      data: [{ player_id: 'p2' }],
      error: null,
    })
    from
      .mockReturnValueOnce(fetchBetChain)
      .mockReturnValueOnce(updateChain)
      .mockReturnValueOnce(partsChain)

    await resolveBet({ betId: 'b1', winnerId: 'p2' })

    expect(updateChain.update).toHaveBeenCalledWith({
      winner_id: 'p2',
      status: 'lost',
    })
  })
})

// --- confirmPaid ---

describe('confirmPaid', () => {
  it('flips creator_paid_confirmed when called by the creator', async () => {
    const fetchBetChain = query({
      data: { ...BET_ROW, status: 'won' },
      error: null,
    })
    const updateBetChain = query({ data: null, error: null })
    const afterBet = query({
      data: {
        creator_paid_confirmed: true,
        status: 'won',
        tournament_id: 't1',
        round_id: null,
      },
      error: null,
    })
    const afterParts = query({
      data: [{ paid_confirmed: false, player_id: 'p2' }],
      error: null,
    })
    from
      .mockReturnValueOnce(fetchBetChain) // initial fetch
      .mockReturnValueOnce(updateBetChain) // bets update creator_paid_confirmed
      .mockReturnValueOnce(afterBet) // re-read bet
      .mockReturnValueOnce(afterParts) // re-read participants

    await confirmPaid({ betId: 'b1', playerId: 'p1' })

    expect(updateBetChain.update).toHaveBeenCalledWith({
      creator_paid_confirmed: true,
    })
    // Bet did NOT transition to paid (participant hasn't confirmed)
    expect(emitFeedEvent).not.toHaveBeenCalled()
  })

  it('flips a participant `paid_confirmed` when called by a participant', async () => {
    const fetchBetChain = query({
      data: { ...BET_ROW, status: 'lost', creator_paid_confirmed: false },
      error: null,
    })
    const updatePartChain = query({ data: null, error: null })
    const afterBet = query({
      data: {
        creator_paid_confirmed: false,
        status: 'lost',
        tournament_id: 't1',
        round_id: null,
      },
      error: null,
    })
    const afterParts = query({
      data: [{ paid_confirmed: true, player_id: 'p2' }],
      error: null,
    })
    from
      .mockReturnValueOnce(fetchBetChain)
      .mockReturnValueOnce(updatePartChain)
      .mockReturnValueOnce(afterBet)
      .mockReturnValueOnce(afterParts)

    await confirmPaid({ betId: 'b1', playerId: 'p2' })

    expect(from).toHaveBeenNthCalledWith(2, 'bet_participants')
    expect(updatePartChain.update).toHaveBeenCalledWith({
      paid_confirmed: true,
    })
    expect(emitFeedEvent).not.toHaveBeenCalled()
  })

  it('transitions the bet to paid + emits feed event when everyone has confirmed', async () => {
    const fetchBetChain = query({
      data: { ...BET_ROW, status: 'won', creator_paid_confirmed: false },
      error: null,
    })
    const updateBetChain = query({ data: null, error: null })
    const afterBet = query({
      data: {
        creator_paid_confirmed: true,
        status: 'won',
        tournament_id: 't1',
        round_id: null,
      },
      error: null,
    })
    const afterParts = query({
      data: [{ paid_confirmed: true, player_id: 'p2' }],
      error: null,
    })
    const flipPaidChain = query({ data: null, error: null })
    const pIdsChain = query({
      data: [{ player_id: 'p2' }],
      error: null,
    })
    from
      .mockReturnValueOnce(fetchBetChain)
      .mockReturnValueOnce(updateBetChain)
      .mockReturnValueOnce(afterBet)
      .mockReturnValueOnce(afterParts)
      .mockReturnValueOnce(flipPaidChain)
      .mockReturnValueOnce(pIdsChain)

    await confirmPaid({ betId: 'b1', playerId: 'p1' })

    expect(flipPaidChain.update).toHaveBeenCalledWith({ status: 'paid' })
    expect(emitFeedEvent).toHaveBeenCalledTimes(1)
    expect(emitFeedEvent.mock.calls[0][0]).toMatchObject({
      tournamentId: 't1',
      type: 'bet',
    })
    expect(emitFeedEvent.mock.calls[0][0].message).toMatch(/Bet paid/)
  })
})

// --- removeBet ---

describe('removeBet', () => {
  it('admin can delete any bet without a guard fetch', async () => {
    const delChain = query({ data: null, error: null })
    from.mockReturnValueOnce(delChain)

    await removeBet({ id: 'b1', callerPlayerId: 'p9', isAdmin: true })

    expect(from).toHaveBeenCalledTimes(1)
    expect(delChain.delete).toHaveBeenCalled()
  })

  it('non-admin creator can delete a pending bet', async () => {
    const guardChain = query({
      data: { created_by_player_id: 'p1', status: 'pending' },
      error: null,
    })
    const delChain = query({ data: null, error: null })
    from.mockReturnValueOnce(guardChain).mockReturnValueOnce(delChain)

    await removeBet({ id: 'b1', callerPlayerId: 'p1', isAdmin: false })

    expect(delChain.delete).toHaveBeenCalled()
  })

  it('non-admin non-creator is rejected', async () => {
    const guardChain = query({
      data: { created_by_player_id: 'p1', status: 'pending' },
      error: null,
    })
    from.mockReturnValueOnce(guardChain)

    await expect(
      removeBet({ id: 'b1', callerPlayerId: 'p2', isAdmin: false })
    ).rejects.toThrow(/creator/i)
  })

  it('non-admin creator is rejected on an accepted bet', async () => {
    const guardChain = query({
      data: { created_by_player_id: 'p1', status: 'accepted' },
      error: null,
    })
    from.mockReturnValueOnce(guardChain)

    await expect(
      removeBet({ id: 'b1', callerPlayerId: 'p1', isAdmin: false })
    ).rejects.toThrow(/pending or rejected/i)
  })

  it('non-admin creator can delete a rejected bet', async () => {
    const guardChain = query({
      data: { created_by_player_id: 'p1', status: 'rejected' },
      error: null,
    })
    const delChain = query({ data: null, error: null })
    from.mockReturnValueOnce(guardChain).mockReturnValueOnce(delChain)

    await removeBet({ id: 'b1', callerPlayerId: 'p1', isAdmin: false })

    expect(delChain.delete).toHaveBeenCalled()
  })
})
