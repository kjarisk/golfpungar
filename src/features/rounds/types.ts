export type RoundFormat = 'scramble' | 'stableford' | 'bestball' | 'handicap'
export type RoundStatus = 'upcoming' | 'active' | 'completed'

export interface Round {
  id: string
  tournamentId: string
  courseId: string
  name: string
  dateTime?: string
  format: RoundFormat
  holesPlayed: 9 | 18
  status: RoundStatus
  /** Custom points table for this round. When undefined, uses DEFAULT_POINTS. */
  pointsTable?: number[]
  /** Soft-deleted rounds are hidden from players but visible to admin */
  deleted?: boolean
  createdAt: string
}

export interface Group {
  id: string
  roundId: string
  name: string
  playerIds: string[]
}

export interface Team {
  id: string
  roundId: string
  name: string
  playerIds: string[]
}

export interface CreateRoundInput {
  courseId: string
  name: string
  dateTime?: string
  format: RoundFormat
  holesPlayed: 9 | 18
  pointsTable?: number[]
  groups: { name: string; playerIds: string[] }[]
  teams?: { name: string; playerIds: string[] }[]
}
