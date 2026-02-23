import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
import { Separator } from '@/components/ui/separator'
import { useCoursesStore } from '@/features/courses'
import { usePlayersStore } from '@/features/players'
import { useRoundsStore } from '@/features/rounds'
import { useTournamentStore } from '@/features/tournament'
import { useCountriesStore } from '@/features/countries'
import { DEFAULT_POINTS } from '@/features/scoring/lib/points-calc'
import type { RoundFormat } from '@/features/rounds'
import { PointsTableEditor } from './points-table-editor'
import { TeamPairingEditor } from './team-pairing-editor'
import { autoPairGroups } from '../lib/team-pairing'
import type { GroupTeamDraft } from '../lib/team-pairing'
import { Shuffle, Plus, X, Users } from 'lucide-react'

interface CreateRoundDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tournamentId: string
}

const FORMAT_OPTIONS: { value: RoundFormat; label: string; desc: string }[] = [
  {
    value: 'stableford',
    label: 'Stableford',
    desc: 'Individual stableford points',
  },
  {
    value: 'handicap',
    label: 'Handicap',
    desc: 'Individual stroke play with handicap',
  },
  {
    value: 'scramble',
    label: 'Scramble',
    desc: 'Team best ball, play from best shot',
  },
  {
    value: 'bestball',
    label: 'Best Ball',
    desc: 'Team format, each plays own ball',
  },
]

interface GroupDraft {
  name: string
  playerIds: string[]
}

export function CreateRoundDialog({
  open,
  onOpenChange,
  tournamentId,
}: CreateRoundDialogProps) {
  const getCoursesByTournament = useCoursesStore(
    (s) => s.getCoursesByTournament
  )
  const getHoles = useCoursesStore((s) => s.getHolesByCourse)
  const getActivePlayers = usePlayersStore((s) => s.getActivePlayers)
  const createRound = useRoundsStore((s) => s.createRound)
  const tournament = useTournamentStore((s) =>
    s.tournaments.find((t) => t.id === tournamentId)
  )
  const countries = useCountriesStore((s) => s.countries)

  const courses = getCoursesByTournament(tournamentId)
  // Separate courses into tournament country vs. others
  const tournamentCountryId = tournament?.countryId
  const countryCourses = tournamentCountryId
    ? courses.filter((c) => c.countryId === tournamentCountryId)
    : courses
  const otherCourses = tournamentCountryId
    ? courses.filter((c) => c.countryId !== tournamentCountryId)
    : []
  const players = getActivePlayers(tournamentId)

  const [name, setName] = useState('')
  const [courseId, setCourseId] = useState('')
  const [format, setFormat] = useState<RoundFormat>('stableford')
  const [holesPlayed, setHolesPlayed] = useState<9 | 18>(18)
  const [dateTime, setDateTime] = useState('')
  const [pointsTable, setPointsTable] = useState<number[]>([...DEFAULT_POINTS])
  const [groups, setGroups] = useState<GroupDraft[]>([
    { name: 'Group 1', playerIds: [] },
  ])
  const [teamConfigs, setTeamConfigs] = useState<GroupTeamDraft[]>([])

  // Players already assigned to a group
  const assignedPlayerIds = useMemo(
    () => new Set(groups.flatMap((g) => g.playerIds)),
    [groups]
  )
  const unassignedPlayers = players.filter((p) => !assignedPlayerIds.has(p.id))

  const isTeamFormat = format === 'scramble' || format === 'bestball'

  // Regenerate team configs when groups change and format is team-based
  function syncTeamConfigs(newGroups: GroupDraft[]) {
    if (format === 'scramble' || format === 'bestball') {
      setTeamConfigs(autoPairGroups(newGroups, getPlayerName))
    }
  }

  function addGroup() {
    setGroups((prev) => {
      const updated = [
        ...prev,
        { name: `Group ${prev.length + 1}`, playerIds: [] },
      ]
      return updated
    })
  }

  function removeGroup(index: number) {
    setGroups((prev) => {
      const updated = prev.filter((_, i) => i !== index)
      syncTeamConfigs(updated)
      return updated
    })
  }

  function updateGroupName(index: number, newName: string) {
    setGroups((prev) =>
      prev.map((g, i) => (i === index ? { ...g, name: newName } : g))
    )
  }

  function addPlayerToGroup(groupIndex: number, playerId: string) {
    setGroups((prev) => {
      const updated = prev.map((g, i) =>
        i === groupIndex ? { ...g, playerIds: [...g.playerIds, playerId] } : g
      )
      syncTeamConfigs(updated)
      return updated
    })
  }

  function removePlayerFromGroup(groupIndex: number, playerId: string) {
    setGroups((prev) => {
      const updated = prev.map((g, i) =>
        i === groupIndex
          ? { ...g, playerIds: g.playerIds.filter((id) => id !== playerId) }
          : g
      )
      syncTeamConfigs(updated)
      return updated
    })
  }

  function autoAssignGroups() {
    // Shuffle players and distribute into groups of 3-4
    const shuffled = [...players].sort(() => Math.random() - 0.5)
    const groupSize = players.length <= 12 ? 3 : 4
    const numGroups = Math.ceil(shuffled.length / groupSize)

    const newGroups: GroupDraft[] = []
    for (let i = 0; i < numGroups; i++) {
      const start = i * groupSize
      const end = Math.min(start + groupSize, shuffled.length)
      newGroups.push({
        name: `Group ${i + 1}`,
        playerIds: shuffled.slice(start, end).map((p) => p.id),
      })
    }
    setGroups(newGroups)
    // Re-generate team pairings if team format
    if (isTeamFormat) {
      setTeamConfigs(autoPairGroups(newGroups, getPlayerName))
    }
  }

  function getPlayerName(playerId: string) {
    const player = players.find((p) => p.id === playerId)
    return player?.displayName ?? 'Unknown'
  }

  function canSubmit() {
    if (!name.trim()) return false
    if (!courseId) return false
    // At least one group with players
    const hasPlayers = groups.some((g) => g.playerIds.length > 0)
    return hasPlayers
  }

  function handleSubmit() {
    if (!canSubmit()) return

    // Filter out empty groups
    const validGroups = groups
      .filter((g) => g.playerIds.length > 0)
      .map((g) => ({ name: g.name, playerIds: g.playerIds }))

    // Check if points table differs from default
    const isDefaultPoints =
      pointsTable.length === DEFAULT_POINTS.length &&
      pointsTable.every((p, i) => p === DEFAULT_POINTS[i])

    // Collect teams from team pairing editor (if team format)
    const teams = isTeamFormat
      ? teamConfigs.flatMap((cfg) =>
          cfg.teams.map((t) => ({
            name: t.name,
            playerIds: [...t.playerIds],
          }))
        )
      : undefined

    createRound(tournamentId, {
      courseId,
      name: name.trim(),
      dateTime: dateTime || undefined,
      format,
      holesPlayed,
      pointsTable: isDefaultPoints ? undefined : pointsTable,
      groups: validGroups,
      teams: teams && teams.length > 0 ? teams : undefined,
    })

    handleClose(false)
  }

  function handleClose(openState: boolean) {
    if (!openState) {
      setName('')
      setCourseId('')
      setFormat('stableford')
      setHolesPlayed(18)
      setDateTime('')
      setPointsTable([...DEFAULT_POINTS])
      setGroups([{ name: 'Group 1', playerIds: [] }])
      setTeamConfigs([])
    }
    onOpenChange(openState)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Round</DialogTitle>
          <DialogDescription>
            Set up a new round with course, format, and groups.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Round name */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="roundName">Round Name</Label>
            <Input
              id="roundName"
              placeholder="e.g. Day 1 Morning"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Course selection */}
          <div className="flex flex-col gap-2">
            <Label>Course</Label>
            {courses.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No courses created yet. Create a course first.
              </p>
            ) : (
              <Select value={courseId} onValueChange={setCourseId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a course" />
                </SelectTrigger>
                <SelectContent>
                  {countryCourses.map((course) => {
                    const holes = getHoles(course.id)
                    const totalPar = holes.reduce((s, h) => s + h.par, 0)
                    return (
                      <SelectItem key={course.id} value={course.id}>
                        {course.name} ({holes.length}h, par {totalPar})
                      </SelectItem>
                    )
                  })}
                  {otherCourses.length > 0 && (
                    <>
                      <div className="text-muted-foreground px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider">
                        Other countries
                      </div>
                      {otherCourses.map((course) => {
                        const holes = getHoles(course.id)
                        const totalPar = holes.reduce((s, h) => s + h.par, 0)
                        const country = countries.find(
                          (c) => c.id === course.countryId
                        )
                        return (
                          <SelectItem key={course.id} value={course.id}>
                            {course.name} ({holes.length}h, par {totalPar})
                            {country && (
                              <span className="text-muted-foreground">
                                {' '}
                                — {country.name}
                              </span>
                            )}
                          </SelectItem>
                        )
                      })}
                    </>
                  )}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Format + Holes */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label>Format</Label>
              <Select
                value={format}
                onValueChange={(v) => {
                  const newFormat = v as RoundFormat
                  setFormat(newFormat)
                  // Auto-generate team pairings when switching to team format
                  if (
                    (newFormat === 'scramble' || newFormat === 'bestball') &&
                    format !== 'scramble' &&
                    format !== 'bestball'
                  ) {
                    setTeamConfigs(autoPairGroups(groups, getPlayerName))
                  }
                  // Clear team configs when switching away from team format
                  if (newFormat !== 'scramble' && newFormat !== 'bestball') {
                    setTeamConfigs([])
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FORMAT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Holes</Label>
              <Select
                value={String(holesPlayed)}
                onValueChange={(v) => setHolesPlayed(Number(v) as 9 | 18)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="18">18 holes</SelectItem>
                  <SelectItem value="9">9 holes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Format description */}
          <p className="text-muted-foreground text-xs">
            {FORMAT_OPTIONS.find((f) => f.value === format)?.desc}
          </p>

          {/* Date/time (optional) */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="roundDateTime">Date & Time (optional)</Label>
            <Input
              id="roundDateTime"
              type="datetime-local"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
            />
          </div>

          <Separator />

          {/* Points table editor */}
          <PointsTableEditor
            pointsTable={pointsTable}
            onChange={setPointsTable}
          />

          <Separator />

          {/* Group assignment */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Label>Groups</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={autoAssignGroups}
                  disabled={players.length === 0}
                >
                  <Shuffle className="size-3.5" />
                  Auto-assign
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addGroup}
                >
                  <Plus className="size-3.5" />
                  Group
                </Button>
              </div>
            </div>

            {/* Unassigned players */}
            {unassignedPlayers.length > 0 && (
              <div className="bg-muted/50 rounded-lg p-2">
                <p className="text-muted-foreground mb-1.5 text-xs font-medium">
                  Unassigned ({unassignedPlayers.length})
                </p>
                <div className="flex flex-wrap gap-1">
                  {unassignedPlayers.map((player) => (
                    <Badge
                      key={player.id}
                      variant="secondary"
                      className="cursor-default text-xs"
                    >
                      {player.displayName}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Group cards */}
            {groups.map((group, gi) => (
              <div key={gi} className="rounded-lg border p-3">
                <div className="mb-2 flex items-center gap-2">
                  <Users className="text-muted-foreground size-3.5" />
                  <Input
                    value={group.name}
                    onChange={(e) => updateGroupName(gi, e.target.value)}
                    className="h-7 text-sm font-medium"
                  />
                  {groups.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => removeGroup(gi)}
                    >
                      <X className="size-3.5" />
                      <span className="sr-only">Remove group</span>
                    </Button>
                  )}
                </div>

                {/* Players in this group */}
                <div className="flex flex-wrap gap-1">
                  {group.playerIds.map((pid) => (
                    <Badge
                      key={pid}
                      variant="default"
                      className="gap-1 pr-1 text-xs"
                    >
                      {getPlayerName(pid)}
                      <button
                        type="button"
                        onClick={() => removePlayerFromGroup(gi, pid)}
                        className="hover:bg-primary-foreground/20 ml-0.5 rounded-full p-0.5"
                      >
                        <X className="size-2.5" />
                        <span className="sr-only">
                          Remove {getPlayerName(pid)}
                        </span>
                      </button>
                    </Badge>
                  ))}
                  {group.playerIds.length === 0 && (
                    <p className="text-muted-foreground text-xs">
                      No players assigned
                    </p>
                  )}
                </div>

                {/* Add player to group dropdown */}
                {unassignedPlayers.length > 0 && (
                  <Select
                    value=""
                    onValueChange={(pid) => addPlayerToGroup(gi, pid)}
                  >
                    <SelectTrigger className="mt-2 h-7 w-full text-xs">
                      <SelectValue placeholder="Add player..." />
                    </SelectTrigger>
                    <SelectContent>
                      {unassignedPlayers.map((player) => (
                        <SelectItem key={player.id} value={player.id}>
                          {player.displayName} (HCP {player.groupHandicap})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            ))}
          </div>

          {isTeamFormat && (
            <>
              <Separator />
              <TeamPairingEditor
                groups={groups}
                getPlayerName={getPlayerName}
                value={teamConfigs}
                onChange={setTeamConfigs}
              />
            </>
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button
            variant="outline"
            className="h-11"
            onClick={() => handleClose(false)}
          >
            Cancel
          </Button>
          <Button
            className="h-11"
            onClick={handleSubmit}
            disabled={!canSubmit()}
          >
            Create Round
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
