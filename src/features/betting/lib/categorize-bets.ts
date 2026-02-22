import type { Bet, BetStatus } from '../types'

export interface CategorizedBets {
  /** Round bets for the active round (not settled) */
  roundBets: Bet[]
  /** Tournament-wide bets (not settled), plus round bets for non-active rounds */
  tournamentBets: Bet[]
  /** Settled bets: won, lost, paid, or rejected */
  settledBets: Bet[]
}

const SETTLED_STATUSES: BetStatus[] = ['won', 'lost', 'paid', 'rejected']

/**
 * Categorize bets into three sections:
 * 1. Round bets — scope='round' with roundId matching active round, not settled
 * 2. Tournament bets — scope='tournament' or round bets for non-active rounds, not settled
 * 3. Settled — won, lost, paid, or rejected
 *
 * Each section is sorted newest first (by createdAt descending).
 */
export function categorizeBets(
  bets: Bet[],
  activeRoundId: string | undefined
): CategorizedBets {
  const roundBets: Bet[] = []
  const tournamentBets: Bet[] = []
  const settledBets: Bet[] = []

  for (const bet of bets) {
    if (SETTLED_STATUSES.includes(bet.status)) {
      settledBets.push(bet)
    } else if (
      bet.scope === 'round' &&
      activeRoundId &&
      bet.roundId === activeRoundId
    ) {
      roundBets.push(bet)
    } else {
      tournamentBets.push(bet)
    }
  }

  const byNewest = (a: Bet, b: Bet) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()

  roundBets.sort(byNewest)
  tournamentBets.sort(byNewest)
  settledBets.sort(byNewest)

  return { roundBets, tournamentBets, settledBets }
}
