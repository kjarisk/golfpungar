import { describe, it, expect } from 'vitest'
import type { SideEventLog } from '../types'
import { deriveLastSnakeInGroup } from './side-events-logic'

// --- Helpers ---

function makeEvent(
  overrides: Partial<SideEventLog> & Pick<SideEventLog, 'playerId' | 'type'>
): SideEventLog {
  return {
    id: `evt-${Math.random().toString(36).slice(2, 6)}`,
    tournamentId: 'tourn-1',
    createdAt: new Date().toISOString(),
    createdByPlayerId: overrides.playerId,
    ...overrides,
  }
}

// --- deriveLastSnakeInGroup ---

describe('deriveLastSnakeInGroup', () => {
  it('returns null playerId when no snakes in group', () => {
    const result = deriveLastSnakeInGroup([], 'round-1', 'group-1', [
      'p1',
      'p2',
    ])
    expect(result.playerId).toBeNull()
    expect(result.groupId).toBe('group-1')
    expect(result.roundId).toBe('round-1')
  })

  it('returns the player with the most recent snake', () => {
    const events: SideEventLog[] = [
      makeEvent({
        playerId: 'p1',
        type: 'snake',
        roundId: 'round-1',
        holeNumber: 3,
        createdAt: '2026-01-01T10:00:00Z',
      }),
      makeEvent({
        playerId: 'p2',
        type: 'snake',
        roundId: 'round-1',
        holeNumber: 7,
        createdAt: '2026-01-01T11:00:00Z',
      }),
      makeEvent({
        playerId: 'p1',
        type: 'snake',
        roundId: 'round-1',
        holeNumber: 12,
        createdAt: '2026-01-01T12:00:00Z',
      }),
    ]

    const result = deriveLastSnakeInGroup(events, 'round-1', 'group-1', [
      'p1',
      'p2',
    ])
    expect(result.playerId).toBe('p1')
    expect(result.holeNumber).toBe(12)
  })

  it('ignores snakes from players not in the group', () => {
    const events: SideEventLog[] = [
      makeEvent({
        playerId: 'p3',
        type: 'snake',
        roundId: 'round-1',
        holeNumber: 18,
        createdAt: '2026-01-01T15:00:00Z',
      }),
      makeEvent({
        playerId: 'p1',
        type: 'snake',
        roundId: 'round-1',
        holeNumber: 5,
        createdAt: '2026-01-01T10:00:00Z',
      }),
    ]

    const result = deriveLastSnakeInGroup(events, 'round-1', 'group-1', [
      'p1',
      'p2',
    ])
    expect(result.playerId).toBe('p1')
    expect(result.holeNumber).toBe(5)
  })

  it('ignores snakes from other rounds', () => {
    const events: SideEventLog[] = [
      makeEvent({
        playerId: 'p1',
        type: 'snake',
        roundId: 'round-2',
        holeNumber: 9,
        createdAt: '2026-01-01T15:00:00Z',
      }),
    ]

    const result = deriveLastSnakeInGroup(events, 'round-1', 'group-1', [
      'p1',
      'p2',
    ])
    expect(result.playerId).toBeNull()
  })

  it('ignores non-snake events', () => {
    const events: SideEventLog[] = [
      makeEvent({
        playerId: 'p1',
        type: 'birdie',
        roundId: 'round-1',
        holeNumber: 5,
        createdAt: '2026-01-01T15:00:00Z',
      }),
    ]

    const result = deriveLastSnakeInGroup(events, 'round-1', 'group-1', ['p1'])
    expect(result.playerId).toBeNull()
  })
})
