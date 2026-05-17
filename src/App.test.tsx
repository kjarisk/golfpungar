/// <reference types="vitest/globals" />
import { render, screen } from '@testing-library/react'

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
    render(<App />)
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

  it('shows the feed page with tournament name by default', () => {
    render(<App />)
    // With mock data, we should see the tournament name
    expect(
      screen.getByRole('heading', { name: /spain 2026/i })
    ).toBeInTheDocument()
    // And the welcome message (time-of-day greeting)
    expect(
      screen.getByText(/good (morning|afternoon|evening), kjartan/i)
    ).toBeInTheDocument()
  })
})
