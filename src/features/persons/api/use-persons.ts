import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { UpdatePersonInput } from '../types'
import {
  createPerson,
  fetchPersons,
  removePerson,
  updatePerson,
} from './persons-api'

export const personsQueryKey = ['persons'] as const

export function usePersons() {
  return useQuery({ queryKey: personsQueryKey, queryFn: fetchPersons })
}

export function usePerson(id: string | null | undefined) {
  const { data: persons } = usePersons()
  return persons?.find((p) => p.id === id)
}

export function useCreatePerson() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createPerson,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: personsQueryKey })
    },
  })
}

export function useUpdatePerson() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdatePersonInput }) =>
      updatePerson(id, updates),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: personsQueryKey })
    },
  })
}

export function useRemovePerson() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: removePerson,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: personsQueryKey })
    },
  })
}
