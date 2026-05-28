// Public API for the betting feature
export {
  betsQueryKey,
  betParticipantsQueryKey,
  useBets,
  useBetParticipants,
  useBetsByTournament,
  useBetsByStatus,
  useBetsForPlayer,
  useParticipantsForBet,
  useCreateBet,
  useAcceptBet,
  useRejectBet,
  useResolveBet,
  useConfirmPaid,
  useRemoveBet,
} from './api/use-bets'
export { useBetsRealtime } from './api/use-bets-realtime'
export { BetList } from './components/bet-list'
export { CreateBetDialog } from './components/create-bet-dialog'
export { categorizeBets } from './lib/categorize-bets'
export type { CategorizedBets } from './lib/categorize-bets'
export { computeBettingTotals } from './lib/betting-logic'
export type {
  Bet,
  BetParticipant,
  BetScope,
  BetMetric,
  BetStatus,
  BettingTotals,
  CreateBetInput,
} from './types'
