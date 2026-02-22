/// <reference types="vitest/globals" />
import { sortRounds } from './sort-rounds'
import type { Round } from '../types'

function makeRound(overrides: Partial<Round> & { id: string }): Round {
  return {
    tournamentId: 'tournament-001',
    courseId: 'course-001',
    name: `Round ${overrides.id}`,
    format: 'stableford',
    holesPlayed: 18,
    status: 'upcoming',
    createdAt: '2026-06-01T10:00:00.000Z',
    ...overrides,
  }
}

describe('sortRounds', () => {
  it('returns empty array for empty input', () => {
    expect(sortRounds([])).toEqual([])
  })

  it('does not mutate the input array', () => {
    const input = [
      makeRound({ id: 'r1', status: 'completed' }),
      makeRound({ id: 'r2', status: 'active' }),
    ]
    const original = [...input]
    sortRounds(input)
    expect(input).toEqual(original)
  })

  it('sorts active before upcoming before completed', () => {
    const rounds = [
      makeRound({ id: 'r1', status: 'completed' }),
      makeRound({ id: 'r2', status: 'upcoming' }),
      makeRound({ id: 'r3', status: 'active' }),
    ]
    const sorted = sortRounds(rounds)
    expect(sorted.map((r) => r.status)).toEqual([
      'active',
      'upcoming',
      'completed',
    ])
  })

  it('sorts active rounds newest first', () => {
    const rounds = [
      makeRound({
        id: 'r-old',
        status: 'active',
        createdAt: '2026-06-01T08:00:00.000Z',
      }),
      makeRound({
        id: 'r-new',
        status: 'active',
        createdAt: '2026-06-01T12:00:00.000Z',
      }),
    ]
    const sorted = sortRounds(rounds)
    expect(sorted.map((r) => r.id)).toEqual(['r-new', 'r-old'])
  })

  it('sorts upcoming rounds newest first', () => {
    const rounds = [
      makeRound({
        id: 'r-old',
        status: 'upcoming',
        createdAt: '2026-06-01T08:00:00.000Z',
      }),
      makeRound({
        id: 'r-new',
        status: 'upcoming',
        createdAt: '2026-06-01T12:00:00.000Z',
      }),
      makeRound({
        id: 'r-mid',
        status: 'upcoming',
        createdAt: '2026-06-01T10:00:00.000Z',
      }),
    ]
    const sorted = sortRounds(rounds)
    expect(sorted.map((r) => r.id)).toEqual(['r-new', 'r-mid', 'r-old'])
  })

  it('sorts completed rounds oldest first', () => {
    const rounds = [
      makeRound({
        id: 'r-new',
        status: 'completed',
        createdAt: '2026-06-01T12:00:00.000Z',
      }),
      makeRound({
        id: 'r-old',
        status: 'completed',
        createdAt: '2026-06-01T08:00:00.000Z',
      }),
      makeRound({
        id: 'r-mid',
        status: 'completed',
        createdAt: '2026-06-01T10:00:00.000Z',
      }),
    ]
    const sorted = sortRounds(rounds)
    expect(sorted.map((r) => r.id)).toEqual(['r-old', 'r-mid', 'r-new'])
  })

  it('handles mixed statuses with correct ordering', () => {
    const rounds = [
      makeRound({
        id: 'c1',
        status: 'completed',
        createdAt: '2026-06-01T08:00:00.000Z',
      }),
      makeRound({
        id: 'u1',
        status: 'upcoming',
        createdAt: '2026-06-01T10:00:00.000Z',
      }),
      makeRound({
        id: 'a1',
        status: 'active',
        createdAt: '2026-06-01T12:00:00.000Z',
      }),
      makeRound({
        id: 'c2',
        status: 'completed',
        createdAt: '2026-06-01T14:00:00.000Z',
      }),
      makeRound({
        id: 'u2',
        status: 'upcoming',
        createdAt: '2026-06-01T06:00:00.000Z',
      }),
    ]
    const sorted = sortRounds(rounds)
    expect(sorted.map((r) => r.id)).toEqual([
      'a1', // active first
      'u1', // upcoming next — u1 newer than u2
      'u2',
      'c1', // completed last — c1 older than c2
      'c2',
    ])
  })

  it('handles single round', () => {
    const rounds = [makeRound({ id: 'r1', status: 'active' })]
    const sorted = sortRounds(rounds)
    expect(sorted).toHaveLength(1)
    expect(sorted[0].id).toBe('r1')
  })
})
