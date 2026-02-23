/// <reference types="vitest/globals" />
import { useCoursesStore } from './state/courses-store'
import type { ParsedHole } from './types'

const SAMPLE_HOLES: ParsedHole[] = [
  { holeNumber: 1, par: 4, strokeIndex: 1 },
  { holeNumber: 2, par: 5, strokeIndex: 3 },
  { holeNumber: 3, par: 3, strokeIndex: 5 },
  { holeNumber: 4, par: 4, strokeIndex: 7 },
  { holeNumber: 5, par: 4, strokeIndex: 9 },
  { holeNumber: 6, par: 4, strokeIndex: 2 },
  { holeNumber: 7, par: 3, strokeIndex: 4 },
  { holeNumber: 8, par: 5, strokeIndex: 6 },
  { holeNumber: 9, par: 4, strokeIndex: 8 },
]

describe('Courses Store', () => {
  beforeEach(() => {
    // Reset to mock data (Los Naranjos pre-loaded)
    useCoursesStore.setState({
      courses: [
        {
          id: 'course-001',
          tournamentId: 'tournament-001',
          name: 'Los Naranjos Golf Club',
          source: 'csv',
          createdAt: '2026-02-01T10:00:00Z',
        },
      ],
      holes: Array.from({ length: 18 }, (_, i) => ({
        id: `hole-${String(i + 1).padStart(3, '0')}`,
        courseId: 'course-001',
        holeNumber: i + 1,
        par: i % 3 === 0 ? 5 : i % 3 === 1 ? 4 : 3,
        strokeIndex: i + 1,
      })),
    })
  })

  it('has mock course loaded by default', () => {
    const { courses } = useCoursesStore.getState()
    expect(courses).toHaveLength(1)
    expect(courses[0].name).toBe('Los Naranjos Golf Club')
  })

  it('gets courses by tournament', () => {
    const courses = useCoursesStore
      .getState()
      .getCoursesByTournament('tournament-001')
    expect(courses).toHaveLength(1)

    const other = useCoursesStore.getState().getCoursesByTournament('no-match')
    expect(other).toHaveLength(0)
  })

  it('gets holes by course sorted by hole number', () => {
    const holes = useCoursesStore.getState().getHolesByCourse('course-001')
    expect(holes).toHaveLength(18)
    for (let i = 0; i < holes.length; i++) {
      expect(holes[i].holeNumber).toBe(i + 1)
    }
  })

  it('adds a new course with holes', () => {
    const course = useCoursesStore
      .getState()
      .addCourse('tournament-001', 'Valderrama', SAMPLE_HOLES, 'csv')

    expect(course.name).toBe('Valderrama')
    expect(course.tournamentId).toBe('tournament-001')
    expect(course.source).toBe('csv')

    const { courses } = useCoursesStore.getState()
    expect(courses).toHaveLength(2)

    const holes = useCoursesStore.getState().getHolesByCourse(course.id)
    expect(holes).toHaveLength(9)
    expect(holes[0].holeNumber).toBe(1)
    expect(holes[0].par).toBe(4)
  })

  it('defaults source to csv', () => {
    const course = useCoursesStore
      .getState()
      .addCourse('tournament-001', 'Test Course', SAMPLE_HOLES)

    expect(course.source).toBe('csv')
  })

  it('removes a course and its holes', () => {
    // Add a second course first
    const course = useCoursesStore
      .getState()
      .addCourse('tournament-001', 'Temp Course', SAMPLE_HOLES)

    useCoursesStore.getState().removeCourse(course.id)

    const { courses } = useCoursesStore.getState()
    expect(courses).toHaveLength(1)
    expect(courses[0].name).toBe('Los Naranjos Golf Club')

    const holes = useCoursesStore.getState().getHolesByCourse(course.id)
    expect(holes).toHaveLength(0)
  })

  it('does not remove holes from other courses', () => {
    const course2 = useCoursesStore
      .getState()
      .addCourse('tournament-001', 'Course 2', SAMPLE_HOLES)

    useCoursesStore.getState().removeCourse(course2.id)

    // Original course holes should still be intact
    const holes = useCoursesStore.getState().getHolesByCourse('course-001')
    expect(holes).toHaveLength(18)
  })

  it('assigns unique IDs to courses', () => {
    const c1 = useCoursesStore
      .getState()
      .addCourse('tournament-001', 'Course A', SAMPLE_HOLES)
    const c2 = useCoursesStore
      .getState()
      .addCourse('tournament-001', 'Course B', SAMPLE_HOLES)

    expect(c1.id).not.toBe(c2.id)
  })

  it('stores countryId when provided', () => {
    const course = useCoursesStore
      .getState()
      .addCourse(
        'tournament-001',
        'Valderrama',
        SAMPLE_HOLES,
        'csv',
        'country-spain'
      )

    expect(course.countryId).toBe('country-spain')

    const stored = useCoursesStore
      .getState()
      .courses.find((c) => c.id === course.id)
    expect(stored?.countryId).toBe('country-spain')
  })

  it('leaves countryId undefined when not provided', () => {
    const course = useCoursesStore
      .getState()
      .addCourse('tournament-001', 'No Country Course', SAMPLE_HOLES)

    expect(course.countryId).toBeUndefined()
  })

  it('supports manual source for manually created courses', () => {
    const course = useCoursesStore
      .getState()
      .addCourse(
        'tournament-001',
        'Manual Course',
        SAMPLE_HOLES,
        'manual',
        'country-pt'
      )

    expect(course.source).toBe('manual')
    expect(course.countryId).toBe('country-pt')

    const holes = useCoursesStore.getState().getHolesByCourse(course.id)
    expect(holes).toHaveLength(9)
  })
})
