import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router'
import { Card, CardContent } from '@/components/ui/card'
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
import { SideEventLogger, useSideEventsStore } from '@/features/side-events'
import { deriveLastSnakeInGroup } from '@/features/side-events/lib/side-events-logic'
import { CourseCard } from '@/features/courses/components/course-card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useAuthStore } from '@/features/auth'
import { useIsAdmin } from '@/hooks/use-is-admin'
import { useActiveRound } from '@/hooks/use-active-round'
import { ClipboardList, Users, MapPin, Skull, Lock } from 'lucide-react'

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
  const allScorecards = useScoringStore((s) => s.scorecards)
  const getScorecardForPlayer = useScoringStore((s) => s.getScorecardForPlayer)
  const getScorecardForTeam = useScoringStore((s) => s.getScorecardForTeam)
  const createScorecard = useScoringStore((s) => s.createScorecard)
  const allCourses = useCoursesStore((s) => s.courses)
  const sideEvents = useSideEventsStore((s) => s.events)
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
  const scorecards = selectedRound
    ? allScorecards.filter((sc) => sc.roundId === selectedRound.id)
    : []

  const isTeamFormat =
    selectedRound?.format === 'scramble' || selectedRound?.format === 'bestball'
  const useTeamScorecards = isTeamFormat && teams.length > 0

  // Read-only when the selected round is not active
  const isReadOnly = selectedRound?.status !== 'active'

  // Course for "View Course" dialog
  const course = selectedRound
    ? allCourses.find((c) => c.id === selectedRound.courseId)
    : undefined

  // --- Group selection logic ---
  // Non-admin players are auto-locked to their own group
  // Admin users can select any group (persisted in localStorage)
  const currentPlayerGroup = groups.find((g) =>
    g.playerIds.includes(currentPlayerId)
  )
  const persistedGroup = groups.find((g) => g.id === selectedGroupId)

  const effectiveGroup = isAdmin
    ? (persistedGroup ??
      currentPlayerGroup ??
      (groups.length > 0 ? groups[0] : undefined))
    : (currentPlayerGroup ?? (groups.length > 0 ? groups[0] : undefined))

  // Players in the selected group
  const groupPlayerIds = effectiveGroup?.playerIds ?? []
  const groupPlayers = players.filter((p) => groupPlayerIds.includes(p.id))

  // Teams in the selected group (teams whose players overlap with group)
  const groupTeams = teams.filter((t) =>
    t.playerIds.some((pid) => groupPlayerIds.includes(pid))
  )

  // Last snake in group
  const lastSnake =
    selectedRound && effectiveGroup
      ? deriveLastSnakeInGroup(
          sideEvents,
          selectedRound.id,
          effectiveGroup.id,
          groupPlayerIds
        )
      : null
  const lastSnakePlayer = lastSnake?.playerId
    ? players.find((p) => p.id === lastSnake.playerId)
    : null

  // All player IDs from this round's groups (for scorecard creation)
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
  // Uses a ref to track which rounds have been initialized, avoiding setState during render
  const initializedRoundsRef = useRef<Set<string>>(new Set())
  const hasParticipants = useTeamScorecards
    ? teams.length > 0
    : roundPlayers.length > 0

  useEffect(() => {
    if (
      selectedRound &&
      hasParticipants &&
      scorecards.length === 0 &&
      !initializedRoundsRef.current.has(selectedRound.id)
    ) {
      initializedRoundsRef.current.add(selectedRound.id)
      ensureScorecards()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRound?.id, hasParticipants, scorecards.length])

  function handleRoundChange(roundId: string) {
    setSelectedRoundId(roundId)
  }

  function handleGroupChange(groupId: string) {
    setSelectedGroupId(groupId)
    persistGroupId(groupId)
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

        {/* Group selector (admin only — players are auto-locked to their group) */}
        {groups.length > 0 && isAdmin && (
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

      {/* Round info badges + View Course */}
      {selectedRound && (
        <div className="flex flex-wrap items-center gap-2">
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

          {/* View Course button */}
          {course && holes.length > 0 && (
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 gap-1 px-2 text-xs"
                >
                  <MapPin className="size-3" aria-hidden="true" />
                  Course
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{course.name}</DialogTitle>
                </DialogHeader>
                <CourseCard course={course} holes={holes} />
              </DialogContent>
            </Dialog>
          )}
        </div>
      )}

      {/* Last Snake indicator */}
      {lastSnakePlayer && lastSnake && (
        <div className="bg-destructive/10 border-destructive/20 flex items-center gap-2 rounded-lg border px-3 py-2">
          <Skull
            className="text-destructive size-4 shrink-0"
            aria-hidden="true"
          />
          <span className="text-sm">
            <span className="font-medium">Last Snake:</span>{' '}
            {lastSnakePlayer.displayName}
            {lastSnake.holeNumber != null && (
              <span className="text-muted-foreground">
                {' '}
                (hole {lastSnake.holeNumber})
              </span>
            )}
          </span>
        </div>
      )}

      {/* Read-only indicator for non-active rounds */}
      {selectedRound && isReadOnly && (
        <div className="bg-muted/60 flex items-center gap-2 rounded-lg border px-3 py-2">
          <Lock
            className="text-muted-foreground size-4 shrink-0"
            aria-hidden="true"
          />
          <span className="text-muted-foreground text-sm">
            {selectedRound.status === 'completed'
              ? 'This round is completed — scores are read-only'
              : 'This round is upcoming — scores are read-only'}
          </span>
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
            readOnly={isReadOnly}
          />

          {/* Side Event Logger — only when round is active */}
          {!isReadOnly && (
            <SideEventLogger
              tournamentId={tournament.id}
              roundId={selectedRound.id}
              players={groupPlayers}
              holes={holes}
              groupPlayerIds={groupPlayerIds}
              holesPlayed={selectedRound.holesPlayed}
            />
          )}
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
    </div>
  )
}
