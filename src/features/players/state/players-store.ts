import { create } from 'zustand'
import type {
  Player,
  CreatePlayerInput,
  UpdatePlayerInput,
  Invite,
} from '../types'

interface PlayersState {
  players: Player[]
  invites: Invite[]

  // Derived
  getPlayersByTournament: (tournamentId: string) => Player[]
  getActivePlayers: (tournamentId: string) => Player[]
  getInvitesByTournament: (tournamentId: string) => Invite[]

  // Actions
  addPlayer: (tournamentId: string, input: CreatePlayerInput) => Player
  updatePlayer: (id: string, updates: UpdatePlayerInput) => void
  removePlayer: (id: string) => void
  sendInvite: (
    tournamentId: string,
    email: string,
    role?: 'admin' | 'player'
  ) => Invite
}

const MOCK_PLAYERS: Player[] = [
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
  {
    id: 'player-003',
    tournamentId: 'tournament-001',
    userId: 'user-003',
    displayName: 'Magnus',
    nickname: 'Maggi',
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
    groupHandicap: 15,
    active: true,
    createdAt: '2026-01-17T10:00:00Z',
  },
  {
    id: 'player-005',
    tournamentId: 'tournament-001',
    userId: 'user-005',
    displayName: 'Gunnar',
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

export const usePlayersStore = create<PlayersState>((set, get) => ({
  players: MOCK_PLAYERS,
  invites: MOCK_INVITES,

  getPlayersByTournament: (tournamentId) =>
    get().players.filter((p) => p.tournamentId === tournamentId),

  getActivePlayers: (tournamentId) =>
    get().players.filter((p) => p.tournamentId === tournamentId && p.active),

  getInvitesByTournament: (tournamentId) =>
    get().invites.filter((i) => i.tournamentId === tournamentId),

  addPlayer: (tournamentId, input) => {
    const player: Player = {
      id: `player-${String(nextPlayerId++).padStart(3, '0')}`,
      tournamentId,
      userId: `user-${String(nextPlayerId).padStart(3, '0')}`,
      displayName: input.displayName,
      nickname: input.nickname,
      groupHandicap: input.groupHandicap,
      active: true,
      createdAt: new Date().toISOString(),
    }
    set((state) => ({
      players: [...state.players, player],
    }))
    return player
  },

  updatePlayer: (id, updates) => {
    set((state) => ({
      players: state.players.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
    }))
  },

  removePlayer: (id) => {
    set((state) => ({
      players: state.players.map((p) =>
        p.id === id ? { ...p, active: false } : p
      ),
    }))
  },

  sendInvite: (tournamentId, email, role = 'player') => {
    const invite: Invite = {
      id: `invite-${String(nextInviteId++).padStart(3, '0')}`,
      tournamentId,
      email,
      role,
      token: `mock-token-${Date.now()}`,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
    }
    set((state) => ({
      invites: [...state.invites, invite],
    }))
    return invite
  },
}))
