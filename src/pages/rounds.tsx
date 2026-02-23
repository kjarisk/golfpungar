import { useState } from 'react'
import { Link } from 'react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { useTournamentStore } from '@/features/tournament'
import { useCoursesStore } from '@/features/courses'
import { CourseCard } from '@/features/courses/components/course-card'
import { ImportCourseDialog } from '@/features/courses/components/import-course-dialog'
import { CreateCourseDialog } from '@/features/courses/components/create-course-dialog'
import { useRoundsStore } from '@/features/rounds'
import { CreateRoundDialog } from '@/features/rounds/components/create-round-dialog'
import { EditRoundDialog } from '@/features/rounds/components/edit-round-dialog'
import { ConfigureTeamsDialog } from '@/features/rounds/components/configure-teams-dialog'
import { RoundCompletionDialog } from '@/features/rounds/components/round-completion-dialog'
import { usePlayersStore } from '@/features/players'
import { useCountriesStore } from '@/features/countries'
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
  ChevronDown,
  Undo2,
} from 'lucide-react'
import { useIsAdmin } from '@/hooks/use-is-admin'
import { sortRounds } from '@/features/rounds/lib/sort-rounds'
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
  const getDeletedRounds = useRoundsStore((s) => s.getDeletedRounds)
  const restoreRound = useRoundsStore((s) => s.restoreRound)
  const getActivePlayers = usePlayersStore((s) => s.getActivePlayers)

  const countries = useCountriesStore((s) => s.countries)

  const courses = tournament ? getCoursesByTournament(tournament.id) : []
  const rawRounds = tournament ? getRoundsByTournament(tournament.id) : []
  const rounds = sortRounds(rawRounds)
  const deletedRounds = tournament ? getDeletedRounds(tournament.id) : []
  const players = tournament ? getActivePlayers(tournament.id) : []

  const [showImport, setShowImport] = useState(false)
  const [showCreateCourse, setShowCreateCourse] = useState(false)
  const [showCreateRound, setShowCreateRound] = useState(false)
  const [editingRound, setEditingRound] = useState<Round | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [configuringTeamsRound, setConfiguringTeamsRound] =
    useState<Round | null>(null)
  const [completingRound, setCompletingRound] = useState<Round | null>(null)

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
    const round = rounds.find((r) => r.id === roundId)
    if (round) setCompletingRound(round)
  }

  function confirmComplete(roundId: string) {
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
                      ? 'Create a course first, then create your first round'
                      : 'Create your first round to get started'}
                  </p>
                </div>
                {isAdmin &&
                  (courses.length === 0 ? (
                    <Button size="sm" onClick={() => setShowCreateCourse(true)}>
                      <Plus className="size-4" />
                      Create Course
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
                      : round.status === 'completed'
                        ? 'opacity-80'
                        : ''
                  }
                >
                  <CardHeader className="pb-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">
                          {round.name}
                        </CardTitle>
                        <Badge
                          variant={STATUS_VARIANT[round.status]}
                          className={
                            round.status === 'active'
                              ? 'bg-primary text-primary-foreground text-xs'
                              : 'text-xs'
                          }
                        >
                          {STATUS_LABEL[round.status]}
                        </Badge>
                      </div>
                    </div>
                    {/* Compact info line: course · format · holes · date */}
                    <div className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
                      {course && (
                        <span className="flex items-center gap-0.5">
                          <MapPin className="size-3" />
                          {course.name}
                        </span>
                      )}
                      <span className="text-muted-foreground/40">|</span>
                      <span>{FORMAT_LABELS[round.format]}</span>
                      <span className="text-muted-foreground/40">|</span>
                      <span>{round.holesPlayed}H</span>
                      {round.dateTime && (
                        <>
                          <span className="text-muted-foreground/40">|</span>
                          <span className="flex items-center gap-0.5">
                            <Calendar className="size-3" />
                            {new Date(round.dateTime).toLocaleDateString(
                              'en-GB',
                              {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              }
                            )}
                          </span>
                        </>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-1.5">
                    {/* Compact groups */}
                    {groups.length > 0 ? (
                      <div className="flex flex-col gap-1">
                        <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                          {groups.map((group) => {
                            const groupTeams = teams.filter((t) =>
                              t.playerIds.some((pid) =>
                                group.playerIds.includes(pid)
                              )
                            )

                            return (
                              <div
                                key={group.id}
                                className="bg-muted/50 flex items-baseline gap-1.5 rounded px-2 py-1"
                              >
                                <span className="text-[10px] font-semibold uppercase tracking-wider opacity-60">
                                  {group.name}
                                </span>
                                <span className="text-muted-foreground text-xs">
                                  {isTeamFormat && groupTeams.length > 0
                                    ? groupTeams.map((t) => t.name).join(' vs ')
                                    : group.playerIds
                                        .map((pid) => getPlayerName(pid))
                                        .join(', ')}
                                </span>
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
                            className="mt-0.5 w-fit gap-1.5"
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
                        No groups assigned yet.
                      </p>
                    )}

                    {/* Admin actions */}
                    {isAdmin && (
                      <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t pt-2">
                        {round.status === 'upcoming' && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleSetActive(round.id)}
                            className="h-7 gap-1 text-xs"
                          >
                            <Play className="size-3" />
                            Set Active
                          </Button>
                        )}
                        {round.status === 'active' && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleComplete(round.id)}
                            className="h-7 gap-1 text-xs"
                          >
                            <CheckCircle className="size-3" />
                            Complete
                          </Button>
                        )}
                        {round.status === 'completed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReopen(round.id)}
                            className="h-7 gap-1 text-xs"
                          >
                            <RotateCcw className="size-3" />
                            Reopen
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingRound(round)}
                          className="h-7 gap-1 text-xs"
                        >
                          <Pencil className="size-3" />
                          Edit
                        </Button>
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
                            className="text-muted-foreground hover:text-destructive h-7 gap-1 text-xs"
                          >
                            <Trash2 className="size-3" />
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

          {/* Deleted rounds section (admin only) */}
          {isAdmin && deletedRounds.length > 0 && (
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="text-muted-foreground hover:text-foreground h-8 w-full justify-start gap-2 text-xs"
                >
                  <ChevronDown className="size-3 transition-transform [[data-state=open]_&]:rotate-180" />
                  <Trash2 className="size-3" />
                  Deleted rounds ({deletedRounds.length})
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 flex flex-col gap-2">
                {deletedRounds.map((round) => {
                  const course = courses.find((c) => c.id === round.courseId)
                  return (
                    <Card key={round.id} className="border-dashed opacity-60">
                      <CardContent className="flex items-center justify-between py-3">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-medium">
                            {round.name}
                          </span>
                          <span className="text-muted-foreground text-xs">
                            {course?.name ?? 'Unknown course'} &middot;{' '}
                            {FORMAT_LABELS[round.format]} &middot;{' '}
                            {round.holesPlayed}H
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => restoreRound(round.id)}
                          className="h-7 gap-1 text-xs"
                        >
                          <Undo2 className="size-3" />
                          Restore
                        </Button>
                      </CardContent>
                    </Card>
                  )
                })}
              </CollapsibleContent>
            </Collapsible>
          )}
        </TabsContent>

        {/* Courses tab */}
        <TabsContent value="courses" className="mt-4 flex flex-col gap-4">
          {isAdmin && (
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => setShowCreateCourse(true)}
                aria-label="Create Course"
              >
                <Plus className="size-4" aria-hidden="true" />
                <span className="hidden sm:inline">Create Course</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowImport(true)}
                aria-label="Import CSV"
              >
                <Upload className="size-4" aria-hidden="true" />
                <span className="hidden sm:inline">Import CSV</span>
              </Button>
            </div>
          )}

          {courses.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
                <MapPin className="text-muted-foreground size-10" />
                <div>
                  <p className="text-muted-foreground text-sm">
                    No courses added
                  </p>
                  <p className="text-muted-foreground/60 text-xs">
                    Create a course or upload a CSV file to get started
                  </p>
                </div>
                {isAdmin && (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => setShowCreateCourse(true)}>
                      <Plus className="size-4" />
                      Create Course
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowImport(true)}
                    >
                      <Upload className="size-4" />
                      Import CSV
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <CoursesByCountry
              courses={courses}
              countries={countries}
              tournamentCountryId={tournament?.countryId}
              getHoles={getHoles}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <ImportCourseDialog
        open={showImport}
        onOpenChange={setShowImport}
        tournamentId={tournament.id}
      />
      <CreateCourseDialog
        open={showCreateCourse}
        onOpenChange={setShowCreateCourse}
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
      {completingRound && (
        <RoundCompletionDialog
          open={!!completingRound}
          onOpenChange={(open) => {
            if (!open) setCompletingRound(null)
          }}
          round={completingRound}
          onConfirm={() => confirmComplete(completingRound.id)}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// CoursesByCountry — groups courses by country, tournament country on top
// ---------------------------------------------------------------------------

interface CoursesByCountryProps {
  courses: import('@/features/courses').Course[]
  countries: import('@/features/countries').Country[]
  tournamentCountryId: string | undefined
  getHoles: (courseId: string) => import('@/features/courses').Hole[]
}

function CoursesByCountry({
  courses,
  countries,
  tournamentCountryId,
  getHoles,
}: CoursesByCountryProps) {
  const countryMap = new Map(countries.map((c) => [c.id, c]))

  // Group courses by countryId
  const grouped = new Map<string | undefined, typeof courses>()
  for (const course of courses) {
    const key = course.countryId
    const list = grouped.get(key) ?? []
    list.push(course)
    grouped.set(key, list)
  }

  // Sort sections: tournament country first, then named countries alphabetically, then "No country"
  const sections: {
    countryId: string | undefined
    name: string
    courses: typeof courses
  }[] = []

  // Tournament country first (if it has courses)
  if (tournamentCountryId && grouped.has(tournamentCountryId)) {
    const country = countryMap.get(tournamentCountryId)
    sections.push({
      countryId: tournamentCountryId,
      name: country?.name ?? 'Unknown',
      courses: grouped.get(tournamentCountryId)!,
    })
  }

  // Other named countries
  const otherCountryIds = [...grouped.keys()]
    .filter((id) => id !== undefined && id !== tournamentCountryId)
    .sort((a, b) => {
      const nameA = countryMap.get(a!)?.name ?? ''
      const nameB = countryMap.get(b!)?.name ?? ''
      return nameA.localeCompare(nameB)
    })

  for (const id of otherCountryIds) {
    const country = countryMap.get(id!)
    sections.push({
      countryId: id,
      name: country?.name ?? 'Unknown',
      courses: grouped.get(id)!,
    })
  }

  // No country
  if (grouped.has(undefined)) {
    sections.push({
      countryId: undefined,
      name: 'No country',
      courses: grouped.get(undefined)!,
    })
  }

  // If only one section, render flat without headers
  if (sections.length === 1) {
    return (
      <div className="flex flex-col gap-3">
        {sections[0].courses.map((course) => (
          <CourseCard
            key={course.id}
            course={course}
            holes={getHoles(course.id)}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {sections.map((section, si) => {
        const isTournamentCountry = section.countryId === tournamentCountryId

        if (isTournamentCountry) {
          // Tournament country — always expanded
          return (
            <div
              key={section.countryId ?? 'none'}
              className="flex flex-col gap-3"
            >
              <h3 className="text-sm font-semibold">
                {section.name}
                <Badge variant="secondary" className="ml-2 text-[10px]">
                  Tournament
                </Badge>
              </h3>
              {section.courses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  holes={getHoles(course.id)}
                />
              ))}
            </div>
          )
        }

        // Other countries — collapsible
        return (
          <Collapsible key={section.countryId ?? 'none'} defaultOpen={si < 3}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="text-muted-foreground hover:text-foreground h-8 w-full justify-start gap-2 text-sm font-semibold"
              >
                <ChevronDown className="size-3 transition-transform [[data-state=open]_&]:rotate-180" />
                {section.name}
                <span className="text-muted-foreground/60 text-xs font-normal">
                  ({section.courses.length})
                </span>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 flex flex-col gap-3">
              {section.courses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  holes={getHoles(course.id)}
                />
              ))}
            </CollapsibleContent>
          </Collapsible>
        )
      })}
    </div>
  )
}
