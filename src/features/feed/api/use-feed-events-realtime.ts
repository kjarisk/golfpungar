import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useRealtimeStatusStore } from '@/lib/realtime-status'
import { feedEventsQueryKey } from './use-feed-events'

const CHANNEL = 'feed-events-insert'

/**
 * Subscribes to INSERTs on `feed_events` and invalidates the feed query so
 * every connected client sees new feed activity live (no manual reload).
 * Server-side RLS filters the stream to rows the user may read.
 *
 * Mount once under the auth boundary — the subscription uses the active
 * Supabase session and is torn down on unmount.
 */
export function useFeedEventsRealtime(): void {
  const queryClient = useQueryClient()

  useEffect(() => {
    const channel = supabase
      .channel(CHANNEL)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'feed_events' },
        () => {
          void queryClient.invalidateQueries({ queryKey: feedEventsQueryKey })
        }
      )
      .subscribe((status) => {
        useRealtimeStatusStore.getState().setChannelStatus(CHANNEL, status)
      })

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [queryClient])
}
