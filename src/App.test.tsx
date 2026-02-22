/// <reference types="vitest/globals" />
import { render, screen } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('renders the start page', () => {
    render(<App />)
    expect(
      screen.getByRole('heading', { name: /ready to build/i })
    ).toBeInTheDocument()
  })
})
