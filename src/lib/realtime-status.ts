import { create } from 'zustand'

/** Status values reported by RealtimeChannel.subscribe()'s callback. */
export type ChannelStatus =
  | 'SUBSCRIBED'
  | 'CHANNEL_ERROR'
  | 'TIMED_OUT'
  | 'CLOSED'

const UNHEALTHY: ReadonlySet<ChannelStatus> = new Set([
  'CHANNEL_ERROR',
  'TIMED_OUT',
  'CLOSED',
])

interface RealtimeStatusState {
  /** Latest subscribe status per channel name. */
  statuses: Record<string, ChannelStatus>
  setChannelStatus: (channel: string, status: ChannelStatus) => void
}

/**
 * Tracks each realtime channel's subscribe status. All channels share one
 * websocket, so any of them reporting an unhealthy status means the realtime
 * connection is down. Drives the offline banner.
 */
export const useRealtimeStatusStore = create<RealtimeStatusState>((set) => ({
  statuses: {},
  setChannelStatus: (channel, status) =>
    set((state) => ({ statuses: { ...state.statuses, [channel]: status } })),
}))

/**
 * Connected unless a tracked channel reports an unhealthy status. Defaults to
 * connected (no statuses yet) so the banner never flashes on first load.
 */
export function selectIsRealtimeConnected(state: RealtimeStatusState): boolean {
  return !Object.values(state.statuses).some((s) => UNHEALTHY.has(s))
}
