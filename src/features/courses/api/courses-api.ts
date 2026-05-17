import { supabase } from '@/lib/supabase'
import type { Course, Hole, ParsedHole } from '../types'

interface CourseRow {
  id: string
  tournament_id: string
  name: string
  country_id: string | null
  source: 'csv' | 'manual'
  created_at: string
}

interface HoleRow {
  id: string
  course_id: string
  hole_number: number
  par: number
  stroke_index: number
}

const COURSE_COLUMNS = 'id, tournament_id, name, country_id, source, created_at'
const HOLE_COLUMNS = 'id, course_id, hole_number, par, stroke_index'

function toCourse(row: CourseRow): Course {
  return {
    id: row.id,
    tournamentId: row.tournament_id,
    name: row.name,
    countryId: row.country_id ?? undefined,
    source: row.source,
    createdAt: row.created_at,
  }
}

function toHole(row: HoleRow): Hole {
  return {
    id: row.id,
    courseId: row.course_id,
    holeNumber: row.hole_number,
    par: row.par,
    strokeIndex: row.stroke_index,
  }
}

export async function fetchCourses(): Promise<Course[]> {
  const { data, error } = await supabase
    .from('courses')
    .select(COURSE_COLUMNS)
    .order('created_at')
  if (error) throw error
  return data.map(toCourse)
}

export async function fetchHoles(): Promise<Hole[]> {
  const { data, error } = await supabase
    .from('holes')
    .select(HOLE_COLUMNS)
    .order('hole_number')
  if (error) throw error
  return data.map(toHole)
}

export interface CreateCourseInput {
  tournamentId: string
  name: string
  holes: ParsedHole[]
  source?: 'csv' | 'manual'
  countryId?: string
}

/** Insert a course and its holes. If the holes insert fails, the course is
 *  deleted again so we never leave an orphaned course behind. */
export async function createCourse(input: CreateCourseInput): Promise<Course> {
  const { data: course, error } = await supabase
    .from('courses')
    .insert({
      tournament_id: input.tournamentId,
      name: input.name,
      country_id: input.countryId ?? null,
      source: input.source ?? 'csv',
    })
    .select(COURSE_COLUMNS)
    .single()
  if (error) throw error

  if (input.holes.length > 0) {
    const { error: holesError } = await supabase.from('holes').insert(
      input.holes.map((h) => ({
        course_id: course.id,
        hole_number: h.holeNumber,
        par: h.par,
        stroke_index: h.strokeIndex,
      }))
    )
    if (holesError) {
      await supabase.from('courses').delete().eq('id', course.id)
      throw holesError
    }
  }
  return toCourse(course)
}

export async function removeCourse(id: string): Promise<void> {
  // holes cascade via the FK; fails if a round still references this course
  const { error } = await supabase.from('courses').delete().eq('id', id)
  if (error) throw error
}
