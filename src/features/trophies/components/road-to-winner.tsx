import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { TrophyStanding } from '../types'
import {
  Trophy,
  Bird,
  Zap,
  Skull,
  Target,
  Ruler,
  Star,
  Flame,
  CircleDot,
  Crosshair,
  AlertTriangle,
  Hash,
  CircleDollarSign,
  type LucideIcon,
} from 'lucide-react'

/** Map icon string names to Lucide components */
const ICON_COMPONENTS: Record<string, LucideIcon> = {
  trophy: Trophy,
  hash: Hash,
  bird: Bird,
  zap: Zap,
  skull: Skull,
  flame: Flame,
  ruler: Ruler,
  crosshair: Crosshair,
  'circle-dot': CircleDot,
  target: Target,
  star: Star,
  'alert-triangle': AlertTriangle,
  'circle-dollar-sign': CircleDollarSign,
}

/** Color mapping based on trophy source key */
const COLOR_MAP: Record<string, string> = {
  total_points: 'text-yellow-500',
  gross_total: 'text-slate-600',
  net_total: 'text-emerald-600',
  birdies: 'text-green-500',
  eagles: 'text-yellow-500',
  snakes: 'text-red-500',
  snopp: 'text-red-700',
  longest_drive: 'text-indigo-500',
  longest_putt: 'text-cyan-500',
  nearest_to_pin: 'text-teal-500',
  gir: 'text-emerald-500',
  bunker_saves: 'text-orange-500',
  group_longest_drives: 'text-blue-500',
  penalties: 'text-amber-500',
  biggest_bettor: 'text-violet-500',
}

interface RoadToWinnerProps {
  standings: TrophyStanding[]
  getPlayerName: (playerId: string) => string
}

export function RoadToWinner({ standings, getPlayerName }: RoadToWinnerProps) {
  const claimed = standings.filter((s) => s.leaderId != null)
  const unclaimed = standings.filter((s) => s.leaderId == null)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Trophy className="size-4 text-yellow-500" />
          Road to Winner
        </CardTitle>
      </CardHeader>
      <CardContent>
        {standings.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <p className="text-muted-foreground text-sm">
              No trophies defined yet.
            </p>
          </div>
        ) : claimed.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <p className="text-muted-foreground text-sm">
              No trophies claimed yet. Play some rounds to see who leads!
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {claimed.map((standing) => {
              const IconComp = ICON_COMPONENTS[standing.icon] ?? Trophy
              const color =
                COLOR_MAP[standing.trophy.sourceKey] ?? 'text-yellow-500'

              return (
                <div
                  key={standing.trophy.id}
                  className="flex items-center gap-3 rounded-md px-2 py-2"
                >
                  <IconComp
                    className={`size-4 shrink-0 ${color}`}
                    aria-hidden="true"
                  />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="text-sm font-medium">
                      {standing.trophy.name}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {getPlayerName(standing.leaderId!)}
                    </span>
                  </div>
                  {standing.leaderValue && (
                    <Badge
                      variant="secondary"
                      className="shrink-0 tabular-nums text-xs"
                    >
                      {standing.leaderValue}
                    </Badge>
                  )}
                </div>
              )
            })}

            {unclaimed.length > 0 && (
              <div className="text-muted-foreground mt-2 border-t pt-2 text-xs">
                {unclaimed.length} troph{unclaimed.length === 1 ? 'y' : 'ies'}{' '}
                unclaimed: {unclaimed.map((s) => s.trophy.name).join(', ')}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
