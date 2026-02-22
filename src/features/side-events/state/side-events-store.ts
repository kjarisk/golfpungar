import { create } from 'zustand'
import type {
  SideEventLog,
  EvidenceImage,
  CreateSideEventInput,
  SideEventTotals,
  LastSnakeInGroup,
  SideEventType,
} from '../types'

interface SideEventsState {
  events: SideEventLog[]
  images: EvidenceImage[]

  // Queries
  getEventsByTournament: (tournamentId: string) => SideEventLog[]
  getEventsByRound: (roundId: string) => SideEventLog[]
  getEventsByPlayer: (playerId: string) => SideEventLog[]
  getEventsByType: (tournamentId: string, type: SideEventType) => SideEventLog[]
  getImagesForEvent: (sideEventLogId: string) => EvidenceImage[]

  // Aggregation
  getTotalsForTournament: (
    tournamentId: string,
    playerIds: string[]
  ) => SideEventTotals[]
  getLastSnakeInGroup: (
    roundId: string,
    groupId: string,
    groupPlayerIds: string[]
  ) => LastSnakeInGroup
  getLongestDriveLeaderboard: (
    tournamentId: string
  ) => { playerId: string; meters: number; eventId: string }[]

  // Actions
  logEvent: (input: CreateSideEventInput) => SideEventLog
  removeEvent: (eventId: string) => void
  addImage: (sideEventLogId: string, imageUrl: string) => EvidenceImage
  removeImage: (imageId: string) => void
}

let nextEventId = 1
let nextImageId = 1

export const useSideEventsStore = create<SideEventsState>((set, get) => ({
  events: [],
  images: [],

  // --- Queries ---

  getEventsByTournament: (tournamentId) =>
    get().events.filter((e) => e.tournamentId === tournamentId),

  getEventsByRound: (roundId) =>
    get().events.filter((e) => e.roundId === roundId),

  getEventsByPlayer: (playerId) =>
    get().events.filter((e) => e.playerId === playerId),

  getEventsByType: (tournamentId, type) =>
    get().events.filter(
      (e) => e.tournamentId === tournamentId && e.type === type
    ),

  getImagesForEvent: (sideEventLogId) =>
    get().images.filter((img) => img.sideEventLogId === sideEventLogId),

  // --- Aggregation ---

  getTotalsForTournament: (tournamentId, playerIds) => {
    const events = get().events.filter((e) => e.tournamentId === tournamentId)

    return playerIds.map((playerId) => {
      const playerEvents = events.filter((e) => e.playerId === playerId)

      const longestDriveEvents = playerEvents.filter(
        (e) => e.type === 'longest_drive_meters' && e.value != null
      )
      const bestDrive =
        longestDriveEvents.length > 0
          ? Math.max(...longestDriveEvents.map((e) => e.value!))
          : null

      return {
        playerId,
        birdies: playerEvents.filter((e) => e.type === 'birdie').length,
        eagles: playerEvents.filter((e) => e.type === 'eagle').length,
        holeInOnes: playerEvents.filter((e) => e.type === 'hio').length,
        albatrosses: playerEvents.filter((e) => e.type === 'albatross').length,
        bunkerSaves: playerEvents.filter((e) => e.type === 'bunker_save')
          .length,
        snakes: playerEvents.filter((e) => e.type === 'snake').length,
        groupLongestDrives: playerEvents.filter(
          (e) => e.type === 'group_longest_drive'
        ).length,
        longestDriveMeters: bestDrive,
      }
    })
  },

  /**
   * Determine who holds the "last snake" in a given group for a round.
   * The last snake = the player who 3-putted most recently (by createdAt timestamp).
   * Only considers snakes from players in the given group.
   */
  getLastSnakeInGroup: (roundId, groupId, groupPlayerIds) => {
    const snakes = get()
      .events.filter(
        (e) =>
          e.roundId === roundId &&
          e.type === 'snake' &&
          groupPlayerIds.includes(e.playerId)
      )
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )

    const latest = snakes[0] ?? null

    return {
      groupId,
      roundId,
      playerId: latest?.playerId ?? null,
      holeNumber: latest?.holeNumber,
    }
  },

  /**
   * Get the longest drive leaderboard across the tournament.
   * Returns entries sorted by meters descending.
   */
  getLongestDriveLeaderboard: (tournamentId) => {
    const driveEvents = get().events.filter(
      (e) =>
        e.tournamentId === tournamentId &&
        e.type === 'longest_drive_meters' &&
        e.value != null
    )

    // Group by player, keep best per player
    const bestByPlayer = new Map<string, { meters: number; eventId: string }>()

    for (const event of driveEvents) {
      const existing = bestByPlayer.get(event.playerId)
      if (!existing || event.value! > existing.meters) {
        bestByPlayer.set(event.playerId, {
          meters: event.value!,
          eventId: event.id,
        })
      }
    }

    return Array.from(bestByPlayer.entries())
      .map(([playerId, data]) => ({
        playerId,
        meters: data.meters,
        eventId: data.eventId,
      }))
      .sort((a, b) => b.meters - a.meters)
  },

  // --- Actions ---

  logEvent: (input) => {
    const event: SideEventLog = {
      id: `side-event-${String(nextEventId++).padStart(3, '0')}`,
      tournamentId: input.tournamentId,
      roundId: input.roundId,
      holeNumber: input.holeNumber,
      playerId: input.playerId,
      type: input.type,
      value: input.value,
      createdAt: new Date().toISOString(),
      createdByPlayerId: input.createdByPlayerId,
    }

    set((state) => ({
      events: [...state.events, event],
    }))

    return event
  },

  removeEvent: (eventId) => {
    set((state) => ({
      events: state.events.filter((e) => e.id !== eventId),
      // Also remove associated images
      images: state.images.filter((img) => img.sideEventLogId !== eventId),
    }))
  },

  addImage: (sideEventLogId, imageUrl) => {
    const image: EvidenceImage = {
      id: `evidence-${String(nextImageId++).padStart(3, '0')}`,
      sideEventLogId,
      imageUrl,
      createdAt: new Date().toISOString(),
    }

    set((state) => ({
      images: [...state.images, image],
    }))

    return image
  },

  removeImage: (imageId) => {
    set((state) => ({
      images: state.images.filter((img) => img.id !== imageId),
    }))
  },
}))
