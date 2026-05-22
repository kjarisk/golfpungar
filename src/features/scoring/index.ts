export {
  scorecardsQueryKey,
  useScorecards,
  useScorecardsByRound,
  useScorecardForPlayer,
  useScorecardForTeam,
  useCreateScorecard,
  useSetScorecardHoles,
  useSetHoleStroke,
  useRemoveScorecard,
} from './api/use-scorecards'
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
export { ScorecardDetail, SideEventBadges } from './components/scorecard-detail'
export { ScorecardComparison } from './components/scorecard-comparison'
export type { Scorecard, RoundPoints, HoleStroke } from './types'
