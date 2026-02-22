import { describe, it, expect } from 'vitest'
import type { SideEventLog } from '../types'
import {
  deriveLastSnakeInGroup,
  countSnakesByPlayer,
  aggregateTotals,
  longestDriveLeaderboard,
  groupLongestDriveLeaderboard,
  longestPuttLeaderboard,
  nearestToPinLeaderboard,
} from './side-events-logic'

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

// --- countSnakesByPlayer ---

describe('countSnakesByPlayer', () => {
  it('returns empty map when no snakes', () => {
    const counts = countSnakesByPlayer([])
    expect(counts.size).toBe(0)
  })

  it('counts snakes per player', () => {
    const events: SideEventLog[] = [
      makeEvent({ playerId: 'p1', type: 'snake' }),
      makeEvent({ playerId: 'p1', type: 'snake' }),
      makeEvent({ playerId: 'p2', type: 'snake' }),
      makeEvent({ playerId: 'p1', type: 'birdie' }), // not a snake
    ]

    const counts = countSnakesByPlayer(events)
    expect(counts.get('p1')).toBe(2)
    expect(counts.get('p2')).toBe(1)
    expect(counts.has('p3')).toBe(false)
  })
})

// --- aggregateTotals ---

describe('aggregateTotals', () => {
  it('returns zero totals for players with no events', () => {
    const totals = aggregateTotals([], 'tourn-1', ['p1', 'p2'])
    expect(totals).toHaveLength(2)
    expect(totals[0]).toEqual({
      playerId: 'p1',
      birdies: 0,
      eagles: 0,
      holeInOnes: 0,
      albatrosses: 0,
      bunkerSaves: 0,
      snakes: 0,
      snopp: 0,
      groupLongestDrives: 0,
      longestDriveMeters: null,
      longestPuttMeters: null,
      nearestToPinMeters: null,
      gir: 0,
    })
  })

  it('counts all event types correctly', () => {
    const events: SideEventLog[] = [
      makeEvent({ playerId: 'p1', type: 'birdie' }),
      makeEvent({ playerId: 'p1', type: 'birdie' }),
      makeEvent({ playerId: 'p1', type: 'eagle' }),
      makeEvent({ playerId: 'p1', type: 'hio' }),
      makeEvent({ playerId: 'p1', type: 'albatross' }),
      makeEvent({ playerId: 'p1', type: 'bunker_save' }),
      makeEvent({ playerId: 'p1', type: 'bunker_save' }),
      makeEvent({ playerId: 'p1', type: 'snake' }),
      makeEvent({ playerId: 'p1', type: 'snake' }),
      makeEvent({ playerId: 'p1', type: 'snake' }),
      makeEvent({ playerId: 'p1', type: 'snopp' }),
      makeEvent({ playerId: 'p1', type: 'snopp' }),
      makeEvent({ playerId: 'p1', type: 'group_longest_drive' }),
      makeEvent({
        playerId: 'p1',
        type: 'longest_drive_meters',
        value: 280,
      }),
      makeEvent({
        playerId: 'p1',
        type: 'longest_drive_meters',
        value: 310,
      }),
      makeEvent({ playerId: 'p1', type: 'longest_putt', value: 8 }),
      makeEvent({ playerId: 'p1', type: 'longest_putt', value: 14 }),
      makeEvent({ playerId: 'p1', type: 'nearest_to_pin', value: 3.2 }),
      makeEvent({ playerId: 'p1', type: 'nearest_to_pin', value: 1.8 }),
      makeEvent({ playerId: 'p1', type: 'gir' }),
      makeEvent({ playerId: 'p1', type: 'gir' }),
      makeEvent({ playerId: 'p1', type: 'gir' }),
    ]

    const totals = aggregateTotals(events, 'tourn-1', ['p1'])
    expect(totals[0]).toEqual({
      playerId: 'p1',
      birdies: 2,
      eagles: 1,
      holeInOnes: 1,
      albatrosses: 1,
      bunkerSaves: 2,
      snakes: 3,
      snopp: 2,
      groupLongestDrives: 1,
      longestDriveMeters: 310,
      longestPuttMeters: 14,
      nearestToPinMeters: 1.8, // min of 3.2 and 1.8
      gir: 3,
    })
  })

  it('separates counts by player', () => {
    const events: SideEventLog[] = [
      makeEvent({ playerId: 'p1', type: 'birdie' }),
      makeEvent({ playerId: 'p2', type: 'birdie' }),
      makeEvent({ playerId: 'p2', type: 'birdie' }),
    ]

    const totals = aggregateTotals(events, 'tourn-1', ['p1', 'p2'])
    expect(totals[0].birdies).toBe(1)
    expect(totals[1].birdies).toBe(2)
  })

  it('ignores events from other tournaments', () => {
    const events: SideEventLog[] = [
      makeEvent({
        playerId: 'p1',
        type: 'birdie',
        tournamentId: 'tourn-2',
      }),
    ]

    const totals = aggregateTotals(events, 'tourn-1', ['p1'])
    expect(totals[0].birdies).toBe(0)
  })
})

// --- longestDriveLeaderboard ---

describe('longestDriveLeaderboard', () => {
  it('returns empty array when no drives', () => {
    const result = longestDriveLeaderboard([], 'tourn-1')
    expect(result).toEqual([])
  })

  it('returns best drive per player sorted descending', () => {
    const events: SideEventLog[] = [
      makeEvent({
        id: 'e1',
        playerId: 'p1',
        type: 'longest_drive_meters',
        value: 280,
      }),
      makeEvent({
        id: 'e2',
        playerId: 'p1',
        type: 'longest_drive_meters',
        value: 305,
      }),
      makeEvent({
        id: 'e3',
        playerId: 'p2',
        type: 'longest_drive_meters',
        value: 290,
      }),
      makeEvent({
        id: 'e4',
        playerId: 'p3',
        type: 'longest_drive_meters',
        value: 320,
      }),
    ]

    const result = longestDriveLeaderboard(events, 'tourn-1')
    expect(result).toHaveLength(3)
    expect(result[0]).toEqual({ playerId: 'p3', meters: 320, eventId: 'e4' })
    expect(result[1]).toEqual({ playerId: 'p1', meters: 305, eventId: 'e2' })
    expect(result[2]).toEqual({ playerId: 'p2', meters: 290, eventId: 'e3' })
  })

  it('ignores drives without a value', () => {
    const events: SideEventLog[] = [
      makeEvent({
        id: 'e1',
        playerId: 'p1',
        type: 'longest_drive_meters',
        value: undefined,
      }),
    ]

    const result = longestDriveLeaderboard(events, 'tourn-1')
    expect(result).toEqual([])
  })
})

// --- groupLongestDriveLeaderboard ---

describe('groupLongestDriveLeaderboard', () => {
  it('returns empty array when no events', () => {
    const result = groupLongestDriveLeaderboard([], 'tourn-1')
    expect(result).toEqual([])
  })

  it('counts group longest drives per player sorted desc', () => {
    const events: SideEventLog[] = [
      makeEvent({ playerId: 'p1', type: 'group_longest_drive' }),
      makeEvent({ playerId: 'p1', type: 'group_longest_drive' }),
      makeEvent({ playerId: 'p2', type: 'group_longest_drive' }),
      makeEvent({ playerId: 'p3', type: 'group_longest_drive' }),
      makeEvent({ playerId: 'p3', type: 'group_longest_drive' }),
      makeEvent({ playerId: 'p3', type: 'group_longest_drive' }),
    ]

    const result = groupLongestDriveLeaderboard(events, 'tourn-1')
    expect(result).toEqual([
      { playerId: 'p3', count: 3 },
      { playerId: 'p1', count: 2 },
      { playerId: 'p2', count: 1 },
    ])
  })
})

// --- longestPuttLeaderboard ---

describe('longestPuttLeaderboard', () => {
  it('returns empty array when no putts', () => {
    const result = longestPuttLeaderboard([], 'tourn-1')
    expect(result).toEqual([])
  })

  it('returns best putt per player sorted descending (longest wins)', () => {
    const events: SideEventLog[] = [
      makeEvent({
        id: 'e1',
        playerId: 'p1',
        type: 'longest_putt',
        value: 8,
      }),
      makeEvent({
        id: 'e2',
        playerId: 'p1',
        type: 'longest_putt',
        value: 14,
      }),
      makeEvent({
        id: 'e3',
        playerId: 'p2',
        type: 'longest_putt',
        value: 11,
      }),
      makeEvent({
        id: 'e4',
        playerId: 'p3',
        type: 'longest_putt',
        value: 18,
      }),
    ]

    const result = longestPuttLeaderboard(events, 'tourn-1')
    expect(result).toHaveLength(3)
    expect(result[0]).toEqual({ playerId: 'p3', meters: 18, eventId: 'e4' })
    expect(result[1]).toEqual({ playerId: 'p1', meters: 14, eventId: 'e2' })
    expect(result[2]).toEqual({ playerId: 'p2', meters: 11, eventId: 'e3' })
  })

  it('ignores putts without a value', () => {
    const events: SideEventLog[] = [
      makeEvent({
        id: 'e1',
        playerId: 'p1',
        type: 'longest_putt',
        value: undefined,
      }),
    ]

    const result = longestPuttLeaderboard(events, 'tourn-1')
    expect(result).toEqual([])
  })

  it('ignores events from other tournaments', () => {
    const events: SideEventLog[] = [
      makeEvent({
        id: 'e1',
        playerId: 'p1',
        type: 'longest_putt',
        value: 10,
        tournamentId: 'tourn-2',
      }),
    ]

    const result = longestPuttLeaderboard(events, 'tourn-1')
    expect(result).toEqual([])
  })
})

// --- nearestToPinLeaderboard ---

describe('nearestToPinLeaderboard', () => {
  it('returns empty array when no NTP events', () => {
    const result = nearestToPinLeaderboard([], 'tourn-1')
    expect(result).toEqual([])
  })

  it('returns best (closest) NTP per player sorted ascending (shortest wins)', () => {
    const events: SideEventLog[] = [
      makeEvent({
        id: 'e1',
        playerId: 'p1',
        type: 'nearest_to_pin',
        value: 5.2,
      }),
      makeEvent({
        id: 'e2',
        playerId: 'p1',
        type: 'nearest_to_pin',
        value: 2.1,
      }),
      makeEvent({
        id: 'e3',
        playerId: 'p2',
        type: 'nearest_to_pin',
        value: 3.5,
      }),
      makeEvent({
        id: 'e4',
        playerId: 'p3',
        type: 'nearest_to_pin',
        value: 0.8,
      }),
    ]

    const result = nearestToPinLeaderboard(events, 'tourn-1')
    expect(result).toHaveLength(3)
    expect(result[0]).toEqual({ playerId: 'p3', meters: 0.8, eventId: 'e4' })
    expect(result[1]).toEqual({ playerId: 'p1', meters: 2.1, eventId: 'e2' })
    expect(result[2]).toEqual({ playerId: 'p2', meters: 3.5, eventId: 'e3' })
  })

  it('ignores NTP events without a value', () => {
    const events: SideEventLog[] = [
      makeEvent({
        id: 'e1',
        playerId: 'p1',
        type: 'nearest_to_pin',
        value: undefined,
      }),
    ]

    const result = nearestToPinLeaderboard(events, 'tourn-1')
    expect(result).toEqual([])
  })
})

// --- snopp aggregation ---

describe('snopp aggregation via aggregateTotals', () => {
  it('counts snopp events per player (unlimited per hole)', () => {
    const events: SideEventLog[] = [
      makeEvent({ playerId: 'p1', type: 'snopp', holeNumber: 3 }),
      makeEvent({ playerId: 'p1', type: 'snopp', holeNumber: 3 }),
      makeEvent({ playerId: 'p1', type: 'snopp', holeNumber: 5 }),
      makeEvent({ playerId: 'p2', type: 'snopp', holeNumber: 7 }),
    ]

    const totals = aggregateTotals(events, 'tourn-1', ['p1', 'p2'])
    expect(totals[0].snopp).toBe(3) // p1: 2 on hole 3 + 1 on hole 5
    expect(totals[1].snopp).toBe(1) // p2: 1 on hole 7
  })
})

// --- GIR aggregation ---

describe('GIR aggregation via aggregateTotals', () => {
  it('counts GIR events per player', () => {
    const events: SideEventLog[] = [
      makeEvent({ playerId: 'p1', type: 'gir', holeNumber: 1 }),
      makeEvent({ playerId: 'p1', type: 'gir', holeNumber: 4 }),
      makeEvent({ playerId: 'p1', type: 'gir', holeNumber: 8 }),
      makeEvent({ playerId: 'p2', type: 'gir', holeNumber: 2 }),
      makeEvent({ playerId: 'p2', type: 'gir', holeNumber: 5 }),
    ]

    const totals = aggregateTotals(events, 'tourn-1', ['p1', 'p2'])
    expect(totals[0].gir).toBe(3)
    expect(totals[1].gir).toBe(2)
  })
})
