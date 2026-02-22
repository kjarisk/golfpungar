import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { TournamentList } from '@/features/tournament/components/tournament-list'
import { CreateTournamentDialog } from '@/features/tournament/components/create-tournament-dialog'
import { useTournamentStore } from '@/features/tournament'
import { useIsAdmin } from '@/hooks/use-is-admin'
import { Plus } from 'lucide-react'
import type { Tournament } from '@/features/tournament'

export function TournamentsPage() {
  const isAdmin = useIsAdmin()
  const setActiveTournament = useTournamentStore((s) => s.setActiveTournament)
  const navigate = useNavigate()
  const [showCreate, setShowCreate] = useState(false)

  function handleSelect(tournament: Tournament) {
    // If it's a past tournament, navigate to leaderboards to browse it
    if (tournament.status === 'done') {
      // Temporarily set it as active so leaderboards show its data
      setActiveTournament(tournament.id)
      navigate('/leaderboards')
    } else {
      setActiveTournament(tournament.id)
      navigate('/feed')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tournaments</h1>
          <p className="text-muted-foreground text-sm">
            {isAdmin
              ? 'Manage tournaments and set the active one'
              : 'View current and past tournaments'}
          </p>
        </div>
        {isAdmin && (
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">New</span>
          </Button>
        )}
      </div>

      <TournamentList onSelect={handleSelect} />

      <CreateTournamentDialog open={showCreate} onOpenChange={setShowCreate} />
    </div>
  )
}
