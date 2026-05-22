import { useEffect, useMemo, useState } from 'react'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  useActivePlayers,
  useCreatePlayer,
  useAddNewPersonToTournament,
  useUpdatePlayer,
  useSendInvite,
} from '@/features/players'
import { usePersons } from '@/features/persons'
import type { Player } from '@/features/players'
import { Mail } from 'lucide-react'
import { cn } from '@/lib/utils'

type Mode = 'existing' | 'new'

interface PlayerFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tournamentId: string
  /** If set, we're editing an existing player (handicap / active) */
  player?: Player
  /** Pre-select a person in "existing" mode (e.g. from a pool row's "Add to tournament" action) */
  initialPersonId?: string
  /** Force "existing" mode (used by the pool row's add-to-tournament shortcut) */
  forceMode?: Mode
}

export function PlayerFormDialog({
  open,
  onOpenChange,
  tournamentId,
  player,
  initialPersonId,
  forceMode,
}: PlayerFormDialogProps) {
  const isEditing = !!player

  const { data: persons = [] } = usePersons()
  const activePlayers = useActivePlayers(tournamentId)
  const personIdsInTournament = useMemo(
    () => new Set(activePlayers.map((p) => p.personId)),
    [activePlayers]
  )
  const candidatePersons = useMemo(
    () => persons.filter((p) => !personIdsInTournament.has(p.id)),
    [persons, personIdsInTournament]
  )

  const createPlayer = useCreatePlayer()
  const updatePlayer = useUpdatePlayer()
  const addNewPersonToTournament = useAddNewPersonToTournament()
  const sendInvite = useSendInvite()

  // Mode: only relevant when adding (not editing). Default: existing if any candidate, else new.
  const defaultMode: Mode =
    forceMode ?? (candidatePersons.length > 0 ? 'existing' : 'new')
  const [mode, setMode] = useState<Mode>(defaultMode)

  // Existing-mode state
  const [personId, setPersonId] = useState<string>(initialPersonId ?? '')

  // New-mode state
  const [displayName, setDisplayName] = useState('')
  const [nickname, setNickname] = useState('')
  const [email, setEmail] = useState('')
  const [sendInviteOnCreate, setSendInviteOnCreate] = useState(true)

  // Shared
  const [groupHandicap, setGroupHandicap] = useState<string>(
    player?.groupHandicap?.toString() ?? ''
  )

  // Re-sync state when the dialog opens.
  useEffect(() => {
    if (open) {
      setMode(forceMode ?? (candidatePersons.length > 0 ? 'existing' : 'new'))
      setPersonId(initialPersonId ?? '')
      setDisplayName('')
      setNickname('')
      setEmail('')
      setSendInviteOnCreate(true)
      setGroupHandicap(player?.groupHandicap?.toString() ?? '')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const trimmedEmail = email.trim().toLowerCase()
  const hasValidEmail = trimmedEmail.includes('@')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const hcp = parseInt(groupHandicap, 10)

    try {
      if (isEditing) {
        await updatePlayer.mutateAsync({
          id: player.id,
          updates: {
            groupHandicap: isNaN(hcp) ? player.groupHandicap : hcp,
          },
        })
      } else if (mode === 'existing') {
        if (!personId) return
        await createPlayer.mutateAsync({
          tournamentId,
          personId,
          groupHandicap: isNaN(hcp) ? 18 : hcp,
        })
      } else {
        if (!displayName.trim()) return
        await addNewPersonToTournament.mutateAsync({
          tournamentId,
          displayName: displayName.trim(),
          nickname: nickname.trim() || undefined,
          email: email.trim() || undefined,
          groupHandicap: isNaN(hcp) ? 18 : hcp,
        })
        if (hasValidEmail && sendInviteOnCreate) {
          try {
            await sendInvite.mutateAsync({
              tournamentId,
              email: trimmedEmail,
            })
            toast(`Invite sent to ${trimmedEmail}`, { duration: 3000 })
          } catch {
            toast.error('Player added, but invite could not be sent')
          }
        }
      }
    } catch {
      toast.error(isEditing ? 'Could not save player' : 'Could not add player')
      return
    }

    onOpenChange(false)
  }

  const isPending =
    createPlayer.isPending ||
    updatePlayer.isPending ||
    addNewPersonToTournament.isPending

  const submitDisabled =
    isPending ||
    (isEditing ? false : mode === 'existing' ? !personId : !displayName.trim())

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Player' : 'Add Player'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update tournament participation. Name and email are edited on the person record.'
              : 'Add someone to this tournament — pick from the pool or create a new person.'}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => void handleSubmit(e)}
          className="flex flex-col gap-4"
        >
          {!isEditing && !forceMode && (
            <div
              role="tablist"
              aria-label="Add player mode"
              className="bg-muted/50 grid grid-cols-2 gap-1 rounded-md p-1"
            >
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'existing'}
                onClick={() => setMode('existing')}
                className={cn(
                  'rounded px-3 py-1.5 text-sm font-medium transition-colors',
                  mode === 'existing'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Existing person
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'new'}
                onClick={() => setMode('new')}
                className={cn(
                  'rounded px-3 py-1.5 text-sm font-medium transition-colors',
                  mode === 'new'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                New person
              </button>
            </div>
          )}

          {!isEditing && mode === 'existing' && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="personSelect">Person</Label>
              {candidatePersons.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  Everyone in the pool is already in this tournament. Switch to
                  &ldquo;New person&rdquo; to add someone new.
                </p>
              ) : (
                <Select value={personId} onValueChange={setPersonId}>
                  <SelectTrigger id="personSelect" className="w-full">
                    <SelectValue placeholder="Pick someone from the pool" />
                  </SelectTrigger>
                  <SelectContent>
                    {candidatePersons.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.displayName}
                        {p.nickname ? ` "${p.nickname}"` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {!isEditing && mode === 'new' && (
            <>
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
                <Label htmlFor="email">Email (optional)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="e.g. magnus@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                {hasValidEmail && (
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
              </div>
            </>
          )}

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
            <Button type="submit" className="h-11" disabled={submitDisabled}>
              {isEditing ? 'Save' : 'Add Player'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
