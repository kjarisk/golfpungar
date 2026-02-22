import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import {
  computeTotalPointsLeaderboard,
  computeRoundLeaderboard,
  computeSideLeaderboard,
  computeLongestDriveLeaderboard,
} from '@/lib/leaderboard-calc'
import {
  Trophy,
  Bird,
  Skull,
  Target,
  Zap,
  Ruler,
  Star,
  Medal,
} from 'lucide-react'

export function LeaderboardsPage() {
  const tournament = useTournamentStore((s) => s.activeTournament())
  const getRoundsByTournament = useRoundsStore((s) => s.getRoundsByTournament)
  const getActivePlayers = usePlayersStore((s) => s.getActivePlayers)
  const getAllRoundPoints = useScoringStore((s) => s.roundPoints)
  const getPointsByRound = useScoringStore((s) => s.getPointsByRound)
  const getScorecardsByRound = useScoringStore((s) => s.getScorecardsByRound)
  const getTotalsForTournament = useSideEventsStore(
    (s) => s.getTotalsForTournament
  )
  const getLongestDriveLeaderboard = useSideEventsStore(
    (s) => s.getLongestDriveLeaderboard
  )

  const [selectedRoundId, setSelectedRoundId] = useState<string>('')

  const rounds = tournament ? getRoundsByTournament(tournament.id) : []
  const players = tournament ? getActivePlayers(tournament.id) : []
  const playerIds = players.map((p) => p.id)

  // Total points
  const totalPointsLeaderboard = computeTotalPointsLeaderboard(
    getAllRoundPoints,
    playerIds
  )

  // Round leaderboard
  const effectiveRoundId =
    selectedRoundId || (rounds.length > 0 ? rounds[0].id : '')
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
  const longestDrives = tournament
    ? getLongestDriveLeaderboard(tournament.id)
    : []
  const longestDriveBoard = computeLongestDriveLeaderboard(longestDrives)

  function getPlayerName(playerId: string) {
    return players.find((p) => p.id === playerId)?.displayName ?? 'Unknown'
  }

  if (!tournament) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold tracking-tight">Leaderboards</h1>
        <p className="text-muted-foreground text-sm">
          Create a tournament first to see leaderboards.
        </p>
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

      <Tabs defaultValue="total" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="total">Total</TabsTrigger>
          <TabsTrigger value="round">Round</TabsTrigger>
          <TabsTrigger value="side">Side</TabsTrigger>
        </TabsList>

        {/* --- Total Points Tab --- */}
        <TabsContent value="total" className="flex flex-col gap-3">
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
        </TabsContent>

        {/* --- Round Tab --- */}
        <TabsContent value="round" className="flex flex-col gap-3">
          {/* Round selector */}
          {rounds.length > 0 && (
            <Select value={effectiveRoundId} onValueChange={setSelectedRoundId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select round" />
              </SelectTrigger>
              <SelectContent>
                {rounds.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

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
