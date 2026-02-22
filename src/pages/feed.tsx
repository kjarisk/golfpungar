import { Link } from 'react-router'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/features/auth'
import { useIsAdmin } from '@/hooks/use-is-admin'
import { useTournamentStore } from '@/features/tournament'
import { TournamentStatusBadge } from '@/features/tournament/components/tournament-status-badge'
import { usePlayersStore } from '@/features/players'
import { useRoundsStore } from '@/features/rounds'
import { useScoringStore } from '@/features/scoring'
import { useSideEventsStore } from '@/features/side-events'
import { usePenaltiesStore } from '@/features/penalties'
import { useBettingStore } from '@/features/betting'
import { useFeedStore } from '@/features/feed'
import { computeTotalPointsLeaderboard } from '@/lib/leaderboard-calc'
import { seedDemoData, clearDemoData, isDemoSeeded } from '@/lib/demo-data'
import {
  MapPin,
  Calendar,
  Users,
  Flag,
  Bird,
  Zap,
  Skull,
  Target,
  Ruler,
  Star,
  Trophy,
  Flame,
  CircleDot,
  Crosshair,
  CircleDollarSign,
  Database,
  Trash2,
} from 'lucide-react'

/** Map side event types to display config */
const SIDE_EVENT_CONFIG: Record<
  string,
  { label: string; icon: typeof Bird; color: string }
> = {
  birdie: { label: 'BIRDIE', icon: Bird, color: 'text-green-500' },
  eagle: { label: 'EAGLE', icon: Zap, color: 'text-yellow-500' },
  hio: { label: 'HOLE IN ONE', icon: Star, color: 'text-amber-500' },
  albatross: { label: 'ALBATROSS', icon: Bird, color: 'text-purple-500' },
  bunker_save: { label: 'BUNKER SAVE', icon: Target, color: 'text-orange-500' },
  snake: { label: 'SNAKE', icon: Skull, color: 'text-red-500' },
  snopp: { label: 'SNOPP', icon: Flame, color: 'text-red-700' },
  group_longest_drive: {
    label: 'GROUP LD',
    icon: Trophy,
    color: 'text-blue-500',
  },
  longest_drive_meters: {
    label: 'DRIVE',
    icon: Ruler,
    color: 'text-indigo-500',
  },
  longest_putt: {
    label: 'LONGEST PUTT',
    icon: Ruler,
    color: 'text-cyan-500',
  },
  nearest_to_pin: {
    label: 'NEAREST PIN',
    icon: Crosshair,
    color: 'text-teal-500',
  },
  gir: {
    label: 'GIR',
    icon: CircleDot,
    color: 'text-emerald-500',
  },
}

function formatDateRange(start: string, end: string) {
  const s = new Date(start)
  const e = new Date(end)
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  return `${s.toLocaleDateString('en-US', opts)} – ${e.toLocaleDateString('en-US', { ...opts, year: 'numeric' })}`
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function timeAgo(dateString: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateString).getTime()) / 1000
  )
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

/** Dev-only toggle: hold Shift and click the stats area 3 times to reveal demo controls */
const IS_DEV = import.meta.env.DEV

export function FeedPage() {
  const user = useAuthStore((s) => s.user)
  const isAdmin = useIsAdmin()
  const tournament = useTournamentStore((s) => s.activeTournament())
  const getActivePlayers = usePlayersStore((s) => s.getActivePlayers)
  const getRoundsByTournament = useRoundsStore((s) => s.getRoundsByTournament)
  const allRoundPoints = useScoringStore((s) => s.roundPoints)
  const getEventsByTournament = useSideEventsStore(
    (s) => s.getEventsByTournament
  )
  const getPenaltyEntries = usePenaltiesStore((s) => s.getEntriesByTournament)
  const getBetsByTournament = useBettingStore((s) => s.getBetsByTournament)
  const getBetParticipants = useBettingStore((s) => s.getParticipantsForBet)
  const getRecentFeedEvents = useFeedStore((s) => s.getRecentEvents)
  const roundCount$ = useRoundsStore((s) => s.rounds.length)
  const seeded = roundCount$ > 0
  const setRole = useAuthStore((s) => s.setRole)
  const currentRole = useAuthStore((s) => s.user?.role ?? 'player')

  const handleSeed = () => {
    if (!isDemoSeeded()) {
      seedDemoData()
    }
  }

  const handleClear = () => {
    clearDemoData()
  }

  const players = tournament ? getActivePlayers(tournament.id) : []
  const rounds = tournament ? getRoundsByTournament(tournament.id) : []
  const playerCount = players.length
  const roundCount = rounds.length

  // Current user's player record
  const currentPlayer = players.find((p) => p.userId === user?.id)

  // Total points for current user
  const totalLeaderboard = computeTotalPointsLeaderboard(
    allRoundPoints,
    players.map((p) => p.id)
  )
  const myPoints =
    totalLeaderboard.find((e) => e.playerId === currentPlayer?.id)
      ?.totalPoints ?? 0

  // Combine side events + penalties + bets + feed events into a unified feed
  const sideEvents = tournament ? getEventsByTournament(tournament.id) : []
  const penaltyEntries = tournament ? getPenaltyEntries(tournament.id) : []
  const bets = tournament ? getBetsByTournament(tournament.id) : []
  const feedEvents = tournament ? getRecentFeedEvents(tournament.id, 50) : []

  type UnifiedFeedItem = {
    id: string
    message: string
    createdAt: string
    type: 'side_event' | 'feed' | 'penalty' | 'bet'
    sideEventType?: string
    betStatus?: string
    playerName?: string
  }

  const unifiedFeed: UnifiedFeedItem[] = [
    ...sideEvents.map((e) => {
      const player = players.find((p) => p.id === e.playerId)
      const config = SIDE_EVENT_CONFIG[e.type]
      const holeStr = e.holeNumber ? ` on ${e.holeNumber}` : ''
      const valueStr =
        (e.type === 'longest_drive_meters' ||
          e.type === 'longest_putt' ||
          e.type === 'nearest_to_pin') &&
        e.value
          ? ` — ${e.value}m`
          : ''
      return {
        id: e.id,
        message: `${player?.displayName ?? 'Unknown'} — ${config?.label ?? e.type}${holeStr}${valueStr}`,
        createdAt: e.createdAt,
        type: 'side_event' as const,
        sideEventType: e.type,
        playerName: player?.displayName,
      }
    }),
    ...penaltyEntries.map((e) => {
      const player = players.find((p) => p.id === e.playerId)
      const noteStr = e.note ? `: ${e.note}` : ''
      return {
        id: e.id,
        message: `${player?.displayName ?? 'Unknown'} — PENALTY (${e.amount})${noteStr}`,
        createdAt: e.createdAt,
        type: 'penalty' as const,
        playerName: player?.displayName,
      }
    }),
    ...feedEvents.map((e) => ({
      id: e.id,
      message: e.message,
      createdAt: e.createdAt,
      type: 'feed' as const,
    })),
    ...bets.map((bet) => {
      const creator = players.find((p) => p.id === bet.createdByPlayerId)
      const betParticipants = getBetParticipants(bet.id)
      const opponentNames = betParticipants
        .map(
          (bp) =>
            players.find((p) => p.id === bp.playerId)?.displayName ?? 'Unknown'
        )
        .join(', ')
      const metricLabel =
        bet.metricKey === 'custom' && bet.customDescription
          ? bet.customDescription
          : bet.metricKey === 'most_points'
            ? 'most points'
            : bet.metricKey === 'most_birdies'
              ? 'most birdies'
              : 'head-to-head'
      const winnerName = bet.winnerId
        ? (players.find((p) => p.id === bet.winnerId)?.displayName ?? 'Unknown')
        : null

      const statusMessages: Record<string, string> = {
        pending: `${creator?.displayName ?? 'Unknown'} challenged ${opponentNames} — ${metricLabel} (${bet.amount} units)`,
        accepted: `Bet accepted: ${creator?.displayName ?? 'Unknown'} vs ${opponentNames} — ${metricLabel}`,
        rejected: `Bet rejected: ${creator?.displayName ?? 'Unknown'} vs ${opponentNames}`,
        won: `${winnerName} won the bet: ${metricLabel} (${bet.amount} units)`,
        lost: `${winnerName} won the bet: ${metricLabel} (${bet.amount} units)`,
        paid: `Bet settled: ${creator?.displayName ?? 'Unknown'} vs ${opponentNames} — ${metricLabel} (${bet.amount} units)`,
      }

      return {
        id: `bet-feed-${bet.id}`,
        message: statusMessages[bet.status] ?? `Bet update: ${bet.status}`,
        createdAt: bet.createdAt,
        type: 'bet' as const,
        betStatus: bet.status,
        playerName: creator?.displayName,
      }
    }),
  ].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  return (
    <div className="flex flex-col gap-6">
      {/* Tournament hero */}
      {tournament ? (
        <div className="from-primary/10 via-primary/5 to-background -mx-4 -mt-4 rounded-b-2xl bg-gradient-to-b px-4 pt-6 pb-5">
          <TournamentStatusBadge status={tournament.status} />
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight">
            {tournament.name}
          </h1>
          <div className="text-muted-foreground mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            {tournament.location && (
              <span className="flex items-center gap-1">
                <MapPin className="size-3.5" aria-hidden="true" />
                {tournament.location}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="size-3.5" aria-hidden="true" />
              {formatDateRange(tournament.startDate, tournament.endDate)}
            </span>
          </div>
          <p className="text-muted-foreground mt-3 text-sm">
            {getGreeting()}, {user?.displayName}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <h1 className="text-2xl font-bold tracking-tight">
            {getGreeting()}, {user?.displayName}
          </h1>
          <p className="text-muted-foreground text-sm">
            No active tournament.{isAdmin ? ' Create one to get started.' : ''}
          </p>
          <Button asChild variant="outline" className="w-fit">
            <Link to="/tournaments">
              <Flag className="size-4" aria-hidden="true" />
              {isAdmin ? 'Manage Tournaments' : 'View Tournaments'}
            </Link>
          </Button>
        </div>
      )}

      {/* Stats row */}
      {tournament && (
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="flex flex-col items-center pt-4 pb-3">
              <Users className="text-primary mb-1 size-5" aria-hidden="true" />
              <p className="text-2xl font-bold">{playerCount}</p>
              <p className="text-muted-foreground text-xs">
                {playerCount === 0 ? (
                  <span className="text-amber-600">Add players</span>
                ) : (
                  'Players'
                )}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col items-center pt-4 pb-3">
              <Flag className="text-primary mb-1 size-5" aria-hidden="true" />
              <p className="text-2xl font-bold">{roundCount}</p>
              <p className="text-muted-foreground text-xs">
                {roundCount === 0 ? (
                  <span className="text-amber-600">Create a round</span>
                ) : (
                  'Rounds'
                )}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col items-center pt-4 pb-3">
              <Trophy className="text-primary mb-1 size-5" aria-hidden="true" />
              <p className="text-2xl font-bold">{myPoints}</p>
              <p className="text-muted-foreground text-xs">Your Points</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Dev controls (dev only) */}
      {IS_DEV && (
        <div className="flex flex-wrap items-center gap-2">
          {tournament && !seeded && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSeed}
              className="gap-1.5 text-xs"
            >
              <Database className="size-3.5" aria-hidden="true" />
              Seed Demo Data
            </Button>
          )}
          {tournament && seeded && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClear}
              className="gap-1.5 text-xs text-red-600 hover:text-red-700"
            >
              <Trash2 className="size-3.5" aria-hidden="true" />
              Clear Demo Data
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setRole(currentRole === 'admin' ? 'player' : 'admin')
            }
            className="gap-1.5 text-xs"
          >
            Role: {currentRole}
          </Button>
          {tournament && (
            <span className="text-muted-foreground text-[10px]">
              {seeded ? 'Demo data loaded' : 'No rounds yet'}
            </span>
          )}
        </div>
      )}

      {/* Live feed */}
      {tournament && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Live Feed</CardTitle>
            <CardDescription>
              {unifiedFeed.length > 0
                ? `${unifiedFeed.length} events`
                : 'Events will appear here during play'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {unifiedFeed.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <p className="text-muted-foreground text-sm">No events yet</p>
                <p className="text-muted-foreground text-xs">
                  Birdies, snakes, and longest drives will show up here
                </p>
              </div>
            ) : (
              <div
                aria-live="polite"
                role="log"
                className="flex max-h-96 flex-col gap-1 overflow-y-auto"
              >
                {unifiedFeed.slice(0, 30).map((item) => {
                  const config = item.sideEventType
                    ? SIDE_EVENT_CONFIG[item.sideEventType]
                    : null
                  const Icon = config?.icon

                  return (
                    <div
                      key={item.id}
                      className="animate-in fade-in slide-in-from-top-1 flex items-start gap-2.5 rounded-md px-2 py-2"
                    >
                      {Icon ? (
                        <Icon
                          className={`mt-0.5 size-4 shrink-0 ${config.color}`}
                        />
                      ) : item.type === 'bet' ? (
                        <CircleDollarSign className="mt-0.5 size-4 shrink-0 text-violet-500" />
                      ) : (
                        <div className="bg-muted mt-0.5 size-4 shrink-0 rounded-full" />
                      )}
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="text-sm">{item.message}</span>
                        <span className="text-muted-foreground text-[10px]">
                          {timeAgo(item.createdAt)}
                        </span>
                      </div>
                      {item.sideEventType && (
                        <Badge
                          variant="secondary"
                          className="shrink-0 text-[10px]"
                        >
                          {config?.label}
                        </Badge>
                      )}
                      {item.type === 'bet' && (
                        <Badge
                          variant="secondary"
                          className="shrink-0 text-[10px]"
                        >
                          BET
                        </Badge>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
