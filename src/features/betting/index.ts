// Public API for the betting feature
export { useBettingStore } from './state/betting-store'
export { BetList } from './components/bet-list'
export { CreateBetDialog } from './components/create-bet-dialog'
export { categorizeBets } from './lib/categorize-bets'
export type { CategorizedBets } from './lib/categorize-bets'
export type {
  Bet,
  BetParticipant,
  BetScope,
  BetMetric,
  BetStatus,
  BettingTotals,
  CreateBetInput,
} from './types'
