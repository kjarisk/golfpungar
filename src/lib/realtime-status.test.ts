/// <reference types="vitest/globals" />

import {
  useRealtimeStatusStore,
  selectIsRealtimeConnected,
} from './realtime-status'

beforeEach(() => {
  useRealtimeStatusStore.setState({ statuses: {} })
})

describe('selectIsRealtimeConnected', () => {
  it('reports connected when no channels have reported yet', () => {
    expect(selectIsRealtimeConnected(useRealtimeStatusStore.getState())).toBe(
      true
    )
  })

  it('reports connected when all channels are SUBSCRIBED', () => {
    const { setChannelStatus } = useRealtimeStatusStore.getState()
    setChannelStatus('a', 'SUBSCRIBED')
    setChannelStatus('b', 'SUBSCRIBED')
    expect(selectIsRealtimeConnected(useRealtimeStatusStore.getState())).toBe(
      true
    )
  })

  it('reports disconnected when any channel is unhealthy', () => {
    const { setChannelStatus } = useRealtimeStatusStore.getState()
    setChannelStatus('a', 'SUBSCRIBED')
    setChannelStatus('b', 'CHANNEL_ERROR')
    expect(selectIsRealtimeConnected(useRealtimeStatusStore.getState())).toBe(
      false
    )
  })

  it('recovers to connected when the channel re-subscribes', () => {
    const { setChannelStatus } = useRealtimeStatusStore.getState()
    setChannelStatus('a', 'CLOSED')
    expect(selectIsRealtimeConnected(useRealtimeStatusStore.getState())).toBe(
      false
    )
    setChannelStatus('a', 'SUBSCRIBED')
    expect(selectIsRealtimeConnected(useRealtimeStatusStore.getState())).toBe(
      true
    )
  })
})
