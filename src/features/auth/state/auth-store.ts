import { create } from 'zustand'
import type { AuthState, User, UserRole } from '../types'

/**
 * Test account used during development to skip the login flow.
 * Replace with real Supabase auth in a later phase.
 */
export const TEST_USER: User = {
  id: 'test-admin-001',
  email: 'kjartan@test.com',
  displayName: 'Kjartan',
  role: 'admin',
  createdAt: new Date().toISOString(),
}

export const useAuthStore = create<AuthState>((set) => ({
  // Auto-login with test account during development
  user: TEST_USER,
  isAuthenticated: true,
  isLoading: false,

  login: (user: User) =>
    set({
      user,
      isAuthenticated: true,
      isLoading: false,
    }),

  logout: () =>
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    }),

  /** Dev helper: switch role without logging out */
  setRole: (role: UserRole) =>
    set((state) => ({
      user: state.user ? { ...state.user, role } : null,
    })),
}))
