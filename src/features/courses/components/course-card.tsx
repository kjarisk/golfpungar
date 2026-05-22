import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Course, Hole } from '@/features/courses'
import { useCountries } from '@/features/countries'

interface CourseCardProps {
  course: Course
  holes: Hole[]
  onClick?: () => void
}

export function CourseCard({ course, holes, onClick }: CourseCardProps) {
  const { data: countries = [] } = useCountries()
  const country = course.countryId
    ? countries.find((c) => c.id === course.countryId)
    : undefined
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
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-base leading-tight">
              {course.name}
            </CardTitle>
            <div className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs">
              <span className="tabular-nums">Par {totalPar}</span>
              {country && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{country.name}</span>
                </>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge variant="outline" className="text-xs tabular-nums">
              {holes.length}H
            </Badge>
            <div className="text-muted-foreground/80 flex gap-1.5 text-[10px] tabular-nums">
              <span>{par3s}×P3</span>
              <span>{par4s}×P4</span>
              <span>{par5s}×P5</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 px-3 pb-3">
        <HalfTable label="Out" holes={frontNine} subtotal={frontPar} />
        {has18 && (
          <HalfTable
            label="In"
            holes={backNine}
            subtotal={backPar}
            totalPar={totalPar}
          />
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
      <table className="w-full table-fixed border-collapse tabular-nums">
        <colgroup>
          <col className="w-9" />
          <col span={9} />
          <col className="w-10" />
          {totalPar != null && <col className="w-10" />}
        </colgroup>
        <tbody>
          {/* Hole numbers */}
          <tr className="text-muted-foreground text-[11px]">
            <th
              scope="row"
              className="py-1 pl-1 text-left font-medium uppercase tracking-wider"
            >
              Hole
            </th>
            {holes.map((h) => (
              <th
                key={h.holeNumber}
                scope="col"
                className="py-1 text-center font-medium"
              >
                {h.holeNumber}
              </th>
            ))}
            <th className="text-primary py-1 text-center text-xs font-semibold">
              {label}
            </th>
            {totalPar != null && (
              <th className="text-primary py-1 text-center text-xs font-semibold">
                Tot
              </th>
            )}
          </tr>
          {/* Par — emphasized band */}
          <tr className="bg-muted/40 text-sm">
            <th
              scope="row"
              className="text-muted-foreground py-1.5 pl-1 text-left text-[11px] font-medium uppercase tracking-wider"
            >
              Par
            </th>
            {holes.map((h) => (
              <td
                key={h.holeNumber}
                className="py-1.5 text-center font-semibold"
              >
                {h.par}
              </td>
            ))}
            <td className="text-primary py-1.5 text-center font-semibold">
              {subtotal}
            </td>
            {totalPar != null && (
              <td className="text-primary py-1.5 text-center font-semibold">
                {totalPar}
              </td>
            )}
          </tr>
          {/* Stroke index — quieter */}
          <tr className="text-muted-foreground text-xs">
            <th
              scope="row"
              className="py-1 pl-1 text-left text-[11px] font-medium uppercase tracking-wider"
            >
              SI
            </th>
            {holes.map((h) => (
              <td key={h.holeNumber} className="py-1 text-center">
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
