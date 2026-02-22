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

    useRoundsStore.getState().setRoundStatus(round.id, 'active')
    const updated = useRoundsStore
      .getState()
      .rounds.find((r) => r.id === round.id)
    expect(updated?.status).toBe('active')

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

describe('Rounds Store — Phase 14 (Status & Management)', () => {
  beforeEach(() => {
    useRoundsStore.setState({
      rounds: [],
      groups: [],
      teams: [],
    })
  })

  describe('enforce one active round per tournament', () => {
    it('deactivates previous active round when setting another to active', () => {
      const r1 = useRoundsStore
        .getState()
        .createRound('tournament-001', SAMPLE_INPUT)
      const r2 = useRoundsStore.getState().createRound('tournament-001', {
        ...SAMPLE_INPUT,
        name: 'Day 1 Afternoon',
      })

      useRoundsStore.getState().setRoundStatus(r1.id, 'active')
      expect(
        useRoundsStore.getState().rounds.find((r) => r.id === r1.id)?.status
      ).toBe('active')

      // Setting r2 to active should deactivate r1
      useRoundsStore.getState().setRoundStatus(r2.id, 'active')
      expect(
        useRoundsStore.getState().rounds.find((r) => r.id === r2.id)?.status
      ).toBe('active')
      expect(
        useRoundsStore.getState().rounds.find((r) => r.id === r1.id)?.status
      ).toBe('upcoming')
    })

    it('does not affect rounds in other tournaments', () => {
      const r1 = useRoundsStore
        .getState()
        .createRound('tournament-001', SAMPLE_INPUT)
      const r2 = useRoundsStore.getState().createRound('tournament-002', {
        ...SAMPLE_INPUT,
        name: 'Other Tournament Round',
      })

      useRoundsStore.getState().setRoundStatus(r1.id, 'active')
      useRoundsStore.getState().setRoundStatus(r2.id, 'active')

      // Both should be active — they're in different tournaments
      expect(
        useRoundsStore.getState().rounds.find((r) => r.id === r1.id)?.status
      ).toBe('active')
      expect(
        useRoundsStore.getState().rounds.find((r) => r.id === r2.id)?.status
      ).toBe('active')
    })

    it('handles setting a round to completed without affecting other rounds', () => {
      const r1 = useRoundsStore
        .getState()
        .createRound('tournament-001', SAMPLE_INPUT)
      const r2 = useRoundsStore.getState().createRound('tournament-001', {
        ...SAMPLE_INPUT,
        name: 'Day 1 Afternoon',
      })

      useRoundsStore.getState().setRoundStatus(r1.id, 'active')
      useRoundsStore.getState().setRoundStatus(r1.id, 'completed')

      expect(
        useRoundsStore.getState().rounds.find((r) => r.id === r1.id)?.status
      ).toBe('completed')
      expect(
        useRoundsStore.getState().rounds.find((r) => r.id === r2.id)?.status
      ).toBe('upcoming')
    })

    it('ignores setRoundStatus on non-existent round', () => {
      useRoundsStore.getState().createRound('tournament-001', SAMPLE_INPUT)

      const before = useRoundsStore.getState().rounds.map((r) => ({ ...r }))
      useRoundsStore.getState().setRoundStatus('non-existent', 'active')
      const after = useRoundsStore.getState().rounds

      expect(after).toEqual(before)
    })
  })

  describe('getActiveRound', () => {
    it('returns undefined when no round is active', () => {
      useRoundsStore.getState().createRound('tournament-001', SAMPLE_INPUT)

      const active = useRoundsStore.getState().getActiveRound('tournament-001')
      expect(active).toBeUndefined()
    })

    it('returns the active round for the tournament', () => {
      const r1 = useRoundsStore
        .getState()
        .createRound('tournament-001', SAMPLE_INPUT)

      useRoundsStore.getState().setRoundStatus(r1.id, 'active')

      const active = useRoundsStore.getState().getActiveRound('tournament-001')
      expect(active?.id).toBe(r1.id)
      expect(active?.status).toBe('active')
    })

    it('returns undefined for a different tournament', () => {
      const r1 = useRoundsStore
        .getState()
        .createRound('tournament-001', SAMPLE_INPUT)

      useRoundsStore.getState().setRoundStatus(r1.id, 'active')

      const active = useRoundsStore.getState().getActiveRound('tournament-002')
      expect(active).toBeUndefined()
    })
  })

  describe('updateRound', () => {
    it('updates round name', () => {
      const round = useRoundsStore
        .getState()
        .createRound('tournament-001', SAMPLE_INPUT)

      useRoundsStore.getState().updateRound(round.id, { name: 'New Name' })

      const updated = useRoundsStore
        .getState()
        .rounds.find((r) => r.id === round.id)
      expect(updated?.name).toBe('New Name')
    })

    it('updates round format', () => {
      const round = useRoundsStore
        .getState()
        .createRound('tournament-001', SAMPLE_INPUT)

      useRoundsStore.getState().updateRound(round.id, { format: 'scramble' })

      const updated = useRoundsStore
        .getState()
        .rounds.find((r) => r.id === round.id)
      expect(updated?.format).toBe('scramble')
    })

    it('updates multiple fields at once', () => {
      const round = useRoundsStore
        .getState()
        .createRound('tournament-001', SAMPLE_INPUT)

      useRoundsStore.getState().updateRound(round.id, {
        name: 'Updated Round',
        holesPlayed: 9,
        dateTime: '2026-06-20T14:00',
      })

      const updated = useRoundsStore
        .getState()
        .rounds.find((r) => r.id === round.id)
      expect(updated?.name).toBe('Updated Round')
      expect(updated?.holesPlayed).toBe(9)
      expect(updated?.dateTime).toBe('2026-06-20T14:00')
    })

    it('does not affect other rounds', () => {
      const r1 = useRoundsStore
        .getState()
        .createRound('tournament-001', SAMPLE_INPUT)
      const r2 = useRoundsStore.getState().createRound('tournament-001', {
        ...SAMPLE_INPUT,
        name: 'Day 1 Afternoon',
      })

      useRoundsStore.getState().updateRound(r1.id, { name: 'Changed Name' })

      const other = useRoundsStore.getState().rounds.find((r) => r.id === r2.id)
      expect(other?.name).toBe('Day 1 Afternoon')
    })
  })

  describe('status transitions', () => {
    it('supports upcoming → active → completed flow', () => {
      const round = useRoundsStore
        .getState()
        .createRound('tournament-001', SAMPLE_INPUT)

      expect(
        useRoundsStore.getState().rounds.find((r) => r.id === round.id)?.status
      ).toBe('upcoming')

      useRoundsStore.getState().setRoundStatus(round.id, 'active')
      expect(
        useRoundsStore.getState().rounds.find((r) => r.id === round.id)?.status
      ).toBe('active')

      useRoundsStore.getState().setRoundStatus(round.id, 'completed')
      expect(
        useRoundsStore.getState().rounds.find((r) => r.id === round.id)?.status
      ).toBe('completed')
    })

    it('supports completed → upcoming (reopen)', () => {
      const round = useRoundsStore
        .getState()
        .createRound('tournament-001', SAMPLE_INPUT)

      useRoundsStore.getState().setRoundStatus(round.id, 'active')
      useRoundsStore.getState().setRoundStatus(round.id, 'completed')
      useRoundsStore.getState().setRoundStatus(round.id, 'upcoming')

      expect(
        useRoundsStore.getState().rounds.find((r) => r.id === round.id)?.status
      ).toBe('upcoming')
    })
  })
})

describe('Rounds Store — Phase 15 (Team Configuration)', () => {
  beforeEach(() => {
    useRoundsStore.setState({
      rounds: [],
      groups: [],
      teams: [],
    })
  })

  const SCRAMBLE_INPUT: CreateRoundInput = {
    courseId: 'course-001',
    name: 'Scramble Round',
    format: 'scramble',
    holesPlayed: 18,
    groups: [
      {
        name: 'Group 1',
        playerIds: ['player-001', 'player-002', 'player-003', 'player-004'],
      },
    ],
  }

  describe('addTeamsToRound', () => {
    it('adds teams to an existing round', () => {
      const round = useRoundsStore
        .getState()
        .createRound('tournament-001', SCRAMBLE_INPUT)

      const teams = useRoundsStore.getState().addTeamsToRound(round.id, [
        { name: 'Alpha', playerIds: ['player-001', 'player-002'] },
        { name: 'Bravo', playerIds: ['player-003', 'player-004'] },
      ])

      expect(teams).toHaveLength(2)
      expect(teams[0].name).toBe('Alpha')
      expect(teams[0].roundId).toBe(round.id)
      expect(teams[1].name).toBe('Bravo')

      const storedTeams = useRoundsStore.getState().getTeamsByRound(round.id)
      expect(storedTeams).toHaveLength(2)
    })

    it('assigns unique IDs to teams', () => {
      const round = useRoundsStore
        .getState()
        .createRound('tournament-001', SCRAMBLE_INPUT)

      const teams = useRoundsStore.getState().addTeamsToRound(round.id, [
        { name: 'Alpha', playerIds: ['player-001', 'player-002'] },
        { name: 'Bravo', playerIds: ['player-003', 'player-004'] },
      ])

      expect(teams[0].id).not.toBe(teams[1].id)
    })
  })

  describe('updateTeamName', () => {
    it('updates a team name', () => {
      const round = useRoundsStore
        .getState()
        .createRound('tournament-001', SCRAMBLE_INPUT)
      const teams = useRoundsStore
        .getState()
        .addTeamsToRound(round.id, [
          { name: 'Old Name', playerIds: ['player-001', 'player-002'] },
        ])

      useRoundsStore.getState().updateTeamName(teams[0].id, 'New Name')

      const updated = useRoundsStore
        .getState()
        .teams.find((t) => t.id === teams[0].id)
      expect(updated?.name).toBe('New Name')
    })

    it('does not affect other teams', () => {
      const round = useRoundsStore
        .getState()
        .createRound('tournament-001', SCRAMBLE_INPUT)
      const teams = useRoundsStore.getState().addTeamsToRound(round.id, [
        { name: 'Team A', playerIds: ['player-001', 'player-002'] },
        { name: 'Team B', playerIds: ['player-003', 'player-004'] },
      ])

      useRoundsStore.getState().updateTeamName(teams[0].id, 'Changed')

      const other = useRoundsStore
        .getState()
        .teams.find((t) => t.id === teams[1].id)
      expect(other?.name).toBe('Team B')
    })
  })

  describe('removeTeam', () => {
    it('removes a single team', () => {
      const round = useRoundsStore
        .getState()
        .createRound('tournament-001', SCRAMBLE_INPUT)
      const teams = useRoundsStore.getState().addTeamsToRound(round.id, [
        { name: 'Team A', playerIds: ['player-001', 'player-002'] },
        { name: 'Team B', playerIds: ['player-003', 'player-004'] },
      ])

      useRoundsStore.getState().removeTeam(teams[0].id)

      const remaining = useRoundsStore.getState().getTeamsByRound(round.id)
      expect(remaining).toHaveLength(1)
      expect(remaining[0].name).toBe('Team B')
    })
  })

  describe('removeTeamsByRound', () => {
    it('removes all teams for a round', () => {
      const round = useRoundsStore
        .getState()
        .createRound('tournament-001', SCRAMBLE_INPUT)
      useRoundsStore.getState().addTeamsToRound(round.id, [
        { name: 'Team A', playerIds: ['player-001', 'player-002'] },
        { name: 'Team B', playerIds: ['player-003', 'player-004'] },
      ])

      useRoundsStore.getState().removeTeamsByRound(round.id)

      expect(useRoundsStore.getState().getTeamsByRound(round.id)).toHaveLength(
        0
      )
    })

    it('does not affect teams from other rounds', () => {
      const r1 = useRoundsStore
        .getState()
        .createRound('tournament-001', SCRAMBLE_INPUT)
      const r2 = useRoundsStore
        .getState()
        .createRound('tournament-001', { ...SCRAMBLE_INPUT, name: 'Round 2' })

      useRoundsStore
        .getState()
        .addTeamsToRound(r1.id, [
          { name: 'R1 Team', playerIds: ['player-001', 'player-002'] },
        ])
      useRoundsStore
        .getState()
        .addTeamsToRound(r2.id, [
          { name: 'R2 Team', playerIds: ['player-003', 'player-004'] },
        ])

      useRoundsStore.getState().removeTeamsByRound(r1.id)

      expect(useRoundsStore.getState().getTeamsByRound(r1.id)).toHaveLength(0)
      expect(useRoundsStore.getState().getTeamsByRound(r2.id)).toHaveLength(1)
    })
  })

  describe('getTeamForPlayer', () => {
    it('finds the team a player belongs to', () => {
      const round = useRoundsStore
        .getState()
        .createRound('tournament-001', SCRAMBLE_INPUT)
      const teams = useRoundsStore.getState().addTeamsToRound(round.id, [
        { name: 'Alpha', playerIds: ['player-001', 'player-002'] },
        { name: 'Bravo', playerIds: ['player-003', 'player-004'] },
      ])

      const team = useRoundsStore
        .getState()
        .getTeamForPlayer(round.id, 'player-003')
      expect(team?.id).toBe(teams[1].id)
      expect(team?.name).toBe('Bravo')
    })

    it('returns undefined if player is not in any team', () => {
      const round = useRoundsStore
        .getState()
        .createRound('tournament-001', SCRAMBLE_INPUT)
      useRoundsStore
        .getState()
        .addTeamsToRound(round.id, [
          { name: 'Alpha', playerIds: ['player-001', 'player-002'] },
        ])

      const team = useRoundsStore
        .getState()
        .getTeamForPlayer(round.id, 'player-005')
      expect(team).toBeUndefined()
    })
  })
})
