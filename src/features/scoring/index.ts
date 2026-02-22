export { useScoringStore } from './state/scoring-store'
export {
  handicapStrokesForHole,
  netStrokesForHole,
  stablefordPointsForHole,
  calculateStablefordTotal,
  calculateGrossTotal,
  calculateNetTotal,
  isScorecardComplete,
} from './lib/scoring-calc'
export { awardPoints, DEFAULT_POINTS } from './lib/points-calc'
export type {
  Scorecard,
  RoundPoints,
  HoleStroke,
  CreateScorecardInput,
  UpdateStrokesInput,
  SetTotalInput,
} from './types'
