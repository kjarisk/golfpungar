import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFeedEvent, fetchFeedEvents } from './feed-events-api'
import type { FeedEvent } from '../types'

export const feedEventsQueryKey = ['feed-events'] as const

export function useFeedEvents() {
  return useQuery({
    queryKey: feedEventsQueryKey,
    queryFn: fetchFeedEvents,
  })
}

export function useFeedEventsByTournament(
  tournamentId: string | null | undefined
): FeedEvent[] {
  const { data: events = [] } = useFeedEvents()
  if (!tournamentId) return []
  // fetchFeedEvents already returns newest-first, but filter does not preserve sort guarantees if the cache is reused — keep an explicit sort.
  return events
    .filter((e) => e.tournamentId === tournamentId)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
}

export function useRecentFeedEvents(
  tournamentId: string | null | undefined,
  limit = 20
): FeedEvent[] {
  return useFeedEventsByTournament(tournamentId).slice(0, limit)
}

export function useCreateFeedEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createFeedEvent,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: feedEventsQueryKey })
    },
  })
}
