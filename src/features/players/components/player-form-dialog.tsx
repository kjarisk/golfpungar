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
import {
  useCreatePlayer,
  useUpdatePlayer,
  useSendInvite,
} from '@/features/players'
import type { Player } from '@/features/players'
import { Mail } from 'lucide-react'

interface PlayerFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tournamentId: string
  /** If set, we're editing an existing player */
  player?: Player
  /** If false, the handicap field is hidden (non-admin editing own profile) */
  canEditHandicap?: boolean
  /** If true, show the email field (admin only) */
  showEmail?: boolean
}

export function PlayerFormDialog({
  open,
  onOpenChange,
  tournamentId,
  player,
  canEditHandicap = true,
  showEmail = false,
}: PlayerFormDialogProps) {
  const createPlayer = useCreatePlayer()
  const updatePlayer = useUpdatePlayer()
  const sendInvite = useSendInvite()

  const [displayName, setDisplayName] = useState(player?.displayName ?? '')
  const [nickname, setNickname] = useState(player?.nickname ?? '')
  const [email, setEmail] = useState(player?.email ?? '')
  const [groupHandicap, setGroupHandicap] = useState(
    player?.groupHandicap?.toString() ?? ''
  )
  const [sendInviteOnCreate, setSendInviteOnCreate] = useState(true)

  const isEditing = !!player
  const trimmedEmail = email.trim().toLowerCase()
  const hasValidEmail = trimmedEmail.includes('@')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!displayName.trim()) return

    const hcp = parseInt(groupHandicap, 10)

    try {
      if (isEditing) {
        await updatePlayer.mutateAsync({
          id: player.id,
          updates: {
            displayName: displayName.trim(),
            nickname: nickname.trim() || undefined,
            email: email.trim() || undefined,
            groupHandicap: isNaN(hcp) ? player.groupHandicap : hcp,
          },
        })
      } else {
        await createPlayer.mutateAsync({
          tournamentId,
          input: {
            displayName: displayName.trim(),
            nickname: nickname.trim() || undefined,
            email: email.trim() || undefined,
            groupHandicap: isNaN(hcp) ? 18 : hcp,
          },
        })
        // Auto-send invite if email provided and toggle is on
        if (showEmail && hasValidEmail && sendInviteOnCreate) {
          await sendInvite.mutateAsync({
            tournamentId,
            email: trimmedEmail,
          })
          toast(`Invite sent to ${trimmedEmail}`, { duration: 3000 })
        }
      }
    } catch {
      toast.error(isEditing ? 'Could not save player' : 'Could not add player')
      return
    }

    if (!isEditing) {
      setDisplayName('')
      setNickname('')
      setEmail('')
      setGroupHandicap('')
      setSendInviteOnCreate(true)
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Player' : 'Add Player'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update player details.'
              : 'Add a player to the tournament.'}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => void handleSubmit(e)}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="displayName">Name</Label>
            <Input
              id="displayName"
              placeholder="e.g. Magnus"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="nickname">Nickname (optional)</Label>
            <Input
              id="nickname"
              placeholder="e.g. Maggi"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
          </div>

          {showEmail && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email (optional)</Label>
              <Input
                id="email"
                type="email"
                placeholder="e.g. magnus@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {!isEditing && hasValidEmail && (
                <label className="bg-muted/50 flex items-center gap-2.5 rounded-md px-3 py-2.5">
                  <input
                    type="checkbox"
                    checked={sendInviteOnCreate}
                    onChange={(e) => setSendInviteOnCreate(e.target.checked)}
                    className="accent-primary size-4 rounded"
                  />
                  <span className="flex items-center gap-1.5 text-sm">
                    <Mail className="size-3.5" aria-hidden="true" />
                    Send invite to {trimmedEmail}
                  </span>
                </label>
              )}
              {isEditing && (
                <p className="text-muted-foreground text-xs">
                  If set, invites sent to this email will auto-link to this
                  player.
                </p>
              )}
            </div>
          )}

          {canEditHandicap && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="groupHandicap">Group Handicap</Label>
              <Input
                id="groupHandicap"
                type="number"
                min={0}
                max={54}
                placeholder="e.g. 18"
                value={groupHandicap}
                onChange={(e) => setGroupHandicap(e.target.value)}
                required
              />
            </div>
          )}

          <DialogFooter>
            <Button
              type="submit"
              className="h-11"
              disabled={
                !displayName.trim() ||
                createPlayer.isPending ||
                updatePlayer.isPending
              }
            >
              {isEditing ? 'Save' : 'Add Player'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
