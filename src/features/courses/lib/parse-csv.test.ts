/// <reference types="vitest/globals" />
import { parseCourseCSV } from './parse-csv'

describe('parseCourseCSV', () => {
  const VALID_9_HOLE_CSV = `holeNumber,par,strokeIndex
1,4,1
2,5,3
3,3,5
4,4,7
5,4,9
6,4,2
7,3,4
8,5,6
9,4,8`

  const VALID_18_HOLE_CSV = `holeNumber,par,strokeIndex
1,4,11
2,5,3
3,3,17
4,4,7
5,4,1
6,4,13
7,3,15
8,5,5
9,4,9
10,4,12
11,5,4
12,3,18
13,4,8
14,4,2
15,4,14
16,3,16
17,5,6
18,4,10`

  it('parses a valid 18-hole CSV', () => {
    const result = parseCourseCSV(VALID_18_HOLE_CSV)
    expect(result.success).toBe(true)
    if (!result.success) return

    expect(result.holeCount).toBe(18)
    expect(result.holes).toHaveLength(18)
    expect(result.totalPar).toBe(72)
    expect(result.holes[0].holeNumber).toBe(1)
    expect(result.holes[17].holeNumber).toBe(18)
  })

  it('parses a valid 9-hole CSV', () => {
    const result = parseCourseCSV(VALID_9_HOLE_CSV)
    expect(result.success).toBe(true)
    if (!result.success) return

    expect(result.holeCount).toBe(9)
    expect(result.holes).toHaveLength(9)
    expect(result.totalPar).toBe(36)
  })

  it('extracts course name from optional column', () => {
    const csv = `holeNumber,par,strokeIndex,courseName
1,4,1,Test Course
2,5,3,Test Course
3,3,5,
4,4,7,
5,4,9,
6,4,2,
7,3,4,
8,5,6,
9,4,8,`

    const result = parseCourseCSV(csv)
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.courseName).toBe('Test Course')
  })

  it('handles case-insensitive headers', () => {
    const csv = `HoleNumber,Par,StrokeIndex
1,4,1
2,5,3
3,3,5
4,4,7
5,4,9
6,4,2
7,3,4
8,5,6
9,4,8`

    const result = parseCourseCSV(csv)
    expect(result.success).toBe(true)
  })

  it('handles Windows-style line endings', () => {
    const csv = `holeNumber,par,strokeIndex\r\n1,4,1\r\n2,5,3\r\n3,3,5\r\n4,4,7\r\n5,4,9\r\n6,4,2\r\n7,3,4\r\n8,5,6\r\n9,4,8`

    const result = parseCourseCSV(csv)
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.holeCount).toBe(9)
  })

  it('rejects empty input', () => {
    const result = parseCourseCSV('')
    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.errors).toContain(
      'CSV must have a header row and at least one data row.'
    )
  })

  it('rejects CSV with header only', () => {
    const result = parseCourseCSV('holeNumber,par,strokeIndex')
    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.errors).toContain(
      'CSV must have a header row and at least one data row.'
    )
  })

  it('rejects CSV missing required columns', () => {
    const csv = `holeNumber,par
1,4
2,5`

    const result = parseCourseCSV(csv)
    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.errors.some((e) => e.includes('strokeindex'))).toBe(true)
  })

  it('rejects invalid par values', () => {
    const csv = `holeNumber,par,strokeIndex
1,6,1
2,5,3
3,3,5
4,4,7
5,4,9
6,4,2
7,3,4
8,5,6
9,4,8`

    const result = parseCourseCSV(csv)
    expect(result.success).toBe(false)
    if (result.success) return
    expect(
      result.errors.some((e) => e.includes('par must be 3, 4, or 5'))
    ).toBe(true)
  })

  it('rejects non-numeric values', () => {
    const csv = `holeNumber,par,strokeIndex
one,4,1
2,five,3
3,3,five`

    const result = parseCourseCSV(csv)
    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.errors.length).toBeGreaterThanOrEqual(1)
  })

  it('rejects invalid hole count (not 9 or 18)', () => {
    const csv = `holeNumber,par,strokeIndex
1,4,1
2,5,2
3,3,3`

    const result = parseCourseCSV(csv)
    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.errors.some((e) => e.includes('Expected 9 or 18'))).toBe(true)
  })

  it('rejects duplicate stroke indices', () => {
    const csv = `holeNumber,par,strokeIndex
1,4,1
2,5,1
3,3,3
4,4,4
5,4,5
6,4,6
7,3,7
8,5,8
9,4,9`

    const result = parseCourseCSV(csv)
    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.errors.some((e) => e.includes('Duplicate strokeIndex'))).toBe(
      true
    )
  })

  it('rejects non-sequential hole numbers', () => {
    const csv = `holeNumber,par,strokeIndex
1,4,1
2,5,2
4,3,3
5,4,4
6,4,5
7,4,6
8,3,7
9,5,8
10,4,9`

    const result = parseCourseCSV(csv)
    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.errors.some((e) => e.includes('sequential'))).toBe(true)
  })

  it('sorts holes by hole number in output', () => {
    // Provide holes out of order
    const csv = `holeNumber,par,strokeIndex
9,4,8
1,4,1
5,4,9
3,3,5
7,3,4
2,5,3
6,4,2
4,4,7
8,5,6`

    const result = parseCourseCSV(csv)
    expect(result.success).toBe(true)
    if (!result.success) return

    for (let i = 0; i < result.holes.length; i++) {
      expect(result.holes[i].holeNumber).toBe(i + 1)
    }
  })
})
