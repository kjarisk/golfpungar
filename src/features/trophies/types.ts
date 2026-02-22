// Types for the trophies feature
// Based on: outline.md §6 "Trophy"

/** The source category that awards a trophy */
export type TrophySourceType = 'points' | 'sideEvent' | 'ledger' | 'bet'

/**
 * A trophy definition — one per leaderboard/competition.
 * The current leader is computed dynamically from live data,
 * not stored as a static field.
 */
export interface Trophy {
  id: string
  tournamentId: string
  /** Display name of the trophy (e.g. "Most Birdies", "Penalty King") */
  name: string
  /** Which data source drives this trophy */
  sourceType: TrophySourceType
  /** Key identifying the specific competition (e.g. 'birdies', 'total_points') */
  sourceKey: string
}

/**
 * A computed trophy standing — runtime result, not persisted.
 * Shows who currently leads each trophy.
 */
export interface TrophyStanding {
  trophy: Trophy
  /** Current leader's playerId (null if no data yet) */
  leaderId: string | null
  /** Display value for the leader (e.g. "42p", "6", "285m") */
  leaderValue: string | null
  /** Icon name hint for the UI */
  icon: string
}

/**
 * All predefined trophy keys for the v1 app.
 * These correspond to the leaderboards listed in outline.md §7.
 */
export const TROPHY_DEFINITIONS: Omit<Trophy, 'id' | 'tournamentId'>[] = [
  {
    name: 'Tournament Champion',
    sourceType: 'points',
    sourceKey: 'total_points',
  },
  {
    name: 'Gross Total Winner',
    sourceType: 'points',
    sourceKey: 'gross_total',
  },
  { name: 'Net Total Winner', sourceType: 'points', sourceKey: 'net_total' },
  { name: 'Most Birdies', sourceType: 'sideEvent', sourceKey: 'birdies' },
  { name: 'Most Eagles', sourceType: 'sideEvent', sourceKey: 'eagles' },
  { name: 'Most Snakes', sourceType: 'sideEvent', sourceKey: 'snakes' },
  { name: 'Most Snopp', sourceType: 'sideEvent', sourceKey: 'snopp' },
  {
    name: 'Longest Drive',
    sourceType: 'sideEvent',
    sourceKey: 'longest_drive',
  },
  {
    name: 'Longest Putt',
    sourceType: 'sideEvent',
    sourceKey: 'longest_putt',
  },
  {
    name: 'Nearest to Pin',
    sourceType: 'sideEvent',
    sourceKey: 'nearest_to_pin',
  },
  { name: 'Most GIR', sourceType: 'sideEvent', sourceKey: 'gir' },
  {
    name: 'Most Bunker Saves',
    sourceType: 'sideEvent',
    sourceKey: 'bunker_saves',
  },
  {
    name: 'Group LD King',
    sourceType: 'sideEvent',
    sourceKey: 'group_longest_drives',
  },
  { name: 'Penalty King', sourceType: 'ledger', sourceKey: 'penalties' },
  { name: 'Biggest Bettor', sourceType: 'bet', sourceKey: 'biggest_bettor' },
]
