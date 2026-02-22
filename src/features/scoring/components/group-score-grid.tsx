import { useState, useRef, useEffect } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useScoringStore } from '@/features/scoring'
import { useSideEventsStore } from '@/features/side-events'
import type { Scorecard, HoleStroke } from '@/features/scoring'
import type { Hole } from '@/features/courses'
import type { RoundFormat, Team } from '@/features/rounds'
import type { Player } from '@/features/players/types'
import type { SideEventLog, SideEventType } from '@/features/side-events'
import { stablefordPointsForHole } from '@/features/scoring/lib/scoring-calc'
import {
  Minus,
  Plus,
  Check,
  X,
  Bird,
  Skull,
  Flame,
  Zap,
  Star,
  CircleDot,
  Target,
} from 'lucide-react'

// --- Types ---

interface Participant {
  id: string
  name: string
  handicap: number
  scorecard: Scorecard
}

interface GroupScoreGridProps {
  roundId: string
  tournamentId: string
  holes: Hole[]
  format: RoundFormat
  /** Players in the group (individual formats) */
  players?: Player[]
  /** Teams in the group (team formats) */
  teams?: Team[]
  /** All players for name lookups and handicap */
  allPlayers: Player[]
  /** Scorecards for this round */
  scorecards: Scorecard[]
  /** Current logged-in player ID (for createdByPlayerId on side events) */
  currentPlayerId: string
}

// --- Helpers ---

/** Side event icons to show on score cells */
const SIDE_EVENT_ICONS: Record<
  string,
  { icon: typeof Bird; className: string }
> = {
  birdie: { icon: Bird, className: 'text-green-600' },
  eagle: { icon: Zap, className: 'text-yellow-500' },
  hio: { icon: Star, className: 'text-amber-400' },
  albatross: { icon: Bird, className: 'text-purple-500' },
  snake: { icon: Skull, className: 'text-red-500' },
  snopp: { icon: Flame, className: 'text-red-700' },
  gir: { icon: CircleDot, className: 'text-emerald-500' },
}

/** Inline quick-action buttons shown in the number pad for fast side event logging */
const INLINE_SIDE_EVENTS: {
  type: SideEventType
  label: string
  icon: typeof Bird
  className: string
}[] = [
  { type: 'birdie', label: 'Birdie', icon: Bird, className: 'text-green-600' },
  { type: 'eagle', label: 'Eagle', icon: Zap, className: 'text-yellow-500' },
  { type: 'snake', label: 'Snake', icon: Skull, className: 'text-red-500' },
  { type: 'snopp', label: 'Snopp', icon: Flame, className: 'text-red-700' },
  { type: 'gir', label: 'GIR', icon: CircleDot, className: 'text-emerald-500' },
  {
    type: 'bunker_save',
    label: 'Bunker',
    icon: Target,
    className: 'text-orange-500',
  },
  {
    type: 'hio',
    label: 'HIO',
    icon: Star,
    className: 'text-amber-400',
  },
]

function getScoreCellClass(strokes: HoleStroke, par: number): string {
  if (strokes === null) return 'bg-muted/50 text-muted-foreground'
  const diff = strokes - par
  if (diff <= -2) return 'bg-yellow-500 text-white' // eagle or better
  if (diff === -1) return 'bg-primary text-primary-foreground' // birdie
  if (diff === 0) return 'bg-background text-foreground' // par
  if (diff === 1)
    return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' // bogey
  return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' // double+
}

function sumStrokes(strokes: HoleStroke[], from: number, to: number): number {
  let total = 0
  for (let i = from; i < to; i++) {
    if (strokes[i] !== null) total += strokes[i]!
  }
  return total
}

function computeSubtotalPar(holes: Hole[], from: number, to: number): number {
  return holes.slice(from, to).reduce((s, h) => s + h.par, 0)
}

// --- Component ---

export function GroupScoreGrid({
  roundId,
  tournamentId,
  holes,
  format,
  players,
  teams,
  allPlayers,
  scorecards,
  currentPlayerId,
}: GroupScoreGridProps) {
  const setHoleStroke = useScoringStore((s) => s.setHoleStroke)
  const getEventsByRound = useSideEventsStore((s) => s.getEventsByRound)
  const logEvent = useSideEventsStore((s) => s.logEvent)

  const roundEvents = getEventsByRound(roundId)

  // Build participant list (players or teams)
  const participants: Participant[] =
    teams && teams.length > 0
      ? teams
          .map((team) => {
            const sc = scorecards.find((s) => s.teamId === team.id)
            const teamPlayers = allPlayers.filter((p) =>
              team.playerIds.includes(p.id)
            )
            const avgHandicap =
              teamPlayers.length > 0
                ? Math.round(
                    teamPlayers.reduce((sum, p) => sum + p.groupHandicap, 0) /
                      teamPlayers.length
                  )
                : 0
            return {
              id: team.id,
              name: team.name,
              handicap: avgHandicap,
              scorecard: sc!,
            }
          })
          .filter((p) => p.scorecard)
      : (players ?? [])
          .map((player) => {
            const sc = scorecards.find((s) => s.playerId === player.id)
            return {
              id: player.id,
              name: player.displayName,
              handicap: player.groupHandicap,
              scorecard: sc!,
            }
          })
          .filter((p) => p.scorecard)

  // Active cell state: [holeIndex, participantIndex]
  const [activeCell, setActiveCell] = useState<[number, number] | null>(null)
  const [pendingStrokes, setPendingStrokes] = useState<number>(4)

  const totalHoles = holes.length
  const hasFront = totalHoles >= 9
  const hasBack = totalHoles > 9

  // Scroll to number pad when active
  const padRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (activeCell !== null && padRef.current) {
      padRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [activeCell])

  function openCell(holeIndex: number, participantIndex: number) {
    setActiveCell([holeIndex, participantIndex])
    const p = participants[participantIndex]
    if (!p) return
    const existing = p.scorecard.holeStrokes[holeIndex]
    setPendingStrokes(existing ?? holes[holeIndex].par)
  }

  function confirmStroke() {
    if (activeCell === null) return
    const [holeIdx, pIdx] = activeCell
    const p = participants[pIdx]
    if (!p) return

    setHoleStroke(
      p.scorecard.id,
      holeIdx,
      pendingStrokes,
      holes,
      p.handicap,
      format
    )

    // Auto-advance: next participant in same hole, or first participant in next hole
    const nextPIdx = pIdx + 1
    if (nextPIdx < participants.length) {
      openCell(holeIdx, nextPIdx)
    } else {
      const nextHole = holeIdx + 1
      if (nextHole < holes.length) {
        openCell(nextHole, 0)
      } else {
        setActiveCell(null)
      }
    }
  }

  function clearCell() {
    if (activeCell === null) return
    const [holeIdx, pIdx] = activeCell
    const p = participants[pIdx]
    if (!p) return
    setHoleStroke(p.scorecard.id, holeIdx, null, holes, p.handicap, format)
    setActiveCell(null)
  }

  /** Log a side event for the currently active cell's hole + participant */
  function handleInlineSideEvent(eventType: SideEventType) {
    if (activeCell === null) return
    const [holeIdx, pIdx] = activeCell
    const participant = participants[pIdx]
    if (!participant) return
    const hole = holes[holeIdx]
    if (!hole) return

    // For teams, log under the first player in the team
    const team = teams?.find((t) => t.id === participant.id)
    const playerId = team ? team.playerIds[0] : participant.id

    logEvent({
      tournamentId,
      roundId,
      holeNumber: hole.holeNumber,
      playerId,
      type: eventType,
      createdByPlayerId: currentPlayerId,
    })

    const config = INLINE_SIDE_EVENTS.find((e) => e.type === eventType)
    toast(
      `${participant.name} — ${config?.label ?? eventType} on #${hole.holeNumber}`,
      {
        duration: 2500,
      }
    )
  }

  /** Get side event icons for a specific hole + participant */
  function getHoleEvents(
    holeNumber: number,
    participantId: string
  ): SideEventLog[] {
    // For teams, check events for any player on the team
    const team = teams?.find((t) => t.id === participantId)
    const playerIds = team ? team.playerIds : [participantId]
    return roundEvents.filter(
      (e) => e.holeNumber === holeNumber && playerIds.includes(e.playerId)
    )
  }

  /** Truncate name for narrow columns */
  function shortName(name: string): string {
    if (name.length <= 8) return name
    // For team names like "Player A & Player B", use initials
    if (name.includes(' & ')) {
      const parts = name.split(' & ')
      return parts.map((p) => p.charAt(0)).join('&')
    }
    return name.slice(0, 7) + '\u2026'
  }

  function renderHoleRows(holeSubset: Hole[]) {
    return holeSubset.map((hole) => {
      const holeIdx = hole.holeNumber - 1

      return (
        <tr key={hole.holeNumber} className="border-b last:border-b-0">
          {/* Hole number */}
          <td className="bg-muted/30 px-1.5 py-1 text-center text-xs font-medium tabular-nums">
            {hole.holeNumber}
          </td>
          {/* Par */}
          <td className="bg-muted/30 text-muted-foreground px-1.5 py-1 text-center text-xs tabular-nums">
            {hole.par}
          </td>
          {/* SI */}
          <td className="bg-muted/30 text-muted-foreground px-1.5 py-1 text-center text-xs tabular-nums">
            {hole.strokeIndex}
          </td>
          {/* Player/team score cells */}
          {participants.map((p, pIdx) => {
            const strokes = p.scorecard.holeStrokes[holeIdx]
            const isActive =
              activeCell?.[0] === holeIdx && activeCell?.[1] === pIdx
            const events = getHoleEvents(hole.holeNumber, p.id)
            const uniqueTypes = [...new Set(events.map((e) => e.type))]

            return (
              <td key={p.id} className="p-0">
                <button
                  type="button"
                  onClick={() => openCell(holeIdx, pIdx)}
                  aria-label={`Hole ${hole.holeNumber}, ${p.name}${strokes !== null ? `, ${strokes} strokes` : ', no score'}`}
                  aria-pressed={isActive}
                  className={`relative flex w-full min-w-[2.8rem] items-center justify-center px-1 py-1.5 text-sm font-bold tabular-nums transition-all ${
                    isActive
                      ? 'ring-primary border-primary ring-2'
                      : 'hover:ring-primary/30 hover:ring-1'
                  } ${getScoreCellClass(strokes, hole.par)}`}
                >
                  {strokes !== null ? strokes : '\u2013'}
                  {/* Side event icons */}
                  {uniqueTypes.length > 0 && (
                    <span className="absolute right-0.5 top-0 flex gap-px">
                      {uniqueTypes.slice(0, 2).map((type) => {
                        const config = SIDE_EVENT_ICONS[type]
                        if (!config) return null
                        const Icon = config.icon
                        return (
                          <Icon
                            key={type}
                            className={`size-2.5 ${config.className}`}
                          />
                        )
                      })}
                    </span>
                  )}
                </button>
              </td>
            )
          })}
        </tr>
      )
    })
  }

  function renderSubtotalRow(label: string, from: number, to: number) {
    const par = computeSubtotalPar(holes, from, to)
    return (
      <tr className="bg-muted/50 border-b font-medium">
        <td colSpan={2} className="px-1.5 py-1 text-right text-xs">
          {label}
        </td>
        <td className="text-muted-foreground px-1.5 py-1 text-center text-xs tabular-nums">
          {par}
        </td>
        {participants.map((p) => {
          const sub = sumStrokes(p.scorecard.holeStrokes, from, to)
          return (
            <td
              key={p.id}
              className="px-1.5 py-1 text-center text-xs font-semibold tabular-nums"
            >
              {sub > 0 ? sub : '\u2013'}
            </td>
          )
        })}
      </tr>
    )
  }

  function renderTotalsRow() {
    const totalPar = holes.reduce((s, h) => s + h.par, 0)
    return (
      <>
        <tr className="bg-muted border-t-2 font-bold">
          <td colSpan={2} className="px-1.5 py-1.5 text-right text-xs">
            Total
          </td>
          <td className="px-1.5 py-1.5 text-center text-xs tabular-nums">
            {totalPar}
          </td>
          {participants.map((p) => (
            <td
              key={p.id}
              className="px-1.5 py-1.5 text-center text-sm tabular-nums"
            >
              {p.scorecard.grossTotal > 0 ? p.scorecard.grossTotal : '\u2013'}
            </td>
          ))}
        </tr>
        {/* Net row */}
        <tr className="bg-muted/70">
          <td
            colSpan={3}
            className="text-muted-foreground px-1.5 py-1 text-right text-xs"
          >
            Net
          </td>
          {participants.map((p) => (
            <td
              key={p.id}
              className="text-muted-foreground px-1.5 py-1 text-center text-xs tabular-nums"
            >
              {p.scorecard.netTotal !== null ? p.scorecard.netTotal : '\u2013'}
            </td>
          ))}
        </tr>
        {/* Stableford row (if format is stableford) */}
        {format === 'stableford' && (
          <tr className="bg-muted/70">
            <td
              colSpan={3}
              className="text-muted-foreground px-1.5 py-1 text-right text-xs"
            >
              Stb
            </td>
            {participants.map((p) => (
              <td
                key={p.id}
                className="px-1.5 py-1 text-center text-xs font-semibold tabular-nums"
              >
                {p.scorecard.stablefordPoints !== null
                  ? p.scorecard.stablefordPoints
                  : '\u2013'}
              </td>
            ))}
          </tr>
        )}
      </>
    )
  }

  if (participants.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground text-sm">
            No scorecards available for this group.
          </p>
        </CardContent>
      </Card>
    )
  }

  const activeParticipant = activeCell ? participants[activeCell[1]] : null
  const activeHole = activeCell ? holes[activeCell[0]] : null

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Score Entry</CardTitle>
          <div className="flex gap-1.5">
            {participants.map((p) => (
              <Badge
                key={p.id}
                variant="outline"
                className="text-xs tabular-nums"
              >
                {shortName(p.name)}:{' '}
                {p.scorecard.grossTotal > 0 ? p.scorecard.grossTotal : '\u2013'}
              </Badge>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto px-0 pb-2">
        <table className="w-full border-collapse text-center">
          <thead>
            <tr className="bg-muted border-b">
              <th className="px-1.5 py-1.5 text-xs font-semibold">#</th>
              <th className="px-1.5 py-1.5 text-xs font-semibold">Par</th>
              <th className="px-1.5 py-1.5 text-xs font-semibold">SI</th>
              {participants.map((p) => (
                <th key={p.id} className="px-1 py-1.5 text-xs font-semibold">
                  <div className="flex flex-col items-center">
                    <span className="truncate max-w-[4.5rem]">
                      {shortName(p.name)}
                    </span>
                    <span className="text-muted-foreground text-[10px] font-normal">
                      hcp {p.handicap}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Front 9 */}
            {hasFront && renderHoleRows(holes.slice(0, 9))}
            {hasFront && renderSubtotalRow('Out', 0, 9)}

            {/* Back 9 */}
            {hasBack && renderHoleRows(holes.slice(9, 18))}
            {hasBack && renderSubtotalRow('In', 9, Math.min(18, totalHoles))}

            {/* Totals */}
            {renderTotalsRow()}
          </tbody>
        </table>

        {/* Number pad input for active cell */}
        {activeCell !== null && activeParticipant && activeHole && (
          <div
            ref={padRef}
            className="bg-muted/50 mx-3 mt-3 flex flex-col items-center gap-3 rounded-lg border p-4"
          >
            <div className="text-center">
              <p className="text-sm font-medium">{activeParticipant.name}</p>
              <p className="text-muted-foreground text-xs">
                Hole {activeHole.holeNumber} &middot; Par {activeHole.par}{' '}
                &middot; SI {activeHole.strokeIndex}
              </p>
              {format === 'stableford' && (
                <p className="text-muted-foreground mt-0.5 text-[10px]">
                  Stableford:{' '}
                  {stablefordPointsForHole(
                    pendingStrokes,
                    activeHole.par,
                    activeParticipant.handicap,
                    activeHole.strokeIndex,
                    totalHoles as 9 | 18
                  )}{' '}
                  pts
                </p>
              )}
            </div>

            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPendingStrokes((s) => Math.max(1, s - 1))}
                disabled={pendingStrokes <= 1}
                aria-label="Decrease strokes"
              >
                <Minus className="size-5" aria-hidden="true" />
              </Button>
              <span
                className="w-12 text-center text-3xl font-bold tabular-nums"
                aria-live="polite"
                role="status"
              >
                {pendingStrokes}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPendingStrokes((s) => Math.min(15, s + 1))}
                disabled={pendingStrokes >= 15}
                aria-label="Increase strokes"
              >
                <Plus className="size-5" aria-hidden="true" />
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearCell}
                className="text-muted-foreground"
              >
                <X className="size-4" />
                Clear
              </Button>
              <Button size="sm" onClick={confirmStroke}>
                <Check className="size-4" />
                Confirm
              </Button>
            </div>

            {/* Inline side event quick-actions */}
            <div className="flex flex-col items-center gap-1.5 border-t pt-3">
              <span className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">
                Side Events
              </span>
              <div className="flex flex-wrap justify-center gap-1.5">
                {INLINE_SIDE_EVENTS.map((evt) => {
                  const Icon = evt.icon
                  // Check if this event is already logged for this hole+participant
                  const existingEvents = getHoleEvents(
                    activeHole!.holeNumber,
                    activeParticipant!.id
                  )
                  const alreadyLogged = existingEvents.some(
                    (e) => e.type === evt.type
                  )
                  // Snopp can be logged multiple times
                  const showDot = alreadyLogged && evt.type !== 'snopp'
                  return (
                    <Button
                      key={evt.type}
                      variant="outline"
                      size="sm"
                      className={`relative h-8 gap-1 px-2 text-xs ${showDot ? 'border-primary/50' : ''}`}
                      onClick={() => handleInlineSideEvent(evt.type)}
                    >
                      <Icon className={`size-3.5 ${evt.className}`} />
                      {evt.label}
                      {showDot && (
                        <span className="bg-primary absolute -right-0.5 -top-0.5 size-2 rounded-full" />
                      )}
                    </Button>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
