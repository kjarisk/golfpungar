/** Per-hole stroke count. null = not yet entered (missing hole). */
export type HoleStroke = number | null

export interface Scorecard {
  id: string
  roundId: string
  /** For individual formats */
  playerId?: string
  /** For team formats (scramble/bestball) */
  teamId?: string
  /** Strokes per hole. Index 0 = hole 1. Length = holesPlayed (9 or 18). */
  holeStrokes: HoleStroke[]
  /** Sum of entered strokes (ignoring nulls) */
  grossTotal: number
  /** Gross minus handicap strokes received */
  netTotal: number | null
  /** Stableford points (only for stableford format) */
  stablefordPoints: number | null
  /** True when all holes have strokes entered */
  isComplete: boolean
}

export interface RoundPoints {
  id: string
  roundId: string
  /** playerId or teamId depending on format */
  participantId: string
  /** 1-based placing */
  placing: number
  /** Points awarded based on the round's points config */
  pointsAwarded: number
}
