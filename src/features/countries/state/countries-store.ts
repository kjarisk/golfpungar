import { create } from 'zustand'
import type { Country } from '../types'

interface CountriesState {
  countries: Country[]

  // Actions
  addCountry: (name: string) => Country | null
  removeCountry: (id: string) => void
}

let nextId = 1

export const useCountriesStore = create<CountriesState>((set, get) => ({
  countries: [],

  addCountry: (name) => {
    const trimmed = name.trim()
    if (!trimmed) return null

    // Prevent duplicates (case-insensitive)
    const existing = get().countries.find(
      (c) => c.name.toLowerCase() === trimmed.toLowerCase()
    )
    if (existing) return existing

    const country: Country = {
      id: `country-${String(nextId++).padStart(3, '0')}`,
      name: trimmed,
      createdAt: new Date().toISOString(),
    }
    set((state) => ({
      countries: [...state.countries, country],
    }))
    return country
  },

  removeCountry: (id) => {
    set((state) => ({
      countries: state.countries.filter((c) => c.id !== id),
    }))
  },
}))
