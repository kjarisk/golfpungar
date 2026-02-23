import { create } from 'zustand'
import type { Course, Hole, ParsedHole } from '../types'

interface CoursesState {
  courses: Course[]
  holes: Hole[]

  // Derived
  getCoursesByTournament: (tournamentId: string) => Course[]
  getHolesByCourse: (courseId: string) => Hole[]

  // Actions
  addCourse: (
    tournamentId: string,
    name: string,
    parsedHoles: ParsedHole[],
    source?: 'csv' | 'manual',
    countryId?: string
  ) => Course
  removeCourse: (id: string) => void
}

// Pre-load Los Naranjos as mock data so there's something to see
const MOCK_COURSE: Course = {
  id: 'course-001',
  tournamentId: 'tournament-001',
  name: 'Los Naranjos Golf Club',
  source: 'csv',
  createdAt: '2026-02-01T10:00:00Z',
}

const LOS_NARANJOS_HOLES: Hole[] = [
  {
    id: 'hole-001',
    courseId: 'course-001',
    holeNumber: 1,
    par: 4,
    strokeIndex: 11,
  },
  {
    id: 'hole-002',
    courseId: 'course-001',
    holeNumber: 2,
    par: 5,
    strokeIndex: 3,
  },
  {
    id: 'hole-003',
    courseId: 'course-001',
    holeNumber: 3,
    par: 3,
    strokeIndex: 17,
  },
  {
    id: 'hole-004',
    courseId: 'course-001',
    holeNumber: 4,
    par: 4,
    strokeIndex: 7,
  },
  {
    id: 'hole-005',
    courseId: 'course-001',
    holeNumber: 5,
    par: 4,
    strokeIndex: 1,
  },
  {
    id: 'hole-006',
    courseId: 'course-001',
    holeNumber: 6,
    par: 4,
    strokeIndex: 13,
  },
  {
    id: 'hole-007',
    courseId: 'course-001',
    holeNumber: 7,
    par: 3,
    strokeIndex: 15,
  },
  {
    id: 'hole-008',
    courseId: 'course-001',
    holeNumber: 8,
    par: 5,
    strokeIndex: 5,
  },
  {
    id: 'hole-009',
    courseId: 'course-001',
    holeNumber: 9,
    par: 4,
    strokeIndex: 9,
  },
  {
    id: 'hole-010',
    courseId: 'course-001',
    holeNumber: 10,
    par: 4,
    strokeIndex: 12,
  },
  {
    id: 'hole-011',
    courseId: 'course-001',
    holeNumber: 11,
    par: 5,
    strokeIndex: 4,
  },
  {
    id: 'hole-012',
    courseId: 'course-001',
    holeNumber: 12,
    par: 3,
    strokeIndex: 18,
  },
  {
    id: 'hole-013',
    courseId: 'course-001',
    holeNumber: 13,
    par: 4,
    strokeIndex: 8,
  },
  {
    id: 'hole-014',
    courseId: 'course-001',
    holeNumber: 14,
    par: 4,
    strokeIndex: 2,
  },
  {
    id: 'hole-015',
    courseId: 'course-001',
    holeNumber: 15,
    par: 4,
    strokeIndex: 14,
  },
  {
    id: 'hole-016',
    courseId: 'course-001',
    holeNumber: 16,
    par: 3,
    strokeIndex: 16,
  },
  {
    id: 'hole-017',
    courseId: 'course-001',
    holeNumber: 17,
    par: 5,
    strokeIndex: 6,
  },
  {
    id: 'hole-018',
    courseId: 'course-001',
    holeNumber: 18,
    par: 4,
    strokeIndex: 10,
  },
]

let nextCourseId = 2
let nextHoleId = 19

export const useCoursesStore = create<CoursesState>((set, get) => ({
  courses: [MOCK_COURSE],
  holes: LOS_NARANJOS_HOLES,

  getCoursesByTournament: (tournamentId) =>
    get().courses.filter((c) => c.tournamentId === tournamentId),

  getHolesByCourse: (courseId) =>
    get()
      .holes.filter((h) => h.courseId === courseId)
      .sort((a, b) => a.holeNumber - b.holeNumber),

  addCourse: (tournamentId, name, parsedHoles, source = 'csv', countryId) => {
    const courseId = `course-${String(nextCourseId++).padStart(3, '0')}`
    const course: Course = {
      id: courseId,
      tournamentId,
      name,
      countryId,
      source,
      createdAt: new Date().toISOString(),
    }

    const newHoles: Hole[] = parsedHoles.map((ph) => ({
      id: `hole-${String(nextHoleId++).padStart(3, '0')}`,
      courseId,
      holeNumber: ph.holeNumber,
      par: ph.par,
      strokeIndex: ph.strokeIndex,
    }))

    set((state) => ({
      courses: [...state.courses, course],
      holes: [...state.holes, ...newHoles],
    }))

    return course
  },

  removeCourse: (id) => {
    set((state) => ({
      courses: state.courses.filter((c) => c.id !== id),
      holes: state.holes.filter((h) => h.courseId !== id),
    }))
  },
}))
