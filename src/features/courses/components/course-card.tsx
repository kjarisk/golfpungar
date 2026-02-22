import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Course, Hole } from '@/features/courses'

interface CourseCardProps {
  course: Course
  holes: Hole[]
  onClick?: () => void
}

export function CourseCard({ course, holes, onClick }: CourseCardProps) {
  const totalPar = holes.reduce((sum, h) => sum + h.par, 0)
  const par3s = holes.filter((h) => h.par === 3).length
  const par4s = holes.filter((h) => h.par === 4).length
  const par5s = holes.filter((h) => h.par === 5).length

  const frontNine = holes.filter((h) => h.holeNumber <= 9)
  const backNine = holes.filter((h) => h.holeNumber > 9)
  const frontPar = frontNine.reduce((sum, h) => sum + h.par, 0)
  const backPar = backNine.reduce((sum, h) => sum + h.par, 0)

  return (
    <Card
      className={
        onClick ? 'cursor-pointer transition-shadow hover:shadow-md' : ''
      }
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{course.name}</CardTitle>
          <Badge variant="secondary" className="text-xs">
            {holes.length} holes
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Par summary */}
        <div className="mb-3 flex items-baseline gap-1">
          <span className="text-2xl font-bold">{totalPar}</span>
          <span className="text-muted-foreground text-sm">par</span>
          {backNine.length > 0 && (
            <span className="text-muted-foreground ml-2 text-xs">
              ({frontPar} + {backPar})
            </span>
          )}
        </div>

        {/* Par breakdown */}
        <div className="text-muted-foreground flex gap-4 text-xs">
          <span>
            <span className="text-foreground font-medium">{par3s}</span> par 3
          </span>
          <span>
            <span className="text-foreground font-medium">{par4s}</span> par 4
          </span>
          <span>
            <span className="text-foreground font-medium">{par5s}</span> par 5
          </span>
        </div>

        {/* Compact scorecard */}
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-center text-xs">
            <thead>
              <tr className="text-muted-foreground">
                {frontNine.map((h) => (
                  <th key={h.holeNumber} className="px-1 pb-0.5 font-medium">
                    {h.holeNumber}
                  </th>
                ))}
                {backNine.length > 0 && (
                  <th className="text-primary px-1 pb-0.5 font-medium">Out</th>
                )}
              </tr>
            </thead>
            <tbody>
              <tr>
                {frontNine.map((h) => (
                  <td key={h.holeNumber} className="px-1 py-0.5">
                    {h.par}
                  </td>
                ))}
                {backNine.length > 0 && (
                  <td className="text-primary px-1 py-0.5 font-medium">
                    {frontPar}
                  </td>
                )}
              </tr>
              <tr className="text-muted-foreground">
                {frontNine.map((h) => (
                  <td key={h.holeNumber} className="px-1 py-0.5 text-[10px]">
                    {h.strokeIndex}
                  </td>
                ))}
                {backNine.length > 0 && <td />}
              </tr>
            </tbody>
          </table>

          {backNine.length > 0 && (
            <table className="mt-1 w-full text-center text-xs">
              <thead>
                <tr className="text-muted-foreground">
                  {backNine.map((h) => (
                    <th key={h.holeNumber} className="px-1 pb-0.5 font-medium">
                      {h.holeNumber}
                    </th>
                  ))}
                  <th className="text-primary px-1 pb-0.5 font-medium">In</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  {backNine.map((h) => (
                    <td key={h.holeNumber} className="px-1 py-0.5">
                      {h.par}
                    </td>
                  ))}
                  <td className="text-primary px-1 py-0.5 font-medium">
                    {backPar}
                  </td>
                </tr>
                <tr className="text-muted-foreground">
                  {backNine.map((h) => (
                    <td key={h.holeNumber} className="px-1 py-0.5 text-[10px]">
                      {h.strokeIndex}
                    </td>
                  ))}
                  <td />
                </tr>
              </tbody>
            </table>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
