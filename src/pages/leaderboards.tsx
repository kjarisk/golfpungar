import { useState } from 'react'
import { Link } from 'react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useTournamentStore } from '@/features/tournament'
import { useRoundsStore } from '@/features/rounds'
import { usePlayersStore } from '@/features/players'
import { useScoringStore } from '@/features/scoring'
import { useSideEventsStore, EvidenceGallery } from '@/features/side-events'
import { usePenaltiesStore } from '@/features/penalties'
import { useBettingStore } from '@/features/betting'
import { computeTrophyStandings, RoadToWinner } from '@/features/trophies'
import {
  computeTotalPointsLeaderboard,
  computeRoundLeaderboard,
  computeSideLeaderboard,
  computeLongestDriveLeaderboard,
  computeLongestPuttLeaderboard,
  computeNearestToPinLeaderboard,
  computeGrossLeaderboard,
  computeNetLeaderboard,
} from '@/lib/leaderboard-calc'
import { useActiveRound } from '@/hooks/use-active-round'
import {
  Trophy,
  Bird,
  Skull,
  Target,
  Zap,
  Ruler,
  Star,
  Medal,
  Flame,
  CircleDot,
  Crosshair,
  AlertTriangle,
  Hash,
  CircleDollarSign,
} from 'lucide-react'

export function LeaderboardsPage() {
  const tournament = useTournamentStore((s) => s.activeTournament())
  const getRoundsByTournament = useRoundsStore((s) => s.getRoundsByTournament)
  const getActivePlayers = usePlayersStore((s) => s.getActivePlayers)
  const getAllRoundPoints = useScoringStore((s) => s.roundPoints)
  const allScorecards = useScoringStore((s) => s.scorecards)
  const getPointsByRound = useScoringStore((s) => s.getPointsByRound)
  const getScorecardsByRound = useScoringStore((s) => s.getScorecardsByRound)
  const getTotalsForTournament = useSideEventsStore(
    (s) => s.getTotalsForTournament
  )
  const getLongestDriveLeaderboard = useSideEventsStore(
    (s) => s.getLongestDriveLeaderboard
  )
  const getLongestPuttLeaderboard = useSideEventsStore(
    (s) => s.getLongestPuttLeaderboard
  )
  const getNearestToPinLeaderboard = useSideEventsStore(
    (s) => s.getNearestToPinLeaderboard
  )
  const getPenaltyTotals = usePenaltiesStore((s) => s.getTotalsForTournament)
  const getBettingTotals = useBettingStore((s) => s.getTotalsForTournament)

  const activeRound = useActiveRound()
  const [selectedRoundId, setSelectedRoundId] = useState<string>('')

  const rounds = tournament ? getRoundsByTournament(tournament.id) : []
  const players = tournament ? getActivePlayers(tournament.id) : []
  const playerIds = players.map((p) => p.id)

  // Default tab: 'round' when an active round exists, 'total' otherwise
  const defaultTab = activeRound ? 'round' : 'total'

  // Total points
  const totalPointsLeaderboard = computeTotalPointsLeaderboard(
    getAllRoundPoints,
    playerIds
  )

  // Gross & Net tournament leaderboards
  const grossLeaderboard = computeGrossLeaderboard(allScorecards, playerIds)
  const netLeaderboard = computeNetLeaderboard(allScorecards, playerIds)

  // Round leaderboard — default to active round, then first round
  const defaultRoundId =
    activeRound?.id ?? (rounds.length > 0 ? rounds[0].id : '')
  const effectiveRoundId = selectedRoundId || defaultRoundId
  const roundPoints = effectiveRoundId ? getPointsByRound(effectiveRoundId) : []
  const roundScorecards = effectiveRoundId
    ? getScorecardsByRound(effectiveRoundId)
    : []
  const roundLeaderboard = computeRoundLeaderboard(roundPoints, roundScorecards)

  // Side competitions
  const sideTotals = tournament
    ? getTotalsForTournament(tournament.id, playerIds)
    : []
  const birdieBoard = computeSideLeaderboard(sideTotals, (t) => t.birdies)
  const eagleBoard = computeSideLeaderboard(sideTotals, (t) => t.eagles)
  const snakeBoard = computeSideLeaderboard(sideTotals, (t) => t.snakes)
  const bunkerBoard = computeSideLeaderboard(sideTotals, (t) => t.bunkerSaves)
  const groupLDBoard = computeSideLeaderboard(
    sideTotals,
    (t) => t.groupLongestDrives
  )
  const snoppBoard = computeSideLeaderboard(sideTotals, (t) => t.snopp)
  const girBoard = computeSideLeaderboard(sideTotals, (t) => t.gir)
  const longestDrives = tournament
    ? getLongestDriveLeaderboard(tournament.id)
    : []
  const longestDriveBoard = computeLongestDriveLeaderboard(longestDrives)
  const longestPutts = tournament
    ? getLongestPuttLeaderboard(tournament.id)
    : []
  const longestPuttBoard = computeLongestPuttLeaderboard(longestPutts)
  const nearestToPins = tournament
    ? getNearestToPinLeaderboard(tournament.id)
    : []
  const nearestToPinBoard = computeNearestToPinLeaderboard(nearestToPins)

  // Penalty King — compute leaderboard using same tie-handling pattern
  const penaltyTotals = tournament
    ? getPenaltyTotals(tournament.id, playerIds)
    : []
  const penaltyBoard = (() => {
    const entries = penaltyTotals
      .filter((t) => t.totalAmount > 0)
      .map((t) => ({ playerId: t.playerId, count: t.totalAmount }))
      .sort((a, b) => b.count - a.count)
    return entries.reduce<
      Array<{ playerId: string; count: number; placing: number }>
    >((acc, entry, index) => {
      const placing =
        index > 0 && entry.count < entries[index - 1].count
          ? index + 1
          : (acc[index - 1]?.placing ?? 1)
      acc.push({ ...entry, placing })
      return acc
    }, [])
  })()

  // Biggest Bettor — compute leaderboard using same tie-handling pattern
  const bettingTotals = tournament
    ? getBettingTotals(tournament.id, playerIds)
    : []
  const bettingBoard = (() => {
    const entries = bettingTotals
      .filter((t) => t.totalWagered > 0)
      .map((t) => ({ playerId: t.playerId, count: t.totalWagered }))
      .sort((a, b) => b.count - a.count)
    return entries.reduce<
      Array<{ playerId: string; count: number; placing: number }>
    >((acc, entry, index) => {
      const placing =
        index > 0 && entry.count < entries[index - 1].count
          ? index + 1
          : (acc[index - 1]?.placing ?? 1)
      acc.push({ ...entry, placing })
      return acc
    }, [])
  })()

  // Trophy standings — computed from all data sources
  const trophyStandings = tournament
    ? computeTrophyStandings({
        tournamentId: tournament.id,
        playerIds,
        allRoundPoints: getAllRoundPoints,
        allScorecards,
        sideTotals,
        longestDrives,
        longestPutts,
        nearestToPins,
        penaltyTotals,
        bettingTotals,
      })
    : []

  function getPlayerName(playerId: string) {
    return players.find((p) => p.id === playerId)?.displayName ?? 'Unknown'
  }

  if (!tournament) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold tracking-tight">Leaderboards</h1>
        <p className="text-muted-foreground text-sm">
          No active tournament. Select or create one to see leaderboards.
        </p>
        <Button asChild variant="outline" className="w-fit">
          <Link to="/tournaments">View Tournaments</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Leaderboards</h1>
        <p className="text-muted-foreground text-sm">
          Points standings and side competitions
        </p>
      </div>

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="total">Total</TabsTrigger>
          <TabsTrigger value="round">Round</TabsTrigger>
          <TabsTrigger value="side">Side</TabsTrigger>
        </TabsList>

        {/* --- Total Points Tab --- */}
        <TabsContent value="total" className="flex flex-col gap-3">
          {/* Road to Winner — Trophy overview */}
          <RoadToWinner
            standings={trophyStandings}
            getPlayerName={getPlayerName}
          />

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Trophy className="size-4" />
                Total Points
              </CardTitle>
            </CardHeader>
            <CardContent>
              {totalPointsLeaderboard.length === 0 ||
              totalPointsLeaderboard.every((e) => e.totalPoints === 0) ? (
                <EmptyState message="No points awarded yet. Score some rounds first." />
              ) : (
                <div className="flex flex-col gap-0.5">
                  {totalPointsLeaderboard.map((entry) => (
                    <div
                      key={entry.playerId}
                      className="flex items-center gap-3 rounded-md px-2 py-2"
                    >
                      <PlacingBadge placing={entry.placing} />
                      <span className="flex-1 truncate text-sm font-medium">
                        {getPlayerName(entry.playerId)}
                      </span>
                      <div className="flex items-center gap-2">
                        {entry.roundBreakdown.length > 0 && (
                          <span className="text-muted-foreground text-xs tabular-nums">
                            {entry.roundBreakdown
                              .map((r) => r.points)
                              .join('+')}
                          </span>
                        )}
                        <Badge
                          variant="default"
                          className="min-w-[3rem] justify-center tabular-nums text-xs"
                        >
                          {entry.totalPoints}p
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Gross Total */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Hash className="size-4 text-slate-600" />
                Gross Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              {grossLeaderboard.length === 0 ? (
                <EmptyState message="No scorecards yet. Enter scores to see gross standings." />
              ) : (
                <div className="flex flex-col gap-0.5">
                  {grossLeaderboard.map((entry) => (
                    <div
                      key={entry.playerId}
                      className="flex items-center gap-3 rounded-md px-2 py-2"
                    >
                      <PlacingBadge placing={entry.placing} />
                      <span className="flex-1 truncate text-sm font-medium">
                        {getPlayerName(entry.playerId)}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-xs tabular-nums">
                          {entry.roundsPlayed}R
                        </span>
                        <Badge
                          variant="secondary"
                          className="min-w-[3rem] justify-center tabular-nums text-xs"
                        >
                          {entry.grossTotal}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Net Total */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Hash className="size-4 text-emerald-600" />
                Net Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              {netLeaderboard.length === 0 ? (
                <EmptyState message="No net scores yet. Enter hole-by-hole scores with handicaps." />
              ) : (
                <div className="flex flex-col gap-0.5">
                  {netLeaderboard.map((entry) => (
                    <div
                      key={entry.playerId}
                      className="flex items-center gap-3 rounded-md px-2 py-2"
                    >
                      <PlacingBadge placing={entry.placing} />
                      <span className="flex-1 truncate text-sm font-medium">
                        {getPlayerName(entry.playerId)}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-xs tabular-nums">
                          {entry.roundsPlayed}R
                        </span>
                        <Badge
                          variant="secondary"
                          className="min-w-[3rem] justify-center tabular-nums text-xs"
                        >
                          {entry.netTotal}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- Round Tab --- */}
        <TabsContent value="round" className="flex flex-col gap-3">
          {rounds.length === 0 ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Medal className="size-4" />
                  Round Standings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <EmptyState message="No rounds created yet. Go to the Rounds tab to create one." />
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Round selector */}
              <Select
                value={effectiveRoundId}
                onValueChange={setSelectedRoundId}
              >
                <SelectTrigger className="w-full" aria-label="Select round">
                  <SelectValue placeholder="Select round" />
                </SelectTrigger>
                <SelectContent>
                  {rounds.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                      {r.status === 'active' ? ' (Active)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Medal className="size-4" />
                    Round Standings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {roundLeaderboard.length === 0 ? (
                    <EmptyState message="No scores entered for this round yet." />
                  ) : (
                    <div className="flex flex-col gap-0.5">
                      {roundLeaderboard.map((entry) => (
                        <div
                          key={entry.participantId}
                          className="flex items-center gap-3 rounded-md px-2 py-2"
                        >
                          <PlacingBadge placing={entry.placing} />
                          <span className="flex-1 truncate text-sm font-medium">
                            {getPlayerName(entry.participantId)}
                          </span>
                          <div className="text-muted-foreground flex items-center gap-2 text-xs tabular-nums">
                            {entry.grossTotal > 0 && (
                              <span>{entry.grossTotal} gross</span>
                            )}
                            {entry.netTotal != null && (
                              <span>{entry.netTotal} net</span>
                            )}
                            {entry.stablefordPoints != null && (
                              <span>{entry.stablefordPoints} stb</span>
                            )}
                          </div>
                          <Badge
                            variant="default"
                            className="min-w-[3rem] justify-center tabular-nums text-xs"
                          >
                            {entry.pointsAwarded}p
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* --- Side Competitions Tab --- */}
        <TabsContent value="side" className="flex flex-col gap-3">
          {/* Birdies */}
          <SideCompetitionCard
            title="Birdies"
            icon={<Bird className="size-4 text-green-500" />}
            entries={birdieBoard}
            getPlayerName={getPlayerName}
            unit=""
          />

          {/* Eagles */}
          <SideCompetitionCard
            title="Eagles"
            icon={<Zap className="size-4 text-yellow-500" />}
            entries={eagleBoard}
            getPlayerName={getPlayerName}
            unit=""
          />

          {/* Snakes */}
          <SideCompetitionCard
            title="Snakes (3-putts)"
            icon={<Skull className="size-4 text-red-500" />}
            entries={snakeBoard}
            getPlayerName={getPlayerName}
            unit=""
            invertColor
          />

          {/* Bunker Saves */}
          <SideCompetitionCard
            title="Bunker Saves"
            icon={<Target className="size-4 text-orange-500" />}
            entries={bunkerBoard}
            getPlayerName={getPlayerName}
            unit=""
          />

          {/* Group Longest Drives */}
          <SideCompetitionCard
            title="Group Longest Drives (Par 5)"
            icon={<Star className="size-4 text-blue-500" />}
            entries={groupLDBoard}
            getPlayerName={getPlayerName}
            unit=""
          />

          {/* Snopp */}
          <SideCompetitionCard
            title="Most Snopp"
            icon={<Flame className="size-4 text-red-700" />}
            entries={snoppBoard}
            getPlayerName={getPlayerName}
            unit=""
            invertColor
          />

          {/* GIR */}
          <SideCompetitionCard
            title="Greens in Regulation"
            icon={<CircleDot className="size-4 text-emerald-500" />}
            entries={girBoard}
            getPlayerName={getPlayerName}
            unit=""
          />

          {/* Longest Drive (meters) */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Ruler className="size-4 text-indigo-500" />
                Longest Drive
              </CardTitle>
            </CardHeader>
            <CardContent>
              {longestDriveBoard.length === 0 ? (
                <EmptyState message="No longest drives logged yet." />
              ) : (
                <div className="flex flex-col gap-0.5">
                  {longestDriveBoard.map((entry) => (
                    <div
                      key={entry.playerId}
                      className="flex items-center gap-3 rounded-md px-2 py-2"
                    >
                      <PlacingBadge placing={entry.placing} />
                      <span className="flex-1 truncate text-sm font-medium">
                        {getPlayerName(entry.playerId)}
                      </span>
                      <Badge
                        variant="secondary"
                        className="tabular-nums text-xs"
                      >
                        {entry.meters}m
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Evidence Gallery for longest drives */}
          <EvidenceGallery
            tournamentId={tournament.id}
            getPlayerName={getPlayerName}
          />

          {/* Longest Putt (meters) */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Ruler className="size-4 text-cyan-500" />
                Longest Putt
              </CardTitle>
            </CardHeader>
            <CardContent>
              {longestPuttBoard.length === 0 ? (
                <EmptyState message="No longest putts logged yet." />
              ) : (
                <div className="flex flex-col gap-0.5">
                  {longestPuttBoard.map((entry) => (
                    <div
                      key={entry.playerId}
                      className="flex items-center gap-3 rounded-md px-2 py-2"
                    >
                      <PlacingBadge placing={entry.placing} />
                      <span className="flex-1 truncate text-sm font-medium">
                        {getPlayerName(entry.playerId)}
                      </span>
                      <Badge
                        variant="secondary"
                        className="tabular-nums text-xs"
                      >
                        {entry.meters}m
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Nearest to Pin (meters) */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Crosshair className="size-4 text-teal-500" />
                Nearest to Pin
              </CardTitle>
            </CardHeader>
            <CardContent>
              {nearestToPinBoard.length === 0 ? (
                <EmptyState message="No nearest to pin logged yet." />
              ) : (
                <div className="flex flex-col gap-0.5">
                  {nearestToPinBoard.map((entry) => (
                    <div
                      key={entry.playerId}
                      className="flex items-center gap-3 rounded-md px-2 py-2"
                    >
                      <PlacingBadge placing={entry.placing} />
                      <span className="flex-1 truncate text-sm font-medium">
                        {getPlayerName(entry.playerId)}
                      </span>
                      <Badge
                        variant="secondary"
                        className="tabular-nums text-xs"
                      >
                        {entry.meters}m
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Penalty King */}
          <SideCompetitionCard
            title="Penalty King"
            icon={<AlertTriangle className="size-4 text-amber-500" />}
            entries={penaltyBoard}
            getPlayerName={getPlayerName}
            unit=""
            invertColor
          />

          {/* Biggest Bettor */}
          <SideCompetitionCard
            title="Biggest Bettor"
            icon={<CircleDollarSign className="size-4 text-violet-500" />}
            entries={bettingBoard}
            getPlayerName={getPlayerName}
            unit=""
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// --- Helper components ---

function PlacingBadge({ placing }: { placing: number }) {
  const colors =
    placing === 1
      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      : placing === 2
        ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
        : placing === 3
          ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-200'
          : 'bg-muted text-muted-foreground'

  return (
    <span
      className={`flex size-7 items-center justify-center rounded-full text-xs font-bold tabular-nums ${colors}`}
    >
      {placing}
    </span>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-6 text-center">
      <p className="text-muted-foreground text-sm">{message}</p>
    </div>
  )
}

interface SideCompetitionCardProps {
  title: string
  icon: React.ReactNode
  entries: { playerId: string; count: number; placing: number }[]
  getPlayerName: (id: string) => string
  unit: string
  invertColor?: boolean
}

function SideCompetitionCard({
  title,
  icon,
  entries,
  getPlayerName,
  invertColor,
}: SideCompetitionCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <EmptyState message={`No ${title.toLowerCase()} logged yet.`} />
        ) : (
          <div className="flex flex-col gap-0.5">
            {entries.map((entry) => (
              <div
                key={entry.playerId}
                className="flex items-center gap-3 rounded-md px-2 py-2"
              >
                <PlacingBadge placing={entry.placing} />
                <span className="flex-1 truncate text-sm font-medium">
                  {getPlayerName(entry.playerId)}
                </span>
                <Badge
                  variant={invertColor ? 'destructive' : 'secondary'}
                  className="tabular-nums text-xs"
                >
                  {entry.count}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
