export interface Player {
  id: string
  tournamentId: string
  personId: string
  /** Denormalized from the joined person row */
  userId: string
  /** Denormalized from the joined person row */
  displayName: string
  /** Denormalized */
  nickname?: string
  /** Denormalized */
  email?: string
  groupHandicap: number
  active: boolean
  createdAt: string
}

/** Pure participation creation — picks an existing person. */
export interface CreatePlayerInput {
  personId: string
  groupHandicap: number
}

/** Tournament-participation updates only. Identity edits go through usePersons. */
export interface UpdatePlayerInput {
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
  /** Linked person ID — set when a person with matching email exists */
  linkedPersonId?: string
}
