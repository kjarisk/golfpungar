import { supabase } from '@/lib/supabase'
import { queryClient } from '@/lib/query-client'
import type { CreateFeedEventInput, FeedEvent, FeedEventType } from '../types'

interface FeedEventRow {
  id: string
  tournament_id: string
  type: FeedEventType
  message: string
  player_id: string | null
  round_id: string | null
  team_id: string | null
  created_at: string
}

const COLUMNS =
  'id, tournament_id, type, message, player_id, round_id, team_id, created_at'

function toFeedEvent(row: FeedEventRow): FeedEvent {
  return {
    id: row.id,
    tournamentId: row.tournament_id,
    type: row.type,
    message: row.message,
    playerId: row.player_id ?? undefined,
    roundId: row.round_id ?? undefined,
    teamId: row.team_id ?? undefined,
    createdAt: row.created_at,
  }
}

export async function fetchFeedEvents(): Promise<FeedEvent[]> {
  const { data, error } = await supabase
    .from('feed_events')
    .select(COLUMNS)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data as unknown as FeedEventRow[]).map(toFeedEvent)
}

export async function createFeedEvent(
  input: CreateFeedEventInput
): Promise<FeedEvent> {
  const { data, error } = await supabase
    .from('feed_events')
    .insert({
      tournament_id: input.tournamentId,
      type: input.type,
      message: input.message,
      player_id: input.playerId ?? null,
      round_id: input.roundId ?? null,
      team_id: input.teamId ?? null,
    })
    .select(COLUMNS)
    .single()
  if (error) throw error
  return toFeedEvent(data as unknown as FeedEventRow)
}

/**
 * Fire-and-forget feed event emit for use from non-React contexts (e.g.
 * Zustand store actions). On success, invalidates the cache so subscribers
 * pick up the new row; on failure, logs to console — the caller should not
 * be blocked by a feed write.
 */
export function emitFeedEvent(input: CreateFeedEventInput): void {
  void createFeedEvent(input)
    .then(() => {
      void queryClient.invalidateQueries({ queryKey: ['feed-events'] })
    })
    .catch((err) => {
      console.error('Failed to emit feed event', err)
    })
}
