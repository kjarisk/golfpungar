export interface Course {
  id: string
  tournamentId: string
  name: string
  source: 'csv' | 'manual'
  createdAt: string
}

export interface Hole {
  id: string
  courseId: string
  holeNumber: number
  par: number
  strokeIndex: number
}

/** Parsed from CSV before creating a Course */
export interface ParsedHole {
  holeNumber: number
  par: number
  strokeIndex: number
}

export interface CsvParseResult {
  success: true
  courseName?: string
  holes: ParsedHole[]
  holeCount: 9 | 18
  totalPar: number
}

export interface CsvParseError {
  success: false
  errors: string[]
}
