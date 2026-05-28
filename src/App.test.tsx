/// <reference types="vitest/globals" />
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signOut: vi.fn().mockResolvedValue({ error: null }),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
    // Realtime subscriptions (Phase 29) — chainable channel stub.
    channel: vi.fn(() => {
      const ch: Record<string, unknown> = {}
      ch.on = vi.fn(() => ch)
      ch.subscribe = vi.fn(() => ch)
      return ch
    }),
    removeChannel: vi.fn(),
    // Every table query (e.g. tournaments) resolves to an empty result.
    from: vi.fn(() => {
      const result = { data: [], error: null }
      const chain: Record<string, unknown> = {}
      for (const method of ['select', 'order', 'eq', 'insert', 'update']) {
        chain[method] = vi.fn(() => chain)
      }
      chain.single = vi.fn(() => Promise.resolve(result))
      chain.maybeSingle = vi.fn(() => Promise.resolve(result))
      chain.then = (resolve: (value: typeof result) => unknown) =>
        Promise.resolve(result).then(resolve)
      return chain
    }),
  },
}))

import App from './App'
import { useAuthStore } from '@/features/auth'
import type { User } from '@/features/auth'

const TEST_USER: User = {
  id: 'u-test',
  email: 'kjartan@example.com',
  displayName: 'Kjartan',
  role: 'admin',
  createdAt: '2026-01-01T00:00:00Z',
}

function renderApp() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  )
}

describe('App', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/feed')
    // The auth listener is mocked to a no-op, so seed an authenticated session.
    useAuthStore.setState({
      user: TEST_USER,
      isAuthenticated: true,
      isLoading: false,
    })
  })

  it('renders the app shell with bottom navigation', () => {
    renderApp()
    const nav = screen.getByRole('navigation')
    expect(nav).toBeInTheDocument()

    // Check nav links within the navigation bar
    const navLinks = nav.querySelectorAll('a')
    const navLabels = Array.from(navLinks).map(
      (link) => link.textContent?.trim() ?? ''
    )
    // Feed link may include badge count text (e.g. "2Feed"), so check with includes
    expect(navLabels.some((l) => l.includes('Feed'))).toBe(true)
    expect(navLabels.some((l) => l.includes('Enter'))).toBe(true)
    expect(navLabels.some((l) => l.includes('Leaders'))).toBe(true)
    expect(navLabels.some((l) => l.includes('Rounds'))).toBe(true)
    expect(navLabels.some((l) => l.includes('Bets'))).toBe(true)
  })

  it('shows the no-active-tournament empty state on the feed page', () => {
    renderApp()
    // With no tournaments in the database, the feed shows an empty state.
    expect(
      screen.getByRole('heading', {
        name: /good (morning|afternoon|evening), kjartan/i,
      })
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        (_, el) =>
          el?.tagName === 'P' &&
          /no active tournament\.\s*create one to get started\./i.test(
            el.textContent ?? ''
          )
      )
    ).toBeInTheDocument()
  })
})
