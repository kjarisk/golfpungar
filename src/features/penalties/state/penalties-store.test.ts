/// <reference types="vitest/globals" />
import { usePenaltiesStore } from './penalties-store'

const T1 = 'tournament-001'
const P1 = 'player-001'
const P2 = 'player-002'
const P3 = 'player-003'
const R1 = 'round-001'
const R2 = 'round-002'

describe('Penalties Store', () => {
  beforeEach(() => {
    usePenaltiesStore.setState({ entries: [] })
  })

  // --- addPenalty ---

  it('adds a penalty and returns the created entry', () => {
    const entry = usePenaltiesStore.getState().addPenalty({
      tournamentId: T1,
      playerId: P1,
      amount: 5,
      note: 'Late to tee',
    })

    expect(entry.id).toMatch(/^penalty-/)
    expect(entry.tournamentId).toBe(T1)
    expect(entry.playerId).toBe(P1)
    expect(entry.kind).toBe('penalty')
    expect(entry.amount).toBe(5)
    expect(entry.note).toBe('Late to tee')
    expect(entry.roundId).toBeUndefined()
    expect(entry.createdAt).toBeTruthy()

    expect(usePenaltiesStore.getState().entries).toHaveLength(1)
  })

  it('adds a penalty with a roundId', () => {
    const entry = usePenaltiesStore.getState().addPenalty({
      tournamentId: T1,
      playerId: P2,
      amount: 3,
      note: 'Slow play',
      roundId: R1,
    })

    expect(entry.roundId).toBe(R1)
  })

  it('assigns unique ids to multiple penalties', () => {
    const { addPenalty } = usePenaltiesStore.getState()
    const e1 = addPenalty({
      tournamentId: T1,
      playerId: P1,
      amount: 1,
      note: 'A',
    })
    const e2 = addPenalty({
      tournamentId: T1,
      playerId: P2,
      amount: 2,
      note: 'B',
    })

    expect(e1.id).not.toBe(e2.id)
    expect(usePenaltiesStore.getState().entries).toHaveLength(2)
  })

  // --- removePenalty ---

  it('removes a penalty by id', () => {
    const entry = usePenaltiesStore.getState().addPenalty({
      tournamentId: T1,
      playerId: P1,
      amount: 5,
      note: 'Removed later',
    })

    expect(usePenaltiesStore.getState().entries).toHaveLength(1)

    usePenaltiesStore.getState().removePenalty(entry.id)

    expect(usePenaltiesStore.getState().entries).toHaveLength(0)
  })

  it('does nothing when removing a non-existent id', () => {
    usePenaltiesStore.getState().addPenalty({
      tournamentId: T1,
      playerId: P1,
      amount: 1,
      note: 'Keep',
    })

    usePenaltiesStore.getState().removePenalty('does-not-exist')

    expect(usePenaltiesStore.getState().entries).toHaveLength(1)
  })

  // --- getEntriesByTournament ---

  it('filters entries by tournament', () => {
    const { addPenalty } = usePenaltiesStore.getState()
    addPenalty({ tournamentId: T1, playerId: P1, amount: 1, note: 'A' })
    addPenalty({
      tournamentId: 'tournament-002',
      playerId: P2,
      amount: 2,
      note: 'B',
    })
    addPenalty({ tournamentId: T1, playerId: P3, amount: 3, note: 'C' })

    const entries = usePenaltiesStore.getState().getEntriesByTournament(T1)
    expect(entries).toHaveLength(2)
    expect(entries.every((e) => e.tournamentId === T1)).toBe(true)
  })

  it('returns empty array for unknown tournament', () => {
    const entries = usePenaltiesStore.getState().getEntriesByTournament('nope')
    expect(entries).toHaveLength(0)
  })

  // --- getEntriesByPlayer ---

  it('filters entries by tournament and player', () => {
    const { addPenalty } = usePenaltiesStore.getState()
    addPenalty({ tournamentId: T1, playerId: P1, amount: 1, note: 'X' })
    addPenalty({ tournamentId: T1, playerId: P2, amount: 2, note: 'Y' })
    addPenalty({ tournamentId: T1, playerId: P1, amount: 3, note: 'Z' })

    const entries = usePenaltiesStore.getState().getEntriesByPlayer(T1, P1)
    expect(entries).toHaveLength(2)
    expect(entries.every((e) => e.playerId === P1)).toBe(true)
  })

  // --- getEntriesByRound ---

  it('filters entries by tournament and round', () => {
    const { addPenalty } = usePenaltiesStore.getState()
    addPenalty({
      tournamentId: T1,
      playerId: P1,
      amount: 1,
      note: 'A',
      roundId: R1,
    })
    addPenalty({
      tournamentId: T1,
      playerId: P2,
      amount: 2,
      note: 'B',
      roundId: R2,
    })
    addPenalty({
      tournamentId: T1,
      playerId: P3,
      amount: 3,
      note: 'C',
      roundId: R1,
    })

    const entries = usePenaltiesStore.getState().getEntriesByRound(T1, R1)
    expect(entries).toHaveLength(2)
    expect(entries.every((e) => e.roundId === R1)).toBe(true)
  })

  // --- getTotalsForTournament ---

  it('calculates totals per player', () => {
    const { addPenalty } = usePenaltiesStore.getState()
    addPenalty({ tournamentId: T1, playerId: P1, amount: 5, note: 'A' })
    addPenalty({ tournamentId: T1, playerId: P1, amount: 3, note: 'B' })
    addPenalty({ tournamentId: T1, playerId: P2, amount: 10, note: 'C' })

    const totals = usePenaltiesStore
      .getState()
      .getTotalsForTournament(T1, [P1, P2, P3])

    expect(totals).toHaveLength(3)

    const p1 = totals.find((t) => t.playerId === P1)!
    expect(p1.totalAmount).toBe(8)
    expect(p1.entryCount).toBe(2)

    const p2 = totals.find((t) => t.playerId === P2)!
    expect(p2.totalAmount).toBe(10)
    expect(p2.entryCount).toBe(1)

    const p3 = totals.find((t) => t.playerId === P3)!
    expect(p3.totalAmount).toBe(0)
    expect(p3.entryCount).toBe(0)
  })

  it('returns zero totals when no penalties exist', () => {
    const totals = usePenaltiesStore
      .getState()
      .getTotalsForTournament(T1, [P1, P2])

    expect(totals).toHaveLength(2)
    expect(totals.every((t) => t.totalAmount === 0 && t.entryCount === 0)).toBe(
      true
    )
  })

  // --- getPenaltyKing ---

  it('returns the player with the highest total penalty amount', () => {
    const { addPenalty } = usePenaltiesStore.getState()
    addPenalty({ tournamentId: T1, playerId: P1, amount: 2, note: 'A' })
    addPenalty({ tournamentId: T1, playerId: P1, amount: 3, note: 'B' })
    addPenalty({ tournamentId: T1, playerId: P2, amount: 4, note: 'C' })

    const king = usePenaltiesStore.getState().getPenaltyKing(T1, [P1, P2, P3])

    expect(king).not.toBeNull()
    expect(king!.playerId).toBe(P1)
    expect(king!.totalAmount).toBe(5)
  })

  it('returns null when no penalties exist', () => {
    const king = usePenaltiesStore.getState().getPenaltyKing(T1, [P1, P2])
    expect(king).toBeNull()
  })

  it('returns first max on tie (deterministic reduce behavior)', () => {
    const { addPenalty } = usePenaltiesStore.getState()
    addPenalty({ tournamentId: T1, playerId: P1, amount: 5, note: 'X' })
    addPenalty({ tournamentId: T1, playerId: P2, amount: 5, note: 'Y' })

    const king = usePenaltiesStore.getState().getPenaltyKing(T1, [P1, P2])

    // On tie, reduce keeps the first accumulator (P1 is first in playerIds)
    expect(king).not.toBeNull()
    expect(king!.totalAmount).toBe(5)
  })
})
