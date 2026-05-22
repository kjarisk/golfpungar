import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { usePlayers, useCreatePlayer } from '@/features/players'
import { usePersons } from '@/features/persons'

interface AddPlayersFromPoolDialogProps {
  tournamentId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

const DEFAULT_HANDICAP = 18

interface RowState {
  checked: boolean
  handicap: string
}

export function AddPlayersFromPoolDialog({
  tournamentId,
  open,
  onOpenChange,
}: AddPlayersFromPoolDialogProps) {
  const { data: persons = [] } = usePersons()
  const { data: players = [] } = usePlayers()
  const createPlayer = useCreatePlayer()

  const candidates = useMemo(() => {
    const inThisTournament = new Set(
      players
        .filter((p) => p.tournamentId === tournamentId)
        .map((p) => p.personId)
    )
    return persons.filter((p) => !inThisTournament.has(p.id))
  }, [persons, players, tournamentId])

  const [rows, setRows] = useState<Record<string, RowState>>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      const next: Record<string, RowState> = {}
      for (const p of candidates) {
        next[p.id] = {
          checked: false,
          handicap: String(p.currentHandicap ?? DEFAULT_HANDICAP),
        }
      }
      setRows(next)
      setSubmitting(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tournamentId])

  function toggle(id: string, checked: boolean) {
    setRows((r) => ({ ...r, [id]: { ...r[id], checked } }))
  }
  function setHandicap(id: string, value: string) {
    setRows((r) => ({ ...r, [id]: { ...r[id], handicap: value } }))
  }

  const selectedIds = Object.entries(rows)
    .filter(([, v]) => v.checked)
    .map(([id]) => id)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (selectedIds.length === 0) return
    setSubmitting(true)
    const failures: string[] = []
    for (const personId of selectedIds) {
      const row = rows[personId]
      const hcp = parseFloat(row.handicap)
      try {
        await createPlayer.mutateAsync({
          tournamentId,
          personId,
          groupHandicap: isNaN(hcp) ? DEFAULT_HANDICAP : hcp,
        })
      } catch {
        failures.push(personId)
      }
    }
    setSubmitting(false)
    if (failures.length > 0) {
      toast.error(
        `Could not add ${failures.length} ${
          failures.length === 1 ? 'player' : 'players'
        }`
      )
      return
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add players from pool</DialogTitle>
          <DialogDescription>
            Select people to add to this tournament.
          </DialogDescription>
        </DialogHeader>

        {candidates.length === 0 ? (
          <div className="flex flex-col gap-4">
            <p className="text-muted-foreground text-sm">
              Everyone in the pool is already in this tournament.
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
            className="flex flex-col gap-3"
          >
            <div className="flex max-h-[50vh] flex-col gap-0 overflow-y-auto">
              {candidates.map((person, i) => {
                const row = rows[person.id] ?? {
                  checked: false,
                  handicap: String(DEFAULT_HANDICAP),
                }
                return (
                  <div key={person.id}>
                    {i > 0 && <Separator />}
                    <label className="flex items-center gap-3 py-2.5">
                      <input
                        type="checkbox"
                        checked={row.checked}
                        onChange={(e) => toggle(person.id, e.target.checked)}
                        className="accent-primary size-4 shrink-0 rounded"
                        aria-label={`Select ${person.displayName}`}
                      />
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-sm font-medium">
                          {person.displayName}
                        </span>
                        {person.nickname && (
                          <span className="text-muted-foreground truncate text-xs">
                            &ldquo;{person.nickname}&rdquo;
                          </span>
                        )}
                      </div>
                      <Input
                        type="number"
                        min={0}
                        max={54}
                        value={row.handicap}
                        onChange={(e) => setHandicap(person.id, e.target.value)}
                        disabled={!row.checked}
                        aria-label={`Handicap for ${person.displayName}`}
                        className="w-20"
                      />
                    </label>
                  </div>
                )
              })}
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
                disabled={selectedIds.length === 0 || submitting}
              >
                {submitting
                  ? 'Adding…'
                  : `Add ${selectedIds.length || ''} ${
                      selectedIds.length === 1 ? 'player' : 'players'
                    }`}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
