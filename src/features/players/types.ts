export interface Player {
  id: string
  tournamentId: string
  userId: string
  displayName: string
  nickname?: string
  groupHandicap: number
  active: boolean
  createdAt: string
}

export interface CreatePlayerInput {
  displayName: string
  nickname?: string
  groupHandicap: number
}

export interface UpdatePlayerInput {
  displayName?: string
  nickname?: string
  groupHandicap?: number
  active?: boolean
}

export type InviteStatus = 'pending' | 'accepted' | 'expired'

export interface Invite {
  id: string
  tournamentId: string
  email: string
  role: 'admin' | 'player'
  token: string
  expiresAt: string
  acceptedAt?: string
  status: InviteStatus
}
