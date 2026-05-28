/// <reference types="vitest/globals" />

import { renderHook } from '@testing-library/react'

const { channel, on, subscribe, removeChannel } = vi.hoisted(() => {
  const on = vi.fn()
  const subscribe = vi.fn()
  const channelObj = { on, subscribe }
  on.mockReturnValue(channelObj)
  const channelHandle = {}
  subscribe.mockReturnValue(channelHandle)
  return {
    channel: vi.fn(() => channelObj),
    on,
    subscribe,
    removeChannel: vi.fn(),
  }
})

vi.mock('@/lib/supabase', () => ({
  supabase: { channel, removeChannel },
}))

const { invalidateQueries } = vi.hoisted(() => ({
  invalidateQueries: vi.fn(),
}))
vi.mock('@tanstack/react-query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-query')>()),
  useQueryClient: () => ({ invalidateQueries }),
}))

import { useFeedEventsRealtime } from './use-feed-events-realtime'

beforeEach(() => {
  channel.mockClear()
  on.mockClear()
  subscribe.mockClear()
  removeChannel.mockClear()
  invalidateQueries.mockClear()
})

describe('useFeedEventsRealtime', () => {
  it('subscribes to feed_events INSERTs on mount', () => {
    renderHook(() => useFeedEventsRealtime())
    expect(channel).toHaveBeenCalledWith('feed-events-insert')
    expect(on).toHaveBeenCalledWith(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'feed_events' },
      expect.any(Function)
    )
    expect(subscribe).toHaveBeenCalled()
  })

  it('invalidates the feed query when an INSERT arrives', () => {
    renderHook(() => useFeedEventsRealtime())
    const handler = on.mock.calls[0][2] as () => void
    handler()
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['feed-events'],
    })
  })

  it('removes the channel on unmount', () => {
    const { unmount } = renderHook(() => useFeedEventsRealtime())
    unmount()
    expect(removeChannel).toHaveBeenCalled()
  })
})
