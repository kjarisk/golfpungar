import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createSideEvent,
  fetchSideEvents,
  removeSideEvent,
} from './side-events-api'
import {
  createEvidenceImage,
  fetchEvidenceImages,
  removeEvidenceImage,
} from './evidence-images-api'
import type { SideEventLog, EvidenceImage, SideEventType } from '../types'

export const sideEventsQueryKey = ['side-events'] as const
export const evidenceImagesQueryKey = ['evidence-images'] as const

// --- Side events ---

export function useSideEvents() {
  return useQuery({
    queryKey: sideEventsQueryKey,
    queryFn: fetchSideEvents,
  })
}

export function useSideEventsByTournament(
  tournamentId: string | null | undefined
): SideEventLog[] {
  const { data: events = [] } = useSideEvents()
  if (!tournamentId) return []
  return events.filter((e) => e.tournamentId === tournamentId)
}

export function useSideEventsByRound(
  roundId: string | null | undefined
): SideEventLog[] {
  const { data: events = [] } = useSideEvents()
  if (!roundId) return []
  return events.filter((e) => e.roundId === roundId)
}

export function useSideEventsByType(
  tournamentId: string | null | undefined,
  type: SideEventType
): SideEventLog[] {
  const { data: events = [] } = useSideEvents()
  if (!tournamentId) return []
  return events.filter(
    (e) => e.tournamentId === tournamentId && e.type === type
  )
}

export function useCreateSideEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createSideEvent,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: sideEventsQueryKey })
    },
  })
}

export function useRemoveSideEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: removeSideEvent,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: sideEventsQueryKey })
      // Evidence images cascade-delete on the DB, refresh the cache.
      void queryClient.invalidateQueries({ queryKey: evidenceImagesQueryKey })
    },
  })
}

// --- Evidence images ---

export function useEvidenceImages() {
  return useQuery({
    queryKey: evidenceImagesQueryKey,
    queryFn: fetchEvidenceImages,
  })
}

export function useEvidenceImagesForEvent(
  sideEventLogId: string | null | undefined
): EvidenceImage[] {
  const { data: images = [] } = useEvidenceImages()
  if (!sideEventLogId) return []
  return images.filter((img) => img.sideEventLogId === sideEventLogId)
}

export function useCreateEvidenceImage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createEvidenceImage,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: evidenceImagesQueryKey })
    },
  })
}

export function useRemoveEvidenceImage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: removeEvidenceImage,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: evidenceImagesQueryKey })
    },
  })
}
