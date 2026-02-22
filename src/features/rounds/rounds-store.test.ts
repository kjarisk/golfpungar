/// <reference types="vitest/globals" />
import { useRoundsStore } from './state/rounds-store'
import type { CreateRoundInput } from './types'

const SAMPLE_INPUT: CreateRoundInput = {
  courseId: 'course-001',
  name: 'Day 1 Morning',
  format: 'stableford',
  holesPlayed: 18,
  groups: [
    { name: 'Group 1', playerIds: ['player-001', 'player-002', 'player-003'] },
    { name: 'Group 2', playerIds: ['player-004', 'player-005', 'player-006'] },
  ],
}

describe('Rounds Store', () => {
  beforeEach(() => {
    useRoundsStore.setState({
      rounds: [],
      groups: [],
      teams: [],
    })
  })

  it('starts with no rounds', () => {
    const { rounds } = useRoundsStore.getState()
    expect(rounds).toHaveLength(0)
  })

  it('creates a round', () => {
    const round = useRoundsStore
      .getState()
      .createRound('tournament-001', SAMPLE_INPUT)

    expect(round.name).toBe('Day 1 Morning')
    expect(round.format).toBe('stableford')
    expect(round.holesPlayed).toBe(18)
    expect(round.courseId).toBe('course-001')
    expect(round.tournamentId).toBe('tournament-001')
    expect(round.status).toBe('upcoming')

    const { rounds } = useRoundsStore.getState()
    expect(rounds).toHaveLength(1)
  })

  it('creates groups when creating a round', () => {
    const round = useRoundsStore
      .getState()
      .createRound('tournament-001', SAMPLE_INPUT)
    const groups = useRoundsStore.getState().getGroupsByRound(round.id)

    expect(groups).toHaveLength(2)
    expect(groups[0].name).toBe('Group 1')
    expect(groups[0].playerIds).toEqual([
      'player-001',
      'player-002',
      'player-003',
    ])
    expect(groups[1].name).toBe('Group 2')
    expect(groups[1].playerIds).toEqual([
      'player-004',
      'player-005',
      'player-006',
    ])
  })

  it('creates teams when provided', () => {
    const input: CreateRoundInput = {
      ...SAMPLE_INPUT,
      format: 'scramble',
      teams: [
        { name: 'Team A', playerIds: ['player-001', 'player-002'] },
        { name: 'Team B', playerIds: ['player-003', 'player-004'] },
      ],
    }

    const round = useRoundsStore.getState().createRound('tournament-001', input)
    const teams = useRoundsStore.getState().getTeamsByRound(round.id)

    expect(teams).toHaveLength(2)
    expect(teams[0].name).toBe('Team A')
    expect(teams[1].name).toBe('Team B')
  })

  it('does not create teams when not provided', () => {
    const round = useRoundsStore
      .getState()
      .createRound('tournament-001', SAMPLE_INPUT)
    const teams = useRoundsStore.getState().getTeamsByRound(round.id)
    expect(teams).toHaveLength(0)
  })

  it('stores optional dateTime', () => {
    const input: CreateRoundInput = {
      ...SAMPLE_INPUT,
      dateTime: '2026-06-15T08:00',
    }

    const round = useRoundsStore.getState().createRound('tournament-001', input)
    expect(round.dateTime).toBe('2026-06-15T08:00')
  })

  it('gets rounds by tournament', () => {
    useRoundsStore.getState().createRound('tournament-001', SAMPLE_INPUT)
    useRoundsStore.getState().createRound('tournament-002', {
      ...SAMPLE_INPUT,
      name: 'Other Tournament Round',
    })

    const t1Rounds = useRoundsStore
      .getState()
      .getRoundsByTournament('tournament-001')
    expect(t1Rounds).toHaveLength(1)
    expect(t1Rounds[0].name).toBe('Day 1 Morning')

    const t2Rounds = useRoundsStore
      .getState()
      .getRoundsByTournament('tournament-002')
    expect(t2Rounds).toHaveLength(1)
    expect(t2Rounds[0].name).toBe('Other Tournament Round')
  })

  it('sets round status', () => {
    const round = useRoundsStore
      .getState()
      .createRound('tournament-001', SAMPLE_INPUT)

    useRoundsStore.getState().setRoundStatus(round.id, 'in_progress')
    const updated = useRoundsStore
      .getState()
      .rounds.find((r) => r.id === round.id)
    expect(updated?.status).toBe('in_progress')

    useRoundsStore.getState().setRoundStatus(round.id, 'completed')
    const completed = useRoundsStore
      .getState()
      .rounds.find((r) => r.id === round.id)
    expect(completed?.status).toBe('completed')
  })

  it('removes a round and its groups and teams', () => {
    const input: CreateRoundInput = {
      ...SAMPLE_INPUT,
      teams: [{ name: 'Team A', playerIds: ['player-001', 'player-002'] }],
    }

    const round = useRoundsStore.getState().createRound('tournament-001', input)
    expect(useRoundsStore.getState().rounds).toHaveLength(1)
    expect(useRoundsStore.getState().groups.length).toBeGreaterThan(0)
    expect(useRoundsStore.getState().teams.length).toBeGreaterThan(0)

    useRoundsStore.getState().removeRound(round.id)

    expect(useRoundsStore.getState().rounds).toHaveLength(0)
    expect(useRoundsStore.getState().getGroupsByRound(round.id)).toHaveLength(0)
    expect(useRoundsStore.getState().getTeamsByRound(round.id)).toHaveLength(0)
  })

  it('assigns unique IDs to rounds', () => {
    const r1 = useRoundsStore
      .getState()
      .createRound('tournament-001', SAMPLE_INPUT)
    const r2 = useRoundsStore.getState().createRound('tournament-001', {
      ...SAMPLE_INPUT,
      name: 'Day 1 Afternoon',
    })

    expect(r1.id).not.toBe(r2.id)
  })

  it('assigns unique IDs to groups across rounds', () => {
    const r1 = useRoundsStore
      .getState()
      .createRound('tournament-001', SAMPLE_INPUT)
    const r2 = useRoundsStore
      .getState()
      .createRound('tournament-001', SAMPLE_INPUT)

    const g1 = useRoundsStore.getState().getGroupsByRound(r1.id)
    const g2 = useRoundsStore.getState().getGroupsByRound(r2.id)

    const allIds = [...g1.map((g) => g.id), ...g2.map((g) => g.id)]
    const uniqueIds = new Set(allIds)
    expect(uniqueIds.size).toBe(allIds.length)
  })
})
