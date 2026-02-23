import { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { useScoringStore } from '@/features/scoring'
import { useSideEventsStore } from '@/features/side-events'
import { useFeedStore } from '@/features/feed'
import type { Scorecard, HoleStroke } from '@/features/scoring'
import type { Hole } from '@/features/courses'
import type { RoundFormat, Team } from '@/features/rounds'
import type { Player } from '@/features/players/types'
import type { SideEventLog, SideEventType } from '@/features/side-events'
import { stablefordPointsForHole } from '@/features/scoring/lib/scoring-calc'
import { Minus, Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { SIDE_EVENT_ICONS } from '@/lib/side-event-icons'
import { useIsMobile } from '@/hooks/use-is-mobile'

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

function getScoreCellClass(strokes: HoleStroke, par: number): string {
  if (strokes === null) return 'bg-muted/50 text-muted-foreground'
  const diff = strokes - par
  if (diff <= -2)
    return 'bg-yellow-500/90 text-yellow-950 dark:bg-yellow-600 dark:text-yellow-50' // eagle or better
  if (diff === -1) return 'bg-primary text-primary-foreground' // birdie
  if (diff === 0) return 'bg-background text-foreground' // par
  if (diff === 1)
    return 'bg-orange-100 text-orange-800 dark:bg-orange-800/50 dark:text-orange-200' // bogey
  return 'bg-red-100 text-red-800 dark:bg-red-800/50 dark:text-red-200' // double+
}

/** Human-readable label for a score relative to par */
function getScoreLabel(strokes: number, par: number): string {
  const diff = strokes - par
  if (strokes === 1) return 'Hole in One'
  if (diff <= -3) return 'Albatross'
  if (diff === -2) return 'Eagle'
  if (diff === -1) return 'Birdie'
  if (diff === 0) return 'Par'
  if (diff === 1) return 'Bogey'
  if (diff === 2) return 'Double Bogey'
  if (diff === 3) return 'Triple Bogey'
  return `+${diff}`
}

/** CSS class for score label */
function getScoreLabelClass(strokes: number, par: number): string {
  const diff = strokes - par
  if (strokes === 1) return 'text-amber-500 font-bold'
  if (diff <= -2) return 'text-yellow-500 font-semibold'
  if (diff === -1) return 'text-primary font-semibold'
  if (diff === 0) return 'text-muted-foreground'
  if (diff === 1) return 'text-orange-600'
  return 'text-red-600'
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

// --- Auto-detection ---

/** Counter for generating unique notable event IDs */
let nextNotableId = 1

/** Side event types that are automatically derived from score vs par */
const AUTO_DETECT_TYPES: SideEventType[] = [
  'birdie',
  'eagle',
  'albatross',
  'hio',
]

/**
 * Given strokes and par, determine which auto-detectable side event (if any) applies.
 * Returns null if the score doesn't qualify for any auto event.
 */
function getAutoEventType(
  strokes: number | null,
  par: number
): SideEventType | null {
  if (strokes === null) return null
  if (strokes === 1) return 'hio'
  const diff = strokes - par
  if (diff <= -3) return 'albatross'
  if (diff === -2) return 'eagle'
  if (diff === -1) return 'birdie'
  return null
}

// --- Component ---

/** Truncate name for narrow columns */
function shortName(name: string): string {
  if (name.length <= 8) return name
  if (name.includes(' & ')) {
    const parts = name.split(' & ')
    return parts.map((p) => p.charAt(0)).join('&')
  }
  return name.slice(0, 7) + '\u2026'
}

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
  const logEvent = useSideEventsStore((s) => s.logEvent)
  const removeEvent = useSideEventsStore((s) => s.removeEvent)
  const allSideEvents = useSideEventsStore((s) => s.events)
  const isMobile = useIsMobile()

  const roundEvents = allSideEvents.filter((e) => e.roundId === roundId)

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

  // Overlay state: which hole is being edited, and which participant tab is active
  const [overlayHoleIdx, setOverlayHoleIdx] = useState<number | null>(null)
  const [overlayPIdx, setOverlayPIdx] = useState<number>(0)

  const totalHoles = holes.length
  const hasFront = totalHoles >= 9
  const hasBack = totalHoles > 9

  const gridRef = useRef<HTMLTableElement>(null)

  function openOverlay(holeIndex: number, participantIndex: number) {
    setOverlayHoleIdx(holeIndex)
    setOverlayPIdx(participantIndex)
  }

  function closeOverlay() {
    setOverlayHoleIdx(null)
  }

  /** Keyboard navigation for the score grid (arrow keys + Enter/Space) */
  function handleGridKeyDown(e: React.KeyboardEvent<HTMLTableElement>) {
    const target = e.target as HTMLElement
    if (!target.matches('[role="gridcell"] button')) return

    const cell = target.closest('[role="gridcell"]') as HTMLElement | null
    if (!cell) return

    const row = cell.closest('tr')
    if (!row) return

    const cells = Array.from(
      row.querySelectorAll<HTMLElement>('[role="gridcell"] button')
    )
    const cellIdx = cells.indexOf(target)

    const tbody = row.closest('tbody')
    if (!tbody) return

    // Collect all data rows (skip subtotal and total rows — they have no gridcell buttons)
    const allRows = Array.from(tbody.querySelectorAll('tr')).filter(
      (r) => r.querySelector('[role="gridcell"] button') !== null
    )
    const rowIdx = allRows.indexOf(row)

    let nextTarget: HTMLElement | null = null

    switch (e.key) {
      case 'ArrowRight':
        if (cellIdx < cells.length - 1) nextTarget = cells[cellIdx + 1]
        break
      case 'ArrowLeft':
        if (cellIdx > 0) nextTarget = cells[cellIdx - 1]
        break
      case 'ArrowDown':
        if (rowIdx < allRows.length - 1) {
          const nextRow = allRows[rowIdx + 1]
          const nextCells = Array.from(
            nextRow.querySelectorAll<HTMLElement>('[role="gridcell"] button')
          )
          nextTarget = nextCells[cellIdx] ?? nextCells[nextCells.length - 1]
        }
        break
      case 'ArrowUp':
        if (rowIdx > 0) {
          const prevRow = allRows[rowIdx - 1]
          const prevCells = Array.from(
            prevRow.querySelectorAll<HTMLElement>('[role="gridcell"] button')
          )
          nextTarget = prevCells[cellIdx] ?? prevCells[prevCells.length - 1]
        }
        break
      default:
        return // don't preventDefault for other keys
    }

    if (nextTarget) {
      e.preventDefault()
      // Roving tabindex: move tabIndex from current to next
      target.tabIndex = -1
      nextTarget.tabIndex = 0
      nextTarget.focus()
    }
  }

  /**
   * Resolve the playerId for side event logging.
   * For individual formats, it's the participant id.
   * For team formats, use the first player in the team.
   */
  function resolvePlayerId(participantId: string): string {
    const team = teams?.find((t) => t.id === participantId)
    return team ? team.playerIds[0] : participantId
  }

  /** Resolve a human-readable name for the participant (player or team) */
  function resolvePlayerName(participantId: string): string {
    const p = participants.find((p) => p.id === participantId)
    return p?.name ?? 'Unknown'
  }

  /**
   * After a score change, sync auto-detectable side events (birdie/eagle/albatross/HIO).
   * - Removes existing auto-events that no longer match the new score
   * - Adds the correct auto-event if the score qualifies
   */
  function syncAutoSideEvents(
    holeIdx: number,
    participantId: string,
    newStrokes: number | null
  ) {
    const hole = holes[holeIdx]
    if (!hole) return

    const playerId = resolvePlayerId(participantId)
    const holeNumber = hole.holeNumber

    // Get current round events from store (fresh read)
    const currentEvents = useSideEventsStore
      .getState()
      .getEventsByRound(roundId)

    // Find existing auto-detectable events for this hole + player
    const existingAutoEvents = currentEvents.filter(
      (e) =>
        e.holeNumber === holeNumber &&
        e.playerId === playerId &&
        AUTO_DETECT_TYPES.includes(e.type)
    )

    // Determine what auto-event the new score should produce
    const expectedType = getAutoEventType(newStrokes, hole.par)

    // Check if the correct event already exists
    const alreadyCorrect = existingAutoEvents.some(
      (e) => e.type === expectedType
    )

    if (alreadyCorrect && existingAutoEvents.length === 1) {
      // Perfect — nothing to do
      return
    }

    // Remove all existing auto-events that don't match
    for (const evt of existingAutoEvents) {
      if (evt.type !== expectedType) {
        removeEvent(evt.id)
      }
    }

    // Add the new auto-event if needed (and doesn't already exist)
    if (expectedType && !alreadyCorrect) {
      logEvent({
        tournamentId,
        roundId,
        holeNumber,
        playerId,
        type: expectedType,
        createdByPlayerId: currentPlayerId,
      })

      // Push notable event for the animated feed banner
      const playerName = resolvePlayerName(participantId)
      useFeedStore.getState().pushNotableEvent({
        id: `notable-${String(nextNotableId++).padStart(3, '0')}`,
        kind: expectedType as 'birdie' | 'eagle' | 'albatross' | 'hio',
        playerName,
        holeNumber,
        createdAt: new Date().toISOString(),
      })
    }
  }

  /** Auto-save: immediately persist the stroke value + sync side events */
  function setStroke(holeIdx: number, pIdx: number, value: number | null) {
    const p = participants[pIdx]
    if (!p) return
    setHoleStroke(p.scorecard.id, holeIdx, value, holes, p.handicap, format)
    syncAutoSideEvents(holeIdx, p.id, value)
  }

  function incrementStroke(holeIdx: number, pIdx: number) {
    const p = participants[pIdx]
    if (!p) return
    const current = p.scorecard.holeStrokes[holeIdx]
    const newVal =
      current !== null ? Math.min(15, current + 1) : holes[holeIdx].par
    setStroke(holeIdx, pIdx, newVal)
  }

  function decrementStroke(holeIdx: number, pIdx: number) {
    const p = participants[pIdx]
    if (!p) return
    const current = p.scorecard.holeStrokes[holeIdx]
    if (current === null) {
      setStroke(holeIdx, pIdx, holes[holeIdx].par)
    } else if (current > 1) {
      setStroke(holeIdx, pIdx, current - 1)
    }
  }

  /** Get side event icons for a specific hole + participant */
  function getHoleEvents(
    holeNumber: number,
    participantId: string
  ): SideEventLog[] {
    const team = teams?.find((t) => t.id === participantId)
    const playerIds = team ? team.playerIds : [participantId]
    return roundEvents.filter(
      (e) => e.holeNumber === holeNumber && playerIds.includes(e.playerId)
    )
  }

  function renderHoleRows(holeSubset: Hole[]) {
    return holeSubset.map((hole) => {
      const holeIdx = hole.holeNumber - 1

      return (
        <tr key={hole.holeNumber} className="border-b last:border-b-0">
          {/* Hole number */}
          <td className="bg-muted/30 px-1 py-0.5 text-center text-[11px] font-medium tabular-nums">
            {hole.holeNumber}
          </td>
          {/* Par */}
          <td className="bg-muted/30 text-muted-foreground px-1 py-0.5 text-center text-[11px] tabular-nums">
            {hole.par}
          </td>
          {/* SI */}
          <td className="bg-muted/30 text-muted-foreground px-1 py-0.5 text-center text-[11px] tabular-nums">
            {hole.strokeIndex}
          </td>
          {/* Player/team score cells */}
          {participants.map((p, pIdx) => {
            const strokes = p.scorecard.holeStrokes[holeIdx]
            const isHighlighted =
              overlayHoleIdx === holeIdx && overlayPIdx === pIdx
            const events = getHoleEvents(hole.holeNumber, p.id)
            const uniqueTypes = [...new Set(events.map((e) => e.type))]

            return (
              <td
                key={p.id}
                className="border-l border-border/50 p-0"
                role="gridcell"
              >
                <button
                  type="button"
                  onClick={() => openOverlay(holeIdx, pIdx)}
                  tabIndex={holeIdx === 0 && pIdx === 0 ? 0 : -1}
                  aria-label={`Hole ${hole.holeNumber}, ${p.name}${strokes !== null ? `, ${strokes} strokes` : ', no score'}`}
                  className={`relative flex w-full min-w-[2.8rem] items-center justify-center px-1 py-1.5 text-sm font-bold tabular-nums transition-all ${
                    isHighlighted
                      ? 'ring-primary border-primary ring-2'
                      : 'hover:ring-primary/30 hover:ring-1'
                  } ${getScoreCellClass(strokes, hole.par)}`}
                >
                  {strokes !== null ? strokes : '\u2013'}
                  {/* Side event icons */}
                  {uniqueTypes.length > 0 && (
                    <span
                      className="absolute right-0.5 top-0 flex gap-px"
                      aria-hidden="true"
                    >
                      {uniqueTypes.slice(0, 2).map((type) => {
                        const config = SIDE_EVENT_ICONS[type]
                        if (!config) return null
                        const Icon = config.icon
                        return (
                          <Icon
                            key={type}
                            className={`size-3 drop-shadow-sm ${config.className}`}
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

  const overlayParticipant =
    overlayHoleIdx !== null ? participants[overlayPIdx] : null
  const overlayHole = overlayHoleIdx !== null ? holes[overlayHoleIdx] : null

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Score Entry</CardTitle>
          {/* Mini leaderboard strip — sorted by gross total (lowest winning) */}
          <div className="mt-1 flex gap-2">
            {[...participants]
              .sort((a, b) => {
                // Players with scores sort before players without
                if (a.scorecard.grossTotal === 0 && b.scorecard.grossTotal > 0)
                  return 1
                if (b.scorecard.grossTotal === 0 && a.scorecard.grossTotal > 0)
                  return -1
                return a.scorecard.grossTotal - b.scorecard.grossTotal
              })
              .map((p, sortedIdx) => {
                const isLeading = sortedIdx === 0 && p.scorecard.grossTotal > 0
                return (
                  <div
                    key={p.id}
                    className={`flex flex-1 flex-col items-center rounded-lg border px-2 py-1.5 ${
                      isLeading
                        ? 'border-primary/40 bg-primary/10'
                        : 'border-border bg-muted/30'
                    }`}
                  >
                    <span className="text-muted-foreground max-w-[5rem] truncate text-[11px]">
                      {shortName(p.name)}
                    </span>
                    <span className="text-lg font-bold tabular-nums">
                      {p.scorecard.grossTotal > 0
                        ? p.scorecard.grossTotal
                        : '\u2013'}
                    </span>
                  </div>
                )
              })}
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto px-0 pb-2">
          <table
            ref={gridRef}
            role="grid"
            aria-label="Score entry grid"
            className="w-full border-collapse text-center"
            onKeyDown={handleGridKeyDown}
          >
            <thead>
              <tr className="bg-muted border-b">
                <th scope="col" className="px-1 py-1 text-[10px] font-semibold">
                  #
                </th>
                <th scope="col" className="px-1 py-1 text-[10px] font-semibold">
                  Par
                </th>
                <th scope="col" className="px-1 py-1 text-[10px] font-semibold">
                  SI
                </th>
                {participants.map((p) => (
                  <th
                    key={p.id}
                    scope="col"
                    className="px-1 py-1.5 text-xs font-semibold"
                  >
                    <div className="flex flex-col items-center">
                      <span className="max-w-[4.5rem] truncate">
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
        </CardContent>
      </Card>

      {/* Score Entry Overlay — Drawer on mobile, Dialog on desktop */}
      <ScoreOverlay
        open={overlayHoleIdx !== null}
        onClose={closeOverlay}
        overlayHole={overlayHole}
        overlayHoleIdx={overlayHoleIdx}
        overlayParticipant={overlayParticipant}
        overlayPIdx={overlayPIdx}
        participants={participants}
        totalHoles={totalHoles}
        format={format}
        isMobile={isMobile}
        onSelectParticipant={setOverlayPIdx}
        onIncrement={() =>
          overlayHoleIdx !== null &&
          incrementStroke(overlayHoleIdx, overlayPIdx)
        }
        onDecrement={() =>
          overlayHoleIdx !== null &&
          decrementStroke(overlayHoleIdx, overlayPIdx)
        }
        onSetStroke={(n) =>
          overlayHoleIdx !== null && setStroke(overlayHoleIdx, overlayPIdx, n)
        }
        onPrevHole={() =>
          overlayHoleIdx !== null &&
          overlayHoleIdx > 0 &&
          setOverlayHoleIdx(overlayHoleIdx - 1)
        }
        onNextHole={() =>
          overlayHoleIdx !== null &&
          overlayHoleIdx < totalHoles - 1 &&
          setOverlayHoleIdx(overlayHoleIdx + 1)
        }
      />
    </>
  )
}

// --- Score Overlay ---

interface ScoreOverlayProps {
  open: boolean
  onClose: () => void
  overlayHole: Hole | null
  overlayHoleIdx: number | null
  overlayParticipant: Participant | null
  overlayPIdx: number
  participants: Participant[]
  totalHoles: number
  format: RoundFormat
  isMobile: boolean
  onSelectParticipant: (idx: number) => void
  onIncrement: () => void
  onDecrement: () => void
  onSetStroke: (n: number) => void
  onPrevHole: () => void
  onNextHole: () => void
}

function ScoreOverlay({
  open,
  onClose,
  overlayHole,
  overlayHoleIdx,
  overlayParticipant,
  overlayPIdx,
  participants,
  totalHoles,
  format,
  isMobile,
  onSelectParticipant,
  onIncrement,
  onDecrement,
  onSetStroke,
  onPrevHole,
  onNextHole,
}: ScoreOverlayProps) {
  const content =
    overlayHole && overlayParticipant && overlayHoleIdx !== null ? (
      <ScoreOverlayContent
        overlayHole={overlayHole}
        overlayHoleIdx={overlayHoleIdx}
        overlayParticipant={overlayParticipant}
        overlayPIdx={overlayPIdx}
        participants={participants}
        totalHoles={totalHoles}
        format={format}
        onSelectParticipant={onSelectParticipant}
        onIncrement={onIncrement}
        onDecrement={onDecrement}
        onSetStroke={onSetStroke}
        onPrevHole={onPrevHole}
        onNextHole={onNextHole}
      />
    ) : null

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
        <DrawerContent>
          {overlayHole && (
            <DrawerHeader className="sr-only">
              <DrawerTitle>Hole {overlayHole.holeNumber}</DrawerTitle>
              <DrawerDescription>
                Par {overlayHole.par}, SI {overlayHole.strokeIndex}
              </DrawerDescription>
            </DrawerHeader>
          )}
          <div className="px-4 pb-6 pt-2">{content}</div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-sm">
        {overlayHole && (
          <DialogHeader>
            <DialogTitle className="text-center">
              Hole {overlayHole.holeNumber}
            </DialogTitle>
            <DialogDescription className="text-center text-sm">
              Par {overlayHole.par} &middot; SI {overlayHole.strokeIndex}
            </DialogDescription>
          </DialogHeader>
        )}
        {content}
      </DialogContent>
    </Dialog>
  )
}

// --- Score Overlay Content (shared between Drawer & Dialog) ---

/** Format relative score as a string: "+2", "-1", "E" for even */
function formatRelativeScore(strokes: number, par: number): string {
  const diff = strokes - par
  if (diff === 0) return 'E'
  return diff > 0 ? `+${diff}` : `${diff}`
}

/** CSS class for the relative score badge */
function getRelativeBadgeClass(strokes: number, par: number): string {
  const diff = strokes - par
  if (diff <= -2)
    return 'bg-yellow-500/90 text-yellow-950 dark:bg-yellow-600 dark:text-yellow-50' // eagle or better
  if (diff === -1) return 'bg-primary text-primary-foreground' // birdie
  if (diff === 0) return 'bg-muted text-muted-foreground' // par
  if (diff === 1)
    return 'bg-orange-100 text-orange-800 dark:bg-orange-800/50 dark:text-orange-200' // bogey
  return 'bg-red-100 text-red-800 dark:bg-red-800/50 dark:text-red-200' // double+
}

interface ScoreOverlayContentProps {
  overlayHole: Hole
  overlayHoleIdx: number
  overlayParticipant: Participant
  overlayPIdx: number
  participants: Participant[]
  totalHoles: number
  format: RoundFormat
  onSelectParticipant: (idx: number) => void
  onIncrement: () => void
  onDecrement: () => void
  onSetStroke: (n: number) => void
  onPrevHole: () => void
  onNextHole: () => void
}

function ScoreOverlayContent({
  overlayHole,
  overlayHoleIdx,
  overlayParticipant,
  overlayPIdx,
  participants,
  totalHoles,
  format,
  onSelectParticipant,
  onIncrement,
  onDecrement,
  onSetStroke,
  onPrevHole,
  onNextHole,
}: ScoreOverlayContentProps) {
  const currentStrokes =
    overlayParticipant.scorecard.holeStrokes[overlayHoleIdx]

  return (
    <>
      {/* Hole header (visible in Drawer since DialogHeader is sr-only there) */}
      <div className="mb-3 flex items-center justify-center gap-3 sm:hidden">
        <span className="text-lg font-semibold">
          Hole {overlayHole.holeNumber}
        </span>
        <span className="text-muted-foreground text-sm">
          Par {overlayHole.par} &middot; SI {overlayHole.strokeIndex}
        </span>
      </div>

      {/* Player tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-lg border p-1">
        {participants.map((p, idx) => {
          const strokes = p.scorecard.holeStrokes[overlayHoleIdx]
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelectParticipant(idx)}
              className={`flex min-w-0 flex-1 flex-col items-center rounded-md px-2 py-1.5 text-xs transition-colors ${
                idx === overlayPIdx
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
              }`}
            >
              <span className="truncate font-medium">{shortName(p.name)}</span>
              <span
                className={`text-[10px] ${idx === overlayPIdx ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}
              >
                {strokes !== null ? `${strokes}` : '\u2013'}
              </span>
            </button>
          )
        })}
      </div>

      {/* Score entry area */}
      <div className="flex flex-col items-center gap-3 py-2">
        {/* Score display + relative badge */}
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              className="size-12"
              onClick={onDecrement}
              disabled={currentStrokes !== null && currentStrokes <= 1}
              aria-label="Decrease strokes"
            >
              <Minus className="size-5" aria-hidden="true" />
            </Button>
            <div className="flex flex-col items-center">
              <span
                className="w-16 text-center text-4xl font-bold tabular-nums"
                aria-live="polite"
                role="status"
              >
                {currentStrokes ?? '\u2013'}
              </span>
              {/* Relative score badge */}
              {currentStrokes !== null && (
                <span
                  className={`mt-1 inline-flex min-w-[2.5rem] items-center justify-center rounded-full px-2 py-0.5 text-sm font-bold ${getRelativeBadgeClass(currentStrokes, overlayHole.par)}`}
                >
                  {formatRelativeScore(currentStrokes, overlayHole.par)}
                </span>
              )}
            </div>
            <Button
              variant="outline"
              size="icon"
              className="size-12"
              onClick={onIncrement}
              disabled={currentStrokes !== null && currentStrokes >= 15}
              aria-label="Increase strokes"
            >
              <Plus className="size-5" aria-hidden="true" />
            </Button>
          </div>

          {/* Score label */}
          {currentStrokes !== null && (
            <span
              className={`text-sm ${getScoreLabelClass(currentStrokes, overlayHole.par)}`}
            >
              {getScoreLabel(currentStrokes, overlayHole.par)}
            </span>
          )}

          {/* Stableford points */}
          {format === 'stableford' && currentStrokes !== null && (
            <span className="text-muted-foreground text-xs">
              {stablefordPointsForHole(
                currentStrokes,
                overlayHole.par,
                overlayParticipant.handicap,
                overlayHole.strokeIndex,
                totalHoles as 9 | 18
              )}{' '}
              stableford pts
            </span>
          )}
        </div>

        {/* Quick number buttons (1-10) for fast entry */}
        <div className="grid grid-cols-5 gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => {
            const isSelected = currentStrokes === n
            const isPar = n === overlayHole.par
            return (
              <Button
                key={n}
                variant={isSelected ? 'default' : 'outline'}
                className={`h-11 w-11 text-base tabular-nums ${
                  !isSelected && isPar ? 'ring-primary/50 ring-2 font-bold' : ''
                }`}
                onClick={() => onSetStroke(n)}
              >
                {n}
              </Button>
            )
          })}
        </div>
      </div>

      {/* Hole navigation */}
      <div className="flex items-center justify-between border-t pt-3">
        <Button
          variant="outline"
          className="h-10 px-4"
          onClick={onPrevHole}
          disabled={overlayHoleIdx <= 0}
        >
          <ChevronLeft className="size-4" />
          Prev
        </Button>
        <span className="text-muted-foreground text-sm tabular-nums">
          {overlayHoleIdx + 1} / {totalHoles}
        </span>
        <Button
          variant="outline"
          className="h-10 px-4"
          onClick={onNextHole}
          disabled={overlayHoleIdx >= totalHoles - 1}
        >
          Next
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </>
  )
}
