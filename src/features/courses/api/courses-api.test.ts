/// <reference types="vitest/globals" />

const { from } = vi.hoisted(() => ({ from: vi.fn() }))
vi.mock('@/lib/supabase', () => ({ supabase: { from } }))

import {
  createCourse,
  fetchCourses,
  fetchHoles,
  removeCourse,
} from './courses-api'

interface Result {
  data: unknown
  error: unknown
}

/** A chainable Supabase query-builder mock that resolves to `result`. */
function query(result: Result) {
  const chain: Record<string, unknown> = {}
  for (const method of ['select', 'order', 'insert', 'eq', 'delete']) {
    chain[method] = vi.fn(() => chain)
  }
  chain.maybeSingle = vi.fn(() => Promise.resolve(result))
  chain.single = vi.fn(() => Promise.resolve(result))
  chain.then = (resolve: (value: Result) => unknown) =>
    Promise.resolve(result).then(resolve)
  return chain
}

beforeEach(() => {
  from.mockReset()
})

describe('fetchCourses', () => {
  it('maps Supabase rows to Course objects', async () => {
    from.mockReturnValue(
      query({
        data: [
          {
            id: 'c1',
            tournament_id: 't1',
            name: 'Los Naranjos',
            country_id: 'co1',
            source: 'csv',
            created_at: '2026-01-01T00:00:00Z',
          },
        ],
        error: null,
      })
    )
    const courses = await fetchCourses()
    expect(courses).toEqual([
      {
        id: 'c1',
        tournamentId: 't1',
        name: 'Los Naranjos',
        countryId: 'co1',
        source: 'csv',
        createdAt: '2026-01-01T00:00:00Z',
      },
    ])
  })

  it('maps a null country_id to undefined', async () => {
    from.mockReturnValue(
      query({
        data: [
          {
            id: 'c1',
            tournament_id: 't1',
            name: 'No Country',
            country_id: null,
            source: 'manual',
            created_at: '2026-01-01T00:00:00Z',
          },
        ],
        error: null,
      })
    )
    const [course] = await fetchCourses()
    expect(course.countryId).toBeUndefined()
  })

  it('throws when Supabase returns an error', async () => {
    from.mockReturnValue(query({ data: null, error: new Error('boom') }))
    await expect(fetchCourses()).rejects.toThrow('boom')
  })
})

describe('fetchHoles', () => {
  it('maps Supabase rows to Hole objects', async () => {
    from.mockReturnValue(
      query({
        data: [
          {
            id: 'h1',
            course_id: 'c1',
            hole_number: 1,
            par: 4,
            stroke_index: 11,
          },
        ],
        error: null,
      })
    )
    const holes = await fetchHoles()
    expect(holes).toEqual([
      { id: 'h1', courseId: 'c1', holeNumber: 1, par: 4, strokeIndex: 11 },
    ])
  })

  it('throws when Supabase returns an error', async () => {
    from.mockReturnValue(query({ data: null, error: new Error('boom') }))
    await expect(fetchHoles()).rejects.toThrow('boom')
  })
})

describe('createCourse', () => {
  it('inserts the course and its holes', async () => {
    from
      .mockReturnValueOnce(
        query({
          data: {
            id: 'c2',
            tournament_id: 't1',
            name: 'Valderrama',
            country_id: 'co1',
            source: 'manual',
            created_at: '2026-02-02T00:00:00Z',
          },
          error: null,
        })
      )
      .mockReturnValueOnce(query({ data: null, error: null })) // holes insert

    const course = await createCourse({
      tournamentId: 't1',
      name: 'Valderrama',
      holes: [{ holeNumber: 1, par: 4, strokeIndex: 1 }],
      source: 'manual',
      countryId: 'co1',
    })

    expect(course).toEqual({
      id: 'c2',
      tournamentId: 't1',
      name: 'Valderrama',
      countryId: 'co1',
      source: 'manual',
      createdAt: '2026-02-02T00:00:00Z',
    })
    expect(from).toHaveBeenCalledTimes(2) // course insert + holes insert
  })

  it('skips the holes insert when there are no holes', async () => {
    from.mockReturnValueOnce(
      query({
        data: {
          id: 'c3',
          tournament_id: 't1',
          name: 'Empty',
          country_id: null,
          source: 'csv',
          created_at: '2026-03-03T00:00:00Z',
        },
        error: null,
      })
    )

    const course = await createCourse({
      tournamentId: 't1',
      name: 'Empty',
      holes: [],
    })

    expect(course.id).toBe('c3')
    expect(from).toHaveBeenCalledTimes(1) // course insert only
  })

  it('deletes the course again when the holes insert fails', async () => {
    const deleteChain = query({ data: null, error: null })
    from
      .mockReturnValueOnce(
        query({
          data: {
            id: 'c4',
            tournament_id: 't1',
            name: 'Orphan',
            country_id: null,
            source: 'csv',
            created_at: '2026-04-04T00:00:00Z',
          },
          error: null,
        })
      )
      .mockReturnValueOnce(
        query({ data: null, error: new Error('holes failed') })
      )
      .mockReturnValueOnce(deleteChain) // compensating delete

    await expect(
      createCourse({
        tournamentId: 't1',
        name: 'Orphan',
        holes: [{ holeNumber: 1, par: 4, strokeIndex: 1 }],
      })
    ).rejects.toThrow('holes failed')

    // The compensating delete was issued against the orphaned course.
    expect(from).toHaveBeenCalledTimes(3)
    expect(deleteChain.delete).toHaveBeenCalled()
    expect(deleteChain.eq).toHaveBeenCalledWith('id', 'c4')
  })

  it('throws when the course insert fails', async () => {
    from.mockReturnValueOnce(
      query({ data: null, error: new Error('insert denied') })
    )
    await expect(
      createCourse({ tournamentId: 't1', name: 'Nope', holes: [] })
    ).rejects.toThrow('insert denied')
  })
})

describe('removeCourse', () => {
  it('throws when the delete fails (e.g. a round still references it)', async () => {
    from.mockReturnValue(
      query({ data: null, error: new Error('violates foreign key') })
    )
    await expect(removeCourse('c1')).rejects.toThrow('violates foreign key')
  })

  it('resolves when the delete succeeds', async () => {
    from.mockReturnValue(query({ data: null, error: null }))
    await expect(removeCourse('c1')).resolves.toBeUndefined()
  })
})
