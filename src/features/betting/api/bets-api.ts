import { supabase } from '@/lib/supabase'
import { queryClient } from '@/lib/query-client'
import { emitFeedEvent } from '@/features/feed'
import { playersQueryKey, type Player } from '@/features/players'
import type {
  Bet,
  BetMetric,
  BetParticipant,
  BetScope,
  BetStatus,
  CreateBetInput,
} from '../types'

interface BetRow {
  id: string
  tournament_id: string
  created_by_player_id: string | null
  scope: BetScope
  metric_key: BetMetric
  custom_description: string | null
  round_id: string | null
  amount: number
  status: BetStatus
  winner_id: string | null
  creator_paid_confirmed: boolean
  created_at: string
}

interface BetParticipantRow {
  id: string
  bet_id: string
  player_id: string
  accepted: boolean | null
  paid_confirmed: boolean
}

const BET_COLUMNS =
  'id, tournament_id, created_by_player_id, scope, metric_key, custom_description, round_id, amount, status, winner_id, creator_paid_confirmed, created_at'

const PARTICIPANT_COLUMNS = 'id, bet_id, player_id, accepted, paid_confirmed'

function toBet(row: BetRow): Bet {
  return {
    id: row.id,
    tournamentId: row.tournament_id,
    createdByPlayerId: row.created_by_player_id ?? '',
    scope: row.scope,
    metricKey: row.metric_key,
    customDescription: row.custom_description ?? undefined,
    roundId: row.round_id ?? undefined,
    amount: Number(row.amount),
    status: row.status,
    winnerId: row.winner_id ?? undefined,
    creatorPaidConfirmed: row.creator_paid_confirmed,
    createdAt: row.created_at,
  }
}

function toParticipant(row: BetParticipantRow): BetParticipant {
  return {
    id: row.id,
    betId: row.bet_id,
    playerId: row.player_id,
    accepted: row.accepted,
    paidConfirmed: row.paid_confirmed,
  }
}

export async function fetchBets(): Promise<Bet[]> {
  const { data, error } = await supabase
    .from('bets')
    .select(BET_COLUMNS)
    .order('created_at')
  if (error) throw error
  return (data as unknown as BetRow[]).map(toBet)
}

export async function fetchBetParticipants(): Promise<BetParticipant[]> {
  const { data, error } = await supabase
    .from('bet_participants')
    .select(PARTICIPANT_COLUMNS)
  if (error) throw error
  return (data as unknown as BetParticipantRow[]).map(toParticipant)
}

// --- helpers ---

function playerName(playerId: string): string {
  const players = queryClient.getQueryData<Player[]>(playersQueryKey) ?? []
  return players.find((p) => p.id === playerId)?.displayName ?? 'Someone'
}

function describeBet(
  bet: Pick<Bet, 'metricKey' | 'customDescription'>
): string {
  if (bet.metricKey === 'custom' && bet.customDescription) {
    return bet.customDescription
  }
  const labels: Record<BetMetric, string> = {
    most_points: 'most points',
    most_birdies: 'most birdies',
    head_to_head: 'head-to-head',
    custom: 'custom bet',
  }
  return labels[bet.metricKey]
}

// --- mutations ---

/**
 * Create a bet plus a participant row for each opponent. On participant insert
 * failure we delete the just-created bet so we don't leave an orphan.
 */
export async function createBet(input: CreateBetInput): Promise<Bet> {
  const { data, error } = await supabase
    .from('bets')
    .insert({
      tournament_id: input.tournamentId,
      created_by_player_id: input.createdByPlayerId,
      scope: input.scope,
      metric_key: input.metricKey,
      custom_description: input.customDescription ?? null,
      round_id: input.roundId ?? null,
      amount: input.amount,
      status: 'pending',
      creator_paid_confirmed: false,
    })
    .select(BET_COLUMNS)
    .single()
  if (error) throw error
  const bet = toBet(data as unknown as BetRow)

  if (input.opponentIds.length > 0) {
    const { error: pErr } = await supabase.from('bet_participants').insert(
      input.opponentIds.map((playerId) => ({
        bet_id: bet.id,
        player_id: playerId,
        accepted: null,
        paid_confirmed: false,
      }))
    )
    if (pErr) {
      // Compensating delete so we don't leave a participant-less bet.
      await supabase.from('bets').delete().eq('id', bet.id)
      throw pErr
    }
  }

  // Feed event: "<creator> invited <opponents> to a bet — <metric> (<amount> units)"
  const creatorName = playerName(input.createdByPlayerId)
  const opponentNames = input.opponentIds.map(playerName).join(', ')
  emitFeedEvent({
    tournamentId: bet.tournamentId,
    type: 'bet',
    message: `${creatorName} invited ${opponentNames} to a bet — ${describeBet(
      bet
    )} (${bet.amount} units)`,
    playerId: input.createdByPlayerId,
    roundId: bet.roundId,
  })

  return bet
}

/**
 * Accept a bet for a participant. If every participant has now accepted,
 * flip the bet's status to 'accepted'.
 */
export async function acceptBet({
  betId,
  playerId,
}: {
  betId: string
  playerId: string
}): Promise<void> {
  const { error: pErr } = await supabase
    .from('bet_participants')
    .update({ accepted: true })
    .eq('bet_id', betId)
    .eq('player_id', playerId)
  if (pErr) throw pErr

  // Re-fetch participants for this bet to decide whether all have accepted.
  const { data: pData, error: pFetchErr } = await supabase
    .from('bet_participants')
    .select('accepted')
    .eq('bet_id', betId)
  if (pFetchErr) throw pFetchErr
  const participants = pData as { accepted: boolean | null }[]
  const allAccepted =
    participants.length > 0 && participants.every((p) => p.accepted === true)

  // Need bet details for feed + (maybe) status flip.
  const { data: bData, error: bErr } = await supabase
    .from('bets')
    .select(BET_COLUMNS)
    .eq('id', betId)
    .single()
  if (bErr) throw bErr
  const bet = toBet(bData as unknown as BetRow)

  if (allAccepted && bet.status === 'pending') {
    const { error: updErr } = await supabase
      .from('bets')
      .update({ status: 'accepted' })
      .eq('id', betId)
    if (updErr) throw updErr
  }

  const accepterName = playerName(playerId)
  const creatorName = playerName(bet.createdByPlayerId)
  emitFeedEvent({
    tournamentId: bet.tournamentId,
    type: 'bet',
    message: `${accepterName} accepted a bet with ${creatorName} — ${describeBet(
      bet
    )} (${bet.amount} units)`,
    playerId,
    roundId: bet.roundId,
  })
}

/**
 * Reject a bet for a participant. A single rejection rejects the whole bet.
 */
export async function rejectBet({
  betId,
  playerId,
}: {
  betId: string
  playerId: string
}): Promise<void> {
  const { error: pErr } = await supabase
    .from('bet_participants')
    .update({ accepted: false })
    .eq('bet_id', betId)
    .eq('player_id', playerId)
  if (pErr) throw pErr

  const { error: bErr } = await supabase
    .from('bets')
    .update({ status: 'rejected' })
    .eq('id', betId)
  if (bErr) throw bErr

  // Look up bet for feed message context.
  const { data: bData } = await supabase
    .from('bets')
    .select(BET_COLUMNS)
    .eq('id', betId)
    .maybeSingle()
  if (bData) {
    const bet = toBet(bData as unknown as BetRow)
    const rejecterName = playerName(playerId)
    const creatorName = playerName(bet.createdByPlayerId)
    emitFeedEvent({
      tournamentId: bet.tournamentId,
      type: 'bet',
      message: `${rejecterName} rejected a bet from ${creatorName}`,
      playerId,
      roundId: bet.roundId,
    })
  }
}

/**
 * Resolve a bet by setting the winner. Status becomes 'won' if the winner is
 * the bet's creator, otherwise 'lost'.
 */
export async function resolveBet({
  betId,
  winnerId,
}: {
  betId: string
  winnerId: string
}): Promise<void> {
  const { data: bData, error: bErr } = await supabase
    .from('bets')
    .select(BET_COLUMNS)
    .eq('id', betId)
    .single()
  if (bErr) throw bErr
  const bet = toBet(bData as unknown as BetRow)

  const newStatus: BetStatus =
    bet.createdByPlayerId === winnerId ? 'won' : 'lost'

  const { error: updErr } = await supabase
    .from('bets')
    .update({ winner_id: winnerId, status: newStatus })
    .eq('id', betId)
  if (updErr) throw updErr

  // For the feed message, loser names = (creator + every participant) minus winner.
  const { data: pData } = await supabase
    .from('bet_participants')
    .select('player_id')
    .eq('bet_id', betId)
  const participantIds = ((pData as { player_id: string }[]) ?? []).map(
    (p) => p.player_id
  )
  const allPlayerIds = [bet.createdByPlayerId, ...participantIds]
  const winnerName = playerName(winnerId)
  const loserNames = allPlayerIds
    .filter((id) => id !== winnerId)
    .map(playerName)
    .join(', ')
  emitFeedEvent({
    tournamentId: bet.tournamentId,
    type: 'bet',
    message: `${winnerName} won ${bet.amount} from ${loserNames} — ${describeBet(
      bet
    )}`,
    playerId: winnerId,
    roundId: bet.roundId,
  })
}

/**
 * Confirm payment for a bet. If the caller is the bet's creator, set
 * `bets.creator_paid_confirmed`; otherwise set the participant's
 * `paid_confirmed`. When every party has confirmed, flip the bet to 'paid'.
 */
export async function confirmPaid({
  betId,
  playerId,
}: {
  betId: string
  playerId: string
}): Promise<void> {
  const { data: bData, error: bErr } = await supabase
    .from('bets')
    .select(BET_COLUMNS)
    .eq('id', betId)
    .single()
  if (bErr) throw bErr
  const bet = toBet(bData as unknown as BetRow)
  const isCreator = bet.createdByPlayerId === playerId

  if (isCreator) {
    const { error } = await supabase
      .from('bets')
      .update({ creator_paid_confirmed: true })
      .eq('id', betId)
    if (error) throw error
  } else {
    const { error } = await supabase
      .from('bet_participants')
      .update({ paid_confirmed: true })
      .eq('bet_id', betId)
      .eq('player_id', playerId)
    if (error) throw error
  }

  // Re-check whether everyone has now confirmed.
  const [{ data: bAfter }, { data: pAfter }] = await Promise.all([
    supabase
      .from('bets')
      .select('creator_paid_confirmed, status, tournament_id, round_id')
      .eq('id', betId)
      .single(),
    supabase
      .from('bet_participants')
      .select('paid_confirmed, player_id')
      .eq('bet_id', betId),
  ])
  const after = bAfter as {
    creator_paid_confirmed: boolean
    status: BetStatus
    tournament_id: string
    round_id: string | null
  } | null
  const participants = (pAfter as { paid_confirmed: boolean }[]) ?? []
  const allPaid =
    !!after &&
    after.creator_paid_confirmed &&
    participants.every((p) => p.paid_confirmed)

  if (allPaid && after && after.status !== 'paid') {
    const { error } = await supabase
      .from('bets')
      .update({ status: 'paid' })
      .eq('id', betId)
    if (error) throw error

    // Feed event: "Bet paid: <names> — <metric> (<amount> units)"
    const { data: pIdsRaw } = await supabase
      .from('bet_participants')
      .select('player_id')
      .eq('bet_id', betId)
    const participantIds = ((pIdsRaw as { player_id: string }[]) ?? []).map(
      (p) => p.player_id
    )
    const allNames = [
      playerName(bet.createdByPlayerId),
      ...participantIds.map(playerName),
    ].join(' vs ')
    emitFeedEvent({
      tournamentId: after.tournament_id,
      type: 'bet',
      message: `Bet paid: ${allNames} — ${describeBet(bet)} (${bet.amount} units)`,
      roundId: after.round_id ?? undefined,
    })
  }
}

/**
 * Delete a bet. Admins can delete any bet; non-admins can only delete bets
 * they created in `pending` or `rejected` status. RLS enforces this on the
 * server too — the client-side guard is for clean UX (a clearer error).
 *
 * `bet_participants` cascades on bet delete.
 */
export async function removeBet({
  id,
  callerPlayerId,
  isAdmin,
}: {
  id: string
  callerPlayerId: string
  isAdmin: boolean
}): Promise<void> {
  if (!isAdmin) {
    const { data, error } = await supabase
      .from('bets')
      .select('created_by_player_id, status')
      .eq('id', id)
      .maybeSingle()
    if (error) throw error
    if (!data) throw new Error('Bet not found')
    const row = data as {
      created_by_player_id: string | null
      status: BetStatus
    }
    if (row.created_by_player_id !== callerPlayerId) {
      throw new Error('Only the bet creator can remove this bet')
    }
    if (row.status !== 'pending' && row.status !== 'rejected') {
      throw new Error('Can only remove pending or rejected bets')
    }
  }

  const { error } = await supabase.from('bets').delete().eq('id', id)
  if (error) throw error
}
