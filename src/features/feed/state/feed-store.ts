import { create } from 'zustand'
import type {
  FeedEvent,
  CreateFeedEventInput,
  Announcement,
  CreateAnnouncementInput,
  NotableEvent,
} from '../types'

interface FeedState {
  events: FeedEvent[]
  announcements: Announcement[]
  /** Queue of notable events to display as animated cards */
  notableEvents: NotableEvent[]

  // Queries
  getEventsByTournament: (tournamentId: string) => FeedEvent[]
  getRecentEvents: (tournamentId: string, limit?: number) => FeedEvent[]
  getAnnouncementsByTournament: (tournamentId: string) => Announcement[]

  // Actions
  addEvent: (input: CreateFeedEventInput) => FeedEvent
  addAnnouncement: (input: CreateAnnouncementInput) => Announcement
  removeAnnouncement: (id: string) => void
  pushNotableEvent: (event: NotableEvent) => void
  dismissNotableEvent: (id: string) => void
}

let nextEventId = 1
let nextAnnouncementId = 1

export const useFeedStore = create<FeedState>((set, get) => ({
  events: [],
  announcements: [],
  notableEvents: [],

  getEventsByTournament: (tournamentId) =>
    get()
      .events.filter((e) => e.tournamentId === tournamentId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),

  getRecentEvents: (tournamentId, limit = 20) =>
    get()
      .events.filter((e) => e.tournamentId === tournamentId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, limit),

  getAnnouncementsByTournament: (tournamentId) =>
    get()
      .announcements.filter((a) => a.tournamentId === tournamentId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),

  addEvent: (input) => {
    const event: FeedEvent = {
      id: `feed-${String(nextEventId++).padStart(3, '0')}`,
      tournamentId: input.tournamentId,
      type: input.type,
      message: input.message,
      playerId: input.playerId,
      roundId: input.roundId,
      teamId: input.teamId,
      createdAt: new Date().toISOString(),
    }

    set((state) => ({
      events: [...state.events, event],
    }))

    return event
  },

  addAnnouncement: (input) => {
    const announcement: Announcement = {
      id: `announcement-${String(nextAnnouncementId++).padStart(3, '0')}`,
      tournamentId: input.tournamentId,
      createdByUserId: input.createdByUserId,
      message: input.message,
      createdAt: new Date().toISOString(),
    }

    set((state) => ({
      announcements: [...state.announcements, announcement],
    }))

    // Also add a feed event so it shows in the live feed
    get().addEvent({
      tournamentId: input.tournamentId,
      type: 'announcement',
      message: `Announcement: ${input.message}`,
    })

    return announcement
  },

  removeAnnouncement: (id) => {
    set((state) => ({
      announcements: state.announcements.filter((a) => a.id !== id),
    }))
  },

  pushNotableEvent: (event) => {
    set((state) => ({
      notableEvents: [...state.notableEvents, event],
    }))
  },

  dismissNotableEvent: (id) => {
    set((state) => ({
      notableEvents: state.notableEvents.filter((e) => e.id !== id),
    }))
  },
}))
