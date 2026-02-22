import type { CsvParseResult, CsvParseError, ParsedHole } from '../types'

/**
 * Parse a CSV string into course hole data.
 * Validates all required columns, data types, ranges, and uniqueness.
 */
export function parseCourseCSV(
  csvText: string
): CsvParseResult | CsvParseError {
  const errors: string[] = []

  // Split into lines, trim, and filter out empty lines
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  if (lines.length < 2) {
    return {
      success: false,
      errors: ['CSV must have a header row and at least one data row.'],
    }
  }

  // Parse header (case-insensitive)
  const rawHeaders = lines[0].split(',').map((h) => h.trim().toLowerCase())

  const requiredHeaders = ['holenumber', 'par', 'strokeindex']
  for (const required of requiredHeaders) {
    if (!rawHeaders.includes(required)) {
      errors.push(`Missing required column: "${required}".`)
    }
  }

  if (errors.length > 0) {
    return { success: false, errors }
  }

  const holeNumberIdx = rawHeaders.indexOf('holenumber')
  const parIdx = rawHeaders.indexOf('par')
  const strokeIndexIdx = rawHeaders.indexOf('strokeindex')
  const courseNameIdx = rawHeaders.indexOf('coursename')

  const holes: ParsedHole[] = []
  let courseName: string | undefined

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map((c) => c.trim())
    const rowNum = i + 1

    // Extract course name from first data row if column exists
    if (courseNameIdx >= 0 && i === 1 && cols[courseNameIdx]) {
      courseName = cols[courseNameIdx]
    }

    const holeNumber = parseInt(cols[holeNumberIdx], 10)
    const par = parseInt(cols[parIdx], 10)
    const strokeIndex = parseInt(cols[strokeIndexIdx], 10)

    if (isNaN(holeNumber)) {
      errors.push(`Row ${rowNum}: holeNumber must be a number.`)
      continue
    }
    if (isNaN(par)) {
      errors.push(`Row ${rowNum}: par must be a number.`)
      continue
    }
    if (isNaN(strokeIndex)) {
      errors.push(`Row ${rowNum}: strokeIndex must be a number.`)
      continue
    }
    if (par < 3 || par > 5) {
      errors.push(`Row ${rowNum}: par must be 3, 4, or 5 (got ${par}).`)
    }

    holes.push({ holeNumber, par, strokeIndex })
  }

  if (errors.length > 0) {
    return { success: false, errors }
  }

  // Validate hole count (9 or 18)
  const holeCount = holes.length
  if (holeCount !== 9 && holeCount !== 18) {
    return {
      success: false,
      errors: [`Expected 9 or 18 holes, got ${holeCount}.`],
    }
  }

  // Validate sequential hole numbers
  const sortedHoles = [...holes].sort((a, b) => a.holeNumber - b.holeNumber)
  for (let i = 0; i < sortedHoles.length; i++) {
    if (sortedHoles[i].holeNumber !== i + 1) {
      errors.push(
        `Hole numbers must be sequential 1–${holeCount}. Missing or duplicate hole ${i + 1}.`
      )
      break
    }
  }

  // Validate unique stroke indices in range
  const strokeIndices = new Set<number>()
  for (const hole of holes) {
    if (hole.strokeIndex < 1 || hole.strokeIndex > holeCount) {
      errors.push(
        `Hole ${hole.holeNumber}: strokeIndex must be 1–${holeCount} (got ${hole.strokeIndex}).`
      )
    }
    if (strokeIndices.has(hole.strokeIndex)) {
      errors.push(
        `Duplicate strokeIndex ${hole.strokeIndex} (hole ${hole.holeNumber}).`
      )
    }
    strokeIndices.add(hole.strokeIndex)
  }

  if (errors.length > 0) {
    return { success: false, errors }
  }

  const totalPar = holes.reduce((sum, h) => sum + h.par, 0)

  return {
    success: true,
    courseName,
    holes: sortedHoles,
    holeCount: holeCount as 9 | 18,
    totalPar,
  }
}
