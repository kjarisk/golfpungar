/// <reference types="vitest/globals" />
import { categorizeBets } from './categorize-bets'
import type { Bet } from '../types'

function makeBet(overrides: Partial<Bet> & { id: string }): Bet {
  return {
    tournamentId: 'tournament-001',
    createdByPlayerId: 'player-001',
    scope: 'tournament',
    metricKey: 'most_points',
    amount: 10,
    status: 'pending',
    creatorPaidConfirmed: false,
    createdAt: '2026-06-01T10:00:00.000Z',
    ...overrides,
  }
}

describe('categorizeBets', () => {
  it('returns empty sections for empty input', () => {
    const result = categorizeBets([], undefined)
    expect(result.roundBets).toHaveLength(0)
    expect(result.tournamentBets).toHaveLength(0)
    expect(result.settledBets).toHaveLength(0)
  })

  it('puts won bets into settled', () => {
    const bets = [makeBet({ id: 'b1', status: 'won', winnerId: 'player-001' })]
    const result = categorizeBets(bets, 'round-001')
    expect(result.settledBets).toHaveLength(1)
    expect(result.roundBets).toHaveLength(0)
    expect(result.tournamentBets).toHaveLength(0)
  })

  it('puts lost bets into settled', () => {
    const bets = [makeBet({ id: 'b1', status: 'lost', winnerId: 'player-002' })]
    const result = categorizeBets(bets, 'round-001')
    expect(result.settledBets).toHaveLength(1)
  })

  it('puts paid bets into settled', () => {
    const bets = [makeBet({ id: 'b1', status: 'paid', winnerId: 'player-001' })]
    const result = categorizeBets(bets, 'round-001')
    expect(result.settledBets).toHaveLength(1)
  })

  it('puts rejected bets into settled', () => {
    const bets = [makeBet({ id: 'b1', status: 'rejected' })]
    const result = categorizeBets(bets, 'round-001')
    expect(result.settledBets).toHaveLength(1)
  })

  it('puts active-round bets into roundBets section', () => {
    const bets = [
      makeBet({
        id: 'b1',
        scope: 'round',
        roundId: 'round-001',
        status: 'pending',
      }),
      makeBet({
        id: 'b2',
        scope: 'round',
        roundId: 'round-001',
        status: 'accepted',
      }),
    ]
    const result = categorizeBets(bets, 'round-001')
    expect(result.roundBets).toHaveLength(2)
    expect(result.tournamentBets).toHaveLength(0)
    expect(result.settledBets).toHaveLength(0)
  })

  it('puts tournament-scoped bets into tournamentBets section', () => {
    const bets = [
      makeBet({ id: 'b1', scope: 'tournament', status: 'pending' }),
      makeBet({ id: 'b2', scope: 'tournament', status: 'accepted' }),
    ]
    const result = categorizeBets(bets, 'round-001')
    expect(result.tournamentBets).toHaveLength(2)
    expect(result.roundBets).toHaveLength(0)
  })

  it('puts round bets for non-active rounds into tournamentBets', () => {
    const bets = [
      makeBet({
        id: 'b1',
        scope: 'round',
        roundId: 'round-002',
        status: 'pending',
      }),
    ]
    const result = categorizeBets(bets, 'round-001')
    expect(result.tournamentBets).toHaveLength(1)
    expect(result.roundBets).toHaveLength(0)
  })

  it('puts round bets into tournamentBets when no active round', () => {
    const bets = [
      makeBet({
        id: 'b1',
        scope: 'round',
        roundId: 'round-001',
        status: 'pending',
      }),
    ]
    const result = categorizeBets(bets, undefined)
    expect(result.tournamentBets).toHaveLength(1)
    expect(result.roundBets).toHaveLength(0)
  })

  it('correctly categorizes a mix of bet types', () => {
    const bets = [
      // Active round bet (pending)
      makeBet({
        id: 'b1',
        scope: 'round',
        roundId: 'round-001',
        status: 'pending',
        createdAt: '2026-06-01T10:00:00.000Z',
      }),
      // Active round bet (accepted)
      makeBet({
        id: 'b2',
        scope: 'round',
        roundId: 'round-001',
        status: 'accepted',
        createdAt: '2026-06-01T11:00:00.000Z',
      }),
      // Tournament bet (pending)
      makeBet({
        id: 'b3',
        scope: 'tournament',
        status: 'pending',
        createdAt: '2026-06-01T09:00:00.000Z',
      }),
      // Round bet for different round (accepted)
      makeBet({
        id: 'b4',
        scope: 'round',
        roundId: 'round-002',
        status: 'accepted',
        createdAt: '2026-06-01T08:00:00.000Z',
      }),
      // Settled (won)
      makeBet({
        id: 'b5',
        status: 'won',
        winnerId: 'player-001',
        createdAt: '2026-06-01T07:00:00.000Z',
      }),
      // Settled (rejected)
      makeBet({
        id: 'b6',
        status: 'rejected',
        createdAt: '2026-06-01T06:00:00.000Z',
      }),
      // Active round bet but settled (won)
      makeBet({
        id: 'b7',
        scope: 'round',
        roundId: 'round-001',
        status: 'won',
        winnerId: 'player-002',
        createdAt: '2026-06-01T05:00:00.000Z',
      }),
    ]

    const result = categorizeBets(bets, 'round-001')

    expect(result.roundBets).toHaveLength(2)
    expect(result.roundBets.map((b) => b.id)).toEqual(['b2', 'b1']) // newest first

    expect(result.tournamentBets).toHaveLength(2)
    expect(result.tournamentBets.map((b) => b.id)).toEqual(['b3', 'b4']) // newest first

    expect(result.settledBets).toHaveLength(3)
    expect(result.settledBets.map((b) => b.id)).toEqual(['b5', 'b6', 'b7']) // newest first
  })

  it('sorts each section by createdAt descending', () => {
    const bets = [
      makeBet({
        id: 'old',
        scope: 'tournament',
        status: 'pending',
        createdAt: '2026-06-01T08:00:00.000Z',
      }),
      makeBet({
        id: 'new',
        scope: 'tournament',
        status: 'pending',
        createdAt: '2026-06-01T12:00:00.000Z',
      }),
      makeBet({
        id: 'mid',
        scope: 'tournament',
        status: 'pending',
        createdAt: '2026-06-01T10:00:00.000Z',
      }),
    ]
    const result = categorizeBets(bets, undefined)
    expect(result.tournamentBets.map((b) => b.id)).toEqual([
      'new',
      'mid',
      'old',
    ])
  })
})
