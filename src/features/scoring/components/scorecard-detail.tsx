import type { Hole } from '@/features/courses'
import type { HoleStroke } from '../types'
import type { SideEventLog } from '@/features/side-events'
import { SIDE_EVENT_ICONS } from '@/lib/side-event-icons'
import { netStrokesForHole } from '../lib/scoring-calc'

/** Color class for gross score relative to par */
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

/** Color class for net score relative to par */
function getNetColor(net: number, par: number): string {
  const diff = net - par
  if (diff <= -2) return 'text-yellow-700 dark:text-yellow-300'
  if (diff === -1) return 'text-green-700 dark:text-green-300'
  if (diff === 0) return 'text-muted-foreground'
  if (diff === 1) return 'text-orange-600 dark:text-orange-400'
  return 'text-red-600 dark:text-red-400'
}

/** Format relative-to-par as "+3", "-2", or "E" */
function formatRelPar(total: number, par: number): string {
  const diff = total - par
  if (diff === 0) return 'E'
  return diff > 0 ? `+${diff}` : `${diff}`
}

/** Color class for a relative-to-par badge */
function relParColor(total: number, par: number): string {
  const diff = total - par
  if (diff < 0) return 'text-green-700 dark:text-green-400'
  if (diff === 0) return 'text-muted-foreground'
  return 'text-red-600 dark:text-red-400'
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
  /** When provided, enables per-hole Net column */
  groupHandicap?: number
}

export function ScorecardDetail({
  holes,
  holeStrokes,
  sideEvents,
  grossTotal,
  netTotal,
  stablefordPoints,
  participantName,
  groupHandicap,
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
  const totalHoles = sortedHoles.length as 9 | 18
  const showNet = groupHandicap != null && groupHandicap > 0

  const sumStrokes = (holeList: Hole[]) =>
    holeList.reduce((sum, h) => {
      const s = holeStrokes[h.holeNumber - 1]
      return sum + (s ?? 0)
    }, 0)

  const sumNet = (holeList: Hole[]) =>
    holeList.reduce((sum, h) => {
      const s = holeStrokes[h.holeNumber - 1]
      if (s == null || groupHandicap == null) return sum
      return sum + netStrokesForHole(s, groupHandicap, h, totalHoles)
    }, 0)

  const sumPar = (holeList: Hole[]) =>
    holeList.reduce((sum, h) => sum + h.par, 0)

  const countEntered = (holeList: Hole[]) =>
    holeList.filter((h) => holeStrokes[h.holeNumber - 1] != null).length

  // Count specific side event types across holes
  const countEventType = (holeList: Hole[], type: string) =>
    holeList.reduce((count, h) => {
      const events = holeEventsMap.get(h.holeNumber) ?? []
      return count + events.filter((e) => e.type === type).length
    }, 0)

  const totalPar = sumPar(sortedHoles)

  return (
    <div className="flex flex-col gap-2" data-testid="scorecard-detail">
      {/* Header with name + relative to par */}
      {(participantName || grossTotal > 0) && (
        <div className="flex items-baseline justify-between gap-2">
          {participantName && (
            <p className="text-sm font-semibold">{participantName}</p>
          )}
          {grossTotal > 0 && (
            <div className="flex items-center gap-2 text-sm font-semibold tabular-nums">
              <span className={relParColor(grossTotal, totalPar)}>
                {formatRelPar(grossTotal, totalPar)}
              </span>
              {showNet && netTotal != null && (
                <>
                  <span className="text-muted-foreground">/</span>
                  <span className={relParColor(netTotal, totalPar)}>
                    {formatRelPar(netTotal, totalPar)}
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Scorecard table */}
      <div>
        <table className="w-full text-xs" role="table">
          <thead>
            <tr className="text-muted-foreground border-b">
              <th className="w-8 px-1 py-1 text-left font-medium">Hole</th>
              <th className="w-8 px-1 py-1 text-center font-medium">Par</th>
              <th className="w-8 px-1 py-1 text-center font-medium">SI</th>
              <th className="px-1 py-1 text-center font-medium">Score</th>
              {showNet && (
                <th className="w-10 px-1 py-1 text-center font-medium">Net</th>
              )}
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
                    showNet={showNet}
                    groupHandicap={groupHandicap}
                    totalHoles={totalHoles}
                  />
                ))}
                {/* Front 9 subtotal */}
                <SubtotalRow
                  label="Out"
                  par={sumPar(front9)}
                  gross={countEntered(front9) > 0 ? sumStrokes(front9) : null}
                  net={
                    showNet && countEntered(front9) > 0 ? sumNet(front9) : null
                  }
                  showNet={showNet}
                  girCount={countEventType(front9, 'gir')}
                  sandCount={countEventType(front9, 'bunker_save')}
                  snakeCount={countEventType(front9, 'snake')}
                />
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
                    showNet={showNet}
                    groupHandicap={groupHandicap}
                    totalHoles={totalHoles}
                  />
                ))}
                {/* Back 9 subtotal */}
                <SubtotalRow
                  label="In"
                  par={sumPar(back9)}
                  gross={countEntered(back9) > 0 ? sumStrokes(back9) : null}
                  net={
                    showNet && countEntered(back9) > 0 ? sumNet(back9) : null
                  }
                  showNet={showNet}
                  girCount={countEventType(back9, 'gir')}
                  sandCount={countEventType(back9, 'bunker_save')}
                  snakeCount={countEventType(back9, 'snake')}
                />
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* Summary footer */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t pt-2 text-xs tabular-nums">
        <span className="text-muted-foreground">
          Gross:{' '}
          <strong className="text-foreground">{grossTotal || '-'}</strong>
        </span>
        {netTotal != null && (
          <span className="text-muted-foreground">
            Net: <strong className="text-foreground">{netTotal}</strong>
          </span>
        )}
        {stablefordPoints != null && (
          <span className="text-muted-foreground">
            Stableford:{' '}
            <strong className="text-foreground">{stablefordPoints}</strong>
          </span>
        )}
        <EventTotals sideEvents={sideEvents} />
      </div>
    </div>
  )
}

/** Single hole row with inline side event icons on the Score cell */
function HoleRow({
  hole,
  strokes,
  events,
  showNet,
  groupHandicap,
  totalHoles,
}: {
  hole: Hole
  strokes: HoleStroke
  events: SideEventLog[]
  showNet: boolean
  groupHandicap?: number
  totalHoles: 9 | 18
}) {
  const scoreColor = getScoreColor(strokes, hole.par)
  const net =
    strokes != null && groupHandicap != null
      ? netStrokesForHole(strokes, groupHandicap, hole, totalHoles)
      : null
  const netColor = net != null ? getNetColor(net, hole.par) : ''

  // Deduplicate event types for display (show each type once, except snopp which can repeat)
  const eventTypes = new Map<string, number>()
  for (const evt of events) {
    eventTypes.set(evt.type, (eventTypes.get(evt.type) ?? 0) + 1)
  }

  return (
    <tr className="border-b last:border-b-0">
      <td className="px-1 py-1 text-left tabular-nums font-medium">
        {hole.holeNumber}
      </td>
      <td className="px-1 py-1 text-center tabular-nums">{hole.par}</td>
      <td className="px-1 py-1 text-center tabular-nums text-muted-foreground">
        {hole.strokeIndex}
      </td>
      <td className="px-1 py-1 text-center">
        <div className="flex items-center justify-center gap-1">
          <span
            className={`inline-flex min-w-[1.5rem] items-center justify-center rounded px-1 tabular-nums font-medium ${scoreColor}`}
          >
            {strokes ?? '-'}
          </span>
          {/* Inline side event icons */}
          {eventTypes.size > 0 && (
            <span className="flex items-center gap-0.5">
              {Array.from(eventTypes.entries()).map(([type, count]) => {
                const config = SIDE_EVENT_ICONS[type]
                if (!config) return null
                const Icon = config.icon
                return (
                  <span
                    key={type}
                    className="inline-flex items-center"
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
            </span>
          )}
        </div>
      </td>
      {showNet && (
        <td
          className={`px-1 py-1 text-center tabular-nums font-medium ${netColor}`}
        >
          {net ?? '-'}
        </td>
      )}
    </tr>
  )
}

/** Subtotal row (Out / In) */
function SubtotalRow({
  label,
  par,
  gross,
  net,
  showNet,
  girCount,
  sandCount,
  snakeCount,
}: {
  label: string
  par: number
  gross: number | null
  net: number | null
  showNet: boolean
  girCount: number
  sandCount: number
  snakeCount: number
}) {
  const hasStats = girCount > 0 || sandCount > 0 || snakeCount > 0

  return (
    <tr className="bg-muted/50 border-t font-medium">
      <td className="px-1 py-1 text-left">{label}</td>
      <td className="px-1 py-1 text-center tabular-nums">{par}</td>
      <td className="px-1 py-1" />
      <td className="px-1 py-1 text-center">
        <div className="flex items-center justify-center gap-1">
          <span className="tabular-nums">{gross ?? '-'}</span>
          {hasStats && (
            <span className="flex items-center gap-0.5 text-[10px]">
              {girCount > 0 && (
                <span title={`${girCount} GIR`}>
                  <SIDE_EVENT_ICONS.gir.icon className="size-3 text-emerald-500" />
                </span>
              )}
              {sandCount > 0 && (
                <span title={`${sandCount} Bunker Save`}>
                  <SIDE_EVENT_ICONS.bunker_save.icon className="size-3 text-orange-500" />
                </span>
              )}
              {snakeCount > 0 && (
                <span title={`${snakeCount} Snake`}>
                  <SIDE_EVENT_ICONS.snake.icon className="size-3 text-red-500" />
                </span>
              )}
            </span>
          )}
        </div>
      </td>
      {showNet && (
        <td className="px-1 py-1 text-center tabular-nums">{net ?? '-'}</td>
      )}
    </tr>
  )
}

/** Compact event totals shown in the summary footer */
function EventTotals({ sideEvents }: { sideEvents: SideEventLog[] }) {
  const counts = new Map<string, number>()
  for (const evt of sideEvents) {
    counts.set(evt.type, (counts.get(evt.type) ?? 0) + 1)
  }

  const SHOW_TYPES = [
    'birdie',
    'eagle',
    'hio',
    'albatross',
    'gir',
    'bunker_save',
    'snake',
    'snopp',
  ] as const

  const visible = SHOW_TYPES.filter((t) => (counts.get(t) ?? 0) > 0)
  if (visible.length === 0) return null

  return (
    <span className="flex items-center gap-1.5">
      {visible.map((type) => {
        const config = SIDE_EVENT_ICONS[type]
        if (!config) return null
        const Icon = config.icon
        const count = counts.get(type) ?? 0
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
    </span>
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
