import { useFeedEventsRealtime } from '@/features/feed/api/use-feed-events-realtime'

/**
 * Mounts the app's Supabase realtime subscriptions. Rendered only inside the
 * auth boundary so subscriptions run with an active session and are torn down
 * on logout. Renders nothing.
 */
export function RealtimeSubscriber() {
  useFeedEventsRealtime()
  return null
}
