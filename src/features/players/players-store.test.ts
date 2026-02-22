/// <reference types="vitest/globals" />
import { usePlayersStore } from './state/players-store'

describe('Players Store', () => {
  beforeEach(() => {
    // Reset to initial mock state
    usePlayersStore.setState({
      players: [
        {
          id: 'player-001',
          tournamentId: 'tournament-001',
          userId: 'test-admin-001',
          displayName: 'Kjartan',
          nickname: 'Kjarri',
          groupHandicap: 18,
          active: true,
          createdAt: '2026-01-15T10:00:00Z',
        },
        {
          id: 'player-002',
          tournamentId: 'tournament-001',
          userId: 'user-002',
          displayName: 'Thomas',
          nickname: 'Tommy',
          groupHandicap: 12,
          active: true,
          createdAt: '2026-01-16T08:00:00Z',
        },
      ],
      invites: [],
    })
  })

  it('has mock players loaded', () => {
    const { players } = usePlayersStore.getState()
    expect(players).toHaveLength(2)
    expect(players[0].displayName).toBe('Kjartan')
  })

  it('filters players by tournament', () => {
    const { getPlayersByTournament } = usePlayersStore.getState()
    const players = getPlayersByTournament('tournament-001')
    expect(players).toHaveLength(2)

    const noPlayers = getPlayersByTournament('nonexistent')
    expect(noPlayers).toHaveLength(0)
  })

  it('returns only active players', () => {
    usePlayersStore.getState().removePlayer('player-002')
    const active = usePlayersStore.getState().getActivePlayers('tournament-001')
    expect(active).toHaveLength(1)
    expect(active[0].displayName).toBe('Kjartan')
  })

  it('adds a new player', () => {
    const { addPlayer } = usePlayersStore.getState()
    const player = addPlayer('tournament-001', {
      displayName: 'Magnus',
      nickname: 'Maggi',
      groupHandicap: 24,
    })

    expect(player.displayName).toBe('Magnus')
    expect(player.nickname).toBe('Maggi')
    expect(player.groupHandicap).toBe(24)
    expect(player.active).toBe(true)

    const { players } = usePlayersStore.getState()
    expect(players).toHaveLength(3)
  })

  it('updates a player', () => {
    const { updatePlayer } = usePlayersStore.getState()
    updatePlayer('player-001', { groupHandicap: 16, nickname: 'K' })

    const player = usePlayersStore
      .getState()
      .players.find((p) => p.id === 'player-001')
    expect(player?.groupHandicap).toBe(16)
    expect(player?.nickname).toBe('K')
  })

  it('soft-removes a player (sets active=false)', () => {
    const { removePlayer } = usePlayersStore.getState()
    removePlayer('player-002')

    const player = usePlayersStore
      .getState()
      .players.find((p) => p.id === 'player-002')
    expect(player?.active).toBe(false)

    // Player still exists in array, just inactive
    expect(usePlayersStore.getState().players).toHaveLength(2)
  })

  it('sends an invite', () => {
    const { sendInvite } = usePlayersStore.getState()
    const invite = sendInvite('tournament-001', 'friend@example.com')

    expect(invite.email).toBe('friend@example.com')
    expect(invite.role).toBe('player')
    expect(invite.status).toBe('pending')
    expect(invite.tournamentId).toBe('tournament-001')

    const { invites } = usePlayersStore.getState()
    expect(invites).toHaveLength(1)
  })

  it('filters invites by tournament', () => {
    const { sendInvite } = usePlayersStore.getState()
    sendInvite('tournament-001', 'a@test.com')
    sendInvite('tournament-002', 'b@test.com')

    const invites = usePlayersStore
      .getState()
      .getInvitesByTournament('tournament-001')
    expect(invites).toHaveLength(1)
    expect(invites[0].email).toBe('a@test.com')
  })
})
