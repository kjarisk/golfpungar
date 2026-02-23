export interface TeamDraft {
  playerIds: [string, string]
  name: string
}

export interface GroupTeamDraft {
  groupIndex: number
  groupName: string
  playerIds: string[]
  teams: TeamDraft[]
}

export interface TeamPairingResult {
  teams: { name: string; playerIds: string[] }[]
}

function defaultTeamName(
  playerIds: [string, string],
  getPlayerName: (id: string) => string
): string {
  return `${getPlayerName(playerIds[0])} & ${getPlayerName(playerIds[1])}`
}

export function autoPairGroup(
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

export function autoPairGroups(
  groups: { name: string; playerIds: string[] }[],
  getPlayerName: (id: string) => string
): GroupTeamDraft[] {
  return groups
    .filter((g) => g.playerIds.length >= 2)
    .map((g, i) => ({
      groupIndex: i,
      groupName: g.name,
      playerIds: g.playerIds,
      teams: autoPairGroup(g.playerIds, getPlayerName),
    }))
}
