/**
 * Demo data seed v2 — populates all stores with realistic multi-tournament data.
 *
 * seedDemoData()  → creates two tournaments:
 *   1. "Spain 2026" (active, live) — 14 players, 3 rounds (completed, active, upcoming),
 *      teams for scramble round, side events, penalties, bets, announcements.
 *   2. "Portugal 2025" (past, done) — 10 players (overlapping), 2 completed rounds.
 *
 * clearDemoData() → resets every store to its base state (single tournament, 6 players).
 * isDemoSeeded()  → returns true if rounds already exist (simple check).
 */

import { useRoundsStore } from '@/features/rounds'
import { useScoringStore } from '@/features/scoring'
import { useSideEventsStore } from '@/features/side-events'
import { useFeedStore } from '@/features/feed'
import { usePenaltiesStore } from '@/features/penalties'
import { useBettingStore } from '@/features/betting'
import { useCoursesStore } from '@/features/courses'
import { useTournamentStore } from '@/features/tournament'
import { usePlayersStore } from '@/features/players'
import { useCountriesStore } from '@/features/countries'
import type { RoundFormat } from '@/features/rounds'
import type { Player } from '@/features/players'
import type { Tournament } from '@/features/tournament'
import type { Course, Hole } from '@/features/courses'

// ---------------------------------------------------------------------------
// Constants — Spain 2026 (active tournament)
// ---------------------------------------------------------------------------

const T1 = 'tournament-001' // Spain 2026 (already exists as mock)
const T2 = 'tournament-past' // Portugal 2025 (added by seed)
const COURSE_SPAIN = 'course-001' // Los Naranjos (already exists as mock)
const COURSE_PORTUGAL = 'course-past' // Quinta do Lago (added by seed)

// Par for Los Naranjos (18 holes)
const HOLE_PARS_SPAIN = [4, 5, 3, 4, 4, 4, 3, 5, 4, 4, 5, 3, 4, 4, 4, 3, 5, 4]
// Par for Quinta do Lago (18 holes)
const HOLE_PARS_PORTUGAL = [
  4, 4, 3, 5, 4, 4, 3, 4, 5, 4, 4, 3, 5, 4, 4, 3, 5, 4,
]

// All 14 players for Spain 2026 (first 6 are mock/existing, 7-14 are new)
const SPAIN_PLAYERS: {
  id: string
  name: string
  nickname?: string
  email: string
  handicap: number
  userId: string
}[] = [
  {
    id: 'player-001',
    name: 'Kjartan',
    nickname: 'Kjarri',
    email: 'kjartan@test.com',
    handicap: 18,
    userId: 'test-admin-001',
  },
  {
    id: 'player-002',
    name: 'Thomas',
    nickname: 'Tommy',
    email: 'thomas@test.com',
    handicap: 12,
    userId: 'user-002',
  },
  {
    id: 'player-003',
    name: 'Magnus',
    nickname: 'Maggi',
    email: 'magnus@test.com',
    handicap: 24,
    userId: 'user-003',
  },
  {
    id: 'player-004',
    name: 'Olafur',
    nickname: 'Oli',
    email: 'olafur@test.com',
    handicap: 15,
    userId: 'user-004',
  },
  {
    id: 'player-005',
    name: 'Gunnar',
    email: 'gunnar@test.com',
    handicap: 20,
    userId: 'user-005',
  },
  {
    id: 'player-006',
    name: 'Stefan',
    nickname: 'Stebbi',
    email: 'stefan@test.com',
    handicap: 8,
    userId: 'user-006',
  },
  {
    id: 'player-d07',
    name: 'Bjorn',
    nickname: 'Bjossi',
    email: 'bjorn@test.com',
    handicap: 14,
    userId: 'user-d07',
  },
  {
    id: 'player-d08',
    name: 'Ragnar',
    email: 'ragnar@test.com',
    handicap: 22,
    userId: 'user-d08',
  },
  {
    id: 'player-d09',
    name: 'Sigurdur',
    nickname: 'Siggi',
    email: 'sigurdur@test.com',
    handicap: 10,
    userId: 'user-d09',
  },
  {
    id: 'player-d10',
    name: 'Helgi',
    email: 'helgi@test.com',
    handicap: 28,
    userId: 'user-d10',
  },
  {
    id: 'player-d11',
    name: 'Jon',
    nickname: 'Jonni',
    email: 'jon@test.com',
    handicap: 16,
    userId: 'user-d11',
  },
  {
    id: 'player-d12',
    name: 'Arnar',
    email: 'arnar@test.com',
    handicap: 19,
    userId: 'user-d12',
  },
  {
    id: 'player-d13',
    name: 'Fridrik',
    nickname: 'Diddi',
    email: 'fridrik@test.com',
    handicap: 11,
    userId: 'user-d13',
  },
  {
    id: 'player-d14',
    name: 'Einar',
    email: 'einar@test.com',
    handicap: 26,
    userId: 'user-d14',
  },
]

const SPAIN_HANDICAPS: Record<string, number> = Object.fromEntries(
  SPAIN_PLAYERS.map((p) => [p.id, p.handicap])
)

// 10 players for Portugal 2025 (8 overlap with Spain, 2 unique to Portugal)
const PORTUGAL_PLAYER_IDS = [
  'player-001',
  'player-002',
  'player-003',
  'player-004',
  'player-005',
  'player-006',
  'player-d07',
  'player-d09',
  'player-p01',
  'player-p02',
]

const PORTUGAL_ONLY_PLAYERS = [
  {
    id: 'player-p01',
    name: 'Viktor',
    email: 'viktor@test.com',
    handicap: 17,
    userId: 'user-p01',
  },
  {
    id: 'player-p02',
    name: 'Birkir',
    nickname: 'Birki',
    email: 'birkir@test.com',
    handicap: 21,
    userId: 'user-p02',
  },
]

const PORTUGAL_HANDICAPS: Record<string, number> = {
  'player-001': 20,
  'player-002': 13,
  'player-003': 26,
  'player-004': 16,
  'player-005': 22,
  'player-006': 9,
  'player-d07': 15,
  'player-d09': 11,
  'player-p01': 17,
  'player-p02': 21,
}

// ---------------------------------------------------------------------------
// Realistic score generation (deterministic pseudo-random)
// ---------------------------------------------------------------------------

function generateScores(
  handicap: number,
  seed: number,
  pars: number[]
): (number | null)[] {
  let s = seed
  const rand = () => {
    s = (s * 16807 + 12345) % 2147483647
    return (s & 0x7fffffff) / 0x7fffffff
  }

  return pars.map((par) => {
    const r = rand()
    const avgOver = handicap / 18

    let strokes: number
    if (r < 0.02)
      strokes = par - 2 // eagle
    else if (r < 0.12)
      strokes = par - 1 // birdie
    else if (r < 0.35)
      strokes = par // par
    else if (r < 0.65)
      strokes = par + 1 // bogey
    else if (r < 0.85)
      strokes = par + 2 // double
    else strokes = par + Math.ceil(avgOver * 2 * rand()) + 1 // triple+

    return Math.max(1, strokes)
  })
}

function getScoresSpain(
  playerIdx: number,
  roundIdx: number
): (number | null)[] {
  const hcp = SPAIN_PLAYERS[playerIdx].handicap
  return generateScores(
    hcp,
    (playerIdx + 1) * 137 + (roundIdx + 1) * 31,
    HOLE_PARS_SPAIN
  )
}

function getScoresPortugal(
  playerIdx: number,
  roundIdx: number
): (number | null)[] {
  const hcp = Object.values(PORTUGAL_HANDICAPS)[playerIdx]
  return generateScores(
    hcp,
    (playerIdx + 1) * 251 + (roundIdx + 1) * 47,
    HOLE_PARS_PORTUGAL
  )
}

// ---------------------------------------------------------------------------
// Round definitions — Spain 2026
// ---------------------------------------------------------------------------

interface RoundDef {
  name: string
  format: RoundFormat
  dateTime: string
  status: 'completed' | 'active' | 'upcoming'
  groups: { name: string; playerIds: string[] }[]
  teams?: { name: string; playerIds: string[] }[]
  /** For active round: how many holes have been scored (partial) */
  holesScored?: number
}

const SPAIN_ROUNDS: RoundDef[] = [
  {
    name: 'Round 1 — Los Naranjos',
    format: 'handicap',
    dateTime: '2026-06-16T08:00:00Z',
    status: 'completed',
    groups: [
      {
        name: 'Group A',
        playerIds: ['player-001', 'player-002', 'player-006', 'player-d13'],
      },
      {
        name: 'Group B',
        playerIds: ['player-003', 'player-004', 'player-d07', 'player-d09'],
      },
      {
        name: 'Group C',
        playerIds: ['player-005', 'player-d08', 'player-d10', 'player-d11'],
      },
      { name: 'Group D', playerIds: ['player-d12', 'player-d14'] },
    ],
  },
  {
    name: 'Round 2 — Scramble',
    format: 'scramble',
    dateTime: '2026-06-17T08:30:00Z',
    status: 'active',
    groups: [
      {
        name: 'Group A',
        playerIds: ['player-001', 'player-006', 'player-003', 'player-d09'],
      },
      {
        name: 'Group B',
        playerIds: ['player-002', 'player-004', 'player-d07', 'player-d13'],
      },
      {
        name: 'Group C',
        playerIds: ['player-005', 'player-d08', 'player-d11', 'player-d12'],
      },
      { name: 'Group D', playerIds: ['player-d10', 'player-d14'] },
    ],
    teams: [
      { name: 'Kjartan & Stefan', playerIds: ['player-001', 'player-006'] },
      { name: 'Magnus & Siggi', playerIds: ['player-003', 'player-d09'] },
      { name: 'Thomas & Oli', playerIds: ['player-002', 'player-004'] },
      { name: 'Team Bjorn', playerIds: ['player-d07', 'player-d13'] },
      { name: 'Gunnar & Ragnar', playerIds: ['player-005', 'player-d08'] },
      { name: 'Jonni & Arnar', playerIds: ['player-d11', 'player-d12'] },
      { name: 'Helgi & Einar', playerIds: ['player-d10', 'player-d14'] },
    ],
    holesScored: 12, // front 9 + 3 of back 9
  },
  {
    name: 'Round 3 — Final Day',
    format: 'stableford',
    dateTime: '2026-06-18T09:00:00Z',
    status: 'upcoming',
    groups: [
      {
        name: 'Group A',
        playerIds: ['player-006', 'player-002', 'player-d09', 'player-d13'],
      },
      {
        name: 'Group B',
        playerIds: ['player-001', 'player-004', 'player-d07', 'player-005'],
      },
      {
        name: 'Group C',
        playerIds: ['player-003', 'player-d08', 'player-d11', 'player-d10'],
      },
      { name: 'Group D', playerIds: ['player-d12', 'player-d14'] },
    ],
  },
]

// Round definitions — Portugal 2025
const PORTUGAL_ROUNDS: RoundDef[] = [
  {
    name: 'Round 1 — Quinta do Lago',
    format: 'handicap',
    dateTime: '2025-09-10T08:00:00Z',
    status: 'completed',
    groups: [
      {
        name: 'Group A',
        playerIds: ['player-001', 'player-002', 'player-006', 'player-d07'],
      },
      {
        name: 'Group B',
        playerIds: ['player-003', 'player-004', 'player-005', 'player-d09'],
      },
      { name: 'Group C', playerIds: ['player-p01', 'player-p02'] },
    ],
  },
  {
    name: 'Round 2 — Quinta do Lago',
    format: 'stableford',
    dateTime: '2025-09-11T09:00:00Z',
    status: 'completed',
    groups: [
      {
        name: 'Group A',
        playerIds: ['player-001', 'player-004', 'player-d09', 'player-p02'],
      },
      {
        name: 'Group B',
        playerIds: ['player-002', 'player-003', 'player-005', 'player-006'],
      },
      { name: 'Group C', playerIds: ['player-d07', 'player-p01'] },
    ],
  },
]

// ---------------------------------------------------------------------------
// Side events — Spain 2026
// ---------------------------------------------------------------------------

interface SideEventSeed {
  playerId: string
  type: string
  holeNumber?: number
  value?: number
  roundIdx: number
}

function buildSpainSideEvents(): SideEventSeed[] {
  const e: SideEventSeed[] = []

  // Round 1 (completed — handicap)
  e.push(
    { playerId: 'player-006', type: 'birdie', holeNumber: 3, roundIdx: 0 },
    { playerId: 'player-002', type: 'birdie', holeNumber: 7, roundIdx: 0 },
    { playerId: 'player-001', type: 'birdie', holeNumber: 12, roundIdx: 0 },
    { playerId: 'player-006', type: 'birdie', holeNumber: 16, roundIdx: 0 },
    { playerId: 'player-d13', type: 'birdie', holeNumber: 2, roundIdx: 0 },
    { playerId: 'player-d09', type: 'birdie', holeNumber: 11, roundIdx: 0 },
    { playerId: 'player-006', type: 'eagle', holeNumber: 8, roundIdx: 0 },
    { playerId: 'player-003', type: 'snake', holeNumber: 2, roundIdx: 0 },
    { playerId: 'player-005', type: 'snake', holeNumber: 5, roundIdx: 0 },
    { playerId: 'player-001', type: 'snake', holeNumber: 14, roundIdx: 0 },
    { playerId: 'player-003', type: 'snake', holeNumber: 18, roundIdx: 0 },
    { playerId: 'player-d10', type: 'snake', holeNumber: 4, roundIdx: 0 },
    { playerId: 'player-d08', type: 'snake', holeNumber: 9, roundIdx: 0 },
    { playerId: 'player-003', type: 'snopp', holeNumber: 5, roundIdx: 0 },
    { playerId: 'player-005', type: 'snopp', holeNumber: 9, roundIdx: 0 },
    { playerId: 'player-001', type: 'snopp', holeNumber: 14, roundIdx: 0 },
    { playerId: 'player-d10', type: 'snopp', holeNumber: 4, roundIdx: 0 },
    { playerId: 'player-d10', type: 'snopp', holeNumber: 13, roundIdx: 0 },
    { playerId: 'player-004', type: 'bunker_save', holeNumber: 6, roundIdx: 0 },
    {
      playerId: 'player-006',
      type: 'bunker_save',
      holeNumber: 11,
      roundIdx: 0,
    },
    {
      playerId: 'player-d07',
      type: 'bunker_save',
      holeNumber: 15,
      roundIdx: 0,
    },
    {
      playerId: 'player-002',
      type: 'group_longest_drive',
      holeNumber: 8,
      roundIdx: 0,
    },
    {
      playerId: 'player-006',
      type: 'group_longest_drive',
      holeNumber: 17,
      roundIdx: 0,
    },
    {
      playerId: 'player-002',
      type: 'longest_drive_meters',
      holeNumber: 8,
      value: 265,
      roundIdx: 0,
    },
    {
      playerId: 'player-006',
      type: 'longest_drive_meters',
      holeNumber: 17,
      value: 278,
      roundIdx: 0,
    },
    {
      playerId: 'player-d07',
      type: 'longest_drive_meters',
      holeNumber: 8,
      value: 255,
      roundIdx: 0,
    },
    {
      playerId: 'player-001',
      type: 'longest_putt',
      holeNumber: 4,
      value: 8.5,
      roundIdx: 0,
    },
    {
      playerId: 'player-004',
      type: 'longest_putt',
      holeNumber: 10,
      value: 12.2,
      roundIdx: 0,
    },
    {
      playerId: 'player-002',
      type: 'nearest_to_pin',
      holeNumber: 3,
      value: 2.4,
      roundIdx: 0,
    },
    {
      playerId: 'player-006',
      type: 'nearest_to_pin',
      holeNumber: 7,
      value: 1.8,
      roundIdx: 0,
    },
    {
      playerId: 'player-d13',
      type: 'nearest_to_pin',
      holeNumber: 16,
      value: 3.2,
      roundIdx: 0,
    },
    { playerId: 'player-006', type: 'gir', holeNumber: 1, roundIdx: 0 },
    { playerId: 'player-002', type: 'gir', holeNumber: 3, roundIdx: 0 },
    { playerId: 'player-006', type: 'gir', holeNumber: 5, roundIdx: 0 },
    { playerId: 'player-004', type: 'gir', holeNumber: 6, roundIdx: 0 },
    { playerId: 'player-002', type: 'gir', holeNumber: 10, roundIdx: 0 },
    { playerId: 'player-006', type: 'gir', holeNumber: 12, roundIdx: 0 },
    { playerId: 'player-d09', type: 'gir', holeNumber: 8, roundIdx: 0 },
    { playerId: 'player-d13', type: 'gir', holeNumber: 2, roundIdx: 0 }
  )

  // Round 2 (active — scramble, partial 12 holes)
  e.push(
    { playerId: 'player-001', type: 'birdie', holeNumber: 2, roundIdx: 1 },
    { playerId: 'player-006', type: 'birdie', holeNumber: 5, roundIdx: 1 },
    { playerId: 'player-d09', type: 'birdie', holeNumber: 9, roundIdx: 1 },
    { playerId: 'player-002', type: 'birdie', holeNumber: 11, roundIdx: 1 },
    { playerId: 'player-005', type: 'snake', holeNumber: 3, roundIdx: 1 },
    { playerId: 'player-d08', type: 'snake', holeNumber: 7, roundIdx: 1 },
    { playerId: 'player-d10', type: 'snopp', holeNumber: 6, roundIdx: 1 },
    { playerId: 'player-d14', type: 'snopp', holeNumber: 10, roundIdx: 1 },
    { playerId: 'player-002', type: 'bunker_save', holeNumber: 4, roundIdx: 1 },
    {
      playerId: 'player-004',
      type: 'group_longest_drive',
      holeNumber: 2,
      roundIdx: 1,
    },
    {
      playerId: 'player-005',
      type: 'group_longest_drive',
      holeNumber: 8,
      roundIdx: 1,
    },
    {
      playerId: 'player-004',
      type: 'longest_drive_meters',
      holeNumber: 2,
      value: 270,
      roundIdx: 1,
    },
    {
      playerId: 'player-006',
      type: 'nearest_to_pin',
      holeNumber: 7,
      value: 1.1,
      roundIdx: 1,
    },
    { playerId: 'player-006', type: 'gir', holeNumber: 2, roundIdx: 1 },
    { playerId: 'player-002', type: 'gir', holeNumber: 11, roundIdx: 1 },
    { playerId: 'player-d09', type: 'gir', holeNumber: 9, roundIdx: 1 }
  )

  return e
}

function buildPortugalSideEvents(): SideEventSeed[] {
  const e: SideEventSeed[] = []

  // Round 1
  e.push(
    { playerId: 'player-006', type: 'birdie', holeNumber: 4, roundIdx: 0 },
    { playerId: 'player-002', type: 'birdie', holeNumber: 9, roundIdx: 0 },
    { playerId: 'player-d09', type: 'birdie', holeNumber: 13, roundIdx: 0 },
    { playerId: 'player-003', type: 'snake', holeNumber: 3, roundIdx: 0 },
    { playerId: 'player-005', type: 'snake', holeNumber: 8, roundIdx: 0 },
    { playerId: 'player-p01', type: 'snake', holeNumber: 15, roundIdx: 0 },
    { playerId: 'player-001', type: 'snopp', holeNumber: 6, roundIdx: 0 },
    {
      playerId: 'player-006',
      type: 'nearest_to_pin',
      holeNumber: 3,
      value: 2.1,
      roundIdx: 0,
    },
    {
      playerId: 'player-002',
      type: 'longest_drive_meters',
      holeNumber: 5,
      value: 260,
      roundIdx: 0,
    },
    { playerId: 'player-006', type: 'gir', holeNumber: 1, roundIdx: 0 },
    { playerId: 'player-d09', type: 'gir', holeNumber: 4, roundIdx: 0 }
  )

  // Round 2
  e.push(
    { playerId: 'player-001', type: 'birdie', holeNumber: 5, roundIdx: 1 },
    { playerId: 'player-006', type: 'birdie', holeNumber: 10, roundIdx: 1 },
    { playerId: 'player-004', type: 'birdie', holeNumber: 17, roundIdx: 1 },
    { playerId: 'player-006', type: 'eagle', holeNumber: 13, roundIdx: 1 },
    { playerId: 'player-p02', type: 'snake', holeNumber: 2, roundIdx: 1 },
    { playerId: 'player-003', type: 'snake', holeNumber: 11, roundIdx: 1 },
    { playerId: 'player-p02', type: 'snopp', holeNumber: 2, roundIdx: 1 },
    { playerId: 'player-003', type: 'snopp', holeNumber: 11, roundIdx: 1 },
    {
      playerId: 'player-004',
      type: 'nearest_to_pin',
      holeNumber: 6,
      value: 1.5,
      roundIdx: 1,
    },
    {
      playerId: 'player-d07',
      type: 'longest_drive_meters',
      holeNumber: 13,
      value: 272,
      roundIdx: 1,
    }
  )

  return e
}

// ---------------------------------------------------------------------------
// Penalties
// ---------------------------------------------------------------------------

interface PenaltySeed {
  playerId: string
  amount: number
  note: string
  roundIdx?: number
}

const SPAIN_PENALTIES: PenaltySeed[] = [
  {
    playerId: 'player-003',
    amount: 2,
    note: 'Threw club into bunker',
    roundIdx: 0,
  },
  {
    playerId: 'player-005',
    amount: 1,
    note: 'Phone rang on tee box',
    roundIdx: 0,
  },
  { playerId: 'player-d10', amount: 1, note: 'Hit wrong ball', roundIdx: 0 },
  { playerId: 'player-001', amount: 1, note: 'Slow play warning', roundIdx: 1 },
  {
    playerId: 'player-003',
    amount: 3,
    note: 'Drove cart onto green',
    roundIdx: 1,
  },
  {
    playerId: 'player-d14',
    amount: 2,
    note: 'Excessive complaining',
    roundIdx: 1,
  },
  {
    playerId: 'player-d08',
    amount: 1,
    note: 'Practice swing hit cart',
    roundIdx: 1,
  },
]

const PORTUGAL_PENALTIES: PenaltySeed[] = [
  { playerId: 'player-003', amount: 2, note: 'Broke rental club', roundIdx: 0 },
  { playerId: 'player-p02', amount: 1, note: 'Late to tee time', roundIdx: 1 },
  {
    playerId: 'player-001',
    amount: 1,
    note: 'Lost three balls in one hole',
    roundIdx: 1,
  },
]

// ---------------------------------------------------------------------------
// Bets
// ---------------------------------------------------------------------------

interface BetSeed {
  createdBy: string
  scope: 'round' | 'tournament'
  metricKey: 'most_points' | 'most_birdies' | 'head_to_head' | 'custom'
  customDescription?: string
  roundIdx?: number
  amount: number
  opponents: string[]
  actions: (
    | { type: 'accept'; playerId: string }
    | { type: 'reject'; playerId: string }
    | { type: 'resolve'; winnerId: string }
    | { type: 'confirmPaid'; playerId: string }
  )[]
}

const SPAIN_BETS: BetSeed[] = [
  // Bet 1: Kjartan vs Thomas, round 1, head-to-head — Thomas wins (resolved + paid)
  {
    createdBy: 'player-001',
    scope: 'round',
    metricKey: 'head_to_head',
    roundIdx: 0,
    amount: 500,
    opponents: ['player-002'],
    actions: [
      { type: 'accept', playerId: 'player-002' },
      { type: 'resolve', winnerId: 'player-002' },
      { type: 'confirmPaid', playerId: 'player-001' },
      { type: 'confirmPaid', playerId: 'player-002' },
    ],
  },
  // Bet 2: Stefan vs all, tournament most birdies — accepted, still active
  {
    createdBy: 'player-006',
    scope: 'tournament',
    metricKey: 'most_birdies',
    amount: 1000,
    opponents: ['player-001', 'player-002', 'player-004'],
    actions: [
      { type: 'accept', playerId: 'player-001' },
      { type: 'accept', playerId: 'player-002' },
      { type: 'accept', playerId: 'player-004' },
    ],
  },
  // Bet 3: Magnus vs Gunnar, round 1, head-to-head — rejected
  {
    createdBy: 'player-003',
    scope: 'round',
    metricKey: 'head_to_head',
    roundIdx: 0,
    amount: 200,
    opponents: ['player-005'],
    actions: [{ type: 'reject', playerId: 'player-005' }],
  },
  // Bet 4: Olafur vs Stefan, custom bet — Olafur wins (resolved)
  {
    createdBy: 'player-004',
    scope: 'tournament',
    metricKey: 'custom',
    customDescription: 'Fewest 3-putts across all rounds',
    amount: 750,
    opponents: ['player-006'],
    actions: [
      { type: 'accept', playerId: 'player-006' },
      { type: 'resolve', winnerId: 'player-004' },
    ],
  },
  // Bet 5: Bjorn vs Fridrik, round 2, most points — pending (round still active)
  {
    createdBy: 'player-d07',
    scope: 'round',
    metricKey: 'most_points',
    roundIdx: 1,
    amount: 300,
    opponents: ['player-d13'],
    actions: [{ type: 'accept', playerId: 'player-d13' }],
  },
  // Bet 6: Gunnar vs Magnus, tournament, head-to-head — accepted, Gunnar wins
  {
    createdBy: 'player-005',
    scope: 'tournament',
    metricKey: 'head_to_head',
    amount: 500,
    opponents: ['player-003'],
    actions: [
      { type: 'accept', playerId: 'player-003' },
      { type: 'resolve', winnerId: 'player-005' },
    ],
  },
  // Bet 7: Thomas vs Kjartan, round 2 — still pending (no accept yet)
  {
    createdBy: 'player-002',
    scope: 'round',
    metricKey: 'most_points',
    roundIdx: 1,
    amount: 400,
    opponents: ['player-001'],
    actions: [],
  },
  // Bet 8: Siggi vs Arnar, tournament — accepted, still running
  {
    createdBy: 'player-d09',
    scope: 'tournament',
    metricKey: 'head_to_head',
    amount: 600,
    opponents: ['player-d12'],
    actions: [{ type: 'accept', playerId: 'player-d12' }],
  },
]

// ---------------------------------------------------------------------------
// Portugal course data (injected via setState)
// ---------------------------------------------------------------------------

const QUINTA_DO_LAGO_HOLES: Hole[] = HOLE_PARS_PORTUGAL.map((par, i) => ({
  id: `hole-p${String(i + 1).padStart(2, '0')}`,
  courseId: COURSE_PORTUGAL,
  holeNumber: i + 1,
  par,
  strokeIndex: [7, 3, 15, 1, 11, 13, 17, 9, 5, 8, 4, 16, 2, 12, 14, 18, 6, 10][
    i
  ],
}))

// ---------------------------------------------------------------------------
// Main seed function
// ---------------------------------------------------------------------------

export function seedDemoData(): void {
  const roundsStore = useRoundsStore.getState()
  const scoringStore = useScoringStore.getState()
  const sideEventsStore = useSideEventsStore.getState()
  const feedStore = useFeedStore.getState()
  const penaltiesStore = usePenaltiesStore.getState()
  const bettingStore = useBettingStore.getState()
  const holesSpain = useCoursesStore.getState().getHolesByCourse(COURSE_SPAIN)

  // -----------------------------------------------------------------------
  // 0. Add countries, past tournament, extra players, and Portugal course
  // -----------------------------------------------------------------------

  // Add countries
  const countriesStore = useCountriesStore.getState()
  const spain = countriesStore.addCountry('Spain')
  const portugal = countriesStore.addCountry('Portugal')

  // Set country on active tournament (Spain 2026)
  useTournamentStore.getState().updateTournament(T1, {
    countryId: spain?.id,
  })

  // Add Portugal 2025 tournament
  const pastTournament: Tournament = {
    id: T2,
    name: 'Portugal 2025',
    location: 'Vilamoura, Portugal',
    countryId: portugal?.id,
    startDate: '2025-09-10',
    endDate: '2025-09-14',
    status: 'done',
    createdByUserId: 'test-admin-001',
    createdAt: '2025-08-01T10:00:00Z',
  }
  useTournamentStore.setState((s) => ({
    tournaments: [...s.tournaments, pastTournament],
  }))

  // Add extra players for Spain 2026 (players 7-14)
  const extraSpainPlayers: Player[] = SPAIN_PLAYERS.slice(6).map((p) => ({
    id: p.id,
    tournamentId: T1,
    userId: p.userId,
    displayName: p.name,
    nickname: p.nickname,
    email: p.email,
    groupHandicap: p.handicap,
    active: true,
    createdAt: '2026-02-01T10:00:00Z',
  }))

  // Add Portugal-only players
  const portugalPlayers: Player[] = [
    ...PORTUGAL_PLAYER_IDS.filter(
      (id) => !SPAIN_PLAYERS.find((p) => p.id === id)
    ).map((id) => {
      const def = PORTUGAL_ONLY_PLAYERS.find((p) => p.id === id)!
      return {
        id: def.id,
        tournamentId: T2,
        userId: def.userId,
        displayName: def.name,
        nickname: def.nickname,
        email: def.email,
        groupHandicap: def.handicap,
        active: true,
        createdAt: '2025-08-15T10:00:00Z',
      } as Player
    }),
    // Also add cross-tournament player records for Portugal
    ...PORTUGAL_PLAYER_IDS.filter((id) =>
      SPAIN_PLAYERS.find((p) => p.id === id)
    ).map((id) => {
      const sp = SPAIN_PLAYERS.find((p) => p.id === id)!
      return {
        id: `${id}-pt`,
        tournamentId: T2,
        userId: sp.userId,
        displayName: sp.name,
        nickname: sp.nickname,
        email: sp.email,
        groupHandicap: PORTUGAL_HANDICAPS[id],
        active: true,
        createdAt: '2025-08-15T10:00:00Z',
      } as Player
    }),
  ]

  usePlayersStore.setState((s) => ({
    players: [...s.players, ...extraSpainPlayers, ...portugalPlayers],
  }))

  // Add Portugal course
  const portugueseCourse: Course = {
    id: COURSE_PORTUGAL,
    tournamentId: T2,
    name: 'Quinta do Lago South',
    source: 'csv',
    createdAt: '2025-08-20T10:00:00Z',
  }
  useCoursesStore.setState((s) => ({
    courses: [...s.courses, portugueseCourse],
    holes: [...s.holes, ...QUINTA_DO_LAGO_HOLES],
  }))

  // -----------------------------------------------------------------------
  // 1. Spain 2026 — Rounds + Scorecards
  // -----------------------------------------------------------------------

  const spainRoundIds: string[] = []
  const spainPlayerIds = SPAIN_PLAYERS.map((p) => p.id)

  for (let ri = 0; ri < SPAIN_ROUNDS.length; ri++) {
    const def = SPAIN_ROUNDS[ri]

    const round = roundsStore.createRound(T1, {
      courseId: COURSE_SPAIN,
      name: def.name,
      dateTime: def.dateTime,
      format: def.format,
      holesPlayed: 18,
      groups: def.groups,
    })
    spainRoundIds.push(round.id)

    // Add teams for scramble round
    if (def.teams && def.teams.length > 0) {
      roundsStore.addTeamsToRound(round.id, def.teams)
    }

    if (def.status === 'completed') {
      roundsStore.setRoundStatus(round.id, 'active')
      roundsStore.setRoundStatus(round.id, 'completed')

      // Full scorecards for all players
      for (let pi = 0; pi < spainPlayerIds.length; pi++) {
        const playerId = spainPlayerIds[pi]
        const hcp = SPAIN_HANDICAPS[playerId]
        const scores = getScoresSpain(pi, ri)
        const scorecard = scoringStore.createScorecard(round.id, 18, playerId)

        for (let hi = 0; hi < 18; hi++) {
          scoringStore.setHoleStroke(
            scorecard.id,
            hi,
            scores[hi],
            holesSpain,
            hcp,
            def.format
          )
        }
      }

      scoringStore.recalculatePoints(round.id, def.format)

      feedStore.addEvent({
        tournamentId: T1,
        type: 'round_completed',
        message: `${def.name} completed`,
        roundId: round.id,
      })
    } else if (def.status === 'active') {
      roundsStore.setRoundStatus(round.id, 'active')

      if (def.format === 'scramble' && def.teams) {
        // For scramble: create team scorecards with partial scores
        const teams = roundsStore.getTeamsByRound(round.id)
        for (let ti = 0; ti < teams.length; ti++) {
          const team = teams[ti]
          // Use first player in team for handicap average
          const avgHcp = Math.round(
            team.playerIds.reduce(
              (sum, pid) => sum + (SPAIN_HANDICAPS[pid] ?? 18),
              0
            ) / team.playerIds.length
          )
          const scores = generateScores(
            avgHcp,
            (ti + 1) * 173 + 41,
            HOLE_PARS_SPAIN
          )
          const scorecard = scoringStore.createScorecard(
            round.id,
            18,
            undefined,
            team.id
          )

          // Only score first `holesScored` holes
          const holesCount = def.holesScored ?? 18
          for (let hi = 0; hi < holesCount; hi++) {
            scoringStore.setHoleStroke(
              scorecard.id,
              hi,
              scores[hi],
              holesSpain,
              avgHcp,
              def.format
            )
          }
        }
      } else {
        // Individual scorecards with partial scores
        const holesCount = def.holesScored ?? 18
        for (let pi = 0; pi < spainPlayerIds.length; pi++) {
          const playerId = spainPlayerIds[pi]
          const hcp = SPAIN_HANDICAPS[playerId]
          const scores = getScoresSpain(pi, ri)
          const scorecard = scoringStore.createScorecard(round.id, 18, playerId)

          for (let hi = 0; hi < holesCount; hi++) {
            scoringStore.setHoleStroke(
              scorecard.id,
              hi,
              scores[hi],
              holesSpain,
              hcp,
              def.format
            )
          }
        }
      }

      feedStore.addEvent({
        tournamentId: T1,
        type: 'round_started',
        message: `${def.name} is underway!`,
        roundId: round.id,
      })
    }
    // upcoming rounds — no scorecards needed
  }

  // -----------------------------------------------------------------------
  // 2. Portugal 2025 — Rounds + Scorecards
  // -----------------------------------------------------------------------

  const portuguesePlayers = usePlayersStore.getState().getActivePlayers(T2)
  const portugalRoundIds: string[] = []

  for (let ri = 0; ri < PORTUGAL_ROUNDS.length; ri++) {
    const def = PORTUGAL_ROUNDS[ri]

    // Remap player IDs for Portugal: use the "-pt" variant for cross-tournament players
    const ptGroups = def.groups.map((g) => ({
      ...g,
      playerIds: g.playerIds.map((pid) => {
        if (SPAIN_PLAYERS.find((p) => p.id === pid)) {
          return `${pid}-pt`
        }
        return pid
      }),
    }))

    const round = roundsStore.createRound(T2, {
      courseId: COURSE_PORTUGAL,
      name: def.name,
      dateTime: def.dateTime,
      format: def.format,
      holesPlayed: 18,
      groups: ptGroups,
    })
    portugalRoundIds.push(round.id)

    roundsStore.setRoundStatus(round.id, 'active')
    roundsStore.setRoundStatus(round.id, 'completed')

    // Score all Portugal players
    for (let pi = 0; pi < portuguesePlayers.length; pi++) {
      const player = portuguesePlayers[pi]
      const hcp =
        PORTUGAL_HANDICAPS[player.id.replace('-pt', '')] ?? player.groupHandicap
      const scores = getScoresPortugal(pi, ri)
      const scorecard = scoringStore.createScorecard(round.id, 18, player.id)

      for (let hi = 0; hi < 18; hi++) {
        scoringStore.setHoleStroke(
          scorecard.id,
          hi,
          scores[hi],
          QUINTA_DO_LAGO_HOLES,
          hcp,
          def.format
        )
      }
    }

    scoringStore.recalculatePoints(round.id, def.format)
  }

  // -----------------------------------------------------------------------
  // 3. Side events — Spain
  // -----------------------------------------------------------------------
  const spainSideEvents = buildSpainSideEvents()
  let baseTime = new Date('2026-06-16T09:00:00Z').getTime()

  for (const se of spainSideEvents) {
    const originalNow = Date.now
    baseTime += 60_000 * (se.holeNumber ?? 1)
    Date.now = () => baseTime

    sideEventsStore.logEvent({
      tournamentId: T1,
      roundId: spainRoundIds[se.roundIdx],
      holeNumber: se.holeNumber,
      playerId: se.playerId,
      type: se.type as Parameters<typeof sideEventsStore.logEvent>[0]['type'],
      value: se.value,
      createdByPlayerId: se.playerId,
    })

    Date.now = originalNow
  }

  // -----------------------------------------------------------------------
  // 3b. Side events — Portugal
  // -----------------------------------------------------------------------
  const portugalSideEvents = buildPortugalSideEvents()
  let ptBaseTime = new Date('2025-09-10T09:00:00Z').getTime()

  for (const se of portugalSideEvents) {
    const originalNow = Date.now
    ptBaseTime += 60_000 * (se.holeNumber ?? 1)
    Date.now = () => ptBaseTime

    // Map player IDs to Portugal "-pt" variants
    const playerId = SPAIN_PLAYERS.find((p) => p.id === se.playerId)
      ? `${se.playerId}-pt`
      : se.playerId

    sideEventsStore.logEvent({
      tournamentId: T2,
      roundId: portugalRoundIds[se.roundIdx],
      holeNumber: se.holeNumber,
      playerId,
      type: se.type as Parameters<typeof sideEventsStore.logEvent>[0]['type'],
      value: se.value,
      createdByPlayerId: playerId,
    })

    Date.now = originalNow
  }

  // -----------------------------------------------------------------------
  // 4. Penalties — Spain
  // -----------------------------------------------------------------------
  for (const ps of SPAIN_PENALTIES) {
    penaltiesStore.addPenalty({
      tournamentId: T1,
      playerId: ps.playerId,
      amount: ps.amount,
      note: ps.note,
      roundId: ps.roundIdx != null ? spainRoundIds[ps.roundIdx] : undefined,
    })
  }

  // Penalties — Portugal
  for (const ps of PORTUGAL_PENALTIES) {
    const playerId = SPAIN_PLAYERS.find((p) => p.id === ps.playerId)
      ? `${ps.playerId}-pt`
      : ps.playerId
    penaltiesStore.addPenalty({
      tournamentId: T2,
      playerId,
      amount: ps.amount,
      note: ps.note,
      roundId: ps.roundIdx != null ? portugalRoundIds[ps.roundIdx] : undefined,
    })
  }

  // -----------------------------------------------------------------------
  // 5. Bets — Spain
  // -----------------------------------------------------------------------
  for (const bs of SPAIN_BETS) {
    const bet = bettingStore.createBet({
      tournamentId: T1,
      createdByPlayerId: bs.createdBy,
      scope: bs.scope,
      metricKey: bs.metricKey,
      customDescription: bs.customDescription,
      roundId: bs.roundIdx != null ? spainRoundIds[bs.roundIdx] : undefined,
      amount: bs.amount,
      opponentIds: bs.opponents,
    })

    for (const action of bs.actions) {
      if (action.type === 'accept') {
        bettingStore.acceptBet(bet.id, action.playerId)
      } else if (action.type === 'reject') {
        bettingStore.rejectBet(bet.id, action.playerId)
      } else if (action.type === 'resolve') {
        bettingStore.resolveBet(bet.id, action.winnerId)
      } else if (action.type === 'confirmPaid') {
        bettingStore.confirmPaid(bet.id, action.playerId)
      }
    }
  }

  // -----------------------------------------------------------------------
  // 6. Feed events + Announcements — Spain
  // -----------------------------------------------------------------------

  feedStore.addEvent({
    tournamentId: T1,
    type: 'tournament_update',
    message: 'Welcome to Spain 2026! Tournament is live. Good luck everyone.',
  })

  feedStore.addEvent({
    tournamentId: T1,
    type: 'side_event',
    message: 'Stefan — EAGLE on hole 8! Incredible shot.',
    playerId: 'player-006',
    roundId: spainRoundIds[0],
  })

  feedStore.addEvent({
    tournamentId: T1,
    type: 'score_entered',
    message: 'All Round 1 scores submitted. Points updated.',
    roundId: spainRoundIds[0],
  })

  feedStore.addEvent({
    tournamentId: T1,
    type: 'tournament_update',
    message: 'Magnus — PENALTY: Drove cart onto green (+3)',
    playerId: 'player-003',
    roundId: spainRoundIds[1],
  })

  feedStore.addEvent({
    tournamentId: T1,
    type: 'handicap_changed',
    message: 'Helgi handicap changed: 28 → 30',
    playerId: 'player-d10',
  })

  // Admin announcements
  feedStore.addAnnouncement({
    tournamentId: T1,
    createdByUserId: 'test-admin-001',
    message:
      'Dinner tonight at 8pm at the clubhouse restaurant. Dress code: smart casual.',
  })

  feedStore.addAnnouncement({
    tournamentId: T1,
    createdByUserId: 'test-admin-001',
    message:
      'Reminder: tee times for Round 2 start at 08:30. Be at the range by 07:45.',
  })

  // Feed events — Portugal (for past tournament browsing)
  feedStore.addEvent({
    tournamentId: T2,
    type: 'tournament_update',
    message: 'Welcome to Portugal 2025! Great weather expected.',
  })

  feedStore.addEvent({
    tournamentId: T2,
    type: 'round_completed',
    message: 'Round 1 completed at Quinta do Lago.',
    roundId: portugalRoundIds[0],
  })

  feedStore.addEvent({
    tournamentId: T2,
    type: 'side_event',
    message: 'Stefan — EAGLE on hole 13! What a finish!',
    playerId: 'player-006-pt',
    roundId: portugalRoundIds[1],
  })

  feedStore.addEvent({
    tournamentId: T2,
    type: 'round_completed',
    message: 'Round 2 completed. Final standings updated. See you next year!',
    roundId: portugalRoundIds[1],
  })

  feedStore.addEvent({
    tournamentId: T2,
    type: 'points_calculated',
    message: 'Final points calculated. Stefan wins Portugal 2025!',
  })
}

// ---------------------------------------------------------------------------
// Clear function
// ---------------------------------------------------------------------------

export function clearDemoData(): void {
  // Reset stores to empty arrays. Base tournament, 6 players, and course
  // are baked into the store initial state and are NOT affected.
  useRoundsStore.setState({ rounds: [], groups: [], teams: [] })
  useScoringStore.setState({ scorecards: [], roundPoints: [] })
  useSideEventsStore.setState({ events: [], images: [] })
  useFeedStore.setState({ events: [], announcements: [], notableEvents: [] })
  usePenaltiesStore.setState({ entries: [] })
  useBettingStore.setState({ bets: [], participants: [] })

  // Remove the past tournament (keep only Spain 2026)
  useTournamentStore.setState((s) => ({
    tournaments: s.tournaments.filter((t) => t.id === 'tournament-001'),
    activeTournamentId: 'tournament-001',
  }))

  // Remove extra players (keep only the original 6 for tournament-001)
  const originalPlayerIds = [
    'player-001',
    'player-002',
    'player-003',
    'player-004',
    'player-005',
    'player-006',
  ]
  usePlayersStore.setState((s) => ({
    players: s.players.filter((p) => originalPlayerIds.includes(p.id)),
    invites: s.invites.filter((i) => i.tournamentId === 'tournament-001'),
  }))

  // Remove Portugal course
  useCoursesStore.setState((s) => ({
    courses: s.courses.filter((c) => c.id === 'course-001'),
    holes: s.holes.filter((h) => h.courseId === 'course-001'),
  }))

  // Clear countries
  useCountriesStore.setState({ countries: [] })
}

// ---------------------------------------------------------------------------
// Check if demo data is seeded
// ---------------------------------------------------------------------------

export function isDemoSeeded(): boolean {
  return useRoundsStore.getState().rounds.length > 0
}
