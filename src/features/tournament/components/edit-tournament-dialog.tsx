import { useState } from 'react'
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
import { useTournamentStore } from '@/features/tournament'
import { CountrySelect } from '@/features/countries'
import type { Tournament } from '@/features/tournament'

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
  const updateTournament = useTournamentStore((s) => s.updateTournament)
  const [name, setName] = useState(tournament.name)
  const [location, setLocation] = useState(tournament.location ?? '')
  const [countryId, setCountryId] = useState<string | undefined>(
    tournament.countryId
  )
  const [startDate, setStartDate] = useState(tournament.startDate)
  const [endDate, setEndDate] = useState(tournament.endDate)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !startDate || !endDate) return

    updateTournament(tournament.id, {
      name: name.trim(),
      location: location.trim() || undefined,
      countryId,
      startDate,
      endDate,
    })

    onClose()
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

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={!name.trim() || !startDate || !endDate}>
          Save
        </Button>
      </DialogFooter>
    </form>
  )
}
