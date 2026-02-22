import { useState } from 'react'
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
import { usePlayersStore } from '@/features/players'
import { Upload, Plus, Calendar, MapPin, Users } from 'lucide-react'
import type { RoundFormat, RoundStatus } from '@/features/rounds'

const FORMAT_LABELS: Record<RoundFormat, string> = {
  stableford: 'Stableford',
  handicap: 'Handicap',
  scramble: 'Scramble',
  bestball: 'Best Ball',
}

const STATUS_VARIANT: Record<RoundStatus, 'default' | 'secondary' | 'outline'> =
  {
    upcoming: 'outline',
    in_progress: 'default',
    completed: 'secondary',
  }

const STATUS_LABEL: Record<RoundStatus, string> = {
  upcoming: 'Upcoming',
  in_progress: 'In Progress',
  completed: 'Completed',
}

export function RoundsPage() {
  const tournament = useTournamentStore((s) => s.activeTournament())
  const getCoursesByTournament = useCoursesStore(
    (s) => s.getCoursesByTournament
  )
  const getHoles = useCoursesStore((s) => s.getHolesByCourse)
  const getRoundsByTournament = useRoundsStore((s) => s.getRoundsByTournament)
  const getGroups = useRoundsStore((s) => s.getGroupsByRound)
  const getActivePlayers = usePlayersStore((s) => s.getActivePlayers)

  const courses = tournament ? getCoursesByTournament(tournament.id) : []
  const rounds = tournament ? getRoundsByTournament(tournament.id) : []
  const players = tournament ? getActivePlayers(tournament.id) : []

  const [showImport, setShowImport] = useState(false)
  const [showCreateRound, setShowCreateRound] = useState(false)

  if (!tournament) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold tracking-tight">Rounds</h1>
        <p className="text-muted-foreground text-sm">
          Create a tournament first to manage rounds.
        </p>
      </div>
    )
  }

  function getPlayerName(playerId: string) {
    const player = players.find((p) => p.id === playerId)
    return player?.displayName ?? 'Unknown'
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
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowImport(true)}
          >
            <Upload className="size-4" />
            <span className="hidden sm:inline">Import Course</span>
          </Button>
          <Button
            size="sm"
            onClick={() => setShowCreateRound(true)}
            disabled={courses.length === 0}
          >
            <Plus className="size-4" />
            <span className="hidden sm:inline">New Round</span>
          </Button>
        </div>
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
                {courses.length === 0 ? (
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
                )}
              </CardContent>
            </Card>
          ) : (
            rounds.map((round) => {
              const course = courses.find((c) => c.id === round.courseId)
              const groups = getGroups(round.id)

              return (
                <Card key={round.id}>
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

                    {/* Groups */}
                    {groups.length > 0 && (
                      <div className="flex flex-col gap-2">
                        <p className="text-muted-foreground flex items-center gap-1 text-xs font-medium">
                          <Users className="size-3" />
                          {groups.length} group{groups.length !== 1 ? 's' : ''}
                        </p>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {groups.map((group) => (
                            <div
                              key={group.id}
                              className="bg-muted/50 rounded-md px-2.5 py-1.5"
                            >
                              <p className="mb-1 text-xs font-medium">
                                {group.name}
                              </p>
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
                            </div>
                          ))}
                        </div>
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
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowImport(true)}
                >
                  <Upload className="size-4" />
                  Import Course
                </Button>
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
    </div>
  )
}
