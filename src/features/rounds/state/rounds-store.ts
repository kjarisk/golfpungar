import { create } from 'zustand'
import type {
  Round,
  Group,
  Team,
  CreateRoundInput,
  RoundStatus,
} from '../types'

interface RoundsState {
  rounds: Round[]
  groups: Group[]
  teams: Team[]

  // Derived
  getRoundsByTournament: (tournamentId: string) => Round[]
  getGroupsByRound: (roundId: string) => Group[]
  getTeamsByRound: (roundId: string) => Team[]

  // Actions
  createRound: (tournamentId: string, input: CreateRoundInput) => Round
  setRoundStatus: (roundId: string, status: RoundStatus) => void
  removeRound: (id: string) => void
}

let nextRoundId = 1
let nextGroupId = 1
let nextTeamId = 1

export const useRoundsStore = create<RoundsState>((set, get) => ({
  rounds: [],
  groups: [],
  teams: [],

  getRoundsByTournament: (tournamentId) =>
    get().rounds.filter((r) => r.tournamentId === tournamentId),

  getGroupsByRound: (roundId) =>
    get().groups.filter((g) => g.roundId === roundId),

  getTeamsByRound: (roundId) =>
    get().teams.filter((t) => t.roundId === roundId),

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

  setRoundStatus: (roundId, status) => {
    set((state) => ({
      rounds: state.rounds.map((r) =>
        r.id === roundId ? { ...r, status } : r
      ),
    }))
  },

  removeRound: (id) => {
    set((state) => ({
      rounds: state.rounds.filter((r) => r.id !== id),
      groups: state.groups.filter((g) => g.roundId !== id),
      teams: state.teams.filter((t) => t.roundId !== id),
    }))
  },
}))
