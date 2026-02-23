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
import { Badge } from '@/components/ui/badge'
import { useBettingStore } from '../state/betting-store'
import type { BetScope, BetMetric } from '../types'
import type { Player } from '@/features/players/types'
import type { Round } from '@/features/rounds/types'
import { Check, X } from 'lucide-react'

interface CreateBetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tournamentId: string
  currentPlayerId: string
  players: Player[]
  rounds: Round[]
}

const METRIC_LABELS: Record<BetMetric, string> = {
  most_points: 'Most Points',
  most_birdies: 'Most Birdies',
  head_to_head: 'Head-to-Head (lower score)',
  custom: 'Custom',
}

export function CreateBetDialog({
  open,
  onOpenChange,
  tournamentId,
  currentPlayerId,
  players,
  rounds,
}: CreateBetDialogProps) {
  const createBet = useBettingStore((s) => s.createBet)
  const [scope, setScope] = useState<BetScope>('tournament')
  const [metricKey, setMetricKey] = useState<BetMetric>('head_to_head')
  const [customDescription, setCustomDescription] = useState('')
  const [roundId, setRoundId] = useState('')
  const [amount, setAmount] = useState('100')
  const [selectedOpponentIds, setSelectedOpponentIds] = useState<string[]>([])

  const opponents = players.filter((p) => p.id !== currentPlayerId)

  function toggleOpponent(playerId: string) {
    setSelectedOpponentIds((prev) =>
      prev.includes(playerId)
        ? prev.filter((id) => id !== playerId)
        : [...prev, playerId]
    )
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (selectedOpponentIds.length === 0) return
    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) return

    createBet({
      tournamentId,
      createdByPlayerId: currentPlayerId,
      scope,
      metricKey,
      customDescription:
        metricKey === 'custom' ? customDescription.trim() : undefined,
      roundId: scope === 'round' && roundId ? roundId : undefined,
      amount: parsedAmount,
      opponentIds: selectedOpponentIds,
    })

    const opponentNames = selectedOpponentIds
      .map((id) => players.find((p) => p.id === id)?.displayName ?? 'Player')
      .join(', ')
    toast(`Bet created with ${opponentNames} — ${parsedAmount}`, {
      duration: 3000,
    })

    // Reset form
    setScope('tournament')
    setMetricKey('head_to_head')
    setCustomDescription('')
    setRoundId('')
    setAmount('100')
    setSelectedOpponentIds([])
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Bet</DialogTitle>
          <DialogDescription>
            Challenge one or more players to a bet. They must accept before it
            becomes active.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Opponents (multi-select) */}
          <div className="flex flex-col gap-1.5">
            <Label>
              Opponents{' '}
              {selectedOpponentIds.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-[10px]">
                  {selectedOpponentIds.length} selected
                </Badge>
              )}
            </Label>
            <div className="grid max-h-48 grid-cols-2 gap-1.5 overflow-y-auto rounded-md border p-2">
              {opponents.map((p) => {
                const isSelected = selectedOpponentIds.includes(p.id)
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggleOpponent(p.id)}
                    className={`flex items-center gap-2 rounded-md px-2.5 py-2.5 text-left text-sm transition-colors ${
                      isSelected
                        ? 'bg-primary/10 text-primary border-primary/30 border'
                        : 'hover:bg-muted border border-transparent'
                    }`}
                  >
                    <div
                      className={`flex size-5 shrink-0 items-center justify-center rounded-sm border ${
                        isSelected
                          ? 'bg-primary border-primary text-primary-foreground'
                          : 'border-input'
                      }`}
                    >
                      {isSelected && <Check className="size-3.5" />}
                    </div>
                    <span className="truncate">
                      {p.displayName}
                      {p.nickname ? ` (${p.nickname})` : ''}
                    </span>
                  </button>
                )
              })}
            </div>
            {selectedOpponentIds.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {selectedOpponentIds.map((id) => {
                  const player = players.find((p) => p.id === id)
                  return (
                    <Badge
                      key={id}
                      variant="secondary"
                      className="gap-1.5 py-1 pr-1 text-sm"
                    >
                      {player?.displayName}
                      <button
                        type="button"
                        onClick={() => toggleOpponent(id)}
                        className="hover:bg-destructive/10 hover:text-destructive ml-0.5 rounded-full p-1"
                        aria-label={`Remove ${player?.displayName}`}
                      >
                        <X className="size-4" />
                      </button>
                    </Badge>
                  )
                })}
              </div>
            )}
          </div>

          {/* Scope */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="bet-scope">Scope</Label>
            <Select
              value={scope}
              onValueChange={(v) => setScope(v as BetScope)}
            >
              <SelectTrigger id="bet-scope">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tournament">Tournament</SelectItem>
                <SelectItem value="round">Round</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Round (when scope=round) */}
          {scope === 'round' && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="bet-round">Round</Label>
              <Select value={roundId} onValueChange={setRoundId}>
                <SelectTrigger id="bet-round">
                  <SelectValue placeholder="Select round" />
                </SelectTrigger>
                <SelectContent>
                  {rounds.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Metric */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="bet-metric">Bet Target</Label>
            <Select
              value={metricKey}
              onValueChange={(v) => setMetricKey(v as BetMetric)}
            >
              <SelectTrigger id="bet-metric">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(METRIC_LABELS) as [BetMetric, string][]).map(
                  ([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Custom description */}
          {metricKey === 'custom' && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="bet-custom">Description</Label>
              <Input
                id="bet-custom"
                value={customDescription}
                onChange={(e) => setCustomDescription(e.target.value)}
                placeholder="e.g. First to make a birdie on a par 3"
              />
            </div>
          )}

          {/* Amount */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="bet-amount">Amount</Label>
            <Input
              id="bet-amount"
              type="number"
              min={1}
              step={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="100"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              className="h-11"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="h-11"
              disabled={
                selectedOpponentIds.length === 0 ||
                (scope === 'round' && !roundId) ||
                (metricKey === 'custom' && !customDescription.trim())
              }
            >
              Create Bet
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
