import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createAnnouncement,
  fetchAnnouncements,
  removeAnnouncement,
} from './announcements-api'
import { createFeedEvent } from './feed-events-api'
import { feedEventsQueryKey } from './use-feed-events'
import type { Announcement, CreateAnnouncementInput } from '../types'

export const announcementsQueryKey = ['announcements'] as const

export function useAnnouncements() {
  return useQuery({
    queryKey: announcementsQueryKey,
    queryFn: fetchAnnouncements,
  })
}

export function useAnnouncementsByTournament(
  tournamentId: string | null | undefined
): Announcement[] {
  const { data: items = [] } = useAnnouncements()
  if (!tournamentId) return []
  return items
    .filter((a) => a.tournamentId === tournamentId)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
}

/**
 * Creating an announcement also writes a paired `announcement` feed event so
 * the live feed shows it without a second source-of-truth.
 */
export function useCreateAnnouncement() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateAnnouncementInput) => {
      const announcement = await createAnnouncement(input)
      try {
        await createFeedEvent({
          tournamentId: input.tournamentId,
          type: 'announcement',
          message: `Announcement: ${input.message}`,
        })
      } catch (err) {
        // Feed event is non-critical — log but don't fail the mutation.
        console.error('Failed to emit announcement feed event', err)
      }
      return announcement
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: announcementsQueryKey })
      void queryClient.invalidateQueries({ queryKey: feedEventsQueryKey })
    },
  })
}

export function useRemoveAnnouncement() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: removeAnnouncement,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: announcementsQueryKey })
    },
  })
}
