/// <reference types="vitest/globals" />
import { useTournamentStore } from './state/tournament-store'

describe('Tournament Store', () => {
  beforeEach(() => {
    // Reset store to initial state
    useTournamentStore.setState({
      tournaments: [
        {
          id: 'tournament-001',
          name: 'Spain 2026',
          location: 'Marbella, Spain',
          startDate: '2026-06-15',
          endDate: '2026-06-20',
          status: 'live',
          createdByUserId: 'test-admin-001',
          createdAt: '2026-01-15T10:00:00Z',
        },
      ],
      activeTournamentId: 'tournament-001',
    })
  })

  it('has the mock tournament loaded by default', () => {
    const { tournaments, activeTournamentId } = useTournamentStore.getState()
    expect(tournaments).toHaveLength(1)
    expect(tournaments[0].name).toBe('Spain 2026')
    expect(activeTournamentId).toBe('tournament-001')
  })

  it('returns the active tournament', () => {
    const tournament = useTournamentStore.getState().activeTournament()
    expect(tournament).toBeDefined()
    expect(tournament?.name).toBe('Spain 2026')
    expect(tournament?.status).toBe('live')
  })

  it('creates a new tournament', () => {
    const { createTournament } = useTournamentStore.getState()
    const newTournament = createTournament({
      name: 'Portugal 2027',
      location: 'Algarve',
      startDate: '2027-05-01',
      endDate: '2027-05-06',
    })

    expect(newTournament.name).toBe('Portugal 2027')
    expect(newTournament.status).toBe('draft')
    expect(newTournament.location).toBe('Algarve')

    const { tournaments, activeTournamentId } = useTournamentStore.getState()
    expect(tournaments).toHaveLength(2)
    // Should auto-set the new tournament as active
    expect(activeTournamentId).toBe(newTournament.id)
  })

  it('updates a tournament', () => {
    const { updateTournament } = useTournamentStore.getState()
    updateTournament('tournament-001', { name: 'Spain Trip 2026' })

    const tournament = useTournamentStore.getState().activeTournament()
    expect(tournament?.name).toBe('Spain Trip 2026')
  })

  it('changes tournament status', () => {
    const { setStatus } = useTournamentStore.getState()
    setStatus('tournament-001', 'done')

    const tournament = useTournamentStore.getState().activeTournament()
    expect(tournament?.status).toBe('done')
  })

  it('switches active tournament', () => {
    const { createTournament, setActiveTournament } =
      useTournamentStore.getState()
    createTournament({
      name: 'Portugal 2027',
      startDate: '2027-05-01',
      endDate: '2027-05-06',
    })

    setActiveTournament('tournament-001')
    const tournament = useTournamentStore.getState().activeTournament()
    expect(tournament?.name).toBe('Spain 2026')
  })

  // --- Multi-tournament tests (Phase 13) ---

  it('supports multiple tournaments', () => {
    const { createTournament } = useTournamentStore.getState()
    createTournament({
      name: 'Portugal 2025',
      location: 'Algarve',
      startDate: '2025-09-01',
      endDate: '2025-09-05',
    })
    createTournament({
      name: 'Scotland 2027',
      startDate: '2027-07-10',
      endDate: '2027-07-15',
    })

    const { tournaments } = useTournamentStore.getState()
    expect(tournaments).toHaveLength(3)
    expect(tournaments.map((t) => t.name)).toContain('Spain 2026')
    expect(tournaments.map((t) => t.name)).toContain('Portugal 2025')
    expect(tournaments.map((t) => t.name)).toContain('Scotland 2027')
  })

  it('activeTournament returns null when activeTournamentId is empty', () => {
    useTournamentStore.setState({ activeTournamentId: '' })
    const tournament = useTournamentStore.getState().activeTournament()
    expect(tournament).toBeUndefined()
  })

  it('activeTournament returns null when activeTournamentId does not match', () => {
    useTournamentStore.setState({ activeTournamentId: 'nonexistent' })
    const tournament = useTournamentStore.getState().activeTournament()
    expect(tournament).toBeUndefined()
  })

  it('switching to a done tournament still returns it as active', () => {
    const { createTournament, setStatus, setActiveTournament } =
      useTournamentStore.getState()
    const past = createTournament({
      name: 'Portugal 2025',
      startDate: '2025-09-01',
      endDate: '2025-09-05',
    })
    setStatus(past.id, 'done')
    setActiveTournament(past.id)

    const active = useTournamentStore.getState().activeTournament()
    expect(active?.name).toBe('Portugal 2025')
    expect(active?.status).toBe('done')
  })

  it('new tournament defaults to draft status', () => {
    const { createTournament } = useTournamentStore.getState()
    const t = createTournament({
      name: 'Test Tournament',
      startDate: '2026-01-01',
      endDate: '2026-01-05',
    })
    expect(t.status).toBe('draft')
  })

  it('setActiveTournament updates the activeTournamentId', () => {
    const { createTournament, setActiveTournament } =
      useTournamentStore.getState()
    const t2 = createTournament({
      name: 'Second',
      startDate: '2026-03-01',
      endDate: '2026-03-05',
    })
    // After creation, t2 is active
    expect(useTournamentStore.getState().activeTournamentId).toBe(t2.id)

    // Switch back
    setActiveTournament('tournament-001')
    expect(useTournamentStore.getState().activeTournamentId).toBe(
      'tournament-001'
    )
  })

  // --- removeTournament tests (IP7 WP1) ---

  it('removes a tournament', () => {
    const { createTournament, removeTournament } = useTournamentStore.getState()
    createTournament({
      name: 'To Delete',
      startDate: '2026-04-01',
      endDate: '2026-04-05',
    })
    expect(useTournamentStore.getState().tournaments).toHaveLength(2)

    const toDelete = useTournamentStore
      .getState()
      .tournaments.find((t) => t.name === 'To Delete')!
    removeTournament(toDelete.id)
    expect(useTournamentStore.getState().tournaments).toHaveLength(1)
    expect(useTournamentStore.getState().tournaments[0].name).toBe('Spain 2026')
  })

  it('reassigns active to first live tournament when active is removed', () => {
    const {
      createTournament,
      setStatus,
      setActiveTournament,
      removeTournament,
    } = useTournamentStore.getState()
    const t2 = createTournament({
      name: 'Second',
      startDate: '2026-04-01',
      endDate: '2026-04-05',
    })
    setStatus(t2.id, 'live')
    // Make t2 active, then delete it — should fall back to tournament-001 (live)
    setActiveTournament(t2.id)
    removeTournament(t2.id)
    expect(useTournamentStore.getState().activeTournamentId).toBe(
      'tournament-001'
    )
  })

  it('sets active to null when no live tournaments remain after removal', () => {
    const { removeTournament, setStatus } = useTournamentStore.getState()
    // Change the only tournament to draft so no live ones remain
    setStatus('tournament-001', 'draft')
    removeTournament('tournament-001')
    expect(useTournamentStore.getState().activeTournamentId).toBeNull()
  })

  it('creates tournament with countryId', () => {
    const { createTournament } = useTournamentStore.getState()
    const t = createTournament({
      name: 'Portugal Trip',
      countryId: 'country-001',
      startDate: '2027-05-01',
      endDate: '2027-05-06',
    })
    expect(t.countryId).toBe('country-001')
  })

  it('updates tournament countryId', () => {
    const { updateTournament } = useTournamentStore.getState()
    updateTournament('tournament-001', { countryId: 'country-002' })
    const t = useTournamentStore.getState().activeTournament()
    expect(t?.countryId).toBe('country-002')
  })
})
