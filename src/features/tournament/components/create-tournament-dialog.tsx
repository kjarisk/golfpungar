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

interface CreateTournamentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateTournamentDialog({
  open,
  onOpenChange,
}: CreateTournamentDialogProps) {
  const createTournament = useTournamentStore((s) => s.createTournament)
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [countryId, setCountryId] = useState<string | undefined>(undefined)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !startDate || !endDate) return

    createTournament({
      name: name.trim(),
      location: location.trim() || undefined,
      countryId,
      startDate,
      endDate,
    })

    setName('')
    setLocation('')
    setCountryId(undefined)
    setStartDate('')
    setEndDate('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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

          <DialogFooter>
            <Button
              type="submit"
              className="h-11"
              disabled={!name.trim() || !startDate || !endDate}
            >
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
