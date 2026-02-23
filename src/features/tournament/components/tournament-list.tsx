import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useTournamentStore } from '@/features/tournament'
import { useCountriesStore } from '@/features/countries'
import { TournamentStatusBadge } from './tournament-status-badge'
import { EditTournamentDialog } from './edit-tournament-dialog'
import { useIsAdmin } from '@/hooks/use-is-admin'
import type { Tournament } from '@/features/tournament'
import {
  MapPin,
  Calendar,
  Check,
  ChevronDown,
  Pencil,
  Trash2,
  Play,
  Flag,
  Globe,
} from 'lucide-react'

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
  const setStatus = useTournamentStore((s) => s.setStatus)
  const removeTournament = useTournamentStore((s) => s.removeTournament)
  const countries = useCountriesStore((s) => s.countries)
  const isAdmin = useIsAdmin()

  const [editTournament, setEditTournament] = useState<Tournament | null>(null)
  const [deleteTournament, setDeleteTournament] = useState<Tournament | null>(
    null
  )
  const [archiveOpen, setArchiveOpen] = useState(false)

  // Admin sees all. Player sees live + done (not draft).
  const visibleTournaments = isAdmin
    ? tournaments
    : tournaments.filter((t) => t.status === 'live' || t.status === 'done')

  // Split into active (draft + live) and archived (done)
  const activeTournaments = visibleTournaments.filter(
    (t) => t.status !== 'done'
  )
  const archivedTournaments = visibleTournaments.filter(
    (t) => t.status === 'done'
  )

  // Sort: active first, then by startDate desc
  function sortTournaments(list: Tournament[]) {
    return [...list].sort((a, b) => {
      if (a.id === activeTournamentId) return -1
      if (b.id === activeTournamentId) return 1
      const statusOrder = { live: 0, draft: 1, done: 2 }
      const sa = statusOrder[a.status]
      const sb = statusOrder[b.status]
      if (sa !== sb) return sa - sb
      return new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    })
  }

  const sortedActive = sortTournaments(activeTournaments)
  const sortedArchived = sortTournaments(archivedTournaments)

  function getCountryName(countryId?: string) {
    if (!countryId) return undefined
    return countries.find((c) => c.id === countryId)?.name
  }

  function handleDelete() {
    if (!deleteTournament) return
    removeTournament(deleteTournament.id)
    setDeleteTournament(null)
  }

  function handleStatusTransition(tournament: Tournament) {
    if (tournament.status === 'draft') {
      setStatus(tournament.id, 'live')
    } else if (tournament.status === 'live') {
      setStatus(tournament.id, 'done')
    }
  }

  function renderCard(t: Tournament) {
    const isActive = t.id === activeTournamentId
    const countryName = getCountryName(t.countryId)

    return (
      <Card
        key={t.id}
        className={isActive ? 'border-primary/40 ring-primary/20 ring-1' : ''}
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
            <div className="flex items-center gap-1.5">
              {isAdmin && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-7"
                  onClick={() => setEditTournament(t)}
                  aria-label={`Edit ${t.name}`}
                >
                  <Pencil className="size-3.5" />
                </Button>
              )}
              {isAdmin && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-destructive hover:text-destructive size-7"
                  onClick={() => setDeleteTournament(t)}
                  aria-label={`Delete ${t.name}`}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              )}
              <TournamentStatusBadge status={t.status} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            {countryName && (
              <span className="flex items-center gap-1">
                <Globe className="size-3" aria-hidden="true" />
                {countryName}
              </span>
            )}
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
            {isAdmin && !isActive && t.status !== 'done' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setActiveTournament(t.id)}
                className="gap-1.5"
              >
                <Check className="size-3.5" />
                Set as Active
              </Button>
            )}
            {isAdmin && t.status === 'draft' && (
              <Button
                size="sm"
                variant="default"
                onClick={() => handleStatusTransition(t)}
                className="gap-1.5"
              >
                <Play className="size-3.5" />
                Go Live
              </Button>
            )}
            {isAdmin && t.status === 'live' && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleStatusTransition(t)}
                className="gap-1.5"
              >
                <Flag className="size-3.5" />
                Mark Complete
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
  }

  const hasContent = sortedActive.length > 0 || sortedArchived.length > 0

  if (!hasContent) {
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
    <>
      <div className="flex flex-col gap-3">
        {sortedActive.map(renderCard)}

        {sortedArchived.length > 0 && (
          <Collapsible open={archiveOpen} onOpenChange={setArchiveOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="text-muted-foreground w-full justify-between text-sm"
              >
                <span>Archive ({sortedArchived.length})</span>
                <ChevronDown
                  className={`size-4 transition-transform ${archiveOpen ? 'rotate-180' : ''}`}
                />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="flex flex-col gap-3 pt-2">
              {sortedArchived.map(renderCard)}
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>

      {/* Edit dialog */}
      {editTournament && (
        <EditTournamentDialog
          tournament={editTournament}
          open={!!editTournament}
          onOpenChange={(open) => {
            if (!open) setEditTournament(null)
          }}
        />
      )}

      {/* Delete confirmation */}
      <Dialog
        open={!!deleteTournament}
        onOpenChange={(open) => {
          if (!open) setDeleteTournament(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Tournament</DialogTitle>
            <DialogDescription>
              This will permanently delete &ldquo;{deleteTournament?.name}
              &rdquo; and all its data. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTournament(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
