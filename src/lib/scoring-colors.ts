/**
 * Shared color utilities for scoring display.
 *
 * Two visual contexts:
 * - "detail" colors: soft backgrounds for scorecard detail and comparison views
 * - "grid" colors: bolder backgrounds for the active score entry grid
 *
 * Both use the same relative-to-par formatting and text coloring.
 */

/** Soft color class for gross score relative to par (scorecard detail views) */
export function getScoreColor(strokes: number | null, par: number): string {
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
export function getNetColor(net: number, par: number): string {
  const diff = net - par
  if (diff <= -2) return 'text-yellow-700 dark:text-yellow-300'
  if (diff === -1) return 'text-green-700 dark:text-green-300'
  if (diff === 0) return 'text-muted-foreground'
  if (diff === 1) return 'text-orange-600 dark:text-orange-400'
  return 'text-red-600 dark:text-red-400'
}

/** Format relative-to-par as "+3", "-2", or "E" */
export function formatRelPar(total: number, par: number): string {
  const diff = total - par
  if (diff === 0) return 'E'
  return diff > 0 ? `+${diff}` : `${diff}`
}

/** Color class for a relative-to-par text badge */
export function relParColor(total: number, par: number): string {
  const diff = total - par
  if (diff < 0) return 'text-green-700 dark:text-green-400'
  if (diff === 0) return 'text-muted-foreground'
  return 'text-red-600 dark:text-red-400'
}
