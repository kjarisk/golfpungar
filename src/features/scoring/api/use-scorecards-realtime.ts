import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useRealtimeStatusStore } from '@/lib/realtime-status'
import { scorecardsQueryKey } from './use-scorecards'

const CHANNEL = 'scorecards-changes'

/**
 * Subscribes to changes on `scorecards` and invalidates the scorecards query
 * so leaderboards, feed and the enter grid reflect other players' scores live.
 * Server-side RLS filters the stream to rows the user may read.
 *
 * Listens to all change types — a new card is an INSERT, a stroke edit an
 * UPDATE. Mount once under the auth boundary; the channel uses the active
 * session and is torn down on unmount.
 */
export function useScorecardsRealtime(): void {
  const queryClient = useQueryClient()

  useEffect(() => {
    const channel = supabase
      .channel(CHANNEL)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'scorecards' },
        () => {
          void queryClient.invalidateQueries({ queryKey: scorecardsQueryKey })
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
