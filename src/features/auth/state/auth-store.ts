import { create } from 'zustand'
import type { AuthState, User } from '../types'

/**
 * Test account used during development to skip the login flow.
 * Replace with real Supabase auth in a later phase.
 */
export const TEST_USER: User = {
  id: 'test-admin-001',
  email: 'kjartan@test.com',
  displayName: 'Kjartan',
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
}))
