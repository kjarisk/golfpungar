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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useRoundsStore } from '@/features/rounds'
import type { Round, RoundFormat } from '@/features/rounds'

interface EditRoundDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  round: Round
}

const FORMAT_OPTIONS: { value: RoundFormat; label: string }[] = [
  { value: 'stableford', label: 'Stableford' },
  { value: 'handicap', label: 'Handicap' },
  { value: 'scramble', label: 'Scramble' },
  { value: 'bestball', label: 'Best Ball' },
]

export function EditRoundDialog({
  open,
  onOpenChange,
  round,
}: EditRoundDialogProps) {
  const updateRound = useRoundsStore((s) => s.updateRound)

  const [name, setName] = useState(round.name)
  const [format, setFormat] = useState<RoundFormat>(round.format)
  const [holesPlayed, setHolesPlayed] = useState<9 | 18>(round.holesPlayed)
  const [dateTime, setDateTime] = useState(round.dateTime ?? '')

  function canSubmit() {
    return name.trim().length > 0
  }

  function handleSubmit() {
    if (!canSubmit()) return

    updateRound(round.id, {
      name: name.trim(),
      format,
      holesPlayed,
      dateTime: dateTime || undefined,
    })

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Round</DialogTitle>
          <DialogDescription>
            Update round details. Group changes can be made separately.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Round name */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="editRoundName">Round Name</Label>
            <Input
              id="editRoundName"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Format + Holes */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label>Format</Label>
              <Select
                value={format}
                onValueChange={(v) => setFormat(v as RoundFormat)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FORMAT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Holes</Label>
              <Select
                value={String(holesPlayed)}
                onValueChange={(v) => setHolesPlayed(Number(v) as 9 | 18)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="18">18 holes</SelectItem>
                  <SelectItem value="9">9 holes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date/time */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="editRoundDateTime">Date & Time (optional)</Label>
            <Input
              id="editRoundDateTime"
              type="datetime-local"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit()}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
