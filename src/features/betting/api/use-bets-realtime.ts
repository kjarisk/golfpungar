import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useRealtimeStatusStore } from '@/lib/realtime-status'
import { betsQueryKey, betParticipantsQueryKey } from './use-bets'

const CHANNEL = 'bets-changes'

/**
 * Subscribes to changes on `bets` and `bet_participants` and invalidates both
 * queries so the bet list and the pending-bet notification badge update live
 * when an opponent creates, accepts, rejects or resolves a bet.
 * Server-side RLS filters the stream to rows the user may read.
 *
 * Mount once under the auth boundary; the channel uses the active session and
 * is torn down on unmount.
 */
export function useBetsRealtime(): void {
  const queryClient = useQueryClient()

  useEffect(() => {
    const channel = supabase
      .channel(CHANNEL)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bets' },
        () => {
          void queryClient.invalidateQueries({ queryKey: betsQueryKey })
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bet_participants' },
        () => {
          void queryClient.invalidateQueries({
            queryKey: betParticipantsQueryKey,
          })
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
