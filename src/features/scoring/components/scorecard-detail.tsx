import type { Hole } from '@/features/courses'
import type { HoleStroke } from '../types'
import type { SideEventLog } from '@/features/side-events'
import { SIDE_EVENT_ICONS } from '@/lib/side-event-icons'

function getScoreColor(strokes: number | null, par: number): string {
  if (strokes == null) return ''
  const diff = strokes - par
  if (diff <= -2)
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' // eagle or better
  if (diff === -1)
    return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' // birdie
  if (diff === 0) return '' // par
  if (diff === 1)
    return 'bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300' // bogey
  return 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300' // double bogey+
}

interface ScorecardDetailProps {
  holes: Hole[]
  holeStrokes: HoleStroke[]
  sideEvents: SideEventLog[]
  grossTotal: number
  netTotal: number | null
  stablefordPoints: number | null
  /** Player or team name for the header */
  participantName?: string
}

export function ScorecardDetail({
  holes,
  holeStrokes,
  sideEvents,
  grossTotal,
  netTotal,
  stablefordPoints,
  participantName,
}: ScorecardDetailProps) {
  // Build a map of hole -> side event types for quick lookup
  const holeEventsMap = new Map<number, SideEventLog[]>()
  for (const evt of sideEvents) {
    if (evt.holeNumber != null) {
      const existing = holeEventsMap.get(evt.holeNumber) ?? []
      existing.push(evt)
      holeEventsMap.set(evt.holeNumber, existing)
    }
  }

  const sortedHoles = [...holes].sort((a, b) => a.holeNumber - b.holeNumber)
  const front9 = sortedHoles.filter((h) => h.holeNumber <= 9)
  const back9 = sortedHoles.filter((h) => h.holeNumber > 9)
  const hasFront = front9.length > 0
  const hasBack = back9.length > 0

  const sumStrokes = (holeList: Hole[]) =>
    holeList.reduce((sum, h) => {
      const s = holeStrokes[h.holeNumber - 1]
      return sum + (s ?? 0)
    }, 0)

  const sumPar = (holeList: Hole[]) =>
    holeList.reduce((sum, h) => sum + h.par, 0)

  const countEntered = (holeList: Hole[]) =>
    holeList.filter((h) => holeStrokes[h.holeNumber - 1] != null).length

  return (
    <div className="flex flex-col gap-2" data-testid="scorecard-detail">
      {participantName && (
        <p className="text-muted-foreground text-xs font-medium">
          {participantName}
        </p>
      )}

      {/* Scorecard table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs" role="table">
          <thead>
            <tr className="text-muted-foreground border-b">
              <th className="px-1.5 py-1 text-left font-medium">Hole</th>
              <th className="px-1.5 py-1 text-center font-medium">Par</th>
              <th className="px-1.5 py-1 text-center font-medium">SI</th>
              <th className="px-1.5 py-1 text-center font-medium">Score</th>
              <th className="px-1.5 py-1 text-left font-medium">Events</th>
            </tr>
          </thead>
          <tbody>
            {hasFront && (
              <>
                {front9.map((hole) => (
                  <HoleRow
                    key={hole.id}
                    hole={hole}
                    strokes={holeStrokes[hole.holeNumber - 1]}
                    events={holeEventsMap.get(hole.holeNumber) ?? []}
                  />
                ))}
                {/* Front 9 subtotal */}
                <tr className="bg-muted/50 border-t font-medium">
                  <td className="px-1.5 py-1 text-left">Out</td>
                  <td className="px-1.5 py-1 text-center tabular-nums">
                    {sumPar(front9)}
                  </td>
                  <td className="px-1.5 py-1" />
                  <td className="px-1.5 py-1 text-center tabular-nums">
                    {countEntered(front9) > 0 ? sumStrokes(front9) : '-'}
                  </td>
                  <td className="px-1.5 py-1" />
                </tr>
              </>
            )}
            {hasBack && (
              <>
                {back9.map((hole) => (
                  <HoleRow
                    key={hole.id}
                    hole={hole}
                    strokes={holeStrokes[hole.holeNumber - 1]}
                    events={holeEventsMap.get(hole.holeNumber) ?? []}
                  />
                ))}
                {/* Back 9 subtotal */}
                <tr className="bg-muted/50 border-t font-medium">
                  <td className="px-1.5 py-1 text-left">In</td>
                  <td className="px-1.5 py-1 text-center tabular-nums">
                    {sumPar(back9)}
                  </td>
                  <td className="px-1.5 py-1" />
                  <td className="px-1.5 py-1 text-center tabular-nums">
                    {countEntered(back9) > 0 ? sumStrokes(back9) : '-'}
                  </td>
                  <td className="px-1.5 py-1" />
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="text-muted-foreground flex flex-wrap gap-3 border-t pt-2 text-xs tabular-nums">
        <span>
          Gross:{' '}
          <strong className="text-foreground">{grossTotal || '-'}</strong>
        </span>
        {netTotal != null && (
          <span>
            Net: <strong className="text-foreground">{netTotal}</strong>
          </span>
        )}
        {stablefordPoints != null && (
          <span>
            Stableford:{' '}
            <strong className="text-foreground">{stablefordPoints}</strong>
          </span>
        )}
      </div>
    </div>
  )
}

/** Single hole row */
function HoleRow({
  hole,
  strokes,
  events,
}: {
  hole: Hole
  strokes: HoleStroke
  events: SideEventLog[]
}) {
  const scoreColor = getScoreColor(strokes, hole.par)

  // Deduplicate event types for display (show each type once, except snopp which can repeat)
  const eventTypes = new Map<string, number>()
  for (const evt of events) {
    eventTypes.set(evt.type, (eventTypes.get(evt.type) ?? 0) + 1)
  }

  return (
    <tr className="border-b last:border-b-0">
      <td className="px-1.5 py-1 text-left tabular-nums font-medium">
        {hole.holeNumber}
      </td>
      <td className="px-1.5 py-1 text-center tabular-nums">{hole.par}</td>
      <td className="px-1.5 py-1 text-center tabular-nums">
        {hole.strokeIndex}
      </td>
      <td className="px-1.5 py-1 text-center">
        <span
          className={`inline-flex min-w-[1.5rem] items-center justify-center rounded px-1 tabular-nums font-medium ${scoreColor}`}
        >
          {strokes ?? '-'}
        </span>
      </td>
      <td className="px-1.5 py-1">
        <div className="flex items-center gap-0.5">
          {Array.from(eventTypes.entries()).map(([type, count]) => {
            const config = SIDE_EVENT_ICONS[type]
            if (!config) return null
            const Icon = config.icon
            return (
              <span
                key={type}
                className="inline-flex items-center gap-0.5"
                title={`${config.label}${count > 1 ? ` x${count}` : ''}`}
              >
                <Icon className={`size-3 ${config.className}`} />
                {count > 1 && (
                  <span className="text-muted-foreground text-[10px]">
                    {count}
                  </span>
                )}
              </span>
            )
          })}
        </div>
      </td>
    </tr>
  )
}

/** Compact side event badges for leaderboard rows */
export function SideEventBadges({
  sideEvents,
  playerId,
}: {
  sideEvents: SideEventLog[]
  playerId: string
}) {
  // Count events by type for this player
  const playerEvents = sideEvents.filter((e) => e.playerId === playerId)
  const typeCounts = new Map<string, number>()
  for (const evt of playerEvents) {
    typeCounts.set(evt.type, (typeCounts.get(evt.type) ?? 0) + 1)
  }

  // Show only the most interesting events as tiny badges
  const BADGE_TYPES = [
    'birdie',
    'eagle',
    'hio',
    'albatross',
    'snake',
    'snopp',
    'gir',
    'bunker_save',
  ] as const

  const badges = BADGE_TYPES.filter((t) => (typeCounts.get(t) ?? 0) > 0)
  if (badges.length === 0) return null

  return (
    <div className="flex items-center gap-0.5">
      {badges.map((type) => {
        const config = SIDE_EVENT_ICONS[type]
        if (!config) return null
        const Icon = config.icon
        const count = typeCounts.get(type) ?? 0
        return (
          <span
            key={type}
            className="inline-flex items-center gap-0"
            title={`${count} ${config.label}${count > 1 ? 's' : ''}`}
          >
            <Icon className={`size-3 ${config.className}`} />
            <span className="text-muted-foreground text-[10px] tabular-nums">
              {count}
            </span>
          </span>
        )
      })}
    </div>
  )
}
