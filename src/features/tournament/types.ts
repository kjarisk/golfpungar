export type TournamentStatus = 'draft' | 'live' | 'done'

export interface Tournament {
  id: string
  name: string
  location?: string
  startDate: string
  endDate: string
  status: TournamentStatus
  createdByUserId: string
  createdAt: string
}

export interface CreateTournamentInput {
  name: string
  location?: string
  startDate: string
  endDate: string
}
