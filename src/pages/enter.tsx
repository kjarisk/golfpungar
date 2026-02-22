import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useTournamentStore } from '@/features/tournament'
import { useRoundsStore } from '@/features/rounds'
import { useCoursesStore } from '@/features/courses'
import { usePlayersStore } from '@/features/players'
import { useScoringStore } from '@/features/scoring'
import { ScoreEntryGrid } from '@/features/scoring/components/score-entry-grid'
import { RoundTotalEntry } from '@/features/scoring/components/round-total-entry'
import { SideEventLogger } from '@/features/side-events'
import { Trophy, ClipboardList, Hash } from 'lucide-react'

export function EnterPage() {
  const tournament = useTournamentStore((s) => s.activeTournament())
  const getRoundsByTournament = useRoundsStore((s) => s.getRoundsByTournament)
  const getGroupsByRound = useRoundsStore((s) => s.getGroupsByRound)
  const getHoles = useCoursesStore((s) => s.getHolesByCourse)
  const getActivePlayers = usePlayersStore((s) => s.getActivePlayers)
  const getScorecardsByRound = useScoringStore((s) => s.getScorecardsByRound)
  const getScorecardForPlayer = useScoringStore((s) => s.getScorecardForPlayer)
  const createScorecard = useScoringStore((s) => s.createScorecard)
  const recalculatePoints = useScoringStore((s) => s.recalculatePoints)
  const getPointsByRound = useScoringStore((s) => s.getPointsByRound)

  const rounds = tournament ? getRoundsByTournament(tournament.id) : []
  const players = tournament ? getActivePlayers(tournament.id) : []

  const [selectedRoundId, setSelectedRoundId] = useState<string>('')
  const [entryMode, setEntryMode] = useState<'holes' | 'total'>('holes')

  // Use the first round as default if nothing is selected
  const effectiveRoundId =
    selectedRoundId || (rounds.length > 0 ? rounds[0].id : '')

  const selectedRound = rounds.find((r) => r.id === effectiveRoundId)
  const holes = selectedRound ? getHoles(selectedRound.courseId) : []
  const coursePar = holes.reduce((s, h) => s + h.par, 0)
  const groups = selectedRound ? getGroupsByRound(selectedRound.id) : []
  const scorecards = selectedRound ? getScorecardsByRound(selectedRound.id) : []
  const roundPoints = selectedRound ? getPointsByRound(selectedRound.id) : []

  // Get all player IDs from this round's groups
  const roundPlayerIds = groups.flatMap((g) => g.playerIds)
  const roundPlayers = players.filter((p) => roundPlayerIds.includes(p.id))

  // Ensure scorecards exist for all players in the round (on-demand, not in effect)
  function ensureScorecards() {
    if (!selectedRound) return
    for (const player of roundPlayers) {
      const existing = getScorecardForPlayer(selectedRound.id, player.id)
      if (!existing) {
        createScorecard(selectedRound.id, selectedRound.holesPlayed, player.id)
      }
    }
  }

  // Create scorecards lazily when we have a round with players
  if (selectedRound && roundPlayers.length > 0 && scorecards.length === 0) {
    ensureScorecards()
  }

  function handleRoundChange(roundId: string) {
    setSelectedRoundId(roundId)
  }

  function handleRecalculate() {
    if (!selectedRound) return
    recalculatePoints(selectedRound.id, selectedRound.format)
  }

  function getPlayerName(playerId: string) {
    const player = players.find((p) => p.id === playerId)
    return player?.displayName ?? 'Unknown'
  }

  if (!tournament) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold tracking-tight">Enter</h1>
        <p className="text-muted-foreground text-sm">
          Create a tournament first to enter scores.
        </p>
      </div>
    )
  }

  if (rounds.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold tracking-tight">Enter</h1>
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
            <ClipboardList className="text-muted-foreground size-10" />
            <div>
              <p className="text-muted-foreground text-sm">No rounds yet</p>
              <p className="text-muted-foreground/60 text-xs">
                Go to Rounds tab to create your first round
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Enter Scores</h1>
          <p className="text-muted-foreground text-sm">
            Enter hole-by-hole or round totals
          </p>
        </div>
      </div>

      {/* Round selector */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-1 flex-col gap-1.5">
          <label className="text-xs font-medium" id="round-select-label">
            Round
          </label>
          <Select value={effectiveRoundId} onValueChange={handleRoundChange}>
            <SelectTrigger
              className="w-full"
              aria-labelledby="round-select-label"
            >
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
        <div className="flex gap-1.5" role="group" aria-label="Entry mode">
          <Button
            variant={entryMode === 'holes' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setEntryMode('holes')}
            aria-pressed={entryMode === 'holes'}
          >
            <Hash className="size-3.5" aria-hidden="true" />
            Holes
          </Button>
          <Button
            variant={entryMode === 'total' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setEntryMode('total')}
            aria-pressed={entryMode === 'total'}
          >
            <ClipboardList className="size-3.5" aria-hidden="true" />
            Total
          </Button>
        </div>
      </div>

      {/* Round info */}
      {selectedRound && (
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="text-xs">
            {selectedRound.format}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {selectedRound.holesPlayed} holes
          </Badge>
          <Badge variant="secondary" className="text-xs">
            Par {coursePar}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {roundPlayers.length} players
          </Badge>
        </div>
      )}

      {/* Score entry per player */}
      {selectedRound && roundPlayers.length > 0 && (
        <div className="flex flex-col gap-4">
          {roundPlayers.map((player) => {
            const sc = getScorecardForPlayer(selectedRound.id, player.id)
            if (!sc) return null

            if (entryMode === 'holes') {
              return (
                <ScoreEntryGrid
                  key={player.id}
                  scorecard={sc}
                  holes={holes}
                  groupHandicap={player.groupHandicap}
                  format={selectedRound.format}
                  playerName={player.displayName}
                />
              )
            }

            return (
              <RoundTotalEntry
                key={player.id}
                scorecard={sc}
                playerName={player.displayName}
                coursePar={coursePar}
              />
            )
          })}

          {/* Side Event Logger */}
          <SideEventLogger
            tournamentId={tournament.id}
            roundId={selectedRound.id}
            players={roundPlayers}
            holes={holes}
            groupPlayerIds={groups[0]?.playerIds}
            holesPlayed={selectedRound.holesPlayed}
          />

          {/* Standings section */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Standings</CardTitle>
                <Button size="sm" variant="outline" onClick={handleRecalculate}>
                  <Trophy className="size-3.5" />
                  Calculate Points
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {roundPoints.length === 0 ? (
                <p className="text-muted-foreground py-4 text-center text-sm">
                  Enter scores and tap &ldquo;Calculate Points&rdquo; to see
                  standings
                </p>
              ) : (
                <div className="flex flex-col gap-1">
                  {[...roundPoints]
                    .sort((a, b) => a.placing - b.placing)
                    .map((rp) => {
                      const sc = scorecards.find(
                        (s) => (s.playerId ?? s.teamId) === rp.participantId
                      )
                      return (
                        <div
                          key={rp.participantId}
                          className="flex items-center gap-3 rounded-md px-2 py-1.5"
                        >
                          <span className="text-muted-foreground w-6 text-right text-sm font-bold tabular-nums">
                            {rp.placing}
                          </span>
                          <span className="flex-1 truncate text-sm">
                            {getPlayerName(rp.participantId)}
                          </span>
                          {sc && (
                            <span className="text-muted-foreground text-xs tabular-nums">
                              {sc.grossTotal > 0 && `${sc.grossTotal} gross`}
                              {sc.stablefordPoints !== null &&
                                ` / ${sc.stablefordPoints} stb`}
                            </span>
                          )}
                          <Badge
                            variant="default"
                            className="tabular-nums text-xs"
                          >
                            {rp.pointsAwarded}p
                          </Badge>
                        </div>
                      )
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* No players assigned */}
      {selectedRound && roundPlayers.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
            <p className="text-muted-foreground text-sm">
              No players assigned to this round
            </p>
            <p className="text-muted-foreground/60 text-xs">
              Go to Rounds tab and add players to groups
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
