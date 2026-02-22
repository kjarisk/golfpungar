import { create } from 'zustand'
import type { FeedEvent, CreateFeedEventInput } from '../types'

interface FeedState {
  events: FeedEvent[]

  // Queries
  getEventsByTournament: (tournamentId: string) => FeedEvent[]
  getRecentEvents: (tournamentId: string, limit?: number) => FeedEvent[]

  // Actions
  addEvent: (input: CreateFeedEventInput) => FeedEvent
  clearEvents: (tournamentId: string) => void
}

let nextEventId = 1

export const useFeedStore = create<FeedState>((set, get) => ({
  events: [],

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

  clearEvents: (tournamentId) => {
    set((state) => ({
      events: state.events.filter((e) => e.tournamentId !== tournamentId),
    }))
  },
}))
