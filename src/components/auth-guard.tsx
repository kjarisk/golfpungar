import { Navigate, Outlet } from 'react-router'
import { useAuthStore } from '@/features/auth/state/auth-store'

/**
 * Route guard that redirects unauthenticated users to /login.
 * Wrap protected routes with this as a layout route.
 *
 * In dev mode the mock auth store auto-logs in, so this is a no-op.
 * When Supabase is connected, this will check the real session.
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
