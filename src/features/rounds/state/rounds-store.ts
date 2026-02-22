import { create } from 'zustand'
import type {
  Round,
  Group,
  Team,
  CreateRoundInput,
  RoundStatus,
} from '../types'

export interface UpdateRoundInput {
  name?: string
  dateTime?: string
  format?: Round['format']
  holesPlayed?: Round['holesPlayed']
  courseId?: string
}

export interface AddTeamInput {
  name: string
  playerIds: string[]
}

export interface UpdateGroupInput {
  name: string
  playerIds: string[]
}

interface RoundsState {
  rounds: Round[]
  groups: Group[]
  teams: Team[]

  // Derived
  getRoundsByTournament: (tournamentId: string) => Round[]
  getGroupsByRound: (roundId: string) => Group[]
  getTeamsByRound: (roundId: string) => Team[]
  getActiveRound: (tournamentId: string) => Round | undefined
  getTeamForPlayer: (roundId: string, playerId: string) => Team | undefined
  getDeletedRounds: (tournamentId: string) => Round[]

  // Actions
  createRound: (tournamentId: string, input: CreateRoundInput) => Round
  updateRound: (roundId: string, input: UpdateRoundInput) => void
  updateGroups: (roundId: string, groupInputs: UpdateGroupInput[]) => void
  setRoundStatus: (roundId: string, status: RoundStatus) => void
  removeRound: (id: string) => void
  restoreRound: (id: string) => void
  addTeamsToRound: (roundId: string, teams: AddTeamInput[]) => Team[]
  updateTeamName: (teamId: string, name: string) => void
  removeTeam: (teamId: string) => void
  removeTeamsByRound: (roundId: string) => void
}

let nextRoundId = 1
let nextGroupId = 1
let nextTeamId = 1

export const useRoundsStore = create<RoundsState>((set, get) => ({
  rounds: [],
  groups: [],
  teams: [],

  getRoundsByTournament: (tournamentId) =>
    get().rounds.filter((r) => r.tournamentId === tournamentId && !r.deleted),

  getGroupsByRound: (roundId) =>
    get().groups.filter((g) => g.roundId === roundId),

  getTeamsByRound: (roundId) =>
    get().teams.filter((t) => t.roundId === roundId),

  getActiveRound: (tournamentId) =>
    get().rounds.find(
      (r) =>
        r.tournamentId === tournamentId && r.status === 'active' && !r.deleted
    ),

  getTeamForPlayer: (roundId, playerId) =>
    get().teams.find(
      (t) => t.roundId === roundId && t.playerIds.includes(playerId)
    ),

  getDeletedRounds: (tournamentId) =>
    get().rounds.filter((r) => r.tournamentId === tournamentId && r.deleted),

  createRound: (tournamentId, input) => {
    const roundId = `round-${String(nextRoundId++).padStart(3, '0')}`
    const round: Round = {
      id: roundId,
      tournamentId,
      courseId: input.courseId,
      name: input.name,
      dateTime: input.dateTime,
      format: input.format,
      holesPlayed: input.holesPlayed,
      status: 'upcoming',
      createdAt: new Date().toISOString(),
    }

    const newGroups: Group[] = input.groups.map((g) => ({
      id: `group-${String(nextGroupId++).padStart(3, '0')}`,
      roundId,
      name: g.name,
      playerIds: g.playerIds,
    }))

    const newTeams: Team[] = (input.teams ?? []).map((t) => ({
      id: `team-${String(nextTeamId++).padStart(3, '0')}`,
      roundId,
      name: t.name,
      playerIds: t.playerIds,
    }))

    set((state) => ({
      rounds: [...state.rounds, round],
      groups: [...state.groups, ...newGroups],
      teams: [...state.teams, ...newTeams],
    }))

    return round
  },

  updateRound: (roundId, input) => {
    set((state) => ({
      rounds: state.rounds.map((r) =>
        r.id === roundId ? { ...r, ...input } : r
      ),
    }))
  },

  setRoundStatus: (roundId, status) => {
    set((state) => {
      const targetRound = state.rounds.find((r) => r.id === roundId)
      if (!targetRound) return state

      let updatedRounds = state.rounds

      // If setting to 'active', deactivate any other active round in the same tournament
      if (status === 'active') {
        updatedRounds = updatedRounds.map((r) =>
          r.tournamentId === targetRound.tournamentId &&
          r.id !== roundId &&
          r.status === 'active'
            ? { ...r, status: 'upcoming' as RoundStatus }
            : r
        )
      }

      // Update the target round's status
      updatedRounds = updatedRounds.map((r) =>
        r.id === roundId ? { ...r, status } : r
      )

      return { rounds: updatedRounds }
    })
  },

  updateGroups: (roundId, groupInputs) => {
    set((state) => {
      // Remove old groups for this round
      const otherGroups = state.groups.filter((g) => g.roundId !== roundId)
      // Create new groups
      const newGroups: Group[] = groupInputs.map((g) => ({
        id: `group-${String(nextGroupId++).padStart(3, '0')}`,
        roundId,
        name: g.name,
        playerIds: g.playerIds,
      }))
      return { groups: [...otherGroups, ...newGroups] }
    })
  },

  removeRound: (id) => {
    set((state) => ({
      rounds: state.rounds.map((r) =>
        r.id === id
          ? { ...r, deleted: true, status: 'upcoming' as RoundStatus }
          : r
      ),
    }))
  },

  restoreRound: (id) => {
    set((state) => ({
      rounds: state.rounds.map((r) =>
        r.id === id ? { ...r, deleted: false } : r
      ),
    }))
  },

  addTeamsToRound: (roundId, teamInputs) => {
    const newTeams: Team[] = teamInputs.map((t) => ({
      id: `team-${String(nextTeamId++).padStart(3, '0')}`,
      roundId,
      name: t.name,
      playerIds: t.playerIds,
    }))

    set((state) => ({
      teams: [...state.teams, ...newTeams],
    }))

    return newTeams
  },

  updateTeamName: (teamId, name) => {
    set((state) => ({
      teams: state.teams.map((t) => (t.id === teamId ? { ...t, name } : t)),
    }))
  },

  removeTeam: (teamId) => {
    set((state) => ({
      teams: state.teams.filter((t) => t.id !== teamId),
    }))
  },

  removeTeamsByRound: (roundId) => {
    set((state) => ({
      teams: state.teams.filter((t) => t.roundId !== roundId),
    }))
  },
}))
