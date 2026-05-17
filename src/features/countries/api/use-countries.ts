import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createCountry, deleteCountry, fetchCountries } from './countries-api'

export const countriesQueryKey = ['countries'] as const

export function useCountries() {
  return useQuery({
    queryKey: countriesQueryKey,
    queryFn: fetchCountries,
  })
}

export function useCreateCountry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createCountry,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: countriesQueryKey })
    },
  })
}

export function useDeleteCountry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteCountry,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: countriesQueryKey })
    },
  })
}
