import { create } from 'zustand'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { AuthState, User } from '../types'

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => set({ user, isAuthenticated: user !== null }),
  setLoading: (isLoading) => set({ isLoading }),

  logout: async () => {
    // Clear optimistically so the UI redirects immediately; the SIGNED_OUT
    // event from onAuthStateChange then confirms it.
    set({ user: null, isAuthenticated: false })
    await supabase.auth.signOut()
  },
}))

/** Compose the app User from a Supabase session and its profile row. */
async function resolveUser(session: Session): Promise<User> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, role, email')
    .eq('id', session.user.id)
    .maybeSingle()

  const email = profile?.email ?? session.user.email ?? ''
  return {
    id: session.user.id,
    email,
    displayName: profile?.display_name || email.split('@')[0] || 'Player',
    role: profile?.role ?? 'player',
    createdAt: session.user.created_at,
  }
}

/**
 * Wire the Zustand auth store to Supabase auth. Call once at app start; the
 * returned function unsubscribes. `onAuthStateChange` emits an INITIAL_SESSION
 * event immediately, which resolves the initial loading state.
 */
export function initAuth(): () => void {
  const { setUser, setLoading } = useAuthStore.getState()

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    if (!session) {
      setUser(null)
      setLoading(false)
      return
    }
    // Defer DB work — awaiting Supabase calls inside this callback can deadlock.
    void resolveUser(session).then((user) => {
      setUser(user)
      setLoading(false)
    })
  })

  return () => subscription.unsubscribe()
}
