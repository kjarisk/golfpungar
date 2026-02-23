import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Shuffle, Pencil } from 'lucide-react'
import { autoPairGroup } from '../lib/team-pairing'
import type { GroupTeamDraft } from '../lib/team-pairing'

interface TeamPairingEditorProps {
  groups: { name: string; playerIds: string[] }[]
  getPlayerName: (id: string) => string
  value: GroupTeamDraft[]
  onChange: (configs: GroupTeamDraft[]) => void
}

function defaultTeamName(
  playerIds: [string, string],
  getPlayerName: (id: string) => string
): string {
  return `${getPlayerName(playerIds[0])} & ${getPlayerName(playerIds[1])}`
}

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export function TeamPairingEditor({
  groups,
  getPlayerName,
  value,
  onChange,
}: TeamPairingEditorProps) {
  function handleShuffle(groupIndex: number) {
    onChange(
      value.map((cfg, i) => {
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
    onChange(
      value.map((cfg, i) => {
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
    onChange(
      value.map((cfg, i) => {
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

  // Only show groups with at least 2 players
  const validGroups = groups.filter((g) => g.playerIds.length >= 2)

  if (validGroups.length === 0) {
    return (
      <div className="bg-muted/50 rounded-lg p-3">
        <p className="text-sm font-medium">Teams</p>
        <p className="text-muted-foreground text-xs">
          Assign at least 2 players per group to configure teams.
        </p>
      </div>
    )
  }

  if (value.length === 0) {
    return (
      <div className="bg-muted/50 rounded-lg p-3">
        <p className="text-sm font-medium">Teams</p>
        <p className="text-muted-foreground text-xs">
          Assign at least 2 players per group to configure teams.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <Label>Teams</Label>
      {value.map((cfg, groupIndex) => (
        <div key={groupIndex} className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold">{cfg.groupName}</h4>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleShuffle(groupIndex)}
              className="h-6 gap-1 px-2 text-xs"
            >
              <Shuffle className="size-3" />
              Shuffle
            </Button>
          </div>

          {cfg.teams.map((team, teamIndex) => (
            <div
              key={teamIndex}
              className="bg-muted/50 rounded-lg border p-2.5"
            >
              <div className="mb-1.5 flex flex-wrap gap-1">
                {team.playerIds.map((pid) => (
                  <Badge key={pid} variant="secondary" className="text-xs">
                    {getPlayerName(pid)}
                  </Badge>
                ))}
              </div>
              <div className="flex items-center gap-1.5">
                <Label
                  htmlFor={`team-${groupIndex}-${teamIndex}`}
                  className="sr-only"
                >
                  Team name
                </Label>
                <Input
                  id={`team-${groupIndex}-${teamIndex}`}
                  value={team.name}
                  onChange={(e) =>
                    handleTeamNameChange(groupIndex, teamIndex, e.target.value)
                  }
                  className="h-7 text-xs"
                  placeholder="Team name"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 shrink-0 px-1.5"
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

          {groupIndex < value.length - 1 && <Separator className="my-1" />}
        </div>
      ))}
    </div>
  )
}
