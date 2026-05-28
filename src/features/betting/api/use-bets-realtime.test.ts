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

import { useBetsRealtime } from './use-bets-realtime'

beforeEach(() => {
  channel.mockClear()
  on.mockClear()
  subscribe.mockClear()
  removeChannel.mockClear()
  invalidateQueries.mockClear()
})

describe('useBetsRealtime', () => {
  it('subscribes to bets and bet_participants changes on mount', () => {
    renderHook(() => useBetsRealtime())
    expect(channel).toHaveBeenCalledWith('bets-changes')
    expect(on).toHaveBeenCalledWith(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'bets' },
      expect.any(Function)
    )
    expect(on).toHaveBeenCalledWith(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'bet_participants' },
      expect.any(Function)
    )
    expect(subscribe).toHaveBeenCalled()
  })

  it('invalidates the bets query when a bets change arrives', () => {
    renderHook(() => useBetsRealtime())
    const betsHandler = on.mock.calls[0][2] as () => void
    betsHandler()
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['bets'] })
  })

  it('invalidates the bet-participants query when a participants change arrives', () => {
    renderHook(() => useBetsRealtime())
    const participantsHandler = on.mock.calls[1][2] as () => void
    participantsHandler()
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['bet-participants'],
    })
  })

  it('removes the channel on unmount', () => {
    const { unmount } = renderHook(() => useBetsRealtime())
    unmount()
    expect(removeChannel).toHaveBeenCalled()
  })
})
