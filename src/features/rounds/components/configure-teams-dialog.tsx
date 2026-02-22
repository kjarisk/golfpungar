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
import { Separator } from '@/components/ui/separator'
import { useRoundsStore } from '@/features/rounds'
import { usePlayersStore } from '@/features/players'
import { useFeedStore } from '@/features/feed'
import type { Round } from '@/features/rounds'
import { Users, Shuffle, Pencil } from 'lucide-react'

interface ConfigureTeamsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  round: Round
  tournamentId: string
}

interface TeamDraft {
  playerIds: [string, string]
  name: string
}

interface GroupTeamConfig {
  groupId: string
  groupName: string
  playerIds: string[]
  teams: TeamDraft[]
}

function defaultTeamName(
  playerIds: [string, string],
  getPlayerName: (id: string) => string
): string {
  return `${getPlayerName(playerIds[0])} & ${getPlayerName(playerIds[1])}`
}

/**
 * Auto-pair players in a group into 2-player teams.
 * Groups with odd player count get the last player left unpaired.
 */
function autoPairGroup(
  playerIds: string[],
  getPlayerName: (id: string) => string
): TeamDraft[] {
  const teams: TeamDraft[] = []
  for (let i = 0; i + 1 < playerIds.length; i += 2) {
    const pair: [string, string] = [playerIds[i], playerIds[i + 1]]
    teams.push({
      playerIds: pair,
      name: defaultTeamName(pair, getPlayerName),
    })
  }
  return teams
}

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export function ConfigureTeamsDialog({
  open,
  onOpenChange,
  round,
  tournamentId,
}: ConfigureTeamsDialogProps) {
  const getGroupsByRound = useRoundsStore((s) => s.getGroupsByRound)
  const getTeamsByRound = useRoundsStore((s) => s.getTeamsByRound)
  const addTeamsToRound = useRoundsStore((s) => s.addTeamsToRound)
  const updateTeamName = useRoundsStore((s) => s.updateTeamName)
  const removeTeamsByRound = useRoundsStore((s) => s.removeTeamsByRound)
  const getActivePlayers = usePlayersStore((s) => s.getActivePlayers)
  const addFeedEvent = useFeedStore((s) => s.addEvent)

  const groups = getGroupsByRound(round.id)
  const existingTeams = getTeamsByRound(round.id)
  const players = getActivePlayers(tournamentId)

  function getPlayerName(id: string): string {
    return players.find((p) => p.id === id)?.displayName ?? 'Unknown'
  }

  // Initialize group configs from existing teams or auto-pair
  const initialConfigs = useMemo(() => {
    return groups.map((group): GroupTeamConfig => {
      // Check if there are existing teams for players in this group
      const groupExistingTeams = existingTeams.filter((t) =>
        t.playerIds.some((pid) => group.playerIds.includes(pid))
      )

      if (groupExistingTeams.length > 0) {
        return {
          groupId: group.id,
          groupName: group.name,
          playerIds: group.playerIds,
          teams: groupExistingTeams.map((t) => ({
            playerIds: t.playerIds as [string, string],
            name: t.name,
          })),
        }
      }

      return {
        groupId: group.id,
        groupName: group.name,
        playerIds: group.playerIds,
        teams: autoPairGroup(group.playerIds, getPlayerName),
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const [configs, setConfigs] = useState<GroupTeamConfig[]>(initialConfigs)

  // Re-sync when dialog opens
  const [lastOpen, setLastOpen] = useState(open)
  if (open !== lastOpen) {
    setLastOpen(open)
    if (open) {
      setConfigs(initialConfigs)
    }
  }

  function handleShuffle(groupIndex: number) {
    setConfigs((prev) =>
      prev.map((cfg, i) => {
        if (i !== groupIndex) return cfg
        const shuffled = shuffleArray(cfg.playerIds)
        return {
          ...cfg,
          teams: autoPairGroup(shuffled, getPlayerName),
        }
      })
    )
  }

  function handleTeamNameChange(
    groupIndex: number,
    teamIndex: number,
    name: string
  ) {
    setConfigs((prev) =>
      prev.map((cfg, i) => {
        if (i !== groupIndex) return cfg
        return {
          ...cfg,
          teams: cfg.teams.map((t, j) =>
            j === teamIndex ? { ...t, name } : t
          ),
        }
      })
    )
  }

  function handleResetName(groupIndex: number, teamIndex: number) {
    setConfigs((prev) =>
      prev.map((cfg, i) => {
        if (i !== groupIndex) return cfg
        return {
          ...cfg,
          teams: cfg.teams.map((t, j) =>
            j === teamIndex
              ? { ...t, name: defaultTeamName(t.playerIds, getPlayerName) }
              : t
          ),
        }
      })
    )
  }

  function handleSave() {
    const allNewTeams = configs.flatMap((cfg) =>
      cfg.teams.map((t) => ({
        name: t.name.trim() || defaultTeamName(t.playerIds, getPlayerName),
        playerIds: t.playerIds,
      }))
    )

    // If editing existing teams, detect name changes and post feed events
    if (existingTeams.length > 0) {
      for (const newTeam of allNewTeams) {
        // Find matching existing team by player composition
        const oldTeam = existingTeams.find(
          (et) =>
            et.playerIds.length === newTeam.playerIds.length &&
            et.playerIds.every((pid) => newTeam.playerIds.includes(pid))
        )
        if (oldTeam && oldTeam.name !== newTeam.name) {
          // Name changed — update in place and post feed event if round is active
          updateTeamName(oldTeam.id, newTeam.name)
          if (round.status === 'active') {
            addFeedEvent({
              tournamentId,
              type: 'team_name_changed',
              message: `Team renamed: "${oldTeam.name}" → "${newTeam.name}"`,
              roundId: round.id,
              teamId: oldTeam.id,
            })
          }
        }
      }

      // Check if team composition changed (not just names) — rebuild if so
      const compositionChanged =
        allNewTeams.length !== existingTeams.length ||
        allNewTeams.some(
          (nt) =>
            !existingTeams.find(
              (et) =>
                et.playerIds.length === nt.playerIds.length &&
                et.playerIds.every((pid) => nt.playerIds.includes(pid))
            )
        )

      if (compositionChanged) {
        // Teams were reshuffled — remove old and add new
        removeTeamsByRound(round.id)
        addTeamsToRound(round.id, allNewTeams)
      }
    } else {
      // No existing teams — just add new ones
      addTeamsToRound(round.id, allNewTeams)
    }

    onOpenChange(false)
  }

  const totalTeams = configs.reduce((sum, cfg) => sum + cfg.teams.length, 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="size-5" />
            Configure Teams
          </DialogTitle>
          <DialogDescription>
            Pair players into 2-player teams for{' '}
            <span className="font-medium">{round.name}</span> (
            {round.format === 'scramble' ? 'Scramble' : 'Best Ball'}).
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          {configs.map((cfg, groupIndex) => (
            <div key={cfg.groupId} className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">{cfg.groupName}</h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleShuffle(groupIndex)}
                  className="h-7 gap-1 text-xs"
                >
                  <Shuffle className="size-3" />
                  Shuffle
                </Button>
              </div>

              {cfg.teams.map((team, teamIndex) => (
                <div
                  key={teamIndex}
                  className="bg-muted/50 rounded-lg border p-3"
                >
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {team.playerIds.map((pid) => (
                      <Badge key={pid} variant="secondary" className="text-xs">
                        {getPlayerName(pid)}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="sr-only">Team name</Label>
                    <Input
                      value={team.name}
                      onChange={(e) =>
                        handleTeamNameChange(
                          groupIndex,
                          teamIndex,
                          e.target.value
                        )
                      }
                      className="h-8 text-sm"
                      placeholder="Team name"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 shrink-0 px-2"
                      onClick={() => handleResetName(groupIndex, teamIndex)}
                      title="Reset to default name"
                    >
                      <Pencil className="size-3" />
                    </Button>
                  </div>
                </div>
              ))}

              {cfg.playerIds.length % 2 !== 0 && (
                <p className="text-muted-foreground text-xs italic">
                  {getPlayerName(cfg.playerIds[cfg.playerIds.length - 1])} is
                  unpaired (odd number of players)
                </p>
              )}

              {groupIndex < configs.length - 1 && <Separator />}
            </div>
          ))}
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={totalTeams === 0}>
            Save {totalTeams} {totalTeams === 1 ? 'Team' : 'Teams'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
