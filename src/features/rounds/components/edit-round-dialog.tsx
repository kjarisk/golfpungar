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
import type { Round, RoundFormat } from '@/features/rounds'
import { Shuffle, Plus, X, Users } from 'lucide-react'

interface EditRoundDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  round: Round
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

export function EditRoundDialog({
  open,
  onOpenChange,
  round,
}: EditRoundDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        {/* Key forces remount when round changes, resetting all form state */}
        {open && (
          <EditRoundForm
            key={round.id}
            round={round}
            onOpenChange={onOpenChange}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function EditRoundForm({
  round,
  onOpenChange,
}: {
  round: Round
  onOpenChange: (open: boolean) => void
}) {
  const updateRound = useRoundsStore((s) => s.updateRound)
  const updateGroups = useRoundsStore((s) => s.updateGroups)
  const getGroupsByRound = useRoundsStore((s) => s.getGroupsByRound)
  const getCoursesByTournament = useCoursesStore(
    (s) => s.getCoursesByTournament
  )
  const getHoles = useCoursesStore((s) => s.getHolesByCourse)
  const getActivePlayers = usePlayersStore((s) => s.getActivePlayers)

  const courses = getCoursesByTournament(round.tournamentId)
  const players = getActivePlayers(round.tournamentId)

  // Initialize groups from existing data
  const existingGroups = getGroupsByRound(round.id)
  const initialGroups: GroupDraft[] =
    existingGroups.length > 0
      ? existingGroups.map((g) => ({
          name: g.name,
          playerIds: [...g.playerIds],
        }))
      : [{ name: 'Group 1', playerIds: [] }]

  const [name, setName] = useState(round.name)
  const [courseId, setCourseId] = useState(round.courseId)
  const [format, setFormat] = useState<RoundFormat>(round.format)
  const [holesPlayed, setHolesPlayed] = useState<9 | 18>(round.holesPlayed)
  const [dateTime, setDateTime] = useState(round.dateTime ?? '')
  const [groups, setGroups] = useState<GroupDraft[]>(initialGroups)

  // Players already assigned to a group
  const assignedPlayerIds = useMemo(
    () => new Set(groups.flatMap((g) => g.playerIds)),
    [groups]
  )
  const unassignedPlayers = players.filter((p) => !assignedPlayerIds.has(p.id))

  const isTeamFormat = format === 'scramble' || format === 'bestball'

  function addGroup() {
    setGroups((prev) => [
      ...prev,
      { name: `Group ${prev.length + 1}`, playerIds: [] },
    ])
  }

  function removeGroup(index: number) {
    setGroups((prev) => prev.filter((_, i) => i !== index))
  }

  function updateGroupName(index: number, newName: string) {
    setGroups((prev) =>
      prev.map((g, i) => (i === index ? { ...g, name: newName } : g))
    )
  }

  function addPlayerToGroup(groupIndex: number, playerId: string) {
    setGroups((prev) =>
      prev.map((g, i) =>
        i === groupIndex ? { ...g, playerIds: [...g.playerIds, playerId] } : g
      )
    )
  }

  function removePlayerFromGroup(groupIndex: number, playerId: string) {
    setGroups((prev) =>
      prev.map((g, i) =>
        i === groupIndex
          ? { ...g, playerIds: g.playerIds.filter((id) => id !== playerId) }
          : g
      )
    )
  }

  function autoAssignGroups() {
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
  }

  function getPlayerName(playerId: string) {
    const player = players.find((p) => p.id === playerId)
    return player?.displayName ?? 'Unknown'
  }

  function canSubmit() {
    if (!name.trim()) return false
    if (!courseId) return false
    const hasPlayers = groups.some((g) => g.playerIds.length > 0)
    return hasPlayers
  }

  function handleSubmit() {
    if (!canSubmit()) return

    // Update round fields
    updateRound(round.id, {
      name: name.trim(),
      format,
      holesPlayed,
      courseId,
      dateTime: dateTime || undefined,
    })

    // Update groups (replace all groups for this round)
    const validGroups = groups
      .filter((g) => g.playerIds.length > 0)
      .map((g) => ({ name: g.name, playerIds: g.playerIds }))
    updateGroups(round.id, validGroups)

    onOpenChange(false)
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Edit Round</DialogTitle>
        <DialogDescription>
          Update round details, course, and group assignments.
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-4">
        {/* Round name */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="editRoundName">Round Name</Label>
          <Input
            id="editRoundName"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* Course selection */}
        <div className="flex flex-col gap-2">
          <Label>Course</Label>
          {courses.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No courses imported yet. Import a course first.
            </p>
          ) : (
            <Select value={courseId} onValueChange={setCourseId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a course" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => {
                  const holes = getHoles(course.id)
                  const totalPar = holes.reduce((s, h) => s + h.par, 0)
                  return (
                    <SelectItem key={course.id} value={course.id}>
                      {course.name} ({holes.length}h, par {totalPar})
                    </SelectItem>
                  )
                })}
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
              onValueChange={(v) => setFormat(v as RoundFormat)}
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
          <Label htmlFor="editRoundDateTime">Date & Time (optional)</Label>
          <Input
            id="editRoundDateTime"
            type="datetime-local"
            value={dateTime}
            onChange={(e) => setDateTime(e.target.value)}
          />
        </div>

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
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-sm font-medium">Team Format</p>
              <p className="text-muted-foreground text-xs">
                Teams can be configured separately after saving.
              </p>
            </div>
          </>
        )}
      </div>

      <DialogFooter className="mt-4">
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={!canSubmit()}>
          Save Changes
        </Button>
      </DialogFooter>
    </>
  )
}
