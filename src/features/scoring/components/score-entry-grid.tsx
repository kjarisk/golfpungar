import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useScoringStore } from '@/features/scoring'
import type { Scorecard, HoleStroke } from '@/features/scoring'
import type { Hole } from '@/features/courses'
import type { RoundFormat } from '@/features/rounds'
import { stablefordPointsForHole } from '@/features/scoring/lib/scoring-calc'
import { Minus, Plus, Check, X } from 'lucide-react'

interface ScoreEntryGridProps {
  scorecard: Scorecard
  holes: Hole[]
  groupHandicap: number
  format: RoundFormat
  playerName: string
}

export function ScoreEntryGrid({
  scorecard,
  holes,
  groupHandicap,
  format,
  playerName,
}: ScoreEntryGridProps) {
  const setHoleStroke = useScoringStore((s) => s.setHoleStroke)
  const [activeHole, setActiveHole] = useState<number | null>(null)
  const [pendingStrokes, setPendingStrokes] = useState<number>(4)

  const totalHoles = holes.length as 9 | 18
  const frontNine = holes.filter((h) => h.holeNumber <= 9)
  const backNine = holes.filter((h) => h.holeNumber > 9)

  const enteredCount = scorecard.holeStrokes.filter((s) => s !== null).length

  function openHole(holeIndex: number) {
    setActiveHole(holeIndex)
    const existing = scorecard.holeStrokes[holeIndex]
    setPendingStrokes(existing ?? holes[holeIndex].par)
  }

  function confirmStroke() {
    if (activeHole === null) return
    setHoleStroke(
      scorecard.id,
      activeHole,
      pendingStrokes,
      holes,
      groupHandicap,
      format
    )

    // Auto-advance to next hole
    const next = activeHole + 1
    if (next < holes.length) {
      openHole(next)
    } else {
      setActiveHole(null)
    }
  }

  function clearHole() {
    if (activeHole === null) return
    setHoleStroke(scorecard.id, activeHole, null, holes, groupHandicap, format)
    setActiveHole(null)
  }

  function getHoleCellClass(strokes: HoleStroke, par: number): string {
    if (strokes === null) return 'bg-muted text-muted-foreground'
    const diff = strokes - par
    if (diff <= -2) return 'bg-yellow-500 text-white' // eagle or better
    if (diff === -1) return 'bg-primary text-primary-foreground' // birdie
    if (diff === 0) return 'bg-background text-foreground' // par
    if (diff === 1)
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' // bogey
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' // double+
  }

  function renderHoleRow(holeSubset: Hole[]) {
    return (
      <div className="flex gap-0.5">
        {holeSubset.map((hole) => {
          const idx = hole.holeNumber - 1
          const strokes = scorecard.holeStrokes[idx]
          const isActive = activeHole === idx

          return (
            <button
              key={hole.holeNumber}
              type="button"
              onClick={() => openHole(idx)}
              aria-label={`Hole ${hole.holeNumber}, Par ${hole.par}${strokes !== null ? `, ${strokes} strokes` : ', no score'}`}
              aria-pressed={isActive}
              className={`flex min-w-[2.2rem] flex-1 flex-col items-center rounded-md border px-1 py-1.5 text-xs transition-all ${
                isActive
                  ? 'ring-primary border-primary ring-2'
                  : 'hover:border-primary/50'
              } ${strokes !== null ? getHoleCellClass(strokes, hole.par) : 'bg-muted/50'}`}
            >
              <span className="text-[10px] font-medium opacity-60">
                {hole.holeNumber}
              </span>
              <span className="text-sm font-bold tabular-nums">
                {strokes !== null ? strokes : '-'}
              </span>
              <span className="text-[10px] opacity-50">P{hole.par}</span>
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{playerName}</CardTitle>
          <div className="flex items-center gap-2">
            {format === 'stableford' && scorecard.stablefordPoints !== null && (
              <Badge variant="default" className="tabular-nums">
                {scorecard.stablefordPoints} pts
              </Badge>
            )}
            <Badge
              variant={scorecard.isComplete ? 'default' : 'outline'}
              className="tabular-nums"
            >
              {scorecard.grossTotal > 0 ? scorecard.grossTotal : '-'}
              {scorecard.netTotal !== null && (
                <span className="ml-1 opacity-70">({scorecard.netTotal})</span>
              )}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {enteredCount}/{holes.length}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {/* Front 9 */}
        {frontNine.length > 0 && (
          <div>
            <p className="text-muted-foreground mb-1 text-[10px] font-medium uppercase tracking-wider">
              Front 9
            </p>
            {renderHoleRow(frontNine)}
          </div>
        )}

        {/* Back 9 */}
        {backNine.length > 0 && (
          <div>
            <p className="text-muted-foreground mb-1 text-[10px] font-medium uppercase tracking-wider">
              Back 9
            </p>
            {renderHoleRow(backNine)}
          </div>
        )}

        {/* Active hole input */}
        {activeHole !== null && (
          <div className="bg-muted/50 flex flex-col items-center gap-3 rounded-lg border p-4">
            <div className="text-center">
              <p className="text-muted-foreground text-xs">
                Hole {holes[activeHole].holeNumber} &middot; Par{' '}
                {holes[activeHole].par} &middot; SI{' '}
                {holes[activeHole].strokeIndex}
              </p>
              {format === 'stableford' && (
                <p className="text-muted-foreground mt-0.5 text-[10px]">
                  Stableford:{' '}
                  {stablefordPointsForHole(
                    pendingStrokes,
                    holes[activeHole].par,
                    groupHandicap,
                    holes[activeHole].strokeIndex,
                    totalHoles
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
                onClick={clearHole}
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
          </div>
        )}
      </CardContent>
    </Card>
  )
}
