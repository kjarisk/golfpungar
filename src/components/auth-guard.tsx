import { Navigate, Outlet } from 'react-router'
import { useAuthStore } from '@/features/auth/state/auth-store'

/**
 * Route guard that redirects unauthenticated users to /login.
 * Wrap protected routes with this as a layout route.
 *
 * Reads the auth store, which `initAuth()` keeps in sync with the Supabase
 * session. Shows a spinner until the initial session check resolves.
 */
export function AuthGuard() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isLoading = useAuthStore((s) => s.isLoading)

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
