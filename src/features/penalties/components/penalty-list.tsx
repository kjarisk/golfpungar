import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { usePenaltiesStore } from '../state/penalties-store'
import { AddPenaltyDialog } from './add-penalty-dialog'
import type { Player } from '@/features/players/types'
import type { Round } from '@/features/rounds/types'
import { AlertTriangle, Plus, Trash2 } from 'lucide-react'

interface PenaltyListProps {
  tournamentId: string
  players: Player[]
  rounds: Round[]
}

export function PenaltyList({
  tournamentId,
  players,
  rounds,
}: PenaltyListProps) {
  const getEntriesByTournament = usePenaltiesStore(
    (s) => s.getEntriesByTournament
  )
  const removePenalty = usePenaltiesStore((s) => s.removePenalty)
  const [showDialog, setShowDialog] = useState(false)

  const entries = getEntriesByTournament(tournamentId)
  const sortedEntries = [...entries].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  function getPlayerName(playerId: string) {
    return players.find((p) => p.id === playerId)?.displayName ?? 'Unknown'
  }

  function getRoundName(roundId?: string) {
    if (!roundId) return null
    return rounds.find((r) => r.id === roundId)?.name ?? null
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="size-4 text-amber-500" />
              Penalties
            </CardTitle>
            <Button size="sm" onClick={() => setShowDialog(true)}>
              <Plus className="size-4" />
              Add
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {sortedEntries.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <p className="text-muted-foreground text-sm">
                No penalties recorded yet.
              </p>
              <p className="text-muted-foreground text-xs">
                Add penalties for late arrivals, rule violations, etc.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {sortedEntries.map((entry) => {
                const roundName = getRoundName(entry.roundId)
                return (
                  <div
                    key={entry.id}
                    className="flex items-center gap-2 rounded-md px-2 py-2"
                  >
                    <span className="flex-1 truncate text-sm">
                      <span className="font-medium">
                        {getPlayerName(entry.playerId)}
                      </span>
                      {entry.note && (
                        <span className="text-muted-foreground">
                          {' '}
                          — {entry.note}
                        </span>
                      )}
                    </span>
                    {roundName && (
                      <Badge variant="outline" className="shrink-0 text-[10px]">
                        {roundName}
                      </Badge>
                    )}
                    <Badge
                      variant="destructive"
                      className="shrink-0 tabular-nums text-xs"
                    >
                      {entry.amount}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-destructive size-7 p-0"
                      onClick={() => removePenalty(entry.id)}
                      aria-label={`Remove penalty for ${getPlayerName(entry.playerId)}`}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <AddPenaltyDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        tournamentId={tournamentId}
        players={players}
        rounds={rounds}
      />
    </>
  )
}
