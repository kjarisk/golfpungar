import { useState } from 'react'
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
import { useTournamentStore } from '@/features/tournament'
import { TournamentStatusBadge } from '@/features/tournament/components/tournament-status-badge'
import { CreateTournamentDialog } from '@/features/tournament/components/create-tournament-dialog'
import { usePlayersStore } from '@/features/players'
import { useRoundsStore } from '@/features/rounds'
import { useScoringStore } from '@/features/scoring'
import { useSideEventsStore } from '@/features/side-events'
import { useFeedStore } from '@/features/feed'
import { computeTotalPointsLeaderboard } from '@/lib/leaderboard-calc'
import {
  MapPin,
  Calendar,
  Plus,
  Users,
  Flag,
  Bird,
  Zap,
  Skull,
  Target,
  Ruler,
  Star,
  Trophy,
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
}

function formatDateRange(start: string, end: string) {
  const s = new Date(start)
  const e = new Date(end)
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  return `${s.toLocaleDateString('en-US', opts)} – ${e.toLocaleDateString('en-US', { ...opts, year: 'numeric' })}`
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

export function FeedPage() {
  const user = useAuthStore((s) => s.user)
  const tournament = useTournamentStore((s) => s.activeTournament())
  const getActivePlayers = usePlayersStore((s) => s.getActivePlayers)
  const getRoundsByTournament = useRoundsStore((s) => s.getRoundsByTournament)
  const allRoundPoints = useScoringStore((s) => s.roundPoints)
  const getEventsByTournament = useSideEventsStore(
    (s) => s.getEventsByTournament
  )
  const getRecentFeedEvents = useFeedStore((s) => s.getRecentEvents)
  const [showCreate, setShowCreate] = useState(false)

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

  // Combine side events + feed events into a unified feed
  const sideEvents = tournament ? getEventsByTournament(tournament.id) : []
  const feedEvents = tournament ? getRecentFeedEvents(tournament.id, 50) : []

  type UnifiedFeedItem = {
    id: string
    message: string
    createdAt: string
    type: 'side_event' | 'feed'
    sideEventType?: string
    playerName?: string
  }

  const unifiedFeed: UnifiedFeedItem[] = [
    ...sideEvents.map((e) => {
      const player = players.find((p) => p.id === e.playerId)
      const config = SIDE_EVENT_CONFIG[e.type]
      const holeStr = e.holeNumber ? ` on ${e.holeNumber}` : ''
      const valueStr =
        e.type === 'longest_drive_meters' && e.value ? ` — ${e.value}m` : ''
      return {
        id: e.id,
        message: `${player?.displayName ?? 'Unknown'} — ${config?.label ?? e.type}${holeStr}${valueStr}`,
        createdAt: e.createdAt,
        type: 'side_event' as const,
        sideEventType: e.type,
        playerName: player?.displayName,
      }
    }),
    ...feedEvents.map((e) => ({
      id: e.id,
      message: e.message,
      createdAt: e.createdAt,
      type: 'feed' as const,
    })),
  ].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  return (
    <div className="flex flex-col gap-6">
      {/* Tournament header */}
      {tournament ? (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">
              {tournament.name}
            </h1>
            <TournamentStatusBadge status={tournament.status} />
          </div>
          <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            {tournament.location && (
              <span className="flex items-center gap-1">
                <MapPin className="size-3.5" />
                {tournament.location}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="size-3.5" />
              {formatDateRange(tournament.startDate, tournament.endDate)}
            </span>
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            Welcome back, {user?.displayName}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <h1 className="text-2xl font-bold tracking-tight">
            Good morning, {user?.displayName}
          </h1>
          <p className="text-muted-foreground text-sm">
            No active tournament. Create one to get started.
          </p>
          <Button onClick={() => setShowCreate(true)} className="w-fit">
            <Plus className="size-4" />
            Create Tournament
          </Button>
        </div>
      )}

      {/* Stats row */}
      {tournament && (
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="flex flex-col items-center pt-4 pb-3">
              <Users className="text-primary mb-1 size-5" />
              <p className="text-2xl font-bold">{playerCount}</p>
              <p className="text-muted-foreground text-xs">Players</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col items-center pt-4 pb-3">
              <Flag className="text-primary mb-1 size-5" />
              <p className="text-2xl font-bold">{roundCount}</p>
              <p className="text-muted-foreground text-xs">Rounds</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col items-center pt-4 pb-3">
              <Trophy className="text-primary mb-1 size-5" />
              <p className="text-2xl font-bold">{myPoints}</p>
              <p className="text-muted-foreground text-xs">Your Points</p>
            </CardContent>
          </Card>
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
                <p className="text-muted-foreground/60 text-xs">
                  Birdies, snakes, and longest drives will show up here
                </p>
              </div>
            ) : (
              <div className="flex max-h-96 flex-col gap-1 overflow-y-auto">
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
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <CreateTournamentDialog open={showCreate} onOpenChange={setShowCreate} />
    </div>
  )
}
