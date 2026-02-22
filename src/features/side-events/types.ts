// Types for the side-events feature
// Based on: outline.md §6 "Log Side Events" + §5 "Rules & Competition Logic"

/** All side event types that can be logged */
export type SideEventType =
  | 'birdie'
  | 'eagle'
  | 'hio' // hole in one
  | 'albatross'
  | 'bunker_save'
  | 'snake' // 3-putt
  | 'group_longest_drive' // par 5 only, winner per group
  | 'longest_drive_meters' // distance in meters + photo evidence

/** A logged side event */
export interface SideEventLog {
  id: string
  tournamentId: string
  /** Which round this happened in (optional for tournament-wide events) */
  roundId?: string
  /** Which hole (1-based) */
  holeNumber?: number
  /** The player who did it */
  playerId: string
  /** What type of event */
  type: SideEventType
  /** Numeric value (meters for longest_drive_meters, otherwise unused) */
  value?: number
  /** ISO timestamp */
  createdAt: string
  /** Who logged this event (may differ from playerId) */
  createdByPlayerId: string
}

/** Photo evidence attached to a side event (used for longest_drive_meters) */
export interface EvidenceImage {
  id: string
  sideEventLogId: string
  /** URL or object URL for the image */
  imageUrl: string
  createdAt: string
}

/** Input for creating a side event */
export interface CreateSideEventInput {
  tournamentId: string
  roundId?: string
  holeNumber?: number
  playerId: string
  type: SideEventType
  /** Required for longest_drive_meters */
  value?: number
  createdByPlayerId: string
}

/** Input for adding evidence image */
export interface AddEvidenceInput {
  sideEventLogId: string
  imageUrl: string
}

/** Summary of side event counts per player */
export interface SideEventTotals {
  playerId: string
  birdies: number
  eagles: number
  holeInOnes: number
  albatrosses: number
  bunkerSaves: number
  snakes: number
  groupLongestDrives: number
  /** Best longest drive in meters (null if none) */
  longestDriveMeters: number | null
}

/** Snake info for a group — who holds the "last snake" */
export interface LastSnakeInGroup {
  groupId: string
  roundId: string
  /** The player who 3-putted most recently in this group. null if no snakes. */
  playerId: string | null
  /** The hole number where the last snake occurred */
  holeNumber?: number
}
