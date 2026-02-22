import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useScoringStore } from '@/features/scoring'
import type { Scorecard } from '@/features/scoring'
import { Check } from 'lucide-react'

interface RoundTotalEntryProps {
  scorecard: Scorecard
  playerName: string
  coursePar: number
}

export function RoundTotalEntry({
  scorecard,
  playerName,
  coursePar,
}: RoundTotalEntryProps) {
  const setWholeRoundTotal = useScoringStore((s) => s.setWholeRoundTotal)
  const [total, setTotal] = useState(
    scorecard.grossTotal > 0 ? String(scorecard.grossTotal) : ''
  )

  function handleSave() {
    const num = parseInt(total, 10)
    if (isNaN(num) || num < 1) return
    setWholeRoundTotal(scorecard.id, num)
  }

  const numVal = parseInt(total, 10)
  const diff = !isNaN(numVal) ? numVal - coursePar : null

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{playerName}</CardTitle>
          {scorecard.grossTotal > 0 && (
            <Badge variant="outline" className="tabular-nums">
              {scorecard.grossTotal}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-3">
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor={`total-${scorecard.id}`} className="text-xs">
              Gross Total (par {coursePar})
            </Label>
            <Input
              id={`total-${scorecard.id}`}
              type="number"
              inputMode="numeric"
              min={1}
              max={200}
              placeholder={String(coursePar)}
              value={total}
              onChange={(e) => setTotal(e.target.value)}
              className="tabular-nums"
            />
          </div>
          {diff !== null && !isNaN(diff) && (
            <span
              className={`mb-2 text-sm font-medium tabular-nums ${
                diff < 0
                  ? 'text-primary'
                  : diff === 0
                    ? 'text-muted-foreground'
                    : 'text-orange-600'
              }`}
            >
              {diff > 0 ? '+' : ''}
              {diff}
            </span>
          )}
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isNaN(numVal) || numVal < 1}
            className="mb-0.5"
          >
            <Check className="size-4" />
            Save
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
