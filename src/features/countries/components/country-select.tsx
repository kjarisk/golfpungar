import { useState } from 'react'
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
import { useCountriesStore } from '@/features/countries'
import { Plus, X } from 'lucide-react'

interface CountrySelectProps {
  value: string | undefined
  onChange: (countryId: string | undefined) => void
  label?: string
}

const ADD_NEW_VALUE = '__add_new__'

export function CountrySelect({
  value,
  onChange,
  label = 'Country (optional)',
}: CountrySelectProps) {
  const countries = useCountriesStore((s) => s.countries)
  const addCountry = useCountriesStore((s) => s.addCountry)
  const [showNew, setShowNew] = useState(false)
  const [newName, setNewName] = useState('')

  function handleSelectChange(val: string) {
    if (val === ADD_NEW_VALUE) {
      setShowNew(true)
      return
    }
    if (val === '__none__') {
      onChange(undefined)
      return
    }
    onChange(val)
  }

  function handleAddNew() {
    const trimmed = newName.trim()
    if (!trimmed) return
    const country = addCountry(trimmed)
    if (country) {
      onChange(country.id)
    }
    setNewName('')
    setShowNew(false)
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
                handleAddNew()
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
            onClick={handleAddNew}
            disabled={!newName.trim()}
          >
            Add
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
        <Select value={value ?? '__none__'} onValueChange={handleSelectChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select country" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">No country</SelectItem>
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
