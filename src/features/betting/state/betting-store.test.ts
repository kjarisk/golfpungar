/// <reference types="vitest/globals" />
import { useBettingStore } from './betting-store'

const T1 = 'tournament-001'
const P1 = 'player-001'
const P2 = 'player-002'
const P3 = 'player-003'
const P4 = 'player-004'
const R1 = 'round-001'

describe('Betting Store', () => {
  beforeEach(() => {
    useBettingStore.setState({ bets: [], participants: [] })
  })

  // --- createBet ---

  it('creates a bet and returns it', () => {
    const bet = useBettingStore.getState().createBet({
      tournamentId: T1,
      createdByPlayerId: P1,
      scope: 'tournament',
      metricKey: 'most_points',
      amount: 10,
      opponentIds: [P2],
    })

    expect(bet.id).toMatch(/^bet-/)
    expect(bet.tournamentId).toBe(T1)
    expect(bet.createdByPlayerId).toBe(P1)
    expect(bet.scope).toBe('tournament')
    expect(bet.metricKey).toBe('most_points')
    expect(bet.amount).toBe(10)
    expect(bet.status).toBe('pending')
    expect(bet.createdAt).toBeTruthy()

    expect(useBettingStore.getState().bets).toHaveLength(1)
  })

  it('creates participants for the opponent(s)', () => {
    useBettingStore.getState().createBet({
      tournamentId: T1,
      createdByPlayerId: P1,
      scope: 'tournament',
      metricKey: 'head_to_head',
      amount: 5,
      opponentIds: [P2, P3],
    })

    const participants = useBettingStore.getState().participants
    expect(participants).toHaveLength(2)
    expect(participants[0].playerId).toBe(P2)
    expect(participants[1].playerId).toBe(P3)
    expect(participants.every((p) => p.accepted === null)).toBe(true)
  })

  it('creates a round-scoped bet with roundId', () => {
    const bet = useBettingStore.getState().createBet({
      tournamentId: T1,
      createdByPlayerId: P1,
      scope: 'round',
      metricKey: 'most_birdies',
      roundId: R1,
      amount: 20,
      opponentIds: [P2],
    })

    expect(bet.scope).toBe('round')
    expect(bet.roundId).toBe(R1)
  })

  it('creates a custom bet with description', () => {
    const bet = useBettingStore.getState().createBet({
      tournamentId: T1,
      createdByPlayerId: P1,
      scope: 'tournament',
      metricKey: 'custom',
      customDescription: 'Fewest putts overall',
      amount: 15,
      opponentIds: [P2],
    })

    expect(bet.metricKey).toBe('custom')
    expect(bet.customDescription).toBe('Fewest putts overall')
  })

  it('assigns unique ids to multiple bets', () => {
    const { createBet } = useBettingStore.getState()
    const b1 = createBet({
      tournamentId: T1,
      createdByPlayerId: P1,
      scope: 'tournament',
      metricKey: 'most_points',
      amount: 5,
      opponentIds: [P2],
    })
    const b2 = createBet({
      tournamentId: T1,
      createdByPlayerId: P3,
      scope: 'tournament',
      metricKey: 'most_birdies',
      amount: 10,
      opponentIds: [P4],
    })

    expect(b1.id).not.toBe(b2.id)
    expect(useBettingStore.getState().bets).toHaveLength(2)
  })

  // --- acceptBet ---

  it('accepts a bet when single opponent accepts', () => {
    const bet = useBettingStore.getState().createBet({
      tournamentId: T1,
      createdByPlayerId: P1,
      scope: 'tournament',
      metricKey: 'head_to_head',
      amount: 10,
      opponentIds: [P2],
    })

    useBettingStore.getState().acceptBet(bet.id, P2)

    const updatedBet = useBettingStore.getState().getBetById(bet.id)
    expect(updatedBet?.status).toBe('accepted')

    const participants = useBettingStore
      .getState()
      .getParticipantsForBet(bet.id)
    expect(participants[0].accepted).toBe(true)
  })

  it('stays pending until all opponents accept (multi-opponent)', () => {
    const bet = useBettingStore.getState().createBet({
      tournamentId: T1,
      createdByPlayerId: P1,
      scope: 'tournament',
      metricKey: 'most_points',
      amount: 10,
      opponentIds: [P2, P3],
    })

    // Only P2 accepts
    useBettingStore.getState().acceptBet(bet.id, P2)

    const betAfterOne = useBettingStore.getState().getBetById(bet.id)
    expect(betAfterOne?.status).toBe('pending')

    // P3 accepts too — now all accepted
    useBettingStore.getState().acceptBet(bet.id, P3)

    const betAfterAll = useBettingStore.getState().getBetById(bet.id)
    expect(betAfterAll?.status).toBe('accepted')
  })

  // --- rejectBet ---

  it('rejects a bet', () => {
    const bet = useBettingStore.getState().createBet({
      tournamentId: T1,
      createdByPlayerId: P1,
      scope: 'tournament',
      metricKey: 'head_to_head',
      amount: 10,
      opponentIds: [P2],
    })

    useBettingStore.getState().rejectBet(bet.id, P2)

    const updatedBet = useBettingStore.getState().getBetById(bet.id)
    expect(updatedBet?.status).toBe('rejected')

    const participants = useBettingStore
      .getState()
      .getParticipantsForBet(bet.id)
    expect(participants[0].accepted).toBe(false)
  })

  // --- resolveBet ---

  it('resolves a bet with a winner (creator wins)', () => {
    const bet = useBettingStore.getState().createBet({
      tournamentId: T1,
      createdByPlayerId: P1,
      scope: 'tournament',
      metricKey: 'most_points',
      amount: 10,
      opponentIds: [P2],
    })

    useBettingStore.getState().acceptBet(bet.id, P2)
    useBettingStore.getState().resolveBet(bet.id, P1)

    const resolved = useBettingStore.getState().getBetById(bet.id)
    expect(resolved?.status).toBe('won')
    expect(resolved?.winnerId).toBe(P1)
  })

  it('resolves a bet with a winner (opponent wins)', () => {
    const bet = useBettingStore.getState().createBet({
      tournamentId: T1,
      createdByPlayerId: P1,
      scope: 'tournament',
      metricKey: 'head_to_head',
      amount: 10,
      opponentIds: [P2],
    })

    useBettingStore.getState().acceptBet(bet.id, P2)
    useBettingStore.getState().resolveBet(bet.id, P2)

    const resolved = useBettingStore.getState().getBetById(bet.id)
    expect(resolved?.status).toBe('lost')
    expect(resolved?.winnerId).toBe(P2)
  })

  // --- removeBet ---

  it('removes a pending bet when called by creator', () => {
    const bet = useBettingStore.getState().createBet({
      tournamentId: T1,
      createdByPlayerId: P1,
      scope: 'tournament',
      metricKey: 'most_points',
      amount: 10,
      opponentIds: [P2, P3],
    })

    expect(useBettingStore.getState().bets).toHaveLength(1)
    expect(useBettingStore.getState().participants).toHaveLength(2)

    const result = useBettingStore.getState().removeBet(bet.id, P1, false)

    expect(result).toBe(true)
    expect(useBettingStore.getState().bets).toHaveLength(0)
    expect(useBettingStore.getState().participants).toHaveLength(0)
  })

  it('returns false when removing a non-existent bet', () => {
    useBettingStore.getState().createBet({
      tournamentId: T1,
      createdByPlayerId: P1,
      scope: 'tournament',
      metricKey: 'most_points',
      amount: 5,
      opponentIds: [P2],
    })

    const result = useBettingStore
      .getState()
      .removeBet('does-not-exist', P1, false)

    expect(result).toBe(false)
    expect(useBettingStore.getState().bets).toHaveLength(1)
    expect(useBettingStore.getState().participants).toHaveLength(1)
  })

  it('blocks non-creator from removing a bet', () => {
    const bet = useBettingStore.getState().createBet({
      tournamentId: T1,
      createdByPlayerId: P1,
      scope: 'tournament',
      metricKey: 'most_points',
      amount: 10,
      opponentIds: [P2],
    })

    const result = useBettingStore.getState().removeBet(bet.id, P2, false)

    expect(result).toBe(false)
    expect(useBettingStore.getState().bets).toHaveLength(1)
  })

  it('blocks creator from removing an accepted bet', () => {
    const bet = useBettingStore.getState().createBet({
      tournamentId: T1,
      createdByPlayerId: P1,
      scope: 'tournament',
      metricKey: 'most_points',
      amount: 10,
      opponentIds: [P2],
    })
    useBettingStore.getState().acceptBet(bet.id, P2)

    const result = useBettingStore.getState().removeBet(bet.id, P1, false)

    expect(result).toBe(false)
    expect(useBettingStore.getState().bets).toHaveLength(1)
  })

  it('allows creator to remove a rejected bet', () => {
    const bet = useBettingStore.getState().createBet({
      tournamentId: T1,
      createdByPlayerId: P1,
      scope: 'tournament',
      metricKey: 'most_points',
      amount: 10,
      opponentIds: [P2],
    })
    useBettingStore.getState().rejectBet(bet.id, P2)

    const result = useBettingStore.getState().removeBet(bet.id, P1, false)

    expect(result).toBe(true)
    expect(useBettingStore.getState().bets).toHaveLength(0)
  })

  it('allows admin to remove any bet regardless of status', () => {
    const bet = useBettingStore.getState().createBet({
      tournamentId: T1,
      createdByPlayerId: P1,
      scope: 'tournament',
      metricKey: 'most_points',
      amount: 10,
      opponentIds: [P2],
    })
    useBettingStore.getState().acceptBet(bet.id, P2)

    // Admin (P3 is neither creator nor participant, but is admin)
    const result = useBettingStore.getState().removeBet(bet.id, P3, true)

    expect(result).toBe(true)
    expect(useBettingStore.getState().bets).toHaveLength(0)
  })

  // --- Query: getBetsByTournament ---

  it('filters bets by tournament', () => {
    const { createBet } = useBettingStore.getState()
    createBet({
      tournamentId: T1,
      createdByPlayerId: P1,
      scope: 'tournament',
      metricKey: 'most_points',
      amount: 5,
      opponentIds: [P2],
    })
    createBet({
      tournamentId: 'tournament-002',
      createdByPlayerId: P3,
      scope: 'tournament',
      metricKey: 'most_birdies',
      amount: 10,
      opponentIds: [P4],
    })

    const bets = useBettingStore.getState().getBetsByTournament(T1)
    expect(bets).toHaveLength(1)
    expect(bets[0].tournamentId).toBe(T1)
  })

  // --- Query: getBetsByStatus ---

  it('filters bets by status', () => {
    const { createBet } = useBettingStore.getState()
    const b1 = createBet({
      tournamentId: T1,
      createdByPlayerId: P1,
      scope: 'tournament',
      metricKey: 'most_points',
      amount: 5,
      opponentIds: [P2],
    })
    createBet({
      tournamentId: T1,
      createdByPlayerId: P3,
      scope: 'tournament',
      metricKey: 'most_birdies',
      amount: 10,
      opponentIds: [P4],
    })

    // Accept only the first bet
    useBettingStore.getState().acceptBet(b1.id, P2)

    const pending = useBettingStore.getState().getBetsByStatus(T1, 'pending')
    expect(pending).toHaveLength(1)

    const accepted = useBettingStore.getState().getBetsByStatus(T1, 'accepted')
    expect(accepted).toHaveLength(1)
    expect(accepted[0].id).toBe(b1.id)
  })

  // --- Query: getBetsForPlayer ---

  it('returns bets where player is creator or participant', () => {
    const { createBet } = useBettingStore.getState()
    // P1 creates a bet against P2
    createBet({
      tournamentId: T1,
      createdByPlayerId: P1,
      scope: 'tournament',
      metricKey: 'most_points',
      amount: 5,
      opponentIds: [P2],
    })
    // P3 creates a bet against P1
    createBet({
      tournamentId: T1,
      createdByPlayerId: P3,
      scope: 'tournament',
      metricKey: 'most_birdies',
      amount: 10,
      opponentIds: [P1],
    })
    // P3 creates a bet against P4 (P1 not involved)
    createBet({
      tournamentId: T1,
      createdByPlayerId: P3,
      scope: 'tournament',
      metricKey: 'head_to_head',
      amount: 15,
      opponentIds: [P4],
    })

    const p1Bets = useBettingStore.getState().getBetsForPlayer(T1, P1)
    expect(p1Bets).toHaveLength(2) // creator of 1st, participant in 2nd
  })

  // --- Aggregation: getTotalsForTournament ---

  it('calculates betting totals per player', () => {
    const { createBet } = useBettingStore.getState()

    // P1 bets 10 against P2 — accepted
    const b1 = createBet({
      tournamentId: T1,
      createdByPlayerId: P1,
      scope: 'tournament',
      metricKey: 'most_points',
      amount: 10,
      opponentIds: [P2],
    })
    useBettingStore.getState().acceptBet(b1.id, P2)

    // P1 bets 5 against P3 — accepted, P1 wins
    const b2 = createBet({
      tournamentId: T1,
      createdByPlayerId: P1,
      scope: 'tournament',
      metricKey: 'head_to_head',
      amount: 5,
      opponentIds: [P3],
    })
    useBettingStore.getState().acceptBet(b2.id, P3)
    useBettingStore.getState().resolveBet(b2.id, P1)

    const totals = useBettingStore
      .getState()
      .getTotalsForTournament(T1, [P1, P2, P3, P4])

    const p1 = totals.find((t) => t.playerId === P1)!
    expect(p1.totalWagered).toBe(15) // 10 + 5
    expect(p1.betCount).toBe(2)
    expect(p1.betsWon).toBe(1)
    expect(p1.betsLost).toBe(0)

    const p2 = totals.find((t) => t.playerId === P2)!
    expect(p2.totalWagered).toBe(10) // participant in b1
    expect(p2.betCount).toBe(1)

    const p3 = totals.find((t) => t.playerId === P3)!
    expect(p3.totalWagered).toBe(5) // participant in b2
    expect(p3.betsLost).toBe(1)

    const p4 = totals.find((t) => t.playerId === P4)!
    expect(p4.totalWagered).toBe(0)
    expect(p4.betCount).toBe(0)
  })

  it('does not count pending bets in totalWagered', () => {
    useBettingStore.getState().createBet({
      tournamentId: T1,
      createdByPlayerId: P1,
      scope: 'tournament',
      metricKey: 'most_points',
      amount: 100,
      opponentIds: [P2],
    })
    // Bet stays pending (P2 hasn't accepted)

    const totals = useBettingStore
      .getState()
      .getTotalsForTournament(T1, [P1, P2])

    const p1 = totals.find((t) => t.playerId === P1)!
    expect(p1.totalWagered).toBe(0) // pending, not counted
    expect(p1.betCount).toBe(1) // but still shows in betCount
  })

  // --- Aggregation: getBiggestBettor ---

  it('returns the biggest bettor', () => {
    const { createBet } = useBettingStore.getState()

    const b1 = createBet({
      tournamentId: T1,
      createdByPlayerId: P1,
      scope: 'tournament',
      metricKey: 'most_points',
      amount: 10,
      opponentIds: [P2],
    })
    useBettingStore.getState().acceptBet(b1.id, P2)

    const b2 = createBet({
      tournamentId: T1,
      createdByPlayerId: P3,
      scope: 'tournament',
      metricKey: 'head_to_head',
      amount: 50,
      opponentIds: [P4],
    })
    useBettingStore.getState().acceptBet(b2.id, P4)

    const biggest = useBettingStore
      .getState()
      .getBiggestBettor(T1, [P1, P2, P3, P4])

    expect(biggest).not.toBeNull()
    expect(biggest!.playerId).toBe(P3)
    expect(biggest!.totalWagered).toBe(50)
  })

  it('returns null when no bets have been wagered', () => {
    const biggest = useBettingStore.getState().getBiggestBettor(T1, [P1, P2])

    expect(biggest).toBeNull()
  })

  it('returns null when all bets are pending (0 wagered)', () => {
    useBettingStore.getState().createBet({
      tournamentId: T1,
      createdByPlayerId: P1,
      scope: 'tournament',
      metricKey: 'most_points',
      amount: 100,
      opponentIds: [P2],
    })

    const biggest = useBettingStore.getState().getBiggestBettor(T1, [P1, P2])

    expect(biggest).toBeNull()
  })

  // --- Query: getBetById ---

  it('returns undefined for unknown bet id', () => {
    const bet = useBettingStore.getState().getBetById('nope')
    expect(bet).toBeUndefined()
  })

  // --- Query: getParticipantsForBet ---

  it('returns empty array for unknown bet id', () => {
    const participants = useBettingStore
      .getState()
      .getParticipantsForBet('nope')
    expect(participants).toHaveLength(0)
  })

  // --- Paid confirmation ---

  it('initializes creatorPaidConfirmed to false on new bets', () => {
    const bet = useBettingStore.getState().createBet({
      tournamentId: T1,
      createdByPlayerId: P1,
      scope: 'tournament',
      metricKey: 'most_points',
      amount: 10,
      opponentIds: [P2],
    })

    expect(bet.creatorPaidConfirmed).toBe(false)
  })

  it('initializes paidConfirmed to false on new participants', () => {
    useBettingStore.getState().createBet({
      tournamentId: T1,
      createdByPlayerId: P1,
      scope: 'tournament',
      metricKey: 'most_points',
      amount: 10,
      opponentIds: [P2, P3],
    })

    const participants = useBettingStore.getState().participants
    expect(participants.every((p) => p.paidConfirmed === false)).toBe(true)
  })

  it('confirmPaid sets creatorPaidConfirmed for the creator', () => {
    const bet = useBettingStore.getState().createBet({
      tournamentId: T1,
      createdByPlayerId: P1,
      scope: 'tournament',
      metricKey: 'head_to_head',
      amount: 10,
      opponentIds: [P2],
    })
    useBettingStore.getState().acceptBet(bet.id, P2)
    useBettingStore.getState().resolveBet(bet.id, P1)

    useBettingStore.getState().confirmPaid(bet.id, P1)

    const updated = useBettingStore.getState().getBetById(bet.id)
    expect(updated?.creatorPaidConfirmed).toBe(true)
    // Bet should NOT be 'paid' yet — opponent hasn't confirmed
    expect(updated?.status).toBe('won')
  })

  it('confirmPaid sets paidConfirmed for a participant', () => {
    const bet = useBettingStore.getState().createBet({
      tournamentId: T1,
      createdByPlayerId: P1,
      scope: 'tournament',
      metricKey: 'head_to_head',
      amount: 10,
      opponentIds: [P2],
    })
    useBettingStore.getState().acceptBet(bet.id, P2)
    useBettingStore.getState().resolveBet(bet.id, P2)

    useBettingStore.getState().confirmPaid(bet.id, P2)

    const participants = useBettingStore
      .getState()
      .getParticipantsForBet(bet.id)
    expect(participants[0].paidConfirmed).toBe(true)
    // Bet should NOT be 'paid' yet — creator hasn't confirmed
    expect(useBettingStore.getState().getBetById(bet.id)?.status).toBe('lost')
  })

  it('moves bet to paid when ALL parties confirm', () => {
    const bet = useBettingStore.getState().createBet({
      tournamentId: T1,
      createdByPlayerId: P1,
      scope: 'tournament',
      metricKey: 'head_to_head',
      amount: 10,
      opponentIds: [P2],
    })
    useBettingStore.getState().acceptBet(bet.id, P2)
    useBettingStore.getState().resolveBet(bet.id, P1)

    // Both confirm
    useBettingStore.getState().confirmPaid(bet.id, P1)
    useBettingStore.getState().confirmPaid(bet.id, P2)

    const updated = useBettingStore.getState().getBetById(bet.id)
    expect(updated?.status).toBe('paid')
  })

  it('moves multi-opponent bet to paid only when all confirm', () => {
    const bet = useBettingStore.getState().createBet({
      tournamentId: T1,
      createdByPlayerId: P1,
      scope: 'tournament',
      metricKey: 'most_points',
      amount: 10,
      opponentIds: [P2, P3],
    })
    useBettingStore.getState().acceptBet(bet.id, P2)
    useBettingStore.getState().acceptBet(bet.id, P3)
    useBettingStore.getState().resolveBet(bet.id, P2)

    // Creator and P2 confirm, but P3 hasn't
    useBettingStore.getState().confirmPaid(bet.id, P1)
    useBettingStore.getState().confirmPaid(bet.id, P2)
    expect(useBettingStore.getState().getBetById(bet.id)?.status).toBe('lost')

    // P3 confirms — now all paid
    useBettingStore.getState().confirmPaid(bet.id, P3)
    expect(useBettingStore.getState().getBetById(bet.id)?.status).toBe('paid')
  })

  it('does nothing when confirming paid on a non-resolved bet', () => {
    const bet = useBettingStore.getState().createBet({
      tournamentId: T1,
      createdByPlayerId: P1,
      scope: 'tournament',
      metricKey: 'head_to_head',
      amount: 10,
      opponentIds: [P2],
    })
    useBettingStore.getState().acceptBet(bet.id, P2)

    // Bet is 'accepted', not 'won'/'lost'
    useBettingStore.getState().confirmPaid(bet.id, P1)

    const updated = useBettingStore.getState().getBetById(bet.id)
    expect(updated?.status).toBe('accepted')
    expect(updated?.creatorPaidConfirmed).toBe(false)
  })

  it('counts paid bets in totalWagered and betsWon/betsLost', () => {
    const bet = useBettingStore.getState().createBet({
      tournamentId: T1,
      createdByPlayerId: P1,
      scope: 'tournament',
      metricKey: 'head_to_head',
      amount: 25,
      opponentIds: [P2],
    })
    useBettingStore.getState().acceptBet(bet.id, P2)
    useBettingStore.getState().resolveBet(bet.id, P1)
    useBettingStore.getState().confirmPaid(bet.id, P1)
    useBettingStore.getState().confirmPaid(bet.id, P2)

    // Bet should now be 'paid'
    expect(useBettingStore.getState().getBetById(bet.id)?.status).toBe('paid')

    const totals = useBettingStore
      .getState()
      .getTotalsForTournament(T1, [P1, P2])

    const p1 = totals.find((t) => t.playerId === P1)!
    expect(p1.totalWagered).toBe(25)
    expect(p1.betsWon).toBe(1)

    const p2 = totals.find((t) => t.playerId === P2)!
    expect(p2.totalWagered).toBe(25)
    expect(p2.betsLost).toBe(1)
  })
})
