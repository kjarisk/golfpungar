/// <reference types="vitest/globals" />
import { useFeedStore } from './state/feed-store'
import { usePlayersStore } from '@/features/players'

describe('feed store — announcements', () => {
  beforeEach(() => {
    useFeedStore.setState({ events: [], announcements: [], notableEvents: [] })
  })

  it('adds an announcement and creates a feed event', () => {
    const store = useFeedStore.getState()
    const announcement = store.addAnnouncement({
      tournamentId: 't1',
      createdByUserId: 'u1',
      message: 'Tee times moved to 9am',
    })

    expect(announcement.id).toMatch(/^announcement-/)
    expect(announcement.message).toBe('Tee times moved to 9am')
    expect(announcement.tournamentId).toBe('t1')
    expect(announcement.createdByUserId).toBe('u1')
    expect(announcement.createdAt).toBeTruthy()

    // Should also exist in announcements array
    const announcements = useFeedStore
      .getState()
      .getAnnouncementsByTournament('t1')
    expect(announcements).toHaveLength(1)
    expect(announcements[0].message).toBe('Tee times moved to 9am')

    // Should also create a feed event
    const events = useFeedStore.getState().getRecentEvents('t1')
    expect(events.length).toBeGreaterThanOrEqual(1)
    const announcementEvent = events.find((e) => e.type === 'announcement')
    expect(announcementEvent).toBeTruthy()
    expect(announcementEvent!.message).toContain('Tee times moved to 9am')
  })

  it('removes an announcement by id', () => {
    const store = useFeedStore.getState()
    const a = store.addAnnouncement({
      tournamentId: 't1',
      createdByUserId: 'u1',
      message: 'First announcement',
    })
    store.addAnnouncement({
      tournamentId: 't1',
      createdByUserId: 'u1',
      message: 'Second announcement',
    })

    expect(
      useFeedStore.getState().getAnnouncementsByTournament('t1')
    ).toHaveLength(2)

    useFeedStore.getState().removeAnnouncement(a.id)

    const remaining = useFeedStore.getState().getAnnouncementsByTournament('t1')
    expect(remaining).toHaveLength(1)
    expect(remaining[0].message).toBe('Second announcement')
  })

  it('returns announcements sorted by newest first', () => {
    // Manually insert announcements with known timestamps
    useFeedStore.setState({
      announcements: [
        {
          id: 'a-1',
          tournamentId: 't1',
          createdByUserId: 'u1',
          message: 'First',
          createdAt: '2026-06-01T10:00:00Z',
        },
        {
          id: 'a-2',
          tournamentId: 't1',
          createdByUserId: 'u1',
          message: 'Second',
          createdAt: '2026-06-01T11:00:00Z',
        },
      ],
    })

    const announcements = useFeedStore
      .getState()
      .getAnnouncementsByTournament('t1')
    expect(announcements.length).toBe(2)
    // Newest first
    expect(announcements[0].message).toBe('Second')
    expect(announcements[1].message).toBe('First')
  })

  it('filters announcements by tournament', () => {
    const store = useFeedStore.getState()
    store.addAnnouncement({
      tournamentId: 't1',
      createdByUserId: 'u1',
      message: 'For t1',
    })
    store.addAnnouncement({
      tournamentId: 't2',
      createdByUserId: 'u1',
      message: 'For t2',
    })

    const t1 = useFeedStore.getState().getAnnouncementsByTournament('t1')
    const t2 = useFeedStore.getState().getAnnouncementsByTournament('t2')
    expect(t1).toHaveLength(1)
    expect(t2).toHaveLength(1)
    expect(t1[0].message).toBe('For t1')
    expect(t2[0].message).toBe('For t2')
  })
})

describe('feed store — notable events queue', () => {
  beforeEach(() => {
    useFeedStore.setState({ events: [], announcements: [], notableEvents: [] })
  })

  it('pushes a notable event to the queue', () => {
    const store = useFeedStore.getState()
    store.pushNotableEvent({
      id: 'ne-1',
      kind: 'birdie',
      playerName: 'Kjartan',
      holeNumber: 7,
      createdAt: new Date().toISOString(),
    })

    const queue = useFeedStore.getState().notableEvents
    expect(queue).toHaveLength(1)
    expect(queue[0].kind).toBe('birdie')
    expect(queue[0].playerName).toBe('Kjartan')
  })

  it('dismisses a notable event from the queue', () => {
    const store = useFeedStore.getState()
    store.pushNotableEvent({
      id: 'ne-1',
      kind: 'eagle',
      playerName: 'Thomas',
      holeNumber: 3,
      createdAt: new Date().toISOString(),
    })
    store.pushNotableEvent({
      id: 'ne-2',
      kind: 'birdie',
      playerName: 'Magnus',
      holeNumber: 5,
      createdAt: new Date().toISOString(),
    })

    expect(useFeedStore.getState().notableEvents).toHaveLength(2)

    useFeedStore.getState().dismissNotableEvent('ne-1')

    const remaining = useFeedStore.getState().notableEvents
    expect(remaining).toHaveLength(1)
    expect(remaining[0].id).toBe('ne-2')
  })

  it('queues multiple notable events in order', () => {
    const store = useFeedStore.getState()
    store.pushNotableEvent({
      id: 'ne-1',
      kind: 'hio',
      playerName: 'Stefan',
      holeNumber: 12,
      createdAt: new Date().toISOString(),
    })
    store.pushNotableEvent({
      id: 'ne-2',
      kind: 'albatross',
      playerName: 'Gunnar',
      holeNumber: 2,
      createdAt: new Date().toISOString(),
    })
    store.pushNotableEvent({
      id: 'ne-3',
      kind: 'nearest_to_pin',
      playerName: 'Olafur',
      holeNumber: 8,
      value: 1.2,
      createdAt: new Date().toISOString(),
    })

    const queue = useFeedStore.getState().notableEvents
    expect(queue).toHaveLength(3)
    expect(queue[0].kind).toBe('hio')
    expect(queue[1].kind).toBe('albatross')
    expect(queue[2].kind).toBe('nearest_to_pin')
    expect(queue[2].value).toBe(1.2)
  })
})

describe('feed store — handicap_changed event type', () => {
  beforeEach(() => {
    useFeedStore.setState({ events: [], announcements: [], notableEvents: [] })
  })

  it('accepts handicap_changed as a valid event type', () => {
    const store = useFeedStore.getState()
    const event = store.addEvent({
      tournamentId: 't1',
      type: 'handicap_changed',
      message: 'Kjartan handicap changed: 18 → 16',
      playerId: 'p1',
    })

    expect(event.type).toBe('handicap_changed')
    expect(event.message).toContain('handicap changed')
  })

  it('accepts announcement as a valid event type', () => {
    const store = useFeedStore.getState()
    const event = store.addEvent({
      tournamentId: 't1',
      type: 'announcement',
      message: 'Announcement: Dinner at 8pm',
    })

    expect(event.type).toBe('announcement')
  })
})

describe('players store — handicap change feed event', () => {
  beforeEach(() => {
    useFeedStore.setState({ events: [], announcements: [], notableEvents: [] })
    // Reset players store to default mock state
    usePlayersStore.setState({
      players: [
        {
          id: 'player-test',
          tournamentId: 'tournament-001',
          userId: 'user-test',
          displayName: 'TestPlayer',
          groupHandicap: 18,
          active: true,
          createdAt: '2026-01-15T10:00:00Z',
        },
      ],
    })
  })

  it('posts a feed event when handicap changes', () => {
    usePlayersStore.getState().updatePlayer('player-test', {
      groupHandicap: 16,
    })

    const events = useFeedStore.getState().getRecentEvents('tournament-001')
    expect(events).toHaveLength(1)
    expect(events[0].type).toBe('handicap_changed')
    expect(events[0].message).toContain('TestPlayer')
    expect(events[0].message).toContain('18')
    expect(events[0].message).toContain('16')
    expect(events[0].playerId).toBe('player-test')
  })

  it('does NOT post a feed event when handicap stays the same', () => {
    usePlayersStore.getState().updatePlayer('player-test', {
      groupHandicap: 18,
    })

    const events = useFeedStore.getState().getRecentEvents('tournament-001')
    expect(events).toHaveLength(0)
  })

  it('does NOT post a feed event when updating non-handicap fields', () => {
    usePlayersStore.getState().updatePlayer('player-test', {
      displayName: 'NewName',
    })

    const events = useFeedStore.getState().getRecentEvents('tournament-001')
    expect(events).toHaveLength(0)
  })
})
