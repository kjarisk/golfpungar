/// <reference types="vitest/globals" />
import { render, screen } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('renders the app shell with bottom navigation', () => {
    render(<App />)
    expect(screen.getByRole('navigation')).toBeInTheDocument()

    // Check nav links by role (these are <a> elements via NavLink)
    const navLinks = screen.getAllByRole('link')
    const navLabels = navLinks.map((link) => link.textContent)
    expect(navLabels).toContain('Feed')
    expect(navLabels).toContain('Enter')
    expect(navLabels).toContain('Leaders')
    expect(navLabels).toContain('Rounds')
    expect(navLabels).toContain('Players')
  })

  it('shows the feed page with tournament name by default', () => {
    render(<App />)
    // With mock data, we should see the tournament name
    expect(
      screen.getByRole('heading', { name: /spain 2026/i })
    ).toBeInTheDocument()
    // And the welcome message
    expect(screen.getByText(/welcome back, kjartan/i)).toBeInTheDocument()
  })
})
