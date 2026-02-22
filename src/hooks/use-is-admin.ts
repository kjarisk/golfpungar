import { useAuthStore } from '@/features/auth'

/**
 * Returns true if the current user has the 'admin' role.
 * Use this hook to conditionally render admin-only UI elements.
 */
export function useIsAdmin(): boolean {
  const role = useAuthStore((s) => s.user?.role)
  return role === 'admin'
}
