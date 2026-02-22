/// <reference types="vitest/globals" />
import { renderHook, act } from '@testing-library/react'
import { useAuthStore, TEST_USER } from '@/features/auth'
import { useIsAdmin } from '@/hooks/use-is-admin'

describe('useIsAdmin hook', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: { ...TEST_USER, role: 'admin' },
      isAuthenticated: true,
      isLoading: false,
    })
  })

  it('returns true when user is admin', () => {
    const { result } = renderHook(() => useIsAdmin())
    expect(result.current).toBe(true)
  })

  it('returns false when user is player', () => {
    useAuthStore.setState({
      user: { ...TEST_USER, role: 'player' },
    })
    const { result } = renderHook(() => useIsAdmin())
    expect(result.current).toBe(false)
  })

  it('returns false when no user is logged in', () => {
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
    })
    const { result } = renderHook(() => useIsAdmin())
    expect(result.current).toBe(false)
  })

  it('updates reactively when role changes via setRole', () => {
    const { result: adminResult } = renderHook(() => useIsAdmin())
    expect(adminResult.current).toBe(true)

    act(() => {
      useAuthStore.getState().setRole('player')
    })

    const { result: playerResult } = renderHook(() => useIsAdmin())
    expect(playerResult.current).toBe(false)
  })
})

describe('auth store role management', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: { ...TEST_USER, role: 'admin' },
      isAuthenticated: true,
      isLoading: false,
    })
  })

  it('TEST_USER defaults to admin role', () => {
    expect(TEST_USER.role).toBe('admin')
  })

  it('setRole updates user role to player', () => {
    useAuthStore.getState().setRole('player')
    expect(useAuthStore.getState().user?.role).toBe('player')
  })

  it('setRole updates user role back to admin', () => {
    useAuthStore.getState().setRole('player')
    useAuthStore.getState().setRole('admin')
    expect(useAuthStore.getState().user?.role).toBe('admin')
  })

  it('setRole does nothing when user is null', () => {
    useAuthStore.setState({ user: null })
    useAuthStore.getState().setRole('admin')
    expect(useAuthStore.getState().user).toBeNull()
  })

  it('login preserves role from user object', () => {
    const playerUser = {
      ...TEST_USER,
      id: 'player-002',
      role: 'player' as const,
    }
    useAuthStore.getState().login(playerUser)
    expect(useAuthStore.getState().user?.role).toBe('player')
  })

  it('logout clears user including role', () => {
    useAuthStore.getState().logout()
    expect(useAuthStore.getState().user).toBeNull()
  })
})
