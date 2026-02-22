/**
 * Demo data seed — populates all stores with realistic tournament data.
 *
 * seedDemoData()  → creates 3 completed rounds, scorecards, side events,
 *                   penalties, bets (various states), and feed events.
 * clearDemoData() → resets every store to its initial state (keeps base
 *                   tournament, players, course).
 * isDemoSeeded()  → returns true if rounds already exist (simple check).
 */

import { useRoundsStore } from '@/features/rounds'
import { useScoringStore } from '@/features/scoring'
import { useSideEventsStore } from '@/features/side-events'
import { useFeedStore } from '@/features/feed'
import { usePenaltiesStore } from '@/features/penalties'
import { useBettingStore } from '@/features/betting'
import { useCoursesStore } from '@/features/courses'
import type { RoundFormat } from '@/features/rounds'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const T = 'tournament-001'
const COURSE = 'course-001'
const PLAYER_IDS = [
  'player-001', // Kjartan (hcp 18)
  'player-002', // Thomas  (hcp 12)
  'player-003', // Magnus  (hcp 24)
  'player-004', // Olafur  (hcp 15)
  'player-005', // Gunnar  (hcp 20)
  'player-006', // Stefan  (hcp 8)
]

const PLAYER_HANDICAPS: Record<string, number> = {
  'player-001': 18,
  'player-002': 12,
  'player-003': 24,
  'player-004': 15,
  'player-005': 20,
  'player-006': 8,
}

// Par for each hole of Los Naranjos (used to generate realistic scores)
const HOLE_PARS = [4, 5, 3, 4, 4, 4, 3, 5, 4, 4, 5, 3, 4, 4, 4, 3, 5, 4]

// ---------------------------------------------------------------------------
// Realistic score generation
// ---------------------------------------------------------------------------

/**
 * Generate an 18-hole scorecard for a player.
 * Base strokes = par + random offset influenced by handicap.
 * Lower handicap → plays closer to par on average.
 */
function generateScores(handicap: number, seed: number): (number | null)[] {
  // Deterministic pseudo-random from seed
  let s = seed
  const rand = () => {
    s = (s * 16807 + 12345) % 2147483647
    return (s & 0x7fffffff) / 0x7fffffff
  }

  return HOLE_PARS.map((par) => {
    const r = rand()
    // Higher handicap → more likely to go over par
    const avgOver = handicap / 18 // e.g. hcp 18 → avg +1 per hole
    let strokes: number

    if (r < 0.02) {
      // ~2% eagle (2 under par)
      strokes = par - 2
    } else if (r < 0.12) {
      // ~10% birdie
      strokes = par - 1
    } else if (r < 0.35) {
      // ~23% par
      strokes = par
    } else if (r < 0.65) {
      // ~30% bogey
      strokes = par + 1
    } else if (r < 0.85) {
      // ~20% double bogey
      strokes = par + 2
    } else {
      // ~15% triple or worse
      strokes = par + Math.ceil(avgOver * 2 * rand()) + 1
    }

    // Ensure minimum 1 stroke
    return Math.max(1, strokes)
  })
}

// Pre-generated scores per player per round (seed = playerIdx * 100 + roundIdx)
function getScores(playerIdx: number, roundIdx: number): (number | null)[] {
  const hcp = Object.values(PLAYER_HANDICAPS)[playerIdx]
  return generateScores(hcp, (playerIdx + 1) * 137 + (roundIdx + 1) * 31)
}

// ---------------------------------------------------------------------------
// Round definitions
// ---------------------------------------------------------------------------

interface RoundDef {
  name: string
  format: RoundFormat
  dateTime: string
  groups: { name: string; playerIds: string[] }[]
}

const ROUND_DEFS: RoundDef[] = [
  {
    name: 'Round 1 — Los Naranjos',
    format: 'handicap',
    dateTime: '2026-03-10T08:00:00Z',
    groups: [
      {
        name: 'Group A',
        playerIds: ['player-001', 'player-002', 'player-003'],
      },
      {
        name: 'Group B',
        playerIds: ['player-004', 'player-005', 'player-006'],
      },
    ],
  },
  {
    name: 'Round 2 — Los Naranjos',
    format: 'stableford',
    dateTime: '2026-03-11T08:30:00Z',
    groups: [
      {
        name: 'Group A',
        playerIds: ['player-001', 'player-004', 'player-006'],
      },
      {
        name: 'Group B',
        playerIds: ['player-002', 'player-003', 'player-005'],
      },
    ],
  },
  {
    name: 'Round 3 — Los Naranjos',
    format: 'handicap',
    dateTime: '2026-03-12T09:00:00Z',
    groups: [
      {
        name: 'Group A',
        playerIds: ['player-001', 'player-005', 'player-002'],
      },
      {
        name: 'Group B',
        playerIds: ['player-003', 'player-004', 'player-006'],
      },
    ],
  },
]

// ---------------------------------------------------------------------------
// Side event generation helpers
// ---------------------------------------------------------------------------

interface SideEventSeed {
  playerId: string
  type: string
  holeNumber?: number
  value?: number
  roundIdx: number
}

function buildSideEvents(): SideEventSeed[] {
  const events: SideEventSeed[] = []

  // Round 1 events
  events.push(
    { playerId: 'player-006', type: 'birdie', holeNumber: 3, roundIdx: 0 },
    { playerId: 'player-002', type: 'birdie', holeNumber: 7, roundIdx: 0 },
    { playerId: 'player-001', type: 'birdie', holeNumber: 12, roundIdx: 0 },
    { playerId: 'player-006', type: 'birdie', holeNumber: 16, roundIdx: 0 },
    { playerId: 'player-006', type: 'eagle', holeNumber: 8, roundIdx: 0 },
    { playerId: 'player-003', type: 'snake', holeNumber: 2, roundIdx: 0 },
    { playerId: 'player-005', type: 'snake', holeNumber: 5, roundIdx: 0 },
    { playerId: 'player-001', type: 'snake', holeNumber: 14, roundIdx: 0 },
    { playerId: 'player-003', type: 'snake', holeNumber: 18, roundIdx: 0 },
    { playerId: 'player-003', type: 'snopp', holeNumber: 5, roundIdx: 0 },
    { playerId: 'player-005', type: 'snopp', holeNumber: 9, roundIdx: 0 },
    { playerId: 'player-001', type: 'snopp', holeNumber: 14, roundIdx: 0 },
    { playerId: 'player-004', type: 'bunker_save', holeNumber: 6, roundIdx: 0 },
    {
      playerId: 'player-006',
      type: 'bunker_save',
      holeNumber: 11,
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
    { playerId: 'player-006', type: 'gir', holeNumber: 1, roundIdx: 0 },
    { playerId: 'player-002', type: 'gir', holeNumber: 3, roundIdx: 0 },
    { playerId: 'player-006', type: 'gir', holeNumber: 5, roundIdx: 0 },
    { playerId: 'player-004', type: 'gir', holeNumber: 6, roundIdx: 0 },
    { playerId: 'player-002', type: 'gir', holeNumber: 10, roundIdx: 0 },
    { playerId: 'player-006', type: 'gir', holeNumber: 12, roundIdx: 0 }
  )

  // Round 2 events
  events.push(
    { playerId: 'player-001', type: 'birdie', holeNumber: 2, roundIdx: 1 },
    { playerId: 'player-004', type: 'birdie', holeNumber: 5, roundIdx: 1 },
    { playerId: 'player-006', type: 'birdie', holeNumber: 9, roundIdx: 1 },
    { playerId: 'player-002', type: 'birdie', holeNumber: 11, roundIdx: 1 },
    { playerId: 'player-006', type: 'birdie', holeNumber: 15, roundIdx: 1 },
    { playerId: 'player-005', type: 'snake', holeNumber: 3, roundIdx: 1 },
    { playerId: 'player-001', type: 'snake', holeNumber: 6, roundIdx: 1 },
    { playerId: 'player-003', type: 'snake', holeNumber: 10, roundIdx: 1 },
    { playerId: 'player-005', type: 'snake', holeNumber: 15, roundIdx: 1 },
    { playerId: 'player-005', type: 'snopp', holeNumber: 3, roundIdx: 1 },
    { playerId: 'player-003', type: 'snopp', holeNumber: 7, roundIdx: 1 },
    { playerId: 'player-001', type: 'snopp', holeNumber: 11, roundIdx: 1 },
    { playerId: 'player-003', type: 'snopp', holeNumber: 16, roundIdx: 1 },
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
      holeNumber: 11,
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
      playerId: 'player-001',
      type: 'longest_drive_meters',
      holeNumber: 11,
      value: 248,
      roundIdx: 1,
    },
    {
      playerId: 'player-006',
      type: 'longest_putt',
      holeNumber: 9,
      value: 14.5,
      roundIdx: 1,
    },
    {
      playerId: 'player-002',
      type: 'longest_putt',
      holeNumber: 15,
      value: 7.3,
      roundIdx: 1,
    },
    {
      playerId: 'player-001',
      type: 'nearest_to_pin',
      holeNumber: 7,
      value: 3.1,
      roundIdx: 1,
    },
    {
      playerId: 'player-004',
      type: 'nearest_to_pin',
      holeNumber: 16,
      value: 1.2,
      roundIdx: 1,
    },
    { playerId: 'player-006', type: 'gir', holeNumber: 2, roundIdx: 1 },
    { playerId: 'player-004', type: 'gir', holeNumber: 4, roundIdx: 1 },
    { playerId: 'player-006', type: 'gir', holeNumber: 9, roundIdx: 1 },
    { playerId: 'player-002', type: 'gir', holeNumber: 11, roundIdx: 1 },
    { playerId: 'player-001', type: 'gir', holeNumber: 13, roundIdx: 1 }
  )

  // Round 3 events
  events.push(
    { playerId: 'player-002', type: 'birdie', holeNumber: 1, roundIdx: 2 },
    { playerId: 'player-006', type: 'birdie', holeNumber: 4, roundIdx: 2 },
    { playerId: 'player-001', type: 'birdie', holeNumber: 8, roundIdx: 2 },
    { playerId: 'player-004', type: 'birdie', holeNumber: 12, roundIdx: 2 },
    { playerId: 'player-006', type: 'birdie', holeNumber: 14, roundIdx: 2 },
    { playerId: 'player-002', type: 'birdie', holeNumber: 17, roundIdx: 2 },
    { playerId: 'player-006', type: 'eagle', holeNumber: 11, roundIdx: 2 },
    { playerId: 'player-001', type: 'snake', holeNumber: 3, roundIdx: 2 },
    { playerId: 'player-003', type: 'snake', holeNumber: 7, roundIdx: 2 },
    { playerId: 'player-005', type: 'snake', holeNumber: 9, roundIdx: 2 },
    { playerId: 'player-003', type: 'snake', holeNumber: 13, roundIdx: 2 },
    { playerId: 'player-001', type: 'snake', holeNumber: 17, roundIdx: 2 },
    { playerId: 'player-003', type: 'snopp', holeNumber: 7, roundIdx: 2 },
    { playerId: 'player-005', type: 'snopp', holeNumber: 9, roundIdx: 2 },
    { playerId: 'player-001', type: 'snopp', holeNumber: 17, roundIdx: 2 },
    { playerId: 'player-006', type: 'bunker_save', holeNumber: 3, roundIdx: 2 },
    {
      playerId: 'player-002',
      type: 'bunker_save',
      holeNumber: 10,
      roundIdx: 2,
    },
    {
      playerId: 'player-006',
      type: 'group_longest_drive',
      holeNumber: 2,
      roundIdx: 2,
    },
    {
      playerId: 'player-001',
      type: 'group_longest_drive',
      holeNumber: 8,
      roundIdx: 2,
    },
    {
      playerId: 'player-006',
      type: 'longest_drive_meters',
      holeNumber: 2,
      value: 285,
      roundIdx: 2,
    },
    {
      playerId: 'player-002',
      type: 'longest_drive_meters',
      holeNumber: 8,
      value: 258,
      roundIdx: 2,
    },
    {
      playerId: 'player-001',
      type: 'longest_putt',
      holeNumber: 8,
      value: 10.0,
      roundIdx: 2,
    },
    {
      playerId: 'player-003',
      type: 'longest_putt',
      holeNumber: 14,
      value: 6.5,
      roundIdx: 2,
    },
    {
      playerId: 'player-006',
      type: 'nearest_to_pin',
      holeNumber: 3,
      value: 0.9,
      roundIdx: 2,
    },
    {
      playerId: 'player-002',
      type: 'nearest_to_pin',
      holeNumber: 12,
      value: 3.6,
      roundIdx: 2,
    },
    { playerId: 'player-006', type: 'gir', holeNumber: 1, roundIdx: 2 },
    { playerId: 'player-002', type: 'gir', holeNumber: 4, roundIdx: 2 },
    { playerId: 'player-006', type: 'gir', holeNumber: 8, roundIdx: 2 },
    { playerId: 'player-004', type: 'gir', holeNumber: 12, roundIdx: 2 },
    { playerId: 'player-006', type: 'gir', holeNumber: 14, roundIdx: 2 },
    { playerId: 'player-002', type: 'gir', holeNumber: 17, roundIdx: 2 }
  )

  return events
}

// ---------------------------------------------------------------------------
// Penalty seeds
// ---------------------------------------------------------------------------

interface PenaltySeed {
  playerId: string
  amount: number
  note: string
  roundIdx?: number
}

const PENALTY_SEEDS: PenaltySeed[] = [
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
  {
    playerId: 'player-001',
    amount: 1,
    note: 'Slow play warning',
    roundIdx: 1,
  },
  {
    playerId: 'player-003',
    amount: 3,
    note: 'Drove cart onto green',
    roundIdx: 1,
  },
  {
    playerId: 'player-005',
    amount: 1,
    note: 'Wrong ball played',
    roundIdx: 2,
  },
  {
    playerId: 'player-003',
    amount: 2,
    note: 'Excessive swearing',
    roundIdx: 2,
  },
  { playerId: 'player-001', amount: 1, note: 'Late to tee time', roundIdx: 2 },
]

// ---------------------------------------------------------------------------
// Bet seeds
// ---------------------------------------------------------------------------

interface BetSeed {
  createdBy: string
  scope: 'round' | 'tournament'
  metricKey: 'most_points' | 'most_birdies' | 'head_to_head' | 'custom'
  customDescription?: string
  roundIdx?: number
  amount: number
  opponents: string[]
  /** After creation: accept, reject, resolve */
  actions: (
    | { type: 'accept'; playerId: string }
    | { type: 'reject'; playerId: string }
    | { type: 'resolve'; winnerId: string }
  )[]
}

const BET_SEEDS: BetSeed[] = [
  // Bet 1: Kjartan vs Thomas, round 1, head-to-head — Thomas wins (resolved)
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
  // Bet 3: Magnus vs Gunnar, round 2, head-to-head — rejected
  {
    createdBy: 'player-003',
    scope: 'round',
    metricKey: 'head_to_head',
    roundIdx: 1,
    amount: 200,
    opponents: ['player-005'],
    actions: [{ type: 'reject', playerId: 'player-005' }],
  },
  // Bet 4: Olafur vs Stefan, custom bet — accepted, Olafur wins
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
  // Bet 5: Thomas vs Kjartan, round 3, most points — still pending
  {
    createdBy: 'player-002',
    scope: 'round',
    metricKey: 'most_points',
    roundIdx: 2,
    amount: 300,
    opponents: ['player-001'],
    actions: [],
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
]

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

  // Get holes for the course (needed for setHoleStroke)
  const holes = useCoursesStore.getState().getHolesByCourse(COURSE)

  // Track created round IDs
  const roundIds: string[] = []

  // -----------------------------------------------------------------------
  // 1. Create rounds + scorecards + scores + points
  // -----------------------------------------------------------------------
  for (let ri = 0; ri < ROUND_DEFS.length; ri++) {
    const def = ROUND_DEFS[ri]

    // Create round
    const round = roundsStore.createRound(T, {
      courseId: COURSE,
      name: def.name,
      dateTime: def.dateTime,
      format: def.format,
      holesPlayed: 18,
      groups: def.groups,
    })
    roundIds.push(round.id)

    // Move to completed
    roundsStore.setRoundStatus(round.id, 'active')
    roundsStore.setRoundStatus(round.id, 'completed')

    // Create scorecards and enter scores for each player
    for (let pi = 0; pi < PLAYER_IDS.length; pi++) {
      const playerId = PLAYER_IDS[pi]
      const hcp = PLAYER_HANDICAPS[playerId]
      const scores = getScores(pi, ri)

      const scorecard = scoringStore.createScorecard(round.id, 18, playerId)

      // Enter each hole
      for (let hi = 0; hi < 18; hi++) {
        scoringStore.setHoleStroke(
          scorecard.id,
          hi,
          scores[hi],
          holes,
          hcp,
          def.format
        )
      }
    }

    // Recalculate points for this round
    scoringStore.recalculatePoints(round.id, def.format)

    // Feed event: round completed
    feedStore.addEvent({
      tournamentId: T,
      type: 'round_completed',
      message: `${def.name} completed`,
      roundId: round.id,
    })
  }

  // -----------------------------------------------------------------------
  // 2. Side events
  // -----------------------------------------------------------------------
  const sideEventSeeds = buildSideEvents()

  // We need to stagger timestamps so "last snake" logic works
  let baseTime = new Date('2026-03-10T09:00:00Z').getTime()

  for (const se of sideEventSeeds) {
    // Temporarily override Date.now to get deterministic timestamps
    const originalNow = Date.now
    baseTime += 60_000 * (se.holeNumber ?? 1) // advance by holeNumber minutes
    Date.now = () => baseTime

    sideEventsStore.logEvent({
      tournamentId: T,
      roundId: roundIds[se.roundIdx],
      holeNumber: se.holeNumber,
      playerId: se.playerId,
      type: se.type as Parameters<typeof sideEventsStore.logEvent>[0]['type'],
      value: se.value,
      createdByPlayerId: se.playerId,
    })

    Date.now = originalNow
  }

  // Feed events for notable side events
  feedStore.addEvent({
    tournamentId: T,
    type: 'side_event',
    message: 'Stefan — EAGLE on 8! Incredible shot.',
    playerId: 'player-006',
    roundId: roundIds[0],
  })
  feedStore.addEvent({
    tournamentId: T,
    type: 'side_event',
    message: 'Stefan — EAGLE on 11! He is on fire!',
    playerId: 'player-006',
    roundId: roundIds[2],
  })

  // -----------------------------------------------------------------------
  // 3. Penalties
  // -----------------------------------------------------------------------
  for (const ps of PENALTY_SEEDS) {
    penaltiesStore.addPenalty({
      tournamentId: T,
      playerId: ps.playerId,
      amount: ps.amount,
      note: ps.note,
      roundId: ps.roundIdx != null ? roundIds[ps.roundIdx] : undefined,
    })
  }

  // Feed event for notable penalty
  feedStore.addEvent({
    tournamentId: T,
    type: 'tournament_update',
    message: 'Magnus — PENALTY: Drove cart onto green (+3)',
    playerId: 'player-003',
    roundId: roundIds[1],
  })

  // -----------------------------------------------------------------------
  // 4. Bets
  // -----------------------------------------------------------------------
  for (const bs of BET_SEEDS) {
    const bet = bettingStore.createBet({
      tournamentId: T,
      createdByPlayerId: bs.createdBy,
      scope: bs.scope,
      metricKey: bs.metricKey,
      customDescription: bs.customDescription,
      roundId: bs.roundIdx != null ? roundIds[bs.roundIdx] : undefined,
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
      }
    }
  }

  // -----------------------------------------------------------------------
  // 5. Extra feed events for flavor
  // -----------------------------------------------------------------------
  feedStore.addEvent({
    tournamentId: T,
    type: 'tournament_update',
    message: 'Tournament underway! Good luck everyone.',
  })
  feedStore.addEvent({
    tournamentId: T,
    type: 'score_entered',
    message: 'All Round 1 scores submitted',
    roundId: roundIds[0],
  })
  feedStore.addEvent({
    tournamentId: T,
    type: 'score_entered',
    message: 'All Round 2 scores submitted',
    roundId: roundIds[1],
  })
  feedStore.addEvent({
    tournamentId: T,
    type: 'score_entered',
    message: 'All Round 3 scores submitted — final standings updated',
    roundId: roundIds[2],
  })
  feedStore.addEvent({
    tournamentId: T,
    type: 'points_calculated',
    message: 'Points recalculated after all rounds',
  })
}

// ---------------------------------------------------------------------------
// Clear function
// ---------------------------------------------------------------------------

export function clearDemoData(): void {
  // Reset each store to empty arrays. The base tournament, players, and
  // course are baked into the store initial state and are NOT affected.
  useRoundsStore.setState({ rounds: [], groups: [], teams: [] })
  useScoringStore.setState({ scorecards: [], roundPoints: [] })
  useSideEventsStore.setState({ events: [], images: [] })
  useFeedStore.setState({ events: [] })
  usePenaltiesStore.setState({ entries: [] })
  useBettingStore.setState({ bets: [], participants: [] })
}

// ---------------------------------------------------------------------------
// Check if demo data is seeded
// ---------------------------------------------------------------------------

export function isDemoSeeded(): boolean {
  return useRoundsStore.getState().rounds.length > 0
}
