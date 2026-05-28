export type UserRole = 'admin' | 'player'

export interface User {
  id: string
  email: string
  displayName: string
  role: UserRole
  createdAt: string
}

export interface AuthState {
  /** The signed-in user, composed from the Supabase session + profile row. */
  user: User | null
  isAuthenticated: boolean
  /** True until the initial session check resolves. */
  isLoading: boolean
  /** Replace the current user — called by the auth listener. */
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  /** Sign out of Supabase. */
  logout: () => Promise<void>
}
