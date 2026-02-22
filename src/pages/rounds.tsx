import { useState } from 'react'
import { Link } from 'react-router'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useTournamentStore } from '@/features/tournament'
import { useCoursesStore } from '@/features/courses'
import { CourseCard } from '@/features/courses/components/course-card'
import { ImportCourseDialog } from '@/features/courses/components/import-course-dialog'
import { useRoundsStore } from '@/features/rounds'
import { CreateRoundDialog } from '@/features/rounds/components/create-round-dialog'
import { EditRoundDialog } from '@/features/rounds/components/edit-round-dialog'
import { ConfigureTeamsDialog } from '@/features/rounds/components/configure-teams-dialog'
import { usePlayersStore } from '@/features/players'
import {
  Upload,
  Plus,
  Calendar,
  MapPin,
  Users,
  Play,
  CheckCircle,
  RotateCcw,
  Pencil,
  Trash2,
} from 'lucide-react'
import { useIsAdmin } from '@/hooks/use-is-admin'
import type { Round, RoundFormat, RoundStatus } from '@/features/rounds'

const FORMAT_LABELS: Record<RoundFormat, string> = {
  stableford: 'Stableford',
  handicap: 'Handicap',
  scramble: 'Scramble',
  bestball: 'Best Ball',
}

const STATUS_VARIANT: Record<RoundStatus, 'default' | 'secondary' | 'outline'> =
  {
    upcoming: 'outline',
    active: 'default',
    completed: 'secondary',
  }

const STATUS_LABEL: Record<RoundStatus, string> = {
  upcoming: 'Upcoming',
  active: 'Active',
  completed: 'Completed',
}

/** Sort rounds: active first, upcoming next, completed last */
const STATUS_ORDER: Record<RoundStatus, number> = {
  active: 0,
  upcoming: 1,
  completed: 2,
}

function sortRounds(rounds: Round[]): Round[] {
  return [...rounds].sort((a, b) => {
    const orderDiff = STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
    if (orderDiff !== 0) return orderDiff
    // Within same status, sort by creation date (newest first for upcoming/active, oldest first for completed)
    if (a.status === 'completed') {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })
}

export function RoundsPage() {
  const tournament = useTournamentStore((s) => s.activeTournament())
  const isAdmin = useIsAdmin()
  const getCoursesByTournament = useCoursesStore(
    (s) => s.getCoursesByTournament
  )
  const getHoles = useCoursesStore((s) => s.getHolesByCourse)
  const getRoundsByTournament = useRoundsStore((s) => s.getRoundsByTournament)
  const getGroups = useRoundsStore((s) => s.getGroupsByRound)
  const getTeams = useRoundsStore((s) => s.getTeamsByRound)
  const setRoundStatus = useRoundsStore((s) => s.setRoundStatus)
  const removeRound = useRoundsStore((s) => s.removeRound)
  const getActivePlayers = usePlayersStore((s) => s.getActivePlayers)

  const courses = tournament ? getCoursesByTournament(tournament.id) : []
  const rawRounds = tournament ? getRoundsByTournament(tournament.id) : []
  const rounds = sortRounds(rawRounds)
  const players = tournament ? getActivePlayers(tournament.id) : []

  const [showImport, setShowImport] = useState(false)
  const [showCreateRound, setShowCreateRound] = useState(false)
  const [editingRound, setEditingRound] = useState<Round | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [configuringTeamsRound, setConfiguringTeamsRound] =
    useState<Round | null>(null)

  if (!tournament) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold tracking-tight">Rounds</h1>
        <p className="text-muted-foreground text-sm">
          No active tournament. Select or create one to manage rounds.
        </p>
        <Button asChild variant="outline" className="w-fit">
          <Link to="/tournaments">View Tournaments</Link>
        </Button>
      </div>
    )
  }

  function getPlayerName(playerId: string) {
    const player = players.find((p) => p.id === playerId)
    return player?.displayName ?? 'Unknown'
  }

  function handleSetActive(roundId: string) {
    setRoundStatus(roundId, 'active')
  }

  function handleComplete(roundId: string) {
    setRoundStatus(roundId, 'completed')
  }

  function handleReopen(roundId: string) {
    setRoundStatus(roundId, 'upcoming')
  }

  function handleDelete(roundId: string) {
    removeRound(roundId)
    setConfirmDelete(null)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Rounds</h1>
          <p className="text-muted-foreground text-sm">
            Manage courses and rounds for {tournament.name}
          </p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowImport(true)}
              aria-label="Import Course"
            >
              <Upload className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">Import Course</span>
            </Button>
            <Button
              size="sm"
              onClick={() => setShowCreateRound(true)}
              disabled={courses.length === 0}
              aria-label="New Round"
            >
              <Plus className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">New Round</span>
            </Button>
          </div>
        )}
      </div>

      <Tabs defaultValue="rounds">
        <TabsList>
          <TabsTrigger value="rounds">Rounds ({rounds.length})</TabsTrigger>
          <TabsTrigger value="courses">Courses ({courses.length})</TabsTrigger>
        </TabsList>

        {/* Rounds tab */}
        <TabsContent value="rounds" className="mt-4 flex flex-col gap-4">
          {rounds.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
                <Calendar className="text-muted-foreground size-10" />
                <div>
                  <p className="text-muted-foreground text-sm">No rounds yet</p>
                  <p className="text-muted-foreground/60 text-xs">
                    {courses.length === 0
                      ? 'Import a course first, then create your first round'
                      : 'Create your first round to get started'}
                  </p>
                </div>
                {isAdmin &&
                  (courses.length === 0 ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowImport(true)}
                    >
                      <Upload className="size-4" />
                      Import Course
                    </Button>
                  ) : (
                    <Button size="sm" onClick={() => setShowCreateRound(true)}>
                      <Plus className="size-4" />
                      Create Round
                    </Button>
                  ))}
              </CardContent>
            </Card>
          ) : (
            rounds.map((round) => {
              const course = courses.find((c) => c.id === round.courseId)
              const groups = getGroups(round.id)
              const teams = getTeams(round.id)
              const isTeamFormat =
                round.format === 'scramble' || round.format === 'bestball'
              const isDeleting = confirmDelete === round.id

              return (
                <Card
                  key={round.id}
                  className={
                    round.status === 'active'
                      ? 'border-primary/40 ring-primary/20 ring-1'
                      : ''
                  }
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{round.name}</CardTitle>
                      <Badge variant={STATUS_VARIANT[round.status]}>
                        {STATUS_LABEL[round.status]}
                      </Badge>
                    </div>
                    {course && (
                      <CardDescription className="flex items-center gap-1">
                        <MapPin className="size-3" />
                        {course.name}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    {/* Round info row */}
                    <div className="mb-3 flex flex-wrap gap-2">
                      <Badge variant="outline" className="text-xs">
                        {FORMAT_LABELS[round.format]}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {round.holesPlayed} holes
                      </Badge>
                      {round.dateTime && (
                        <Badge variant="outline" className="text-xs">
                          <Calendar className="mr-1 size-3" />
                          {new Date(round.dateTime).toLocaleDateString(
                            'en-GB',
                            {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            }
                          )}
                        </Badge>
                      )}
                    </div>

                    {/* Groups & Teams */}
                    {groups.length > 0 ? (
                      <div className="flex flex-col gap-2">
                        <p className="text-muted-foreground flex items-center gap-1 text-xs font-medium">
                          <Users className="size-3" />
                          {groups.length} group{groups.length !== 1 ? 's' : ''}
                          {isTeamFormat && teams.length > 0 && (
                            <span>
                              {' '}
                              &middot; {teams.length} team
                              {teams.length !== 1 ? 's' : ''}
                            </span>
                          )}
                        </p>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {groups.map((group) => {
                            // Find teams within this group
                            const groupTeams = teams.filter((t) =>
                              t.playerIds.some((pid) =>
                                group.playerIds.includes(pid)
                              )
                            )

                            return (
                              <div
                                key={group.id}
                                className="bg-muted/50 rounded-md px-2.5 py-1.5"
                              >
                                <p className="mb-1 text-xs font-medium">
                                  {group.name}
                                </p>
                                {isTeamFormat && groupTeams.length > 0 ? (
                                  <div className="flex flex-col gap-1">
                                    {groupTeams.map((team) => (
                                      <div
                                        key={team.id}
                                        className="flex items-center gap-1.5"
                                      >
                                        <span className="bg-primary/10 text-primary rounded px-1.5 py-0.5 text-xs font-medium">
                                          {team.name}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="flex flex-wrap gap-1">
                                    {group.playerIds.map((pid) => (
                                      <span
                                        key={pid}
                                        className="text-muted-foreground text-xs"
                                      >
                                        {getPlayerName(pid)}
                                        {pid !==
                                          group.playerIds[
                                            group.playerIds.length - 1
                                          ] && ','}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>

                        {/* Configure Teams button for team formats */}
                        {isAdmin && isTeamFormat && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setConfiguringTeamsRound(round)}
                            className="mt-1 w-fit gap-1.5"
                          >
                            <Users className="size-3.5" />
                            {teams.length > 0
                              ? 'Edit Teams'
                              : 'Configure Teams'}
                          </Button>
                        )}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-xs">
                        No groups assigned to this round yet.
                      </p>
                    )}

                    {/* Admin actions */}
                    {isAdmin && (
                      <div className="mt-3 flex flex-wrap items-center gap-2 border-t pt-3">
                        {/* Status transitions */}
                        {round.status === 'upcoming' && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleSetActive(round.id)}
                            className="gap-1.5"
                          >
                            <Play className="size-3.5" />
                            Set Active
                          </Button>
                        )}
                        {round.status === 'active' && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleComplete(round.id)}
                            className="gap-1.5"
                          >
                            <CheckCircle className="size-3.5" />
                            Complete
                          </Button>
                        )}
                        {round.status === 'completed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReopen(round.id)}
                            className="gap-1.5"
                          >
                            <RotateCcw className="size-3.5" />
                            Reopen
                          </Button>
                        )}

                        {/* Edit */}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingRound(round)}
                          className="gap-1.5"
                        >
                          <Pencil className="size-3.5" />
                          Edit
                        </Button>

                        {/* Delete */}
                        {isDeleting ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-red-600">
                              Delete?
                            </span>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(round.id)}
                              className="h-7 text-xs"
                            >
                              Yes
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setConfirmDelete(null)}
                              className="h-7 text-xs"
                            >
                              No
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setConfirmDelete(round.id)}
                            className="text-muted-foreground hover:text-destructive gap-1.5"
                          >
                            <Trash2 className="size-3.5" />
                            Delete
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })
          )}
        </TabsContent>

        {/* Courses tab */}
        <TabsContent value="courses" className="mt-4 flex flex-col gap-4">
          {courses.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
                <MapPin className="text-muted-foreground size-10" />
                <div>
                  <p className="text-muted-foreground text-sm">
                    No courses imported
                  </p>
                  <p className="text-muted-foreground/60 text-xs">
                    Upload a CSV file to import a course
                  </p>
                </div>
                {isAdmin && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowImport(true)}
                  >
                    <Upload className="size-4" />
                    Import Course
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            courses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                holes={getHoles(course.id)}
              />
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <ImportCourseDialog
        open={showImport}
        onOpenChange={setShowImport}
        tournamentId={tournament.id}
      />
      <CreateRoundDialog
        open={showCreateRound}
        onOpenChange={setShowCreateRound}
        tournamentId={tournament.id}
      />
      {editingRound && (
        <EditRoundDialog
          open={!!editingRound}
          onOpenChange={(open) => {
            if (!open) setEditingRound(null)
          }}
          round={editingRound}
        />
      )}
      {configuringTeamsRound && (
        <ConfigureTeamsDialog
          open={!!configuringTeamsRound}
          onOpenChange={(open) => {
            if (!open) setConfiguringTeamsRound(null)
          }}
          round={configuringTeamsRound}
          tournamentId={tournament.id}
        />
      )}
    </div>
  )
}
