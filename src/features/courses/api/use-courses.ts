import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createCourse,
  fetchCourses,
  fetchHoles,
  removeCourse,
} from './courses-api'

export const coursesQueryKey = ['courses'] as const
export const holesQueryKey = ['holes'] as const

export function useCourses() {
  return useQuery({ queryKey: coursesQueryKey, queryFn: fetchCourses })
}

export function useHoles() {
  return useQuery({ queryKey: holesQueryKey, queryFn: fetchHoles })
}

export function useCoursesByTournament(
  tournamentId: string | null | undefined
) {
  const { data: courses = [] } = useCourses()
  return courses.filter((c) => c.tournamentId === tournamentId)
}

export function useHolesByCourse(courseId: string | null | undefined) {
  const { data: holes = [] } = useHoles()
  return holes
    .filter((h) => h.courseId === courseId)
    .sort((a, b) => a.holeNumber - b.holeNumber)
}

export function useCreateCourse() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createCourse,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: coursesQueryKey })
      void queryClient.invalidateQueries({ queryKey: holesQueryKey })
    },
  })
}

export function useRemoveCourse() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: removeCourse,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: coursesQueryKey })
      void queryClient.invalidateQueries({ queryKey: holesQueryKey })
    },
  })
}
