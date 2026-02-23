import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { DEFAULT_POINTS } from '@/features/scoring/lib/points-calc'
import { RotateCcw, Pencil } from 'lucide-react'

interface PointsTableEditorProps {
  pointsTable: number[]
  onChange: (table: number[]) => void
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

export function PointsTableEditor({
  pointsTable,
  onChange,
}: PointsTableEditorProps) {
  const [editing, setEditing] = useState(false)
  const isDefault =
    pointsTable.length === DEFAULT_POINTS.length &&
    pointsTable.every((p, i) => p === DEFAULT_POINTS[i])

  function handlePointChange(index: number, value: string) {
    const num = parseInt(value, 10)
    if (isNaN(num) || num < 0) return
    const updated = [...pointsTable]
    updated[index] = num
    onChange(updated)
  }

  function addPlace() {
    onChange([...pointsTable, 1])
  }

  function removeLastPlace() {
    if (pointsTable.length <= 1) return
    onChange(pointsTable.slice(0, -1))
  }

  function resetToDefault() {
    onChange([...DEFAULT_POINTS])
    setEditing(false)
  }

  if (!editing) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label>Points</Label>
          <div className="flex gap-1.5">
            {!isDefault && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={resetToDefault}
                className="h-6 gap-1 px-2 text-xs"
              >
                <RotateCcw className="size-3" />
                Reset
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setEditing(true)}
              className="h-6 gap-1 px-2 text-xs"
            >
              <Pencil className="size-3" />
              Edit
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-1">
          {pointsTable.map((pts, i) => (
            <Badge key={i} variant="outline" className="text-xs tabular-nums">
              {ordinal(i + 1)}: {pts}p
            </Badge>
          ))}
        </div>
        {isDefault && (
          <p className="text-muted-foreground text-xs">
            Default top-{pointsTable.length} points table.
          </p>
        )}
        {!isDefault && (
          <p className="text-muted-foreground text-xs">Custom points table.</p>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <Label>Points (editing)</Label>
        <div className="flex gap-1.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={resetToDefault}
            className="h-6 gap-1 px-2 text-xs"
          >
            <RotateCcw className="size-3" />
            Reset
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setEditing(false)}
            className="h-6 px-2 text-xs"
          >
            Done
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-5 gap-1.5">
        {pointsTable.map((pts, i) => (
          <div key={i} className="flex flex-col items-center gap-0.5">
            <span className="text-muted-foreground text-[10px]">
              {ordinal(i + 1)}
            </span>
            <Input
              type="number"
              min={0}
              value={pts}
              onChange={(e) => handlePointChange(i, e.target.value)}
              className="h-7 w-full text-center text-xs tabular-nums"
              aria-label={`Points for ${ordinal(i + 1)} place`}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addPlace}
          className="h-6 text-xs"
        >
          + Place
        </Button>
        {pointsTable.length > 1 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={removeLastPlace}
            className="h-6 text-xs"
          >
            - Place
          </Button>
        )}
      </div>
    </div>
  )
}
