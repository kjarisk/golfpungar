// Types for the feed feature
// Based on: outline.md §6 data model — FeedEvent + Announcement

export type FeedEventType =
  | 'score_entered'
  | 'points_calculated'
  | 'side_event'
  | 'round_started'
  | 'round_completed'
  | 'tournament_update'
  | 'team_name_changed'
  | 'announcement'
  | 'handicap_changed'

export interface FeedEvent {
  id: string
  tournamentId: string
  type: FeedEventType
  /** Human-readable message, e.g. "Kjartan — BIRDIE on 7" */
  message: string
  /** Player involved (if applicable) */
  playerId?: string
  /** Round involved (if applicable) */
  roundId?: string
  /** Team involved (if applicable) */
  teamId?: string
  /** ISO timestamp */
  createdAt: string
}

export interface CreateFeedEventInput {
  tournamentId: string
  type: FeedEventType
  message: string
  playerId?: string
  roundId?: string
  teamId?: string
}

/**
 * Announcement posted by admin to the feed.
 * Stored separately from feed events for pinning / dismissal.
 */
export interface Announcement {
  id: string
  tournamentId: string
  createdByUserId: string
  message: string
  createdAt: string
}

export interface CreateAnnouncementInput {
  tournamentId: string
  createdByUserId: string
  message: string
}

/**
 * Notable event announcement (birdie, eagle, HIO, etc.)
 * These get a large animated card at the top of the feed with auto-dismiss.
 */
export type NotableEventKind =
  | 'birdie'
  | 'eagle'
  | 'hio'
  | 'albatross'
  | 'nearest_to_pin'

export interface NotableEvent {
  id: string
  kind: NotableEventKind
  playerName: string
  holeNumber?: number
  value?: number
  createdAt: string
}
