export interface Person {
  id: string
  displayName: string
  nickname?: string
  email?: string
  /** Linked auth user once they've signed up; undefined for "pool" people */
  userId?: string
  currentHandicap: number
  createdAt: string
}

export interface CreatePersonInput {
  displayName: string
  nickname?: string
  email?: string
  currentHandicap?: number
}

export interface UpdatePersonInput {
  displayName?: string
  nickname?: string
  email?: string
  currentHandicap?: number
}
