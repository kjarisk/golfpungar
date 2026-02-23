import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useScoringStore } from '@/features/scoring'
import { useSideEventsStore } from '@/features/side-events'
import { usePlayersStore } from '@/features/players'
import { useRoundsStore } from '@/features/rounds'
import { computeRoundLeaderboard } from '@/lib/leaderboard-calc'
import { SIDE_EVENT_ICONS } from '@/lib/side-event-icons'
import { CheckCircle, Trophy, Sparkles } from 'lucide-react'
import type { Round, RoundFormat } from '@/features/rounds'

const FORMAT_LABELS: Record<RoundFormat, string> = {
  stableford: 'Stableford',
  handicap: 'Handicap',
  scramble: 'Scramble',
  bestball: 'Best Ball',
}

const PLACING_COLORS = [
  'text-yellow-500', // 1st
  'text-zinc-400', // 2nd
  'text-amber-700', // 3rd
]

interface RoundCompletionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  round: Round
  onConfirm: () => void
}

export function RoundCompletionDialog({
  open,
  onOpenChange,
  round,
  onConfirm,
}: RoundCompletionDialogProps) {
  const scorecards = useScoringStore((s) => s.scorecards)
  const allRoundPoints = useScoringStore((s) => s.roundPoints)
  const sideEvents = useSideEventsStore((s) => s.events)
  const players = usePlayersStore((s) => s.players)
  const getTeams = useRoundsStore((s) => s.getTeamsByRound)

  // Get scorecards and points for this round
  const roundScorecards = scorecards.filter((sc) => sc.roundId === round.id)
  const roundPoints = allRoundPoints.filter((rp) => rp.roundId === round.id)
  const teams = getTeams(round.id)
  const isTeamFormat =
    round.format === 'scramble' || round.format === 'bestball'

  // Build leaderboard
  const leaderboard = computeRoundLeaderboard(roundPoints, roundScorecards)
  const topEntries = leaderboard.slice(0, 5)

  // Side events for this round
  const roundEvents = sideEvents.filter((e) => e.roundId === round.id)

  // Count notable events
  const notableTypes = [
    'hio',
    'albatross',
    'eagle',
    'birdie',
    'snake',
    'snopp',
    'bunker_save',
    'gir',
  ] as const
  const eventCounts = notableTypes
    .map((type) => ({
      type,
      count: roundEvents.filter((e) => e.type === type).length,
    }))
    .filter((e) => e.count > 0)

  // Completion stats
  const completedCards = roundScorecards.filter((sc) => sc.isComplete).length
  const totalCards = roundScorecards.length

  function getParticipantName(participantId: string): string {
    if (isTeamFormat) {
      const team = teams.find((t) => t.id === participantId)
      if (team) return team.name
    }
    const player = players.find((p) => p.id === participantId)
    return player?.displayName ?? 'Unknown'
  }

  function handleConfirm() {
    onConfirm()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="text-primary size-5" />
            Complete Round
          </DialogTitle>
          <DialogDescription>
            {round.name} &middot; {FORMAT_LABELS[round.format]}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Completion status */}
          <div className="bg-muted/50 flex items-center justify-between rounded-lg px-3 py-2">
            <span className="text-muted-foreground text-sm">
              Scorecards completed
            </span>
            <Badge
              variant={completedCards === totalCards ? 'default' : 'outline'}
            >
              {completedCards} / {totalCards}
            </Badge>
          </div>

          {/* Top placings */}
          {topEntries.length > 0 && (
            <div>
              <h4 className="mb-2 flex items-center gap-1.5 text-sm font-medium">
                <Trophy className="size-4 text-yellow-500" />
                Standings
              </h4>
              <div className="flex flex-col gap-1">
                {topEntries.map((entry, i) => (
                  <div
                    key={entry.participantId}
                    className="flex items-center justify-between rounded px-2 py-1 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-5 text-right font-bold ${PLACING_COLORS[i] ?? 'text-muted-foreground'}`}
                      >
                        {entry.placing}
                      </span>
                      <span className={i === 0 ? 'font-semibold' : ''}>
                        {getParticipantName(entry.participantId)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-muted-foreground">
                        {entry.grossTotal} strokes
                      </span>
                      {entry.pointsAwarded > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {entry.pointsAwarded} pts
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notable events summary */}
          {eventCounts.length > 0 && (
            <div>
              <h4 className="mb-2 flex items-center gap-1.5 text-sm font-medium">
                <Sparkles className="size-4 text-yellow-500" />
                Round Highlights
              </h4>
              <div className="flex flex-wrap gap-2">
                {eventCounts.map(({ type, count }) => {
                  const config = SIDE_EVENT_ICONS[type]
                  if (!config) return null
                  const Icon = config.icon
                  return (
                    <div
                      key={type}
                      className="bg-muted/50 flex items-center gap-1.5 rounded-full px-2.5 py-1"
                    >
                      <Icon className={`size-3.5 ${config.className}`} />
                      <span className="text-xs font-medium">
                        {count} {config.label}
                        {count > 1 ? 's' : ''}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Warning if not all scorecards complete */}
          {completedCards < totalCards && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Not all scorecards are complete. You can still complete the round
              — scores can be edited later.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} className="gap-1.5">
            <CheckCircle className="size-4" />
            Complete Round
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
