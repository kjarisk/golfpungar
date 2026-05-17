/// <reference types="vitest/globals" />
import { renderHook, act } from '@testing-library/react'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signOut: vi.fn().mockResolvedValue({ error: null }),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
    from: vi.fn(),
  },
}))

import { useAuthStore } from '@/features/auth'
import type { User } from '@/features/auth'
import { useIsAdmin } from '@/hooks/use-is-admin'
import { supabase } from '@/lib/supabase'

const ADMIN_USER: User = {
  id: 'u-admin',
  email: 'admin@example.com',
  displayName: 'Admin',
  role: 'admin',
  createdAt: '2026-01-01T00:00:00Z',
}

describe('useIsAdmin hook', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: ADMIN_USER,
      isAuthenticated: true,
      isLoading: false,
    })
  })

  it('returns true when the user is an admin', () => {
    const { result } = renderHook(() => useIsAdmin())
    expect(result.current).toBe(true)
  })

  it('returns false when the user is a player', () => {
    useAuthStore.setState({ user: { ...ADMIN_USER, role: 'player' } })
    const { result } = renderHook(() => useIsAdmin())
    expect(result.current).toBe(false)
  })

  it('returns false when no user is signed in', () => {
    useAuthStore.setState({ user: null, isAuthenticated: false })
    const { result } = renderHook(() => useIsAdmin())
    expect(result.current).toBe(false)
  })

  it('updates reactively when the role changes via setRole', () => {
    const { result } = renderHook(() => useIsAdmin())
    expect(result.current).toBe(true)
    act(() => useAuthStore.getState().setRole('player'))
    expect(result.current).toBe(false)
  })
})

describe('auth store', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: ADMIN_USER,
      isAuthenticated: true,
      isLoading: false,
    })
    vi.clearAllMocks()
  })

  it('setUser stores the user and marks the session authenticated', () => {
    useAuthStore.getState().setUser({ ...ADMIN_USER, role: 'player' })
    expect(useAuthStore.getState().user?.role).toBe('player')
    expect(useAuthStore.getState().isAuthenticated).toBe(true)
  })

  it('setUser(null) clears the user and authentication', () => {
    useAuthStore.getState().setUser(null)
    expect(useAuthStore.getState().user).toBeNull()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })

  it('setRole updates the current user role', () => {
    useAuthStore.getState().setRole('player')
    expect(useAuthStore.getState().user?.role).toBe('player')
  })

  it('setRole does nothing when no user is signed in', () => {
    useAuthStore.setState({ user: null })
    useAuthStore.getState().setRole('admin')
    expect(useAuthStore.getState().user).toBeNull()
  })

  it('logout clears the user and calls supabase signOut', async () => {
    await useAuthStore.getState().logout()
    expect(useAuthStore.getState().user).toBeNull()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(supabase.auth.signOut).toHaveBeenCalledOnce()
  })
})
