/// <reference types="vitest/globals" />

import { renderHook } from '@testing-library/react'

const { channel, on, subscribe, removeChannel } = vi.hoisted(() => {
  const on = vi.fn()
  const subscribe = vi.fn()
  const channelObj = { on, subscribe }
  on.mockReturnValue(channelObj)
  subscribe.mockReturnValue({})
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

import { useScorecardsRealtime } from './use-scorecards-realtime'

beforeEach(() => {
  channel.mockClear()
  on.mockClear()
  subscribe.mockClear()
  removeChannel.mockClear()
  invalidateQueries.mockClear()
})

describe('useScorecardsRealtime', () => {
  it('subscribes to scorecards changes on mount', () => {
    renderHook(() => useScorecardsRealtime())
    expect(channel).toHaveBeenCalledWith('scorecards-changes')
    expect(on).toHaveBeenCalledWith(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'scorecards' },
      expect.any(Function)
    )
    expect(subscribe).toHaveBeenCalled()
  })

  it('invalidates the scorecards query when a change arrives', () => {
    renderHook(() => useScorecardsRealtime())
    const handler = on.mock.calls[0][2] as () => void
    handler()
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['scorecards'],
    })
  })

  it('removes the channel on unmount', () => {
    const { unmount } = renderHook(() => useScorecardsRealtime())
    unmount()
    expect(removeChannel).toHaveBeenCalled()
  })
})
