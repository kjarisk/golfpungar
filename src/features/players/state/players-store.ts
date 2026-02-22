import { create } from 'zustand'
import type {
  Player,
  CreatePlayerInput,
  UpdatePlayerInput,
  Invite,
} from '../types'
import { useFeedStore } from '@/features/feed'

interface PlayersState {
  players: Player[]
  invites: Invite[]

  // Derived
  getPlayersByTournament: (tournamentId: string) => Player[]
  getActivePlayers: (tournamentId: string) => Player[]
  getInvitesByTournament: (tournamentId: string) => Invite[]
  getPlayerByEmail: (tournamentId: string, email: string) => Player | undefined

  // Actions
  addPlayer: (tournamentId: string, input: CreatePlayerInput) => Player
  updatePlayer: (id: string, updates: UpdatePlayerInput) => void
  removePlayer: (id: string) => void
  sendInvite: (
    tournamentId: string,
    email: string,
    role?: 'admin' | 'player'
  ) => Invite
  acceptInvite: (inviteId: string) => void
}

const MOCK_PLAYERS: Player[] = [
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
  {
    id: 'player-003',
    tournamentId: 'tournament-001',
    userId: 'user-003',
    displayName: 'Magnus',
    nickname: 'Maggi',
    email: 'magnus@test.com',
    groupHandicap: 24,
    active: true,
    createdAt: '2026-01-16T09:00:00Z',
  },
  {
    id: 'player-004',
    tournamentId: 'tournament-001',
    userId: 'user-004',
    displayName: 'Olafur',
    nickname: 'Oli',
    email: 'olafur@test.com',
    groupHandicap: 15,
    active: true,
    createdAt: '2026-01-17T10:00:00Z',
  },
  {
    id: 'player-005',
    tournamentId: 'tournament-001',
    userId: 'user-005',
    displayName: 'Gunnar',
    email: 'gunnar@test.com',
    groupHandicap: 20,
    active: true,
    createdAt: '2026-01-17T11:00:00Z',
  },
  {
    id: 'player-006',
    tournamentId: 'tournament-001',
    userId: 'user-006',
    displayName: 'Stefan',
    nickname: 'Stebbi',
    email: 'stefan@test.com',
    groupHandicap: 8,
    active: true,
    createdAt: '2026-01-18T10:00:00Z',
  },
]

const MOCK_INVITES: Invite[] = [
  {
    id: 'invite-001',
    tournamentId: 'tournament-001',
    email: 'jon@example.com',
    role: 'player',
    token: 'mock-token-001',
    expiresAt: '2026-03-01T00:00:00Z',
    status: 'pending',
  },
]

let nextPlayerId = 7
let nextInviteId = 2

/**
 * Auto-link: when a player is created with an email, find any pending invite
 * with the same email in the same tournament and set linkedPlayerId.
 * Conversely, when an invite is sent, check if a player already exists with
 * that email and auto-link.
 */
function autoLinkInviteToPlayer(invites: Invite[], player: Player): Invite[] {
  if (!player.email) return invites
  const emailLower = player.email.toLowerCase()
  return invites.map((inv) =>
    inv.tournamentId === player.tournamentId &&
    inv.email.toLowerCase() === emailLower &&
    inv.status === 'pending' &&
    !inv.linkedPlayerId
      ? { ...inv, linkedPlayerId: player.id }
      : inv
  )
}

export const usePlayersStore = create<PlayersState>((set, get) => ({
  players: MOCK_PLAYERS,
  invites: MOCK_INVITES,

  getPlayersByTournament: (tournamentId) =>
    get().players.filter((p) => p.tournamentId === tournamentId),

  getActivePlayers: (tournamentId) =>
    get().players.filter((p) => p.tournamentId === tournamentId && p.active),

  getInvitesByTournament: (tournamentId) =>
    get().invites.filter((i) => i.tournamentId === tournamentId),

  getPlayerByEmail: (tournamentId, email) => {
    const emailLower = email.toLowerCase()
    return get().players.find(
      (p) =>
        p.tournamentId === tournamentId &&
        p.active &&
        p.email?.toLowerCase() === emailLower
    )
  },

  addPlayer: (tournamentId, input) => {
    const player: Player = {
      id: `player-${String(nextPlayerId++).padStart(3, '0')}`,
      tournamentId,
      userId: `user-${String(nextPlayerId).padStart(3, '0')}`,
      displayName: input.displayName,
      nickname: input.nickname,
      email: input.email,
      groupHandicap: input.groupHandicap,
      active: true,
      createdAt: new Date().toISOString(),
    }
    set((state) => ({
      players: [...state.players, player],
      // Auto-link any pending invite with matching email
      invites: autoLinkInviteToPlayer(state.invites, player),
    }))
    return player
  },

  updatePlayer: (id, updates) => {
    const existing = get().players.find((p) => p.id === id)

    // Detect handicap change and post feed event
    if (
      existing &&
      updates.groupHandicap !== undefined &&
      updates.groupHandicap !== existing.groupHandicap
    ) {
      useFeedStore.getState().addEvent({
        tournamentId: existing.tournamentId,
        type: 'handicap_changed',
        message: `${existing.displayName} handicap changed: ${existing.groupHandicap} → ${updates.groupHandicap}`,
        playerId: existing.id,
      })
    }

    set((state) => {
      const updatedPlayers = state.players.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      )

      // If email was updated, re-link invites
      const updatedPlayer = updatedPlayers.find((p) => p.id === id)
      const invites =
        updates.email !== undefined && updatedPlayer
          ? autoLinkInviteToPlayer(state.invites, updatedPlayer)
          : state.invites

      return { players: updatedPlayers, invites }
    })
  },

  removePlayer: (id) => {
    set((state) => ({
      players: state.players.map((p) =>
        p.id === id ? { ...p, active: false } : p
      ),
    }))
  },

  sendInvite: (tournamentId, email, role = 'player') => {
    // Check if a player with this email already exists → auto-link
    const existingPlayer = get().getPlayerByEmail(tournamentId, email)

    const invite: Invite = {
      id: `invite-${String(nextInviteId++).padStart(3, '0')}`,
      tournamentId,
      email,
      role,
      token: `mock-token-${Date.now()}`,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      linkedPlayerId: existingPlayer?.id,
    }
    set((state) => ({
      invites: [...state.invites, invite],
    }))
    return invite
  },

  acceptInvite: (inviteId) => {
    const invite = get().invites.find((i) => i.id === inviteId)
    if (!invite || invite.status !== 'pending') return

    set((state) => {
      const now = new Date().toISOString()
      let players = state.players

      // If invite is linked to a player, update the player's userId
      // (simulating the user account being connected on acceptance)
      if (invite.linkedPlayerId) {
        players = players.map((p) =>
          p.id === invite.linkedPlayerId
            ? { ...p, email: p.email || invite.email }
            : p
        )
      } else {
        // No linked player — create a new player from the invite
        const newPlayer: Player = {
          id: `player-${String(nextPlayerId++).padStart(3, '0')}`,
          tournamentId: invite.tournamentId,
          userId: `user-${String(nextPlayerId).padStart(3, '0')}`,
          displayName: invite.email.split('@')[0],
          email: invite.email,
          groupHandicap: 18,
          active: true,
          createdAt: now,
        }
        players = [...players, newPlayer]

        // Update the invite with the new player's id
        return {
          players,
          invites: state.invites.map((i) =>
            i.id === inviteId
              ? {
                  ...i,
                  status: 'accepted' as const,
                  acceptedAt: now,
                  linkedPlayerId: newPlayer.id,
                }
              : i
          ),
        }
      }

      return {
        players,
        invites: state.invites.map((i) =>
          i.id === inviteId
            ? { ...i, status: 'accepted' as const, acceptedAt: now }
            : i
        ),
      }
    })
  },
}))
