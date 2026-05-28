/// <reference types="vitest/globals" />

import { render, screen, act } from '@testing-library/react'
import { RealtimeStatusBanner } from './realtime-status-banner'
import { useRealtimeStatusStore } from '@/lib/realtime-status'

beforeEach(() => {
  useRealtimeStatusStore.setState({ statuses: {} })
})

describe('RealtimeStatusBanner', () => {
  it('renders nothing while connected', () => {
    const { container } = render(<RealtimeStatusBanner />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows the offline banner when a channel is unhealthy', () => {
    useRealtimeStatusStore
      .getState()
      .setChannelStatus('scorecards-changes', 'CHANNEL_ERROR')
    render(<RealtimeStatusBanner />)
    expect(screen.getByRole('status')).toHaveTextContent(/offline/i)
  })

  it('hides again once the channel re-subscribes', () => {
    useRealtimeStatusStore
      .getState()
      .setChannelStatus('scorecards-changes', 'CLOSED')
    const { container } = render(<RealtimeStatusBanner />)
    expect(screen.getByRole('status')).toBeInTheDocument()

    act(() => {
      useRealtimeStatusStore
        .getState()
        .setChannelStatus('scorecards-changes', 'SUBSCRIBED')
    })
    expect(container).toBeEmptyDOMElement()
  })
})
