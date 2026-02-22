import { describe, it, expect, beforeEach } from 'vitest'
import { useSideEventsStore } from './state/side-events-store'

describe('side-events-store', () => {
  beforeEach(() => {
    useSideEventsStore.setState({ events: [], images: [] })
  })

  const baseInput = {
    tournamentId: 'tourn-1',
    roundId: 'round-1',
    holeNumber: 5,
    playerId: 'p1',
    createdByPlayerId: 'p1',
  } as const

  // --- logEvent ---

  it('logs a birdie event', () => {
    const store = useSideEventsStore.getState()
    const event = store.logEvent({ ...baseInput, type: 'birdie' })

    expect(event.id).toBeTruthy()
    expect(event.type).toBe('birdie')
    expect(event.playerId).toBe('p1')
    expect(event.holeNumber).toBe(5)
    expect(event.roundId).toBe('round-1')
    expect(useSideEventsStore.getState().events).toHaveLength(1)
  })

  it('logs a snake event', () => {
    const store = useSideEventsStore.getState()
    store.logEvent({ ...baseInput, type: 'snake' })

    const events = useSideEventsStore.getState().events
    expect(events[0].type).toBe('snake')
  })

  it('logs a longest drive with meters', () => {
    const store = useSideEventsStore.getState()
    const event = store.logEvent({
      ...baseInput,
      type: 'longest_drive_meters',
      value: 312,
    })

    expect(event.value).toBe(312)
    expect(event.type).toBe('longest_drive_meters')
  })

  // --- removeEvent ---

  it('removes an event by id', () => {
    const store = useSideEventsStore.getState()
    const e1 = store.logEvent({ ...baseInput, type: 'birdie' })
    store.logEvent({ ...baseInput, type: 'eagle', playerId: 'p2' })

    expect(useSideEventsStore.getState().events).toHaveLength(2)
    useSideEventsStore.getState().removeEvent(e1.id)
    expect(useSideEventsStore.getState().events).toHaveLength(1)
    expect(useSideEventsStore.getState().events[0].type).toBe('eagle')
  })

  it('removes associated images when event is removed', () => {
    const store = useSideEventsStore.getState()
    const event = store.logEvent({
      ...baseInput,
      type: 'longest_drive_meters',
      value: 300,
    })
    store.addImage(event.id, 'https://example.com/photo1.jpg')
    store.addImage(event.id, 'https://example.com/photo2.jpg')

    expect(useSideEventsStore.getState().images).toHaveLength(2)
    useSideEventsStore.getState().removeEvent(event.id)
    expect(useSideEventsStore.getState().images).toHaveLength(0)
  })

  // --- addImage / removeImage ---

  it('adds and removes evidence images', () => {
    const store = useSideEventsStore.getState()
    const event = store.logEvent({
      ...baseInput,
      type: 'longest_drive_meters',
      value: 290,
    })

    const img = store.addImage(event.id, 'https://example.com/drive.jpg')
    expect(img.sideEventLogId).toBe(event.id)
    expect(useSideEventsStore.getState().images).toHaveLength(1)

    useSideEventsStore.getState().removeImage(img.id)
    expect(useSideEventsStore.getState().images).toHaveLength(0)
  })

  // --- Query methods ---

  it('filters events by tournament', () => {
    const store = useSideEventsStore.getState()
    store.logEvent({ ...baseInput, type: 'birdie' })
    store.logEvent({
      ...baseInput,
      type: 'eagle',
      tournamentId: 'tourn-2',
    })

    const results = useSideEventsStore
      .getState()
      .getEventsByTournament('tourn-1')
    expect(results).toHaveLength(1)
    expect(results[0].type).toBe('birdie')
  })

  it('filters events by round', () => {
    const store = useSideEventsStore.getState()
    store.logEvent({ ...baseInput, type: 'birdie', roundId: 'round-1' })
    store.logEvent({ ...baseInput, type: 'eagle', roundId: 'round-2' })

    const results = useSideEventsStore.getState().getEventsByRound('round-1')
    expect(results).toHaveLength(1)
  })

  it('filters events by type', () => {
    const store = useSideEventsStore.getState()
    store.logEvent({ ...baseInput, type: 'birdie' })
    store.logEvent({ ...baseInput, type: 'birdie' })
    store.logEvent({ ...baseInput, type: 'snake' })

    const results = useSideEventsStore
      .getState()
      .getEventsByType('tourn-1', 'birdie')
    expect(results).toHaveLength(2)
  })

  it('gets images for a specific event', () => {
    const store = useSideEventsStore.getState()
    const e1 = store.logEvent({
      ...baseInput,
      type: 'longest_drive_meters',
      value: 300,
    })
    const e2 = store.logEvent({
      ...baseInput,
      type: 'longest_drive_meters',
      value: 280,
      playerId: 'p2',
    })

    store.addImage(e1.id, 'https://example.com/a.jpg')
    store.addImage(e1.id, 'https://example.com/b.jpg')
    store.addImage(e2.id, 'https://example.com/c.jpg')

    const e1Images = useSideEventsStore.getState().getImagesForEvent(e1.id)
    expect(e1Images).toHaveLength(2)

    const e2Images = useSideEventsStore.getState().getImagesForEvent(e2.id)
    expect(e2Images).toHaveLength(1)
  })

  // --- Aggregation ---

  it('computes tournament totals for players', () => {
    const store = useSideEventsStore.getState()
    store.logEvent({ ...baseInput, type: 'birdie', playerId: 'p1' })
    store.logEvent({ ...baseInput, type: 'birdie', playerId: 'p1' })
    store.logEvent({ ...baseInput, type: 'snake', playerId: 'p1' })
    store.logEvent({ ...baseInput, type: 'birdie', playerId: 'p2' })

    const totals = useSideEventsStore
      .getState()
      .getTotalsForTournament('tourn-1', ['p1', 'p2'])

    expect(totals[0].birdies).toBe(2)
    expect(totals[0].snakes).toBe(1)
    expect(totals[1].birdies).toBe(1)
    expect(totals[1].snakes).toBe(0)
  })

  it('derives last snake in group', () => {
    const store = useSideEventsStore.getState()
    store.logEvent({
      ...baseInput,
      type: 'snake',
      playerId: 'p1',
      holeNumber: 3,
      roundId: 'round-1',
    })
    store.logEvent({
      ...baseInput,
      type: 'snake',
      playerId: 'p2',
      holeNumber: 8,
      roundId: 'round-1',
    })

    // Set explicit timestamps so ordering is deterministic
    useSideEventsStore.setState((state) => ({
      events: state.events.map((e) =>
        e.playerId === 'p1' && e.type === 'snake'
          ? { ...e, createdAt: '2026-01-01T10:00:00Z' }
          : e.playerId === 'p2' && e.type === 'snake'
            ? { ...e, createdAt: '2026-01-01T11:00:00Z' }
            : e
      ),
    }))

    const result = useSideEventsStore
      .getState()
      .getLastSnakeInGroup('round-1', 'group-1', ['p1', 'p2'])

    expect(result.playerId).toBe('p2')
    expect(result.holeNumber).toBe(8)
  })

  it('returns longest drive leaderboard', () => {
    const store = useSideEventsStore.getState()
    store.logEvent({
      ...baseInput,
      type: 'longest_drive_meters',
      value: 280,
      playerId: 'p1',
    })
    store.logEvent({
      ...baseInput,
      type: 'longest_drive_meters',
      value: 310,
      playerId: 'p2',
    })

    const leaderboard = useSideEventsStore
      .getState()
      .getLongestDriveLeaderboard('tourn-1')

    expect(leaderboard).toHaveLength(2)
    expect(leaderboard[0].playerId).toBe('p2')
    expect(leaderboard[0].meters).toBe(310)
    expect(leaderboard[1].playerId).toBe('p1')
    expect(leaderboard[1].meters).toBe(280)
  })
})
