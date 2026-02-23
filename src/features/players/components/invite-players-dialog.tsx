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
import { Badge } from '@/components/ui/badge'
import { usePlayersStore } from '@/features/players'
import { Mail, X } from 'lucide-react'

interface InvitePlayersDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tournamentId: string
}

export function InvitePlayersDialog({
  open,
  onOpenChange,
  tournamentId,
}: InvitePlayersDialogProps) {
  const sendInvite = usePlayersStore((s) => s.sendInvite)
  const [email, setEmail] = useState('')
  const [pendingEmails, setPendingEmails] = useState<string[]>([])

  function addEmail() {
    const trimmed = email.trim().toLowerCase()
    if (!trimmed || !trimmed.includes('@')) return
    if (pendingEmails.includes(trimmed)) return

    setPendingEmails((prev) => [...prev, trimmed])
    setEmail('')
  }

  function removeEmail(emailToRemove: string) {
    setPendingEmails((prev) => prev.filter((e) => e !== emailToRemove))
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      addEmail()
    }
  }

  function handleSend() {
    for (const addr of pendingEmails) {
      sendInvite(tournamentId, addr)
    }
    setPendingEmails([])
    setEmail('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Players</DialogTitle>
          <DialogDescription>
            Add email addresses and send magic link invites.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="inviteEmail">Email Address</Label>
            <div className="flex gap-2">
              <Input
                id="inviteEmail"
                type="email"
                placeholder="friend@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <Button
                type="button"
                variant="outline"
                size="default"
                onClick={addEmail}
              >
                Add
              </Button>
            </div>
          </div>

          {pendingEmails.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {pendingEmails.map((addr) => (
                <Badge
                  key={addr}
                  variant="secondary"
                  className="gap-1.5 py-1 pr-1 text-sm"
                >
                  <Mail className="size-3.5" />
                  {addr}
                  <button
                    type="button"
                    onClick={() => removeEmail(addr)}
                    className="hover:bg-destructive/10 hover:text-destructive ml-0.5 rounded-full p-1"
                  >
                    <X className="size-4" />
                    <span className="sr-only">Remove {addr}</span>
                  </button>
                </Badge>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              className="h-11"
              onClick={handleSend}
              disabled={pendingEmails.length === 0}
            >
              Send {pendingEmails.length > 0 ? `${pendingEmails.length} ` : ''}
              Invite{pendingEmails.length !== 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
