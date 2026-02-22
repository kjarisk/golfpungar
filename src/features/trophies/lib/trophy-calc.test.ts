/// <reference types="vitest/globals" />
import { computeTrophyStandings } from './trophy-calc'
import type { TrophyComputeInput } from './trophy-calc'
import type { RoundPoints, Scorecard } from '@/features/scoring'
import type { SideEventTotals } from '@/features/side-events'
import type { PenaltyTotals } from '@/features/penalties'
import type { BettingTotals } from '@/features/betting'

const T1 = 'tournament-001'
const P1 = 'player-001'
const P2 = 'player-002'
const P3 = 'player-003'

function makeInput(
  overrides: Partial<TrophyComputeInput> = {}
): TrophyComputeInput {
  return {
    tournamentId: T1,
    playerIds: [P1, P2, P3],
    allRoundPoints: [],
    allScorecards: [],
    sideTotals: [],
    longestDrives: [],
    longestPutts: [],
    nearestToPins: [],
    penaltyTotals: [],
    bettingTotals: [],
    ...overrides,
  }
}

function emptyTotals(playerId: string): SideEventTotals {
  return {
    playerId,
    birdies: 0,
    eagles: 0,
    holeInOnes: 0,
    albatrosses: 0,
    bunkerSaves: 0,
    snakes: 0,
    snopp: 0,
    groupLongestDrives: 0,
    longestDriveMeters: null,
    longestPuttMeters: null,
    nearestToPinMeters: null,
    gir: 0,
  }
}

describe('Trophy Computation', () => {
  // --- Basic structure ---

  it('returns one standing per TROPHY_DEFINITIONS entry', () => {
    const standings = computeTrophyStandings(makeInput())
    // There are 15 trophy definitions
    expect(standings).toHaveLength(15)
    expect(standings.every((s) => s.trophy.tournamentId === T1)).toBe(true)
  })

  it('assigns unique trophy ids', () => {
    const standings = computeTrophyStandings(makeInput())
    const ids = standings.map((s) => s.trophy.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('returns null leaders when no data exists', () => {
    const standings = computeTrophyStandings(makeInput())
    expect(standings.every((s) => s.leaderId === null)).toBe(true)
    expect(standings.every((s) => s.leaderValue === null)).toBe(true)
  })

  // --- Total Points trophy ---

  it('computes total points leader', () => {
    const roundPoints: RoundPoints[] = [
      {
        id: 'rp-1',
        roundId: 'r1',
        participantId: P1,
        placing: 1,
        pointsAwarded: 25,
      },
      {
        id: 'rp-2',
        roundId: 'r1',
        participantId: P2,
        placing: 2,
        pointsAwarded: 18,
      },
    ]
    const standings = computeTrophyStandings(
      makeInput({ allRoundPoints: roundPoints })
    )

    const totalPoints = standings.find(
      (s) => s.trophy.sourceKey === 'total_points'
    )!
    expect(totalPoints.leaderId).toBe(P1)
    expect(totalPoints.leaderValue).toBe('25p')
  })

  // --- Gross total trophy ---

  it('computes gross total leader (lowest wins)', () => {
    const scorecards: Scorecard[] = [
      {
        id: 'sc-1',
        roundId: 'r1',
        playerId: P1,
        holeStrokes: [],
        grossTotal: 78,
        netTotal: null,
        stablefordPoints: null,
        isComplete: true,
      },
      {
        id: 'sc-2',
        roundId: 'r1',
        playerId: P2,
        holeStrokes: [],
        grossTotal: 72,
        netTotal: null,
        stablefordPoints: null,
        isComplete: true,
      },
    ]
    const standings = computeTrophyStandings(
      makeInput({ allScorecards: scorecards })
    )

    const gross = standings.find((s) => s.trophy.sourceKey === 'gross_total')!
    expect(gross.leaderId).toBe(P2)
    expect(gross.leaderValue).toBe('72')
  })

  // --- Net total trophy ---

  it('computes net total leader (lowest wins)', () => {
    const scorecards: Scorecard[] = [
      {
        id: 'sc-1',
        roundId: 'r1',
        playerId: P1,
        holeStrokes: [],
        grossTotal: 78,
        netTotal: 70,
        stablefordPoints: null,
        isComplete: true,
      },
      {
        id: 'sc-2',
        roundId: 'r1',
        playerId: P2,
        holeStrokes: [],
        grossTotal: 72,
        netTotal: 68,
        stablefordPoints: null,
        isComplete: true,
      },
    ]
    const standings = computeTrophyStandings(
      makeInput({ allScorecards: scorecards })
    )

    const net = standings.find((s) => s.trophy.sourceKey === 'net_total')!
    expect(net.leaderId).toBe(P2)
    expect(net.leaderValue).toBe('68')
  })

  // --- Count-based side event trophies ---

  it('computes birdie leader', () => {
    const sideTotals: SideEventTotals[] = [
      { ...emptyTotals(P1), birdies: 3 },
      { ...emptyTotals(P2), birdies: 7 },
      { ...emptyTotals(P3), birdies: 5 },
    ]
    const standings = computeTrophyStandings(makeInput({ sideTotals }))

    const birdies = standings.find((s) => s.trophy.sourceKey === 'birdies')!
    expect(birdies.leaderId).toBe(P2)
    expect(birdies.leaderValue).toBe('7')
  })

  it('computes snake leader', () => {
    const sideTotals: SideEventTotals[] = [
      { ...emptyTotals(P1), snakes: 4 },
      { ...emptyTotals(P2), snakes: 2 },
      { ...emptyTotals(P3), snakes: 0 },
    ]
    const standings = computeTrophyStandings(makeInput({ sideTotals }))

    const snakes = standings.find((s) => s.trophy.sourceKey === 'snakes')!
    expect(snakes.leaderId).toBe(P1)
    expect(snakes.leaderValue).toBe('4')
  })

  it('computes snopp leader', () => {
    const sideTotals: SideEventTotals[] = [
      { ...emptyTotals(P1), snopp: 0 },
      { ...emptyTotals(P2), snopp: 8 },
      { ...emptyTotals(P3), snopp: 3 },
    ]
    const standings = computeTrophyStandings(makeInput({ sideTotals }))

    const snopp = standings.find((s) => s.trophy.sourceKey === 'snopp')!
    expect(snopp.leaderId).toBe(P2)
    expect(snopp.leaderValue).toBe('8')
  })

  it('computes GIR leader', () => {
    const sideTotals: SideEventTotals[] = [
      { ...emptyTotals(P1), gir: 10 },
      { ...emptyTotals(P2), gir: 12 },
      { ...emptyTotals(P3), gir: 8 },
    ]
    const standings = computeTrophyStandings(makeInput({ sideTotals }))

    const gir = standings.find((s) => s.trophy.sourceKey === 'gir')!
    expect(gir.leaderId).toBe(P2)
    expect(gir.leaderValue).toBe('12')
  })

  it('returns null leader when no side events have been logged', () => {
    const sideTotals: SideEventTotals[] = [emptyTotals(P1), emptyTotals(P2)]
    const standings = computeTrophyStandings(makeInput({ sideTotals }))

    const birdies = standings.find((s) => s.trophy.sourceKey === 'birdies')!
    expect(birdies.leaderId).toBeNull()
  })

  // --- Distance-based trophies ---

  it('computes longest drive leader', () => {
    const longestDrives = [
      { playerId: P2, meters: 310 },
      { playerId: P1, meters: 285 },
    ]
    const standings = computeTrophyStandings(makeInput({ longestDrives }))

    const ld = standings.find((s) => s.trophy.sourceKey === 'longest_drive')!
    expect(ld.leaderId).toBe(P2)
    expect(ld.leaderValue).toBe('310m')
  })

  it('computes longest putt leader', () => {
    const longestPutts = [
      { playerId: P1, meters: 15 },
      { playerId: P3, meters: 8 },
    ]
    const standings = computeTrophyStandings(makeInput({ longestPutts }))

    const lp = standings.find((s) => s.trophy.sourceKey === 'longest_putt')!
    expect(lp.leaderId).toBe(P1)
    expect(lp.leaderValue).toBe('15m')
  })

  it('computes nearest to pin leader (closest wins)', () => {
    const nearestToPins = [
      { playerId: P3, meters: 1.2 },
      { playerId: P1, meters: 3.5 },
    ]
    const standings = computeTrophyStandings(makeInput({ nearestToPins }))

    const ntp = standings.find((s) => s.trophy.sourceKey === 'nearest_to_pin')!
    expect(ntp.leaderId).toBe(P3)
    expect(ntp.leaderValue).toBe('1.2m')
  })

  // --- Penalty trophy ---

  it('computes penalty king', () => {
    const penaltyTotals: PenaltyTotals[] = [
      { playerId: P1, totalAmount: 3, entryCount: 2 },
      { playerId: P2, totalAmount: 10, entryCount: 4 },
      { playerId: P3, totalAmount: 1, entryCount: 1 },
    ]
    const standings = computeTrophyStandings(makeInput({ penaltyTotals }))

    const penalty = standings.find((s) => s.trophy.sourceKey === 'penalties')!
    expect(penalty.leaderId).toBe(P2)
    expect(penalty.leaderValue).toBe('10')
  })

  it('returns null penalty leader when no penalties exist', () => {
    const penaltyTotals: PenaltyTotals[] = [
      { playerId: P1, totalAmount: 0, entryCount: 0 },
    ]
    const standings = computeTrophyStandings(makeInput({ penaltyTotals }))

    const penalty = standings.find((s) => s.trophy.sourceKey === 'penalties')!
    expect(penalty.leaderId).toBeNull()
  })

  // --- Betting trophy ---

  it('computes biggest bettor', () => {
    const bettingTotals: BettingTotals[] = [
      { playerId: P1, totalWagered: 50, betCount: 3, betsWon: 1, betsLost: 1 },
      {
        playerId: P2,
        totalWagered: 100,
        betCount: 5,
        betsWon: 2,
        betsLost: 1,
      },
      { playerId: P3, totalWagered: 0, betCount: 0, betsWon: 0, betsLost: 0 },
    ]
    const standings = computeTrophyStandings(makeInput({ bettingTotals }))

    const betting = standings.find(
      (s) => s.trophy.sourceKey === 'biggest_bettor'
    )!
    expect(betting.leaderId).toBe(P2)
    expect(betting.leaderValue).toBe('100')
  })

  it('returns null betting leader when no bets wagered', () => {
    const bettingTotals: BettingTotals[] = [
      { playerId: P1, totalWagered: 0, betCount: 0, betsWon: 0, betsLost: 0 },
    ]
    const standings = computeTrophyStandings(makeInput({ bettingTotals }))

    const betting = standings.find(
      (s) => s.trophy.sourceKey === 'biggest_bettor'
    )!
    expect(betting.leaderId).toBeNull()
  })

  // --- Multiple trophies with mixed data ---

  it('computes all trophy standings simultaneously with mixed data', () => {
    const roundPoints: RoundPoints[] = [
      {
        id: 'rp-1',
        roundId: 'r1',
        participantId: P1,
        placing: 1,
        pointsAwarded: 25,
      },
      {
        id: 'rp-2',
        roundId: 'r1',
        participantId: P2,
        placing: 2,
        pointsAwarded: 18,
      },
    ]
    const sideTotals: SideEventTotals[] = [
      { ...emptyTotals(P1), birdies: 3, snakes: 2 },
      { ...emptyTotals(P2), birdies: 5, snakes: 0 },
      { ...emptyTotals(P3), birdies: 0, snakes: 4 },
    ]
    const penaltyTotals: PenaltyTotals[] = [
      { playerId: P1, totalAmount: 0, entryCount: 0 },
      { playerId: P2, totalAmount: 5, entryCount: 2 },
      { playerId: P3, totalAmount: 8, entryCount: 3 },
    ]

    const standings = computeTrophyStandings(
      makeInput({
        allRoundPoints: roundPoints,
        sideTotals,
        penaltyTotals,
      })
    )

    expect(standings).toHaveLength(15)

    const points = standings.find((s) => s.trophy.sourceKey === 'total_points')!
    expect(points.leaderId).toBe(P1)

    const birdies = standings.find((s) => s.trophy.sourceKey === 'birdies')!
    expect(birdies.leaderId).toBe(P2)

    const snakes = standings.find((s) => s.trophy.sourceKey === 'snakes')!
    expect(snakes.leaderId).toBe(P3)

    const penalty = standings.find((s) => s.trophy.sourceKey === 'penalties')!
    expect(penalty.leaderId).toBe(P3)

    // Trophies with no data should be null
    const betting = standings.find(
      (s) => s.trophy.sourceKey === 'biggest_bettor'
    )!
    expect(betting.leaderId).toBeNull()
  })

  // --- Icon assignment ---

  it('assigns correct icons to trophies', () => {
    const standings = computeTrophyStandings(makeInput())

    const totalPoints = standings.find(
      (s) => s.trophy.sourceKey === 'total_points'
    )!
    expect(totalPoints.icon).toBe('trophy')

    const birdies = standings.find((s) => s.trophy.sourceKey === 'birdies')!
    expect(birdies.icon).toBe('bird')

    const penalties = standings.find((s) => s.trophy.sourceKey === 'penalties')!
    expect(penalties.icon).toBe('alert-triangle')

    const betting = standings.find(
      (s) => s.trophy.sourceKey === 'biggest_bettor'
    )!
    expect(betting.icon).toBe('circle-dollar-sign')
  })
})
