import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCountries, useCreateCountry } from '../api/use-countries'

interface CountrySelectProps {
  value: string | undefined
  onChange: (countryId: string | undefined) => void
  label?: string
}

const ADD_NEW_VALUE = '__add_new__'
const NONE_VALUE = '__none__'

export function CountrySelect({
  value,
  onChange,
  label = 'Country (optional)',
}: CountrySelectProps) {
  const { data: countries = [] } = useCountries()
  const createCountry = useCreateCountry()
  const [showNew, setShowNew] = useState(false)
  const [newName, setNewName] = useState('')

  function handleSelectChange(val: string) {
    if (val === ADD_NEW_VALUE) {
      setShowNew(true)
      return
    }
    if (val === NONE_VALUE) {
      onChange(undefined)
      return
    }
    onChange(val)
  }

  async function handleAddNew() {
    const trimmed = newName.trim()
    if (!trimmed) return
    try {
      const country = await createCountry.mutateAsync(trimmed)
      onChange(country.id)
      setNewName('')
      setShowNew(false)
    } catch {
      toast.error('Could not add country')
    }
  }

  function handleCancelNew() {
    setNewName('')
    setShowNew(false)
  }

  const sorted = [...countries].sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      {showNew ? (
        <div className="flex items-center gap-2">
          <Input
            placeholder="e.g. Spain"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                void handleAddNew()
              }
              if (e.key === 'Escape') {
                handleCancelNew()
              }
            }}
            autoFocus
          />
          <Button
            type="button"
            size="sm"
            onClick={() => void handleAddNew()}
            disabled={!newName.trim() || createCountry.isPending}
          >
            {createCountry.isPending ? 'Adding…' : 'Add'}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={handleCancelNew}
          >
            <X className="size-4" />
          </Button>
        </div>
      ) : (
        <Select value={value ?? NONE_VALUE} onValueChange={handleSelectChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select country" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE_VALUE}>No country</SelectItem>
            {sorted.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
            <SelectItem value={ADD_NEW_VALUE}>
              <span className="flex items-center gap-1.5">
                <Plus className="size-3.5" />
                Add new country
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
      )}
    </div>
  )
}
