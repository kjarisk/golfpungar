/// <reference types="vitest/globals" />
import { useCountriesStore } from './state/countries-store'

describe('Countries Store', () => {
  beforeEach(() => {
    useCountriesStore.setState({ countries: [] })
  })

  it('starts with an empty list', () => {
    const { countries } = useCountriesStore.getState()
    expect(countries).toHaveLength(0)
  })

  it('adds a country', () => {
    const { addCountry } = useCountriesStore.getState()
    const country = addCountry('Spain')

    expect(country).not.toBeNull()
    expect(country?.name).toBe('Spain')
    expect(useCountriesStore.getState().countries).toHaveLength(1)
  })

  it('prevents duplicate countries (case-insensitive)', () => {
    const { addCountry } = useCountriesStore.getState()
    const first = addCountry('Spain')
    const duplicate = addCountry('spain')

    expect(first?.id).toBe(duplicate?.id)
    expect(useCountriesStore.getState().countries).toHaveLength(1)
  })

  it('returns null for empty name', () => {
    const { addCountry } = useCountriesStore.getState()
    const result = addCountry('   ')

    expect(result).toBeNull()
    expect(useCountriesStore.getState().countries).toHaveLength(0)
  })

  it('removes a country', () => {
    const { addCountry } = useCountriesStore.getState()
    const country = addCountry('Portugal')!

    useCountriesStore.getState().removeCountry(country.id)
    expect(useCountriesStore.getState().countries).toHaveLength(0)
  })

  it('supports multiple countries', () => {
    const { addCountry } = useCountriesStore.getState()
    addCountry('Spain')
    addCountry('Portugal')
    addCountry('Scotland')

    expect(useCountriesStore.getState().countries).toHaveLength(3)
    const names = useCountriesStore.getState().countries.map((c) => c.name)
    expect(names).toContain('Spain')
    expect(names).toContain('Portugal')
    expect(names).toContain('Scotland')
  })

  it('trims whitespace from country names', () => {
    const { addCountry } = useCountriesStore.getState()
    const country = addCountry('  Spain  ')

    expect(country?.name).toBe('Spain')
  })
})
