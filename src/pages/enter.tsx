import { useState } from 'react'
import { Link } from 'react-router'
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
import { GroupScoreGrid } from '@/features/scoring/components/group-score-grid'
import { SideEventLogger } from '@/features/side-events'
import { PenaltyList } from '@/features/penalties'
import { BetList } from '@/features/betting'
import { useAuthStore } from '@/features/auth'
import { useIsAdmin } from '@/hooks/use-is-admin'
import { useActiveRound } from '@/hooks/use-active-round'
import { Trophy, ClipboardList, Users } from 'lucide-react'

/** localStorage key for persisting the user's group selection */
const GROUP_STORAGE_KEY = 'golfpungar:selectedGroupId'

function getPersistedGroupId(): string {
  try {
    return localStorage.getItem(GROUP_STORAGE_KEY) ?? ''
  } catch {
    return ''
  }
}

function persistGroupId(groupId: string) {
  try {
    localStorage.setItem(GROUP_STORAGE_KEY, groupId)
  } catch {
    // localStorage unavailable
  }
}

export function EnterPage() {
  const tournament = useTournamentStore((s) => s.activeTournament())
  const getRoundsByTournament = useRoundsStore((s) => s.getRoundsByTournament)
  const getGroupsByRound = useRoundsStore((s) => s.getGroupsByRound)
  const getTeamsByRound = useRoundsStore((s) => s.getTeamsByRound)
  const getHoles = useCoursesStore((s) => s.getHolesByCourse)
  const getActivePlayers = usePlayersStore((s) => s.getActivePlayers)
  const getScorecardsByRound = useScoringStore((s) => s.getScorecardsByRound)
  const getScorecardForPlayer = useScoringStore((s) => s.getScorecardForPlayer)
  const getScorecardForTeam = useScoringStore((s) => s.getScorecardForTeam)
  const createScorecard = useScoringStore((s) => s.createScorecard)
  const recalculatePoints = useScoringStore((s) => s.recalculatePoints)
  const getPointsByRound = useScoringStore((s) => s.getPointsByRound)
  const authUser = useAuthStore((s) => s.user)
  const isAdmin = useIsAdmin()

  const activeRound = useActiveRound()

  const rounds = tournament ? getRoundsByTournament(tournament.id) : []
  const players = tournament ? getActivePlayers(tournament.id) : []

  // Derive current player from auth userId
  const currentPlayer = players.find((p) => p.userId === authUser?.id)
  const currentPlayerId = currentPlayer?.id ?? ''

  const [selectedRoundId, setSelectedRoundId] = useState<string>('')
  const [selectedGroupId, setSelectedGroupId] =
    useState<string>(getPersistedGroupId)

  // Default to active round, then first round as fallback
  const defaultRoundId =
    activeRound?.id ?? (rounds.length > 0 ? rounds[0].id : '')
  const effectiveRoundId = selectedRoundId || defaultRoundId

  const selectedRound = rounds.find((r) => r.id === effectiveRoundId)
  const holes = selectedRound ? getHoles(selectedRound.courseId) : []
  const coursePar = holes.reduce((s, h) => s + h.par, 0)
  const groups = selectedRound ? getGroupsByRound(selectedRound.id) : []
  const teams = selectedRound ? getTeamsByRound(selectedRound.id) : []
  const scorecards = selectedRound ? getScorecardsByRound(selectedRound.id) : []
  const roundPoints = selectedRound ? getPointsByRound(selectedRound.id) : []

  const isTeamFormat =
    selectedRound?.format === 'scramble' || selectedRound?.format === 'bestball'
  const useTeamScorecards = isTeamFormat && teams.length > 0

  // --- Group selection logic ---
  // Auto-detect current player's group, or use persisted, or first group
  const currentPlayerGroup = groups.find((g) =>
    g.playerIds.includes(currentPlayerId)
  )
  const persistedGroup = groups.find((g) => g.id === selectedGroupId)
  const effectiveGroup =
    persistedGroup ??
    currentPlayerGroup ??
    (groups.length > 0 ? groups[0] : undefined)

  // Players in the selected group
  const groupPlayerIds = effectiveGroup?.playerIds ?? []
  const groupPlayers = players.filter((p) => groupPlayerIds.includes(p.id))

  // Teams in the selected group (teams whose players overlap with group)
  const groupTeams = teams.filter((t) =>
    t.playerIds.some((pid) => groupPlayerIds.includes(pid))
  )

  // All player IDs from this round's groups (for standings)
  const roundPlayerIds = groups.flatMap((g) => g.playerIds)
  const roundPlayers = players.filter((p) => roundPlayerIds.includes(p.id))

  // Ensure scorecards exist for all participants in the round (on-demand)
  function ensureScorecards() {
    if (!selectedRound) return
    if (useTeamScorecards) {
      for (const team of teams) {
        const existing = getScorecardForTeam(selectedRound.id, team.id)
        if (!existing) {
          createScorecard(
            selectedRound.id,
            selectedRound.holesPlayed,
            undefined,
            team.id
          )
        }
      }
    } else {
      for (const player of roundPlayers) {
        const existing = getScorecardForPlayer(selectedRound.id, player.id)
        if (!existing) {
          createScorecard(
            selectedRound.id,
            selectedRound.holesPlayed,
            player.id
          )
        }
      }
    }
  }

  // Create scorecards lazily when we have a round with participants
  const hasParticipants = useTeamScorecards
    ? teams.length > 0
    : roundPlayers.length > 0
  if (selectedRound && hasParticipants && scorecards.length === 0) {
    ensureScorecards()
  }

  function handleRoundChange(roundId: string) {
    setSelectedRoundId(roundId)
  }

  function handleGroupChange(groupId: string) {
    setSelectedGroupId(groupId)
    persistGroupId(groupId)
  }

  function handleRecalculate() {
    if (!selectedRound) return
    recalculatePoints(selectedRound.id, selectedRound.format)
  }

  function getPlayerName(playerId: string) {
    const player = players.find((p) => p.id === playerId)
    return player?.displayName ?? 'Unknown'
  }

  function getParticipantName(participantId: string) {
    const team = teams.find((t) => t.id === participantId)
    if (team) return team.name
    return getPlayerName(participantId)
  }

  if (!tournament) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold tracking-tight">Enter</h1>
        <p className="text-muted-foreground text-sm">
          No active tournament. Select or create one to enter scores.
        </p>
        <Button asChild variant="outline" className="w-fit">
          <Link to="/tournaments">View Tournaments</Link>
        </Button>
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Enter Scores</h1>
        <p className="text-muted-foreground text-sm">
          {activeRound
            ? `Active: ${activeRound.name}`
            : 'Select a round to enter scores'}
        </p>
      </div>

      {/* Round selector + Group selector */}
      <div className="flex flex-wrap items-end gap-3">
        {/* Round */}
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
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
                  {r.status === 'active' ? ' (Active)' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Group selector */}
        {groups.length > 0 && (
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <label className="text-xs font-medium" id="group-select-label">
              <Users className="mr-1 inline size-3" aria-hidden="true" />
              Group
            </label>
            <Select
              value={effectiveGroup?.id ?? ''}
              onValueChange={handleGroupChange}
            >
              <SelectTrigger
                className="w-full"
                aria-labelledby="group-select-label"
              >
                <SelectValue placeholder="Select group" />
              </SelectTrigger>
              <SelectContent>
                {groups.map((g) => {
                  const names = g.playerIds
                    .map(
                      (pid) =>
                        players.find((p) => p.id === pid)?.displayName ??
                        'Unknown'
                    )
                    .join(', ')
                  return (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}{' '}
                      <span className="text-muted-foreground text-xs">
                        ({names})
                      </span>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Round info badges */}
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
          {effectiveGroup && (
            <Badge variant="secondary" className="text-xs">
              {effectiveGroup.name} &middot; {groupPlayers.length} players
            </Badge>
          )}
          {useTeamScorecards && groupTeams.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {groupTeams.length} teams
            </Badge>
          )}
        </div>
      )}

      {/* Score entry grid for the selected group */}
      {selectedRound && effectiveGroup && hasParticipants && (
        <div className="flex flex-col gap-4">
          <GroupScoreGrid
            roundId={selectedRound.id}
            tournamentId={tournament.id}
            holes={holes}
            format={selectedRound.format}
            players={useTeamScorecards ? undefined : groupPlayers}
            teams={useTeamScorecards ? groupTeams : undefined}
            allPlayers={players}
            scorecards={scorecards}
            currentPlayerId={currentPlayerId}
          />

          {/* Side Event Logger — scoped to group players */}
          <SideEventLogger
            tournamentId={tournament.id}
            roundId={selectedRound.id}
            players={groupPlayers}
            holes={holes}
            groupPlayerIds={groupPlayerIds}
            holesPlayed={selectedRound.holesPlayed}
          />

          {/* Standings section — shows full round standings */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Standings</CardTitle>
                {isAdmin && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleRecalculate}
                  >
                    <Trophy className="size-3.5" />
                    Recalculate
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {roundPoints.length === 0 ? (
                <p className="text-muted-foreground py-4 text-center text-sm">
                  Enter scores to see standings
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
                            {getParticipantName(rp.participantId)}
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

      {/* No group selected / no participants */}
      {selectedRound && !effectiveGroup && groups.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
            <p className="text-muted-foreground text-sm">
              {isTeamFormat
                ? 'No teams configured for this round'
                : 'No players assigned to this round'}
            </p>
            <p className="text-muted-foreground/60 text-xs">
              {isTeamFormat
                ? 'Go to Rounds tab and configure teams'
                : 'Go to Rounds tab and add players to groups'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Penalties */}
      {tournament && (
        <PenaltyList
          tournamentId={tournament.id}
          players={players}
          rounds={rounds}
        />
      )}

      {/* Bets */}
      {tournament && currentPlayerId && (
        <BetList
          tournamentId={tournament.id}
          currentPlayerId={currentPlayerId}
          players={players}
          rounds={rounds}
          activeRoundId={activeRound?.id}
        />
      )}
    </div>
  )
}
