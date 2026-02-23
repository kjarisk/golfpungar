import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCoursesStore } from '@/features/courses'
import { CountrySelect } from '@/features/countries/components/country-select'
import { Plus } from 'lucide-react'
import type { ParsedHole } from '@/features/courses'

interface CreateCourseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tournamentId: string
}

interface HoleDraft {
  par: 3 | 4 | 5
  strokeIndex: number | ''
}

function makeDefaultHoles(count: 9 | 18): HoleDraft[] {
  // Default: alternating 4, 4, 3, 5, 4, 4, 3, 5, 4 pattern per 9
  const pattern: (3 | 4 | 5)[] = [4, 4, 3, 5, 4, 4, 3, 5, 4]
  return Array.from({ length: count }, (_, i) => ({
    par: pattern[i % 9],
    strokeIndex: i + 1,
  }))
}

export function CreateCourseDialog({
  open,
  onOpenChange,
  tournamentId,
}: CreateCourseDialogProps) {
  const addCourse = useCoursesStore((s) => s.addCourse)

  const [name, setName] = useState('')
  const [countryId, setCountryId] = useState<string | undefined>(undefined)
  const [holeCount, setHoleCount] = useState<9 | 18>(18)
  const [holes, setHoles] = useState<HoleDraft[]>(makeDefaultHoles(18))

  function handleHoleCountChange(count: 9 | 18) {
    setHoleCount(count)
    setHoles(makeDefaultHoles(count))
  }

  function updateHolePar(index: number, par: 3 | 4 | 5) {
    setHoles((prev) => prev.map((h, i) => (i === index ? { ...h, par } : h)))
  }

  function updateHoleSI(index: number, si: string) {
    const num = si === '' ? '' : parseInt(si, 10)
    if (num !== '' && (isNaN(num) || num < 1 || num > 18)) return
    setHoles((prev) =>
      prev.map((h, i) => (i === index ? { ...h, strokeIndex: num } : h))
    )
  }

  function validate(): string[] {
    const errors: string[] = []
    if (!name.trim()) errors.push('Course name is required')

    const siValues = holes.map((h) => h.strokeIndex)
    const hasMissing = siValues.some((si) => si === '')
    if (hasMissing) errors.push('All holes need a stroke index')

    const siNumbers = siValues.filter((si) => si !== '') as number[]
    const unique = new Set(siNumbers)
    if (unique.size !== siNumbers.length)
      errors.push('Stroke indices must be unique')

    const maxSI = holeCount
    const outOfRange = siNumbers.some((si) => si < 1 || si > maxSI)
    if (outOfRange) errors.push(`Stroke indices must be between 1 and ${maxSI}`)

    return errors
  }

  function canSubmit(): boolean {
    return validate().length === 0
  }

  function handleSubmit() {
    if (!canSubmit()) return

    const parsedHoles: ParsedHole[] = holes.map((h, i) => ({
      holeNumber: i + 1,
      par: h.par,
      strokeIndex: h.strokeIndex as number,
    }))

    addCourse(tournamentId, name.trim(), parsedHoles, 'manual', countryId)
    handleClose(false)
  }

  function handleClose(openState: boolean) {
    if (!openState) {
      setName('')
      setCountryId(undefined)
      setHoleCount(18)
      setHoles(makeDefaultHoles(18))
    }
    onOpenChange(openState)
  }

  const frontNine = holes.slice(0, 9)
  const backNine = holeCount === 18 ? holes.slice(9, 18) : []
  const frontPar = frontNine.reduce((s, h) => s + h.par, 0)
  const backPar = backNine.reduce((s, h) => s + h.par, 0)
  const totalPar = frontPar + backPar

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Course</DialogTitle>
          <DialogDescription>
            Manually define a course with par and stroke index for each hole.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Course name */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="manualCourseName">Course Name</Label>
            <Input
              id="manualCourseName"
              placeholder="e.g. Real Club Valderrama"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Country */}
          <CountrySelect value={countryId} onChange={setCountryId} />

          {/* Hole count */}
          <div className="flex flex-col gap-2">
            <Label>Holes</Label>
            <Select
              value={String(holeCount)}
              onValueChange={(v) => handleHoleCountChange(Number(v) as 9 | 18)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="18">18 holes</SelectItem>
                <SelectItem value="9">9 holes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Hole grid */}
          <div className="flex flex-col gap-3">
            <HoleGrid
              label="Front 9"
              holes={frontNine}
              startIndex={0}
              subtotal={frontPar}
              onParChange={updateHolePar}
              onSIChange={updateHoleSI}
            />
            {holeCount === 18 && (
              <HoleGrid
                label="Back 9"
                holes={backNine}
                startIndex={9}
                subtotal={backPar}
                totalPar={totalPar}
                onParChange={updateHolePar}
                onSIChange={updateHoleSI}
              />
            )}
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => handleClose(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit()}>
            <Plus className="size-4" />
            Create Course
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// HoleGrid — editable par + SI table for 9 holes
// ---------------------------------------------------------------------------

interface HoleGridProps {
  label: string
  holes: HoleDraft[]
  startIndex: number
  subtotal: number
  totalPar?: number
  onParChange: (index: number, par: 3 | 4 | 5) => void
  onSIChange: (index: number, si: string) => void
}

function HoleGrid({
  label,
  holes,
  startIndex,
  subtotal,
  totalPar,
  onParChange,
  onSIChange,
}: HoleGridProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
        {label}
      </span>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-center text-xs tabular-nums">
          <thead>
            <tr className="text-muted-foreground">
              <th className="w-8 py-0.5 text-left text-[10px] font-medium">
                Hole
              </th>
              {holes.map((_, i) => (
                <th key={i} className="min-w-[28px] py-0.5 font-medium">
                  {startIndex + i + 1}
                </th>
              ))}
              <th className="text-primary min-w-[28px] py-0.5 font-semibold">
                {label === 'Front 9' ? 'Out' : 'In'}
              </th>
              {totalPar != null && (
                <th className="text-primary min-w-[28px] py-0.5 font-semibold">
                  Tot
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {/* Par row — tap to cycle 3→4→5→3 */}
            <tr className="bg-muted/40">
              <td className="py-0.5 text-left text-[10px] font-medium">Par</td>
              {holes.map((h, i) => (
                <td key={i} className="py-0.5">
                  <button
                    type="button"
                    className="hover:bg-primary/10 rounded px-1.5 py-0.5 font-medium transition-colors"
                    onClick={() => {
                      const next = h.par === 3 ? 4 : h.par === 4 ? 5 : 3
                      onParChange(startIndex + i, next as 3 | 4 | 5)
                    }}
                    aria-label={`Hole ${startIndex + i + 1} par ${h.par}, tap to change`}
                  >
                    {h.par}
                  </button>
                </td>
              ))}
              <td className="text-primary py-0.5 font-semibold">{subtotal}</td>
              {totalPar != null && (
                <td className="text-primary py-0.5 font-semibold">
                  {totalPar}
                </td>
              )}
            </tr>
            {/* Stroke index row — editable inputs */}
            <tr>
              <td className="text-muted-foreground py-0.5 text-left text-[10px] font-medium">
                SI
              </td>
              {holes.map((h, i) => (
                <td key={i} className="py-0.5">
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={holes.length === 9 && startIndex === 0 ? 9 : 18}
                    className="bg-background border-border w-7 rounded border text-center text-xs tabular-nums outline-none focus:border-primary"
                    value={h.strokeIndex}
                    onChange={(e) => onSIChange(startIndex + i, e.target.value)}
                    aria-label={`Hole ${startIndex + i + 1} stroke index`}
                  />
                </td>
              ))}
              <td />
              {totalPar != null && <td />}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
