import { cn } from '@/lib/utils'

interface HoleSelectorProps {
  holesPlayed: 9 | 18
  selectedHole: number | null
  onSelectHole: (holeNumber: number) => void
  /** Optional: hole numbers where events have already been logged (shown with a dot) */
  markedHoles?: number[]
  /** Optional: restrict to specific holes (e.g., par 5 holes only) */
  allowedHoles?: number[]
}

export function HoleSelector({
  holesPlayed,
  selectedHole,
  onSelectHole,
  markedHoles = [],
  allowedHoles,
}: HoleSelectorProps) {
  const holeNumbers = Array.from({ length: holesPlayed }, (_, i) => i + 1)
  const frontNine = holeNumbers.filter((h) => h <= 9)
  const backNine = holeNumbers.filter((h) => h > 9)

  function isDisabled(hole: number) {
    return allowedHoles != null && !allowedHoles.includes(hole)
  }

  return (
    <div
      className="flex flex-col gap-1.5"
      role="group"
      aria-label="Hole selector"
    >
      {/* Front 9 */}
      <div className="grid grid-cols-9 gap-1">
        {frontNine.map((hole) => (
          <button
            key={hole}
            type="button"
            disabled={isDisabled(hole)}
            onClick={() => onSelectHole(hole)}
            aria-label={`Hole ${hole}`}
            aria-pressed={selectedHole === hole}
            className={cn(
              'relative flex h-8 w-full items-center justify-center rounded-md text-xs font-medium transition-colors',
              selectedHole === hole
                ? 'bg-primary text-primary-foreground'
                : isDisabled(hole)
                  ? 'bg-muted text-muted-foreground/40 cursor-not-allowed'
                  : 'bg-muted hover:bg-muted/80 text-foreground cursor-pointer'
            )}
          >
            {hole}
            {markedHoles.includes(hole) && (
              <>
                <span className="bg-primary absolute -top-0.5 -right-0.5 size-1.5 rounded-full" />
                <span className="sr-only">(has events)</span>
              </>
            )}
          </button>
        ))}
      </div>

      {/* Back 9 */}
      {backNine.length > 0 && (
        <div className="grid grid-cols-9 gap-1">
          {backNine.map((hole) => (
            <button
              key={hole}
              type="button"
              disabled={isDisabled(hole)}
              onClick={() => onSelectHole(hole)}
              aria-label={`Hole ${hole}`}
              aria-pressed={selectedHole === hole}
              className={cn(
                'relative flex h-8 w-full items-center justify-center rounded-md text-xs font-medium transition-colors',
                selectedHole === hole
                  ? 'bg-primary text-primary-foreground'
                  : isDisabled(hole)
                    ? 'bg-muted text-muted-foreground/40 cursor-not-allowed'
                    : 'bg-muted hover:bg-muted/80 text-foreground cursor-pointer'
              )}
            >
              {hole}
              {markedHoles.includes(hole) && (
                <>
                  <span className="bg-primary absolute -top-0.5 -right-0.5 size-1.5 rounded-full" />
                  <span className="sr-only">(has events)</span>
                </>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
