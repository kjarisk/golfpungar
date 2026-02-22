// Types for the feed feature
// Based on: outline.md §6 data model — FeedEvent

export type FeedEventType =
  | 'score_entered'
  | 'points_calculated'
  | 'side_event'
  | 'round_started'
  | 'round_completed'
  | 'tournament_update'
  | 'team_name_changed'

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
