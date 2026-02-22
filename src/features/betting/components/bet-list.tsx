import { useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { useBettingStore } from '../state/betting-store'
import { CreateBetDialog } from './create-bet-dialog'
import { categorizeBets } from '../lib/categorize-bets'
import type { Player } from '@/features/players/types'
import type { Round } from '@/features/rounds/types'
import type { Bet } from '../types'
import {
  Plus,
  Trash2,
  Check,
  X,
  Trophy,
  CircleDollarSign,
  Banknote,
  CircleCheck,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'

interface BetListProps {
  tournamentId: string
  currentPlayerId: string
  players: Player[]
  rounds: Round[]
  activeRoundId?: string
}

const METRIC_LABELS: Record<string, string> = {
  most_points: 'Most Points',
  most_birdies: 'Most Birdies',
  head_to_head: 'Head-to-Head',
  custom: 'Custom',
}

const STATUS_VARIANTS: Record<
  string,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  pending: 'outline',
  accepted: 'default',
  rejected: 'destructive',
  won: 'secondary',
  lost: 'destructive',
  paid: 'default',
}

export function BetList({
  tournamentId,
  currentPlayerId,
  players,
  rounds,
  activeRoundId,
}: BetListProps) {
  const getBetsByTournament = useBettingStore((s) => s.getBetsByTournament)
  const getParticipantsForBet = useBettingStore((s) => s.getParticipantsForBet)
  const acceptBet = useBettingStore((s) => s.acceptBet)
  const rejectBet = useBettingStore((s) => s.rejectBet)
  const resolveBet = useBettingStore((s) => s.resolveBet)
  const confirmPaid = useBettingStore((s) => s.confirmPaid)
  const removeBet = useBettingStore((s) => s.removeBet)

  const [showDialog, setShowDialog] = useState(false)
  const [resolvingBetId, setResolvingBetId] = useState<string | null>(null)
  const [selectedWinner, setSelectedWinner] = useState('')
  const [settledOpen, setSettledOpen] = useState(false)

  const bets = getBetsByTournament(tournamentId)
  const { roundBets, tournamentBets, settledBets } = categorizeBets(
    bets,
    activeRoundId
  )

  function getPlayerName(playerId: string) {
    return players.find((p) => p.id === playerId)?.displayName ?? 'Unknown'
  }

  function getRoundName(roundId?: string) {
    if (!roundId) return null
    return rounds.find((r) => r.id === roundId)?.name ?? null
  }

  function getBetDescription(bet: Bet) {
    if (bet.metricKey === 'custom' && bet.customDescription) {
      return bet.customDescription
    }
    return METRIC_LABELS[bet.metricKey] ?? bet.metricKey
  }

  function getAllBetPlayerIds(bet: Bet): string[] {
    const participants = getParticipantsForBet(bet.id)
    return [bet.createdByPlayerId, ...participants.map((p) => p.playerId)]
  }

  function handleAccept(betId: string) {
    acceptBet(betId, currentPlayerId)
    toast('Bet accepted!', { duration: 2000 })
  }

  function handleReject(betId: string) {
    rejectBet(betId, currentPlayerId)
    toast('Bet rejected.', { duration: 2000 })
  }

  function handleResolve(betId: string) {
    if (!selectedWinner) return
    resolveBet(betId, selectedWinner)
    const winnerName = getPlayerName(selectedWinner)
    toast(`Bet resolved — ${winnerName} wins!`, { duration: 3000 })
    setResolvingBetId(null)
    setSelectedWinner('')
  }

  function handleRemove(betId: string) {
    removeBet(betId)
    toast('Bet removed.', { duration: 2000 })
  }

  function handleConfirmPaid(betId: string) {
    confirmPaid(betId, currentPlayerId)
    toast('Payment confirmed!', { duration: 2000 })
  }

  const activeRoundName = activeRoundId
    ? getRoundName(activeRoundId)
    : undefined

  const hasBets = bets.length > 0

  function renderBetCard(bet: Bet) {
    const participants = getParticipantsForBet(bet.id)
    const opponentNames = participants
      .map((p) => getPlayerName(p.playerId))
      .join(', ')
    const roundName = getRoundName(bet.roundId)
    const isCreator = bet.createdByPlayerId === currentPlayerId
    const isParticipant = participants.some(
      (p) => p.playerId === currentPlayerId
    )
    const myParticipant = participants.find(
      (p) => p.playerId === currentPlayerId
    )
    const needsMyResponse =
      isParticipant &&
      myParticipant?.accepted === null &&
      bet.status === 'pending'
    const canResolve = bet.status === 'accepted' && isCreator
    const isResolving = resolvingBetId === bet.id
    const isResolved = bet.status === 'won' || bet.status === 'lost'
    const isPaid = bet.status === 'paid'
    const myPaidConfirmed = isCreator
      ? bet.creatorPaidConfirmed
      : (myParticipant?.paidConfirmed ?? false)
    const canConfirmPaid =
      isResolved && (isCreator || isParticipant) && !myPaidConfirmed

    return (
      <div key={bet.id} className="flex flex-col gap-2 rounded-lg border p-3">
        {/* Header row */}
        <div className="flex items-start gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {getPlayerName(bet.createdByPlayerId)}
              </span>
              <span className="text-muted-foreground text-xs">vs</span>
              <span className="text-sm font-medium">{opponentNames}</span>
            </div>
            <div className="text-muted-foreground mt-0.5 flex items-center gap-2 text-xs">
              <span>{getBetDescription(bet)}</span>
              {roundName && (
                <>
                  <span>·</span>
                  <span>{roundName}</span>
                </>
              )}
              <span>·</span>
              <span className="capitalize">{bet.scope}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge
              variant={STATUS_VARIANTS[bet.status] ?? 'outline'}
              className="text-xs capitalize"
            >
              {bet.status}
            </Badge>
            <Badge variant="secondary" className="tabular-nums text-xs">
              {bet.amount}
            </Badge>
          </div>
        </div>

        {/* Winner display */}
        {bet.winnerId && (
          <div className="flex items-center gap-1.5 text-xs">
            <Trophy className="size-3.5 text-yellow-500" />
            <span className="font-medium">{getPlayerName(bet.winnerId)}</span>
            <span className="text-muted-foreground">wins!</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Acceptance buttons for opponents */}
          {needsMyResponse && (
            <>
              <Button
                size="sm"
                variant="default"
                className="h-7 text-xs"
                onClick={() => handleAccept(bet.id)}
              >
                <Check className="mr-1 size-3" />
                Accept
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="h-7 text-xs"
                onClick={() => handleReject(bet.id)}
              >
                <X className="mr-1 size-3" />
                Reject
              </Button>
            </>
          )}

          {/* Resolve button for creator on accepted bets */}
          {canResolve && !isResolving && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => {
                setResolvingBetId(bet.id)
                setSelectedWinner('')
              }}
            >
              <Trophy className="mr-1 size-3" />
              Resolve
            </Button>
          )}

          {/* Resolution form */}
          {isResolving && (
            <>
              <Select value={selectedWinner} onValueChange={setSelectedWinner}>
                <SelectTrigger
                  className="h-7 w-36 text-xs"
                  aria-label="Select winner"
                >
                  <SelectValue placeholder="Winner?" />
                </SelectTrigger>
                <SelectContent>
                  {getAllBetPlayerIds(bet).map((pid) => (
                    <SelectItem key={pid} value={pid}>
                      {getPlayerName(pid)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                variant="default"
                className="h-7 text-xs"
                onClick={() => handleResolve(bet.id)}
                disabled={!selectedWinner}
              >
                Confirm
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs"
                onClick={() => setResolvingBetId(null)}
              >
                Cancel
              </Button>
            </>
          )}

          {/* Paid confirmation button */}
          {canConfirmPaid && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => handleConfirmPaid(bet.id)}
            >
              <Banknote className="mr-1 size-3" />
              Mark as Paid
            </Button>
          )}

          {/* Already confirmed paid indicator (per player) */}
          {isResolved &&
            (isCreator || isParticipant) &&
            myPaidConfirmed &&
            !isPaid && (
              <span className="flex items-center gap-1 text-xs text-green-600">
                <CircleCheck className="size-3" />
                You confirmed
              </span>
            )}

          {/* Fully paid indicator */}
          {isPaid && (
            <span className="flex items-center gap-1 text-xs font-medium text-green-600">
              <CircleCheck className="size-3.5" />
              Paid
            </span>
          )}

          {/* Remove for creator on pending/rejected bets */}
          {isCreator &&
            (bet.status === 'pending' || bet.status === 'rejected') && (
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-destructive ml-auto size-7 p-0"
                onClick={() => handleRemove(bet.id)}
                aria-label="Remove bet"
              >
                <Trash2 className="size-3.5" />
              </Button>
            )}
        </div>
      </div>
    )
  }

  function renderSection(
    title: string,
    sectionBets: Bet[],
    emptyText?: string
  ) {
    if (sectionBets.length === 0 && !emptyText) return null
    return (
      <div className="flex flex-col gap-2">
        <h3 className="text-muted-foreground border-b pb-1 text-xs font-semibold uppercase tracking-wider">
          {title}
          <span className="ml-1.5 font-normal">({sectionBets.length})</span>
        </h3>
        {sectionBets.length === 0 ? (
          <p className="text-muted-foreground py-2 text-center text-xs">
            {emptyText}
          </p>
        ) : (
          sectionBets.map(renderBetCard)
        )}
      </div>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <CircleDollarSign className="size-4 text-green-600" />
              Bets
            </CardTitle>
            <Button size="sm" onClick={() => setShowDialog(true)}>
              <Plus className="size-4" />
              New Bet
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!hasBets ? (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <p className="text-muted-foreground text-sm">No bets yet.</p>
              <p className="text-muted-foreground text-xs">
                Challenge a player to make things interesting!
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Round bets section — only shown when there's an active round */}
              {activeRoundId &&
                renderSection(
                  activeRoundName ? `Round — ${activeRoundName}` : 'Round Bets',
                  roundBets,
                  'No bets for this round.'
                )}

              {/* Tournament bets section */}
              {renderSection(
                'Tournament',
                tournamentBets,
                activeRoundId ? undefined : 'No active bets.'
              )}

              {/* Settled bets — collapsible, closed by default */}
              {settledBets.length > 0 && (
                <Collapsible open={settledOpen} onOpenChange={setSettledOpen}>
                  <CollapsibleTrigger asChild>
                    <button
                      type="button"
                      className="text-muted-foreground flex w-full items-center gap-1 border-b pb-1 text-xs font-semibold uppercase tracking-wider hover:text-foreground"
                    >
                      {settledOpen ? (
                        <ChevronDown className="size-3.5" />
                      ) : (
                        <ChevronRight className="size-3.5" />
                      )}
                      Settled
                      <span className="font-normal">
                        ({settledBets.length})
                      </span>
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="mt-2 flex flex-col gap-2">
                      {settledBets.map(renderBetCard)}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <CreateBetDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        tournamentId={tournamentId}
        currentPlayerId={currentPlayerId}
        players={players}
        rounds={rounds}
      />
    </>
  )
}
