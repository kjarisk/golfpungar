import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { usePlayers, useCreatePlayer } from '@/features/players'
import { usePersons } from '@/features/persons'
import { useTournaments } from '@/features/tournament'

interface AddPersonToTournamentDialogProps {
  personId: string | undefined
  open: boolean
  onOpenChange: (open: boolean) => void
}

const DEFAULT_HANDICAP = 18

export function AddPersonToTournamentDialog({
  personId,
  open,
  onOpenChange,
}: AddPersonToTournamentDialogProps) {
  const { data: tournaments = [] } = useTournaments()
  const { data: players = [] } = usePlayers()
  const { data: persons = [] } = usePersons()
  const createPlayer = useCreatePlayer()

  const person = persons.find((p) => p.id === personId)

  const candidateTournaments = useMemo(() => {
    if (!personId) return []
    const tournamentIdsForPerson = new Set(
      players.filter((p) => p.personId === personId).map((p) => p.tournamentId)
    )
    return tournaments.filter((t) => !tournamentIdsForPerson.has(t.id))
  }, [tournaments, players, personId])

  const [tournamentId, setTournamentId] = useState<string>('')
  const [handicap, setHandicap] = useState<string>(String(DEFAULT_HANDICAP))

  useEffect(() => {
    if (open) {
      setTournamentId(
        candidateTournaments.length === 1 ? candidateTournaments[0].id : ''
      )
      setHandicap(String(person?.currentHandicap ?? DEFAULT_HANDICAP))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, personId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!personId || !tournamentId) return
    const hcp = parseFloat(handicap)
    try {
      await createPlayer.mutateAsync({
        tournamentId,
        personId,
        groupHandicap: isNaN(hcp) ? DEFAULT_HANDICAP : hcp,
      })
    } catch {
      toast.error('Could not add to tournament')
      return
    }
    onOpenChange(false)
  }

  const onlyOne = candidateTournaments.length === 1
  const hasNoCandidates = candidateTournaments.length === 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add to tournament</DialogTitle>
          <DialogDescription>
            {person
              ? `Add ${person.displayName} to a tournament.`
              : 'Add this person to a tournament.'}
          </DialogDescription>
        </DialogHeader>

        {hasNoCandidates ? (
          <div className="flex flex-col gap-4">
            <p className="text-muted-foreground text-sm">
              {person?.displayName ?? 'This person'} is already in every
              tournament.
            </p>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="h-11"
              >
                Close
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form
            onSubmit={(e) => void handleSubmit(e)}
            className="flex flex-col gap-4"
          >
            {!onlyOne && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="tournament-select">Tournament</Label>
                <Select value={tournamentId} onValueChange={setTournamentId}>
                  <SelectTrigger id="tournament-select" className="w-full">
                    <SelectValue placeholder="Pick a tournament" />
                  </SelectTrigger>
                  <SelectContent>
                    {candidateTournaments.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {onlyOne && (
              <p className="text-muted-foreground text-sm">
                Adding to{' '}
                <span className="text-foreground font-medium">
                  {candidateTournaments[0].name}
                </span>
                .
              </p>
            )}

            <div className="flex flex-col gap-2">
              <Label htmlFor="add-handicap">Handicap</Label>
              <Input
                id="add-handicap"
                type="number"
                min={0}
                max={54}
                value={handicap}
                onChange={(e) => setHandicap(e.target.value)}
                required
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="h-11"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-11"
                disabled={!tournamentId || createPlayer.isPending}
              >
                {createPlayer.isPending ? 'Adding…' : 'Add to tournament'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
