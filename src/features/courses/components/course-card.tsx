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

  const frontNine = holes
    .filter((h) => h.holeNumber <= 9)
    .sort((a, b) => a.holeNumber - b.holeNumber)
  const backNine = holes
    .filter((h) => h.holeNumber > 9)
    .sort((a, b) => a.holeNumber - b.holeNumber)
  const frontPar = frontNine.reduce((sum, h) => sum + h.par, 0)
  const backPar = backNine.reduce((sum, h) => sum + h.par, 0)
  const has18 = backNine.length > 0

  return (
    <Card
      className={
        onClick ? 'cursor-pointer transition-shadow hover:shadow-md' : ''
      }
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <CardTitle className="text-base">{course.name}</CardTitle>
            <span className="text-muted-foreground text-xs tabular-nums">
              Par {totalPar}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className="text-xs tabular-nums">
              {holes.length}H
            </Badge>
            <div className="text-muted-foreground flex gap-2 text-[10px]">
              <span>{par3s}×P3</span>
              <span>{par4s}×P4</span>
              <span>{par5s}×P5</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-3 pb-3">
        {/* Front 9 */}
        <HalfTable label="Out" holes={frontNine} subtotal={frontPar} />

        {/* Back 9 */}
        {has18 && (
          <>
            <div className="my-1" />
            <HalfTable
              label="In"
              holes={backNine}
              subtotal={backPar}
              totalPar={totalPar}
            />
          </>
        )}
      </CardContent>
    </Card>
  )
}

interface HalfTableProps {
  label: string
  holes: Hole[]
  subtotal: number
  totalPar?: number
}

function HalfTable({ label, holes, subtotal, totalPar }: HalfTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-center text-xs tabular-nums">
        <thead>
          <tr className="text-muted-foreground">
            <th className="w-8 py-0.5 text-left text-[10px] font-medium">
              Hole
            </th>
            {holes.map((h) => (
              <th
                key={h.holeNumber}
                className="min-w-[22px] py-0.5 font-medium"
              >
                {h.holeNumber}
              </th>
            ))}
            <th className="text-primary min-w-[28px] py-0.5 font-semibold">
              {label}
            </th>
            {totalPar != null && (
              <th className="text-primary min-w-[28px] py-0.5 font-semibold">
                Tot
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {/* Par row */}
          <tr className="bg-muted/40">
            <td className="py-0.5 text-left text-[10px] font-medium">Par</td>
            {holes.map((h) => (
              <td key={h.holeNumber} className="py-0.5">
                {h.par}
              </td>
            ))}
            <td className="text-primary py-0.5 font-semibold">{subtotal}</td>
            {totalPar != null && (
              <td className="text-primary py-0.5 font-semibold">{totalPar}</td>
            )}
          </tr>
          {/* Stroke Index row */}
          <tr>
            <td className="text-muted-foreground py-0.5 text-left text-[10px] font-medium">
              SI
            </td>
            {holes.map((h) => (
              <td
                key={h.holeNumber}
                className="text-muted-foreground py-0.5 text-[10px]"
              >
                {h.strokeIndex}
              </td>
            ))}
            <td />
            {totalPar != null && <td />}
          </tr>
        </tbody>
      </table>
    </div>
  )
}
