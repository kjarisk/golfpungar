import type { Hole } from '@/features/courses'
import type { HoleStroke } from '../types'
import type { SideEventLog } from '@/features/side-events'
import { SIDE_EVENT_ICONS } from '@/lib/side-event-icons'
import { cn } from '@/lib/utils'

/** Color class for gross score relative to par */
function getScoreColor(strokes: number | null, par: number): string {
  if (strokes == null) return ''
  const diff = strokes - par
  if (diff <= -2)
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
  if (diff === -1)
    return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
  if (diff === 0) return ''
  if (diff === 1)
    return 'bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300'
  return 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'
}

/** Format relative-to-par as "+3", "-2", or "E" */
function formatRelPar(total: number, par: number): string {
  const diff = total - par
  if (diff === 0) return 'E'
  return diff > 0 ? `+${diff}` : `${diff}`
}

/** Color class for relative-to-par text */
function relParColor(total: number, par: number): string {
  const diff = total - par
  if (diff < 0) return 'text-green-700 dark:text-green-400'
  if (diff === 0) return 'text-muted-foreground'
  return 'text-red-600 dark:text-red-400'
}

/** Highlight class for the winner of a hole comparison */
function winnerClass(diff: number): string {
  if (diff < 0) return 'bg-green-100/60 dark:bg-green-900/30'
  if (diff > 0) return 'bg-red-50/60 dark:bg-red-950/30'
  return ''
}

interface PlayerData {
  name: string
  holeStrokes: HoleStroke[]
  grossTotal: number
  netTotal: number | null
  stablefordPoints: number | null
  sideEvents: SideEventLog[]
  groupHandicap?: number
}

interface ScorecardComparisonProps {
  holes: Hole[]
  playerA: PlayerData
  playerB: PlayerData
}

export function ScorecardComparison({
  holes,
  playerA,
  playerB,
}: ScorecardComparisonProps) {
  const sortedHoles = [...holes].sort((a, b) => a.holeNumber - b.holeNumber)
  const front9 = sortedHoles.filter((h) => h.holeNumber <= 9)
  const back9 = sortedHoles.filter((h) => h.holeNumber > 9)
  const hasFront = front9.length > 0
  const hasBack = back9.length > 0

  const totalPar = sortedHoles.reduce((sum, h) => sum + h.par, 0)

  const sumStrokes = (holeList: Hole[], strokes: HoleStroke[]) =>
    holeList.reduce((sum, h) => {
      const s = strokes[h.holeNumber - 1]
      return sum + (s ?? 0)
    }, 0)

  // Side event icons per hole per player
  const buildEventMap = (events: SideEventLog[]) => {
    const map = new Map<number, string[]>()
    for (const evt of events) {
      if (evt.holeNumber != null) {
        const types = map.get(evt.holeNumber) ?? []
        if (!types.includes(evt.type)) types.push(evt.type)
        map.set(evt.holeNumber, types)
      }
    }
    return map
  }

  const eventsA = buildEventMap(playerA.sideEvents)
  const eventsB = buildEventMap(playerB.sideEvents)

  const renderHoleRow = (hole: Hole) => {
    const sA = playerA.holeStrokes[hole.holeNumber - 1]
    const sB = playerB.holeStrokes[hole.holeNumber - 1]
    const colorA = getScoreColor(sA, hole.par)
    const colorB = getScoreColor(sB, hole.par)

    // Determine per-hole winner highlight (lower is better)
    const diff = sA != null && sB != null ? sA - sB : 0
    const cellA = diff < 0 ? winnerClass(-1) : diff > 0 ? winnerClass(1) : ''
    const cellB = diff > 0 ? winnerClass(-1) : diff < 0 ? winnerClass(1) : ''

    const iconsA = (eventsA.get(hole.holeNumber) ?? []).slice(0, 2)
    const iconsB = (eventsB.get(hole.holeNumber) ?? []).slice(0, 2)

    return (
      <tr key={hole.id} className="border-b last:border-b-0">
        <td className="px-1 py-1 text-center font-medium tabular-nums">
          {hole.holeNumber}
        </td>
        <td className="px-1 py-1 text-center tabular-nums">{hole.par}</td>
        <td className={cn('px-1 py-1 text-center tabular-nums', colorA, cellA)}>
          <div className="flex items-center justify-center gap-0.5">
            {sA ?? '—'}
            {iconsA.map((type) => {
              const config =
                SIDE_EVENT_ICONS[type as keyof typeof SIDE_EVENT_ICONS]
              if (!config) return null
              const Icon = config.icon
              return (
                <Icon key={type} className={cn('size-2.5', config.className)} />
              )
            })}
          </div>
        </td>
        <td className={cn('px-1 py-1 text-center tabular-nums', colorB, cellB)}>
          <div className="flex items-center justify-center gap-0.5">
            {sB ?? '—'}
            {iconsB.map((type) => {
              const config =
                SIDE_EVENT_ICONS[type as keyof typeof SIDE_EVENT_ICONS]
              if (!config) return null
              const Icon = config.icon
              return (
                <Icon key={type} className={cn('size-2.5', config.className)} />
              )
            })}
          </div>
        </td>
      </tr>
    )
  }

  const renderSubtotal = (label: string, holeList: Hole[]) => {
    const grossA = sumStrokes(holeList, playerA.holeStrokes)
    const grossB = sumStrokes(holeList, playerB.holeStrokes)
    const par = holeList.reduce((sum, h) => sum + h.par, 0)
    return (
      <tr className="bg-muted/40 border-b font-semibold">
        <td className="px-1 py-1 text-center text-[10px] uppercase">{label}</td>
        <td className="px-1 py-1 text-center tabular-nums">{par}</td>
        <td className="px-1 py-1 text-center tabular-nums">{grossA || '—'}</td>
        <td className="px-1 py-1 text-center tabular-nums">{grossB || '—'}</td>
      </tr>
    )
  }

  // Count holes won by each player
  let winsA = 0
  let winsB = 0
  for (const hole of sortedHoles) {
    const sA = playerA.holeStrokes[hole.holeNumber - 1]
    const sB = playerB.holeStrokes[hole.holeNumber - 1]
    if (sA != null && sB != null) {
      if (sA < sB) winsA++
      else if (sB < sA) winsB++
    }
  }

  return (
    <div className="flex flex-col gap-2" data-testid="scorecard-comparison">
      {/* Match summary header */}
      <div className="flex items-center justify-between gap-2 text-sm">
        <div className="flex flex-col items-start">
          <span className="font-semibold">{playerA.name}</span>
          <span
            className={cn(
              'text-xs tabular-nums',
              relParColor(playerA.grossTotal, totalPar)
            )}
          >
            {playerA.grossTotal > 0
              ? formatRelPar(playerA.grossTotal, totalPar)
              : '—'}
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs tabular-nums">
          <span
            className={cn(
              'rounded px-1.5 py-0.5 font-bold',
              winsA > winsB
                ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                : 'bg-muted'
            )}
          >
            {winsA}
          </span>
          <span className="text-muted-foreground">-</span>
          <span
            className={cn(
              'rounded px-1.5 py-0.5 font-bold',
              winsB > winsA
                ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                : 'bg-muted'
            )}
          >
            {winsB}
          </span>
        </div>
        <div className="flex flex-col items-end">
          <span className="font-semibold">{playerB.name}</span>
          <span
            className={cn(
              'text-xs tabular-nums',
              relParColor(playerB.grossTotal, totalPar)
            )}
          >
            {playerB.grossTotal > 0
              ? formatRelPar(playerB.grossTotal, totalPar)
              : '—'}
          </span>
        </div>
      </div>

      {/* Comparison table */}
      <table className="w-full text-xs" role="table">
        <thead>
          <tr className="text-muted-foreground border-b">
            <th className="w-8 px-1 py-1 text-center font-medium">Hole</th>
            <th className="w-8 px-1 py-1 text-center font-medium">Par</th>
            <th className="px-1 py-1 text-center font-medium">
              {playerA.name.split(' ')[0]}
            </th>
            <th className="px-1 py-1 text-center font-medium">
              {playerB.name.split(' ')[0]}
            </th>
          </tr>
        </thead>
        <tbody>
          {hasFront && (
            <>
              {front9.map(renderHoleRow)}
              {renderSubtotal('Out', front9)}
            </>
          )}
          {hasBack && (
            <>
              {back9.map(renderHoleRow)}
              {renderSubtotal('In', back9)}
            </>
          )}
        </tbody>
      </table>

      {/* Summary footer */}
      <div className="flex justify-between border-t pt-2 text-xs tabular-nums">
        <div className="flex flex-col gap-0.5">
          <span className="text-muted-foreground">
            Gross:{' '}
            <strong className="text-foreground">
              {playerA.grossTotal || '—'}
            </strong>
          </span>
          {playerA.netTotal != null && (
            <span className="text-muted-foreground">
              Net:{' '}
              <strong className="text-foreground">{playerA.netTotal}</strong>
            </span>
          )}
          {playerA.stablefordPoints != null && (
            <span className="text-muted-foreground">
              Stbl:{' '}
              <strong className="text-foreground">
                {playerA.stablefordPoints}
              </strong>
            </span>
          )}
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <span className="text-muted-foreground">
            Gross:{' '}
            <strong className="text-foreground">
              {playerB.grossTotal || '—'}
            </strong>
          </span>
          {playerB.netTotal != null && (
            <span className="text-muted-foreground">
              Net:{' '}
              <strong className="text-foreground">{playerB.netTotal}</strong>
            </span>
          )}
          {playerB.stablefordPoints != null && (
            <span className="text-muted-foreground">
              Stbl:{' '}
              <strong className="text-foreground">
                {playerB.stablefordPoints}
              </strong>
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
