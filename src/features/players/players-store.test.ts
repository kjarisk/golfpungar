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
          email: 'kjartan@test.com',
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
          email: 'thomas@test.com',
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

  it('adds a new player with email', () => {
    const { addPlayer } = usePlayersStore.getState()
    const player = addPlayer('tournament-001', {
      displayName: 'Magnus',
      email: 'magnus@test.com',
      groupHandicap: 24,
    })

    expect(player.email).toBe('magnus@test.com')
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

  it('finds a player by email', () => {
    const player = usePlayersStore
      .getState()
      .getPlayerByEmail('tournament-001', 'kjartan@test.com')
    expect(player).toBeDefined()
    expect(player?.displayName).toBe('Kjartan')
  })

  it('finds a player by email case-insensitively', () => {
    const player = usePlayersStore
      .getState()
      .getPlayerByEmail('tournament-001', 'KJARTAN@TEST.COM')
    expect(player).toBeDefined()
    expect(player?.displayName).toBe('Kjartan')
  })

  it('returns undefined for non-existent email', () => {
    const player = usePlayersStore
      .getState()
      .getPlayerByEmail('tournament-001', 'nobody@test.com')
    expect(player).toBeUndefined()
  })
})

describe('Invite Linking', () => {
  beforeEach(() => {
    usePlayersStore.setState({
      players: [
        {
          id: 'player-001',
          tournamentId: 'tournament-001',
          userId: 'test-admin-001',
          displayName: 'Kjartan',
          email: 'kjartan@test.com',
          groupHandicap: 18,
          active: true,
          createdAt: '2026-01-15T10:00:00Z',
        },
      ],
      invites: [],
    })
  })

  it('auto-links invite when player with matching email already exists', () => {
    const { sendInvite } = usePlayersStore.getState()
    const invite = sendInvite('tournament-001', 'kjartan@test.com')

    expect(invite.linkedPlayerId).toBe('player-001')
  })

  it('auto-links invite case-insensitively', () => {
    const { sendInvite } = usePlayersStore.getState()
    const invite = sendInvite('tournament-001', 'KJARTAN@TEST.COM')

    expect(invite.linkedPlayerId).toBe('player-001')
  })

  it('does NOT auto-link when no player has the email', () => {
    const { sendInvite } = usePlayersStore.getState()
    const invite = sendInvite('tournament-001', 'unknown@test.com')

    expect(invite.linkedPlayerId).toBeUndefined()
  })

  it('does NOT auto-link across different tournaments', () => {
    const { sendInvite } = usePlayersStore.getState()
    const invite = sendInvite('tournament-999', 'kjartan@test.com')

    expect(invite.linkedPlayerId).toBeUndefined()
  })

  it('auto-links pending invite when player is added with matching email', () => {
    // First send invite (no player match yet)
    const { sendInvite } = usePlayersStore.getState()
    const invite = sendInvite('tournament-001', 'magnus@test.com')
    expect(invite.linkedPlayerId).toBeUndefined()

    // Now add a player with the same email
    const { addPlayer } = usePlayersStore.getState()
    addPlayer('tournament-001', {
      displayName: 'Magnus',
      email: 'magnus@test.com',
      groupHandicap: 24,
    })

    // The pending invite should now be linked
    const updatedInvites = usePlayersStore
      .getState()
      .getInvitesByTournament('tournament-001')
    const updatedInvite = updatedInvites.find((i) => i.id === invite.id)
    expect(updatedInvite?.linkedPlayerId).toBeDefined()
  })

  it('auto-links pending invite when player email is updated to match', () => {
    // Add a player without email
    const { addPlayer } = usePlayersStore.getState()
    const player = addPlayer('tournament-001', {
      displayName: 'Magnus',
      groupHandicap: 24,
    })

    // Send invite to magnus@test.com (no match yet)
    const { sendInvite } = usePlayersStore.getState()
    sendInvite('tournament-001', 'magnus@test.com')

    // Update the player's email to match
    const { updatePlayer } = usePlayersStore.getState()
    updatePlayer(player.id, { email: 'magnus@test.com' })

    // Invite should now be linked
    const invites = usePlayersStore
      .getState()
      .getInvitesByTournament('tournament-001')
    const invite = invites.find((i) => i.email === 'magnus@test.com')
    expect(invite?.linkedPlayerId).toBe(player.id)
  })
})

describe('Accept Invite', () => {
  beforeEach(() => {
    usePlayersStore.setState({
      players: [
        {
          id: 'player-001',
          tournamentId: 'tournament-001',
          userId: 'test-admin-001',
          displayName: 'Kjartan',
          email: 'kjartan@test.com',
          groupHandicap: 18,
          active: true,
          createdAt: '2026-01-15T10:00:00Z',
        },
      ],
      invites: [
        {
          id: 'invite-linked',
          tournamentId: 'tournament-001',
          email: 'kjartan@test.com',
          role: 'player',
          token: 'token-1',
          expiresAt: '2026-03-01T00:00:00Z',
          status: 'pending',
          linkedPlayerId: 'player-001',
        },
        {
          id: 'invite-unlinked',
          tournamentId: 'tournament-001',
          email: 'new-person@test.com',
          role: 'player',
          token: 'token-2',
          expiresAt: '2026-03-01T00:00:00Z',
          status: 'pending',
        },
      ],
    })
  })

  it('accepts a linked invite and sets status to accepted', () => {
    const { acceptInvite } = usePlayersStore.getState()
    acceptInvite('invite-linked')

    const invite = usePlayersStore
      .getState()
      .invites.find((i) => i.id === 'invite-linked')
    expect(invite?.status).toBe('accepted')
    expect(invite?.acceptedAt).toBeDefined()
  })

  it('accepts a linked invite without creating a new player', () => {
    const { acceptInvite } = usePlayersStore.getState()
    const beforeCount = usePlayersStore.getState().players.length
    acceptInvite('invite-linked')
    const afterCount = usePlayersStore.getState().players.length

    expect(afterCount).toBe(beforeCount)
  })

  it('accepts an unlinked invite and creates a new player', () => {
    const { acceptInvite } = usePlayersStore.getState()
    const beforeCount = usePlayersStore.getState().players.length
    acceptInvite('invite-unlinked')
    const afterCount = usePlayersStore.getState().players.length

    expect(afterCount).toBe(beforeCount + 1)

    // New player should have email from invite
    const newPlayer = usePlayersStore
      .getState()
      .players.find((p) => p.email === 'new-person@test.com')
    expect(newPlayer).toBeDefined()
    expect(newPlayer?.active).toBe(true)
    expect(newPlayer?.groupHandicap).toBe(18) // default
  })

  it('sets linkedPlayerId on unlinked invite after acceptance', () => {
    const { acceptInvite } = usePlayersStore.getState()
    acceptInvite('invite-unlinked')

    const invite = usePlayersStore
      .getState()
      .invites.find((i) => i.id === 'invite-unlinked')
    expect(invite?.status).toBe('accepted')
    expect(invite?.linkedPlayerId).toBeDefined()
  })

  it('does nothing for already accepted invites', () => {
    const { acceptInvite } = usePlayersStore.getState()
    acceptInvite('invite-linked') // first accept
    const afterFirstAccept = usePlayersStore.getState().players.length

    acceptInvite('invite-linked') // second accept — should be no-op
    const afterSecondAccept = usePlayersStore.getState().players.length

    expect(afterSecondAccept).toBe(afterFirstAccept)
  })

  it('does nothing for non-existent invite', () => {
    const { acceptInvite } = usePlayersStore.getState()
    const beforeCount = usePlayersStore.getState().players.length
    acceptInvite('invite-nonexistent')
    const afterCount = usePlayersStore.getState().players.length

    expect(afterCount).toBe(beforeCount)
  })
})
