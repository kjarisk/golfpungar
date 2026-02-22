import { create } from 'zustand'
import type {
  Tournament,
  TournamentStatus,
  CreateTournamentInput,
} from '../types'
import { TEST_USER } from '@/features/auth'

interface TournamentState {
  tournaments: Tournament[]
  activeTournamentId: string | null

  // Derived
  activeTournament: () => Tournament | undefined

  // Actions
  createTournament: (input: CreateTournamentInput) => Tournament
  updateTournament: (
    id: string,
    updates: Partial<
      Pick<Tournament, 'name' | 'location' | 'startDate' | 'endDate'>
    >
  ) => void
  setStatus: (id: string, status: TournamentStatus) => void
  setActiveTournament: (id: string | null) => void
}

const MOCK_TOURNAMENT: Tournament = {
  id: 'tournament-001',
  name: 'Spain 2026',
  location: 'Marbella, Spain',
  startDate: '2026-06-15',
  endDate: '2026-06-20',
  status: 'live',
  createdByUserId: TEST_USER.id,
  createdAt: '2026-01-15T10:00:00Z',
}

let nextId = 2

export const useTournamentStore = create<TournamentState>((set, get) => ({
  tournaments: [MOCK_TOURNAMENT],
  activeTournamentId: MOCK_TOURNAMENT.id,

  activeTournament: () => {
    const { tournaments, activeTournamentId } = get()
    return tournaments.find((t) => t.id === activeTournamentId)
  },

  createTournament: (input) => {
    const tournament: Tournament = {
      id: `tournament-${String(nextId++).padStart(3, '0')}`,
      ...input,
      status: 'draft',
      createdByUserId: TEST_USER.id,
      createdAt: new Date().toISOString(),
    }
    set((state) => ({
      tournaments: [...state.tournaments, tournament],
      activeTournamentId: tournament.id,
    }))
    return tournament
  },

  updateTournament: (id, updates) => {
    set((state) => ({
      tournaments: state.tournaments.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      ),
    }))
  },

  setStatus: (id, status) => {
    set((state) => ({
      tournaments: state.tournaments.map((t) =>
        t.id === id ? { ...t, status } : t
      ),
    }))
  },

  setActiveTournament: (id) => {
    set({ activeTournamentId: id })
  },
}))
