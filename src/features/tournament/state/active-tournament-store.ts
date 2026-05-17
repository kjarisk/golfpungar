import { create } from 'zustand'

interface ActiveTournamentState {
  /** The tournament the user has selected; null = use the resolved default. */
  selectedTournamentId: string | null
  setActiveTournament: (id: string | null) => void
}

export const useActiveTournamentStore = create<ActiveTournamentState>(
  (set) => ({
    selectedTournamentId: null,
    setActiveTournament: (id) => set({ selectedTournamentId: id }),
  })
)
