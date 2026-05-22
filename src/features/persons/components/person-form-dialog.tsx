import { useState } from 'react'
import { toast } from 'sonner'
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
import { useCreatePerson, useUpdatePerson } from '../api/use-persons'
import type { Person } from '../types'

interface PersonFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** If set, we're editing an existing person */
  person?: Person
}

export function PersonFormDialog(props: PersonFormDialogProps) {
  // Keying the inner form by `person?.id` + `open` resets local state when
  // the dialog opens or the target person changes — without an effect.
  return (
    <PersonFormDialogInner
      key={`${props.open ? 'open' : 'closed'}-${props.person?.id ?? 'new'}`}
      {...props}
    />
  )
}

function PersonFormDialogInner({
  open,
  onOpenChange,
  person,
}: PersonFormDialogProps) {
  const createPerson = useCreatePerson()
  const updatePerson = useUpdatePerson()

  const [displayName, setDisplayName] = useState(person?.displayName ?? '')
  const [nickname, setNickname] = useState(person?.nickname ?? '')
  const [email, setEmail] = useState(person?.email ?? '')

  const isEditing = !!person

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!displayName.trim()) return

    try {
      if (isEditing) {
        await updatePerson.mutateAsync({
          id: person.id,
          updates: {
            displayName: displayName.trim(),
            nickname: nickname.trim() || undefined,
            email: email.trim() || undefined,
          },
        })
      } else {
        await createPerson.mutateAsync({
          displayName: displayName.trim(),
          nickname: nickname.trim() || undefined,
          email: email.trim() || undefined,
        })
      }
    } catch {
      toast.error(isEditing ? 'Could not save person' : 'Could not add person')
      return
    }

    if (!isEditing) {
      setDisplayName('')
      setNickname('')
      setEmail('')
    }
    onOpenChange(false)
  }

  const isPending = createPerson.isPending || updatePerson.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Person' : 'Add Person'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update this person in the pool.'
              : 'Add someone to the people pool. They can be added to tournaments later.'}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => void handleSubmit(e)}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="personDisplayName">Name</Label>
            <Input
              id="personDisplayName"
              placeholder="e.g. Magnus"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="personNickname">Nickname (optional)</Label>
            <Input
              id="personNickname"
              placeholder="e.g. Maggi"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="personEmail">Email (optional)</Label>
            <Input
              id="personEmail"
              type="email"
              placeholder="e.g. magnus@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <p className="text-muted-foreground text-xs">
              Invites sent to this email link to this person on signup.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="submit"
              className="h-11"
              disabled={!displayName.trim() || isPending}
            >
              {isEditing ? 'Save' : 'Add Person'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
