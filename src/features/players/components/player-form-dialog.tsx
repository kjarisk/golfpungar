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
import { usePlayersStore } from '@/features/players'
import type { Player } from '@/features/players'

interface PlayerFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tournamentId: string
  /** If set, we're editing an existing player */
  player?: Player
}

export function PlayerFormDialog({
  open,
  onOpenChange,
  tournamentId,
  player,
}: PlayerFormDialogProps) {
  const addPlayer = usePlayersStore((s) => s.addPlayer)
  const updatePlayer = usePlayersStore((s) => s.updatePlayer)

  const [displayName, setDisplayName] = useState(player?.displayName ?? '')
  const [nickname, setNickname] = useState(player?.nickname ?? '')
  const [groupHandicap, setGroupHandicap] = useState(
    player?.groupHandicap?.toString() ?? ''
  )

  const isEditing = !!player

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!displayName.trim()) return

    const hcp = parseInt(groupHandicap, 10)

    if (isEditing) {
      updatePlayer(player.id, {
        displayName: displayName.trim(),
        nickname: nickname.trim() || undefined,
        groupHandicap: isNaN(hcp) ? player.groupHandicap : hcp,
      })
    } else {
      addPlayer(tournamentId, {
        displayName: displayName.trim(),
        nickname: nickname.trim() || undefined,
        groupHandicap: isNaN(hcp) ? 18 : hcp,
      })
    }

    if (!isEditing) {
      setDisplayName('')
      setNickname('')
      setGroupHandicap('')
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

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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

          <DialogFooter>
            <Button type="submit" disabled={!displayName.trim()}>
              {isEditing ? 'Save' : 'Add Player'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
