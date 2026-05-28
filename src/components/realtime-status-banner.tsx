import { WifiOff } from 'lucide-react'
import {
  useRealtimeStatusStore,
  selectIsRealtimeConnected,
} from '@/lib/realtime-status'

/**
 * Thin banner shown when the Supabase realtime connection drops. Live updates
 * stop while offline; the banner clears automatically once a channel
 * re-subscribes (supabase-js reconnects the socket on its own).
 */
export function RealtimeStatusBanner() {
  const isConnected = useRealtimeStatusStore(selectIsRealtimeConnected)

  if (isConnected) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-destructive text-destructive-foreground flex items-center justify-center gap-2 px-4 py-1.5 text-xs font-medium"
    >
      <WifiOff className="size-3.5" aria-hidden="true" />
      Offline — live updates paused. Reconnecting…
    </div>
  )
}
