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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { usePenaltiesStore } from '../state/penalties-store'
import type { Player } from '@/features/players/types'
import type { Round } from '@/features/rounds/types'

interface AddPenaltyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tournamentId: string
  players: Player[]
  rounds: Round[]
}

export function AddPenaltyDialog({
  open,
  onOpenChange,
  tournamentId,
  players,
  rounds,
}: AddPenaltyDialogProps) {
  const addPenalty = usePenaltiesStore((s) => s.addPenalty)
  const [playerId, setPlayerId] = useState('')
  const [amount, setAmount] = useState('1')
  const [note, setNote] = useState('')
  const [roundId, setRoundId] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!playerId) return
    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) return

    addPenalty({
      tournamentId,
      playerId,
      amount: parsedAmount,
      note: note.trim(),
      roundId: roundId || undefined,
    })

    const playerName =
      players.find((p) => p.id === playerId)?.displayName ?? 'Player'
    toast(`Penalty added: ${playerName} — ${parsedAmount}`, {
      duration: 3000,
    })

    setPlayerId('')
    setAmount('1')
    setNote('')
    setRoundId('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Penalty</DialogTitle>
          <DialogDescription>
            Record a penalty for a player. Penalties are accumulated per
            tournament.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="penalty-player">Player</Label>
            <Select value={playerId} onValueChange={setPlayerId}>
              <SelectTrigger id="penalty-player">
                <SelectValue placeholder="Select player" />
              </SelectTrigger>
              <SelectContent>
                {players.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.displayName}
                    {p.nickname ? ` (${p.nickname})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="penalty-amount">Amount</Label>
            <Input
              id="penalty-amount"
              type="number"
              min={1}
              step={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="1"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="penalty-note">Note</Label>
            <Input
              id="penalty-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Late to tee time"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="penalty-round">Round (optional)</Label>
            <Select value={roundId} onValueChange={setRoundId}>
              <SelectTrigger id="penalty-round">
                <SelectValue placeholder="No specific round" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No specific round</SelectItem>
                {rounds.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!playerId}>
              Add Penalty
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
