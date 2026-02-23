import { useState, useRef } from 'react'
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
import { parseCourseCSV, useCoursesStore } from '@/features/courses'
import type { CsvParseResult } from '@/features/courses'
import { CountrySelect } from '@/features/countries/components/country-select'
import { Upload, CheckCircle, AlertCircle, FileSpreadsheet } from 'lucide-react'

interface ImportCourseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tournamentId: string
}

export function ImportCourseDialog({
  open,
  onOpenChange,
  tournamentId,
}: ImportCourseDialogProps) {
  const addCourse = useCoursesStore((s) => s.addCourse)
  const fileRef = useRef<HTMLInputElement>(null)

  const [courseName, setCourseName] = useState('')
  const [countryId, setCountryId] = useState<string | undefined>(undefined)
  const [parseResult, setParseResult] = useState<CsvParseResult | null>(null)
  const [parseErrors, setParseErrors] = useState<string[]>([])
  const [fileName, setFileName] = useState<string>('')

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      const result = parseCourseCSV(text)

      if (result.success) {
        setParseResult(result)
        setParseErrors([])
        if (result.courseName && !courseName) {
          setCourseName(result.courseName)
        }
      } else {
        setParseResult(null)
        setParseErrors(result.errors)
      }
    }
    reader.readAsText(file)
  }

  function handleImport() {
    if (!parseResult || !courseName.trim()) return

    addCourse(
      tournamentId,
      courseName.trim(),
      parseResult.holes,
      'csv',
      countryId
    )

    // Reset
    setCourseName('')
    setCountryId(undefined)
    setParseResult(null)
    setParseErrors([])
    setFileName('')
    if (fileRef.current) fileRef.current.value = ''
    onOpenChange(false)
  }

  function handleClose(openState: boolean) {
    if (!openState) {
      setCourseName('')
      setCountryId(undefined)
      setParseResult(null)
      setParseErrors([])
      setFileName('')
      if (fileRef.current) fileRef.current.value = ''
    }
    onOpenChange(openState)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import Course (CSV)</DialogTitle>
          <DialogDescription>
            Upload a CSV with holeNumber, par, and strokeIndex columns.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* File upload */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="csvFile">CSV File</Label>
            <div className="flex gap-2">
              <Input
                ref={fileRef}
                id="csvFile"
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileChange}
                className="cursor-pointer"
              />
            </div>
            {fileName && !parseResult && parseErrors.length === 0 && (
              <p className="text-muted-foreground flex items-center gap-1 text-xs">
                <FileSpreadsheet className="size-3" />
                Reading {fileName}...
              </p>
            )}
          </div>

          {/* Parse errors */}
          {parseErrors.length > 0 && (
            <div className="bg-destructive/10 text-destructive rounded-lg border border-red-200 p-3">
              <p className="mb-1 flex items-center gap-1 text-sm font-medium">
                <AlertCircle className="size-4" />
                Import errors
              </p>
              <ul className="list-inside list-disc text-xs">
                {parseErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Parse success: preview */}
          {parseResult && (
            <>
              <div className="bg-primary/5 border-primary/20 rounded-lg border p-3">
                <p className="text-primary mb-2 flex items-center gap-1 text-sm font-medium">
                  <CheckCircle className="size-4" />
                  Parsed successfully
                </p>
                <div className="text-muted-foreground grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-foreground font-medium">
                      {parseResult.holeCount}
                    </span>{' '}
                    holes
                  </div>
                  <div>
                    Par{' '}
                    <span className="text-foreground font-medium">
                      {parseResult.totalPar}
                    </span>
                  </div>
                  <div>
                    <span className="text-foreground font-medium">
                      {parseResult.holes.filter((h) => h.par === 3).length}
                    </span>{' '}
                    par 3s
                  </div>
                </div>
              </div>

              {/* Hole grid preview */}
              <div className="max-h-48 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-muted-foreground border-b text-left">
                      <th className="pb-1 font-medium">Hole</th>
                      <th className="pb-1 font-medium">Par</th>
                      <th className="pb-1 font-medium">SI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parseResult.holes.map((hole) => (
                      <tr
                        key={hole.holeNumber}
                        className="border-b last:border-0"
                      >
                        <td className="py-1 font-medium">{hole.holeNumber}</td>
                        <td className="py-1">{hole.par}</td>
                        <td className="py-1">{hole.strokeIndex}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="courseName">Course Name</Label>
                <Input
                  id="courseName"
                  placeholder="e.g. Los Naranjos Golf Club"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  required
                />
              </div>

              <CountrySelect value={countryId} onChange={setCountryId} />
            </>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="h-11"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="size-4" />
              {fileName ? 'Change File' : 'Choose File'}
            </Button>
            <Button
              type="button"
              className="h-11"
              onClick={handleImport}
              disabled={!parseResult || !courseName.trim()}
            >
              Import Course
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
