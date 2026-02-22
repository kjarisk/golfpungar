import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useTournamentStore } from '@/features/tournament'
import { TournamentStatusBadge } from './tournament-status-badge'
import { useIsAdmin } from '@/hooks/use-is-admin'
import type { Tournament } from '@/features/tournament'
import { MapPin, Calendar, Check } from 'lucide-react'

function formatDateRange(start: string, end: string) {
  const s = new Date(start)
  const e = new Date(end)
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  return `${s.toLocaleDateString('en-US', opts)} – ${e.toLocaleDateString('en-US', { ...opts, year: 'numeric' })}`
}

interface TournamentListProps {
  onSelect?: (tournament: Tournament) => void
}

export function TournamentList({ onSelect }: TournamentListProps) {
  const tournaments = useTournamentStore((s) => s.tournaments)
  const activeTournamentId = useTournamentStore((s) => s.activeTournamentId)
  const setActiveTournament = useTournamentStore((s) => s.setActiveTournament)
  const isAdmin = useIsAdmin()

  // Admin sees all. Player sees live + done (not draft).
  const visibleTournaments = isAdmin
    ? tournaments
    : tournaments.filter((t) => t.status === 'live' || t.status === 'done')

  // Sort: active first, then live, then draft, then done (most recent first)
  const sorted = [...visibleTournaments].sort((a, b) => {
    if (a.id === activeTournamentId) return -1
    if (b.id === activeTournamentId) return 1
    const statusOrder = { live: 0, draft: 1, done: 2 }
    const sa = statusOrder[a.status]
    const sb = statusOrder[b.status]
    if (sa !== sb) return sa - sb
    return new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  })

  function handleSetActive(id: string) {
    setActiveTournament(id)
  }

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center">
        <p className="text-muted-foreground text-sm">No tournaments yet</p>
        {!isAdmin && (
          <p className="text-muted-foreground text-xs">
            Ask an admin to create a tournament.
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {sorted.map((t) => {
        const isActive = t.id === activeTournamentId
        return (
          <Card
            key={t.id}
            className={
              isActive ? 'border-primary/40 ring-primary/20 ring-1' : ''
            }
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2">
                <CardTitle
                  className="flex items-center gap-2 text-base cursor-pointer"
                  onClick={() => onSelect?.(t)}
                >
                  {t.name}
                  {isActive && (
                    <Badge variant="default" className="text-[10px]">
                      Active
                    </Badge>
                  )}
                </CardTitle>
                <TournamentStatusBadge status={t.status} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-muted-foreground mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                {t.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3" aria-hidden="true" />
                    {t.location}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="size-3" aria-hidden="true" />
                  {formatDateRange(t.startDate, t.endDate)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {isAdmin && !isActive && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSetActive(t.id)}
                    className="gap-1.5"
                  >
                    <Check className="size-3.5" />
                    Set as Active
                  </Button>
                )}
                {t.status === 'done' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onSelect?.(t)}
                    className="text-xs"
                  >
                    View Leaderboards
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
