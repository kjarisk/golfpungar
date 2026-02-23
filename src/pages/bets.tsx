import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/features/auth'
import { useIsAdmin } from '@/hooks/use-is-admin'
import { useTournamentStore } from '@/features/tournament'
import { usePlayersStore } from '@/features/players'
import { useRoundsStore } from '@/features/rounds'
import { useFeedStore } from '@/features/feed'
import { BetList } from '@/features/betting'
import { useActiveRound } from '@/hooks/use-active-round'
import { CircleDollarSign } from 'lucide-react'

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

export function BetsPage() {
  const user = useAuthStore((s) => s.user)
  const isAdmin = useIsAdmin()
  const tournament = useTournamentStore((s) => s.activeTournament())
  const getActivePlayers = usePlayersStore((s) => s.getActivePlayers)
  const getRoundsByTournament = useRoundsStore((s) => s.getRoundsByTournament)
  const getEventsByTournament = useFeedStore((s) => s.getEventsByTournament)
  const activeRound = useActiveRound()

  const players = tournament ? getActivePlayers(tournament.id) : []
  const rounds = tournament ? getRoundsByTournament(tournament.id) : []
  const currentPlayer = players.find((p) => p.userId === user?.id)

  // Bet-related feed events (chronological, newest first)
  const betFeedEvents = tournament
    ? getEventsByTournament(tournament.id).filter((e) => e.type === 'bet')
    : []

  if (!tournament || !currentPlayer) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-20 text-center">
        <CircleDollarSign className="text-muted-foreground size-10" />
        <p className="text-muted-foreground text-sm">
          No active tournament found
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Bets</h1>
        <p className="text-muted-foreground text-sm">
          Create, manage, and track bets for {tournament.name}
        </p>
      </div>

      {/* Full BetList component */}
      <BetList
        tournamentId={tournament.id}
        currentPlayerId={currentPlayer.id}
        players={players}
        rounds={rounds}
        activeRoundId={activeRound?.id}
        isAdmin={isAdmin}
      />

      {/* Bet Activity feed */}
      {betFeedEvents.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Bet Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {betFeedEvents.slice(0, 30).map((event) => (
              <div
                key={event.id}
                className="flex items-start gap-2.5 rounded-md px-2 py-2"
              >
                <CircleDollarSign className="mt-0.5 size-4 shrink-0 text-violet-500" />
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="text-sm">{event.message}</span>
                  <span className="text-muted-foreground text-[10px]">
                    {timeAgo(event.createdAt)}
                  </span>
                </div>
                <Badge variant="secondary" className="shrink-0 text-[10px]">
                  BET
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
