/// <reference types="vitest/globals" />
import { render, screen } from '@testing-library/react'
import App from './App'

describe('App', () => {
  beforeEach(() => {
    // Set URL to match BrowserRouter basename for GitHub Pages
    window.history.pushState({}, '', '/golfpungar/feed')
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
    expect(navLabels.some((l) => l.includes('Players'))).toBe(true)
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
