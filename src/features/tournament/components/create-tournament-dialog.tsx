import { useState } from 'react'
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
import { Separator } from '@/components/ui/separator'
import { useCreateTournament } from '@/features/tournament'
import { CountrySelect } from '@/features/countries'
import { usePersons } from '@/features/persons'
import { useCreatePlayer } from '@/features/players'

interface CreateTournamentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const DEFAULT_HANDICAP = 18

interface RowState {
  checked: boolean
  handicap: string
}

export function CreateTournamentDialog({
  open,
  onOpenChange,
}: CreateTournamentDialogProps) {
  const createTournament = useCreateTournament()
  const createPlayer = useCreatePlayer()
  const { data: persons = [] } = usePersons()

  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [countryId, setCountryId] = useState<string | undefined>(undefined)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [rows, setRows] = useState<Record<string, RowState>>({})
  const [submitting, setSubmitting] = useState(false)

  function getRow(personId: string): RowState {
    return (
      rows[personId] ?? { checked: false, handicap: String(DEFAULT_HANDICAP) }
    )
  }
  function toggle(personId: string, checked: boolean) {
    setRows((r) => ({
      ...r,
      [personId]: { ...getRow(personId), checked },
    }))
  }
  function setHandicap(personId: string, value: string) {
    setRows((r) => ({
      ...r,
      [personId]: { ...getRow(personId), handicap: value },
    }))
  }

  function reset() {
    setName('')
    setLocation('')
    setCountryId(undefined)
    setStartDate('')
    setEndDate('')
    setRows({})
    setSubmitting(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !startDate || !endDate) return

    setSubmitting(true)
    let created
    try {
      created = await createTournament.mutateAsync({
        name: name.trim(),
        location: location.trim() || undefined,
        countryId,
        startDate,
        endDate,
      })
    } catch {
      toast.error('Could not create tournament')
      setSubmitting(false)
      return
    }

    // Add selected players. Partial failures are allowed — the tournament stays.
    const selected = Object.entries(rows).filter(([, v]) => v.checked)
    let failed = 0
    for (const [personId, row] of selected) {
      const hcp = parseInt(row.handicap, 10)
      try {
        await createPlayer.mutateAsync({
          tournamentId: created.id,
          personId,
          groupHandicap: isNaN(hcp) ? DEFAULT_HANDICAP : hcp,
        })
      } catch {
        failed += 1
      }
    }
    if (failed > 0) {
      toast.error(
        `Tournament created, but could not add ${failed} ${
          failed === 1 ? 'player' : 'players'
        }. Fix from Edit.`
      )
    }

    reset()
    onOpenChange(false)
  }

  const selectedCount = Object.values(rows).filter((r) => r.checked).length

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset()
        onOpenChange(o)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Tournament</DialogTitle>
          <DialogDescription>
            Set up a new golf trip tournament.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Tournament Name</Label>
            <Input
              id="name"
              placeholder="e.g. Spain 2026"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="location">Location (optional)</Label>
            <Input
              id="location"
              placeholder="e.g. Marbella, Spain"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <CountrySelect value={countryId} onChange={setCountryId} />

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>
              Players from pool ({selectedCount} selected, optional)
            </Label>
            {persons.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No people in the pool yet — add some from the Players page.
              </p>
            ) : (
              <div className="flex max-h-[40vh] flex-col gap-0 overflow-y-auto rounded-md border">
                {persons.map((person, i) => {
                  const row = getRow(person.id)
                  return (
                    <div key={person.id}>
                      {i > 0 && <Separator />}
                      <label className="flex items-center gap-3 px-3 py-2">
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
                          onChange={(e) =>
                            setHandicap(person.id, e.target.value)
                          }
                          disabled={!row.checked}
                          aria-label={`Handicap for ${person.displayName}`}
                          className="w-20"
                        />
                      </label>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="submit"
              className="h-11"
              disabled={!name.trim() || !startDate || !endDate || submitting}
            >
              {submitting ? 'Creating…' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
