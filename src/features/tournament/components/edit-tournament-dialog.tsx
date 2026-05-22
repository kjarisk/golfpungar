import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Plus, Trash2 } from 'lucide-react'
import { useUpdateTournament } from '@/features/tournament'
import { CountrySelect } from '@/features/countries'
import { usePersons } from '@/features/persons'
import type { Tournament } from '@/features/tournament'
import {
  useActivePlayers,
  useRemovePlayer,
  AddPlayersFromPoolDialog,
} from '@/features/players'

interface EditTournamentDialogProps {
  tournament: Tournament
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditTournamentDialog({
  tournament,
  open,
  onOpenChange,
}: EditTournamentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Tournament</DialogTitle>
          <DialogDescription>Update tournament details.</DialogDescription>
        </DialogHeader>

        <EditTournamentForm
          key={tournament.id}
          tournament={tournament}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

function EditTournamentForm({
  tournament,
  onClose,
}: {
  tournament: Tournament
  onClose: () => void
}) {
  const updateTournament = useUpdateTournament()
  const removePlayer = useRemovePlayer()
  const players = useActivePlayers(tournament.id)
  const { data: allPersons = [] } = usePersons()
  const candidatesFromPool = useMemo(() => {
    const inTournament = new Set(players.map((p) => p.personId))
    return allPersons.filter((p) => !inTournament.has(p.id))
  }, [allPersons, players])

  const [name, setName] = useState(tournament.name)
  const [location, setLocation] = useState(tournament.location ?? '')
  const [countryId, setCountryId] = useState<string | undefined>(
    tournament.countryId
  )
  const [startDate, setStartDate] = useState(tournament.startDate)
  const [endDate, setEndDate] = useState(tournament.endDate)

  const [showAddFromPool, setShowAddFromPool] = useState(false)
  const [confirmingRemovePlayerId, setConfirmingRemovePlayerId] = useState<
    string | null
  >(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !startDate || !endDate) return

    try {
      await updateTournament.mutateAsync({
        id: tournament.id,
        updates: {
          name: name.trim(),
          location: location.trim() || undefined,
          countryId,
          startDate,
          endDate,
        },
      })
    } catch {
      toast.error('Could not update tournament')
      return
    }

    onClose()
  }

  function handleRemovePlayer(playerId: string) {
    setConfirmingRemovePlayerId(null)
    removePlayer.mutate(playerId, {
      onError: () => toast.error('Could not remove player'),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="edit-name">Tournament Name</Label>
        <Input
          id="edit-name"
          placeholder="e.g. Spain 2026"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="edit-location">Location (optional)</Label>
        <Input
          id="edit-location"
          placeholder="e.g. Marbella, Spain"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
      </div>

      <CountrySelect value={countryId} onChange={setCountryId} />

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="edit-startDate">Start Date</Label>
          <Input
            id="edit-startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="edit-endDate">End Date</Label>
          <Input
            id="edit-endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label>Players ({players.length})</Label>
          {candidatesFromPool.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAddFromPool(true)}
            >
              <Plus className="size-4" aria-hidden="true" />
              <span>Add players from pool</span>
            </Button>
          )}
        </div>
        {players.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No players yet. Add some from the pool.
          </p>
        ) : (
          <div className="flex flex-col gap-0 rounded-md border">
            {players.map((player, i) => {
              const confirmingRemove = confirmingRemovePlayerId === player.id
              return (
                <div key={player.id}>
                  {i > 0 && <Separator />}
                  <div className="flex items-center gap-2 px-3 py-2">
                    <div className="min-w-0 flex-1">
                      <span className="truncate text-sm font-medium">
                        {player.displayName}
                      </span>
                      {player.nickname && (
                        <span className="text-muted-foreground ml-1.5 truncate text-xs">
                          &ldquo;{player.nickname}&rdquo;
                        </span>
                      )}
                    </div>
                    <Badge
                      variant="outline"
                      className="tabular-nums"
                      title="Edit handicap from the Players page"
                    >
                      hcp: {player.groupHandicap}
                    </Badge>
                    {confirmingRemove ? (
                      <span className="flex items-center gap-1 text-sm">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-sm text-green-600 hover:text-green-700"
                          onClick={() => handleRemovePlayer(player.id)}
                        >
                          Yes
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-sm"
                          onClick={() => setConfirmingRemovePlayerId(null)}
                        >
                          No
                        </Button>
                      </span>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setConfirmingRemovePlayerId(player.id)}
                        aria-label={`Remove ${player.displayName} from tournament`}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          className="h-11"
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="h-11"
          disabled={
            !name.trim() || !startDate || !endDate || updateTournament.isPending
          }
        >
          {updateTournament.isPending ? 'Saving…' : 'Save'}
        </Button>
      </DialogFooter>

      <AddPlayersFromPoolDialog
        tournamentId={tournament.id}
        open={showAddFromPool}
        onOpenChange={setShowAddFromPool}
      />
    </form>
  )
}
