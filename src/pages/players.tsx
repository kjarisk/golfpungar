import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { useTournaments } from '@/features/tournament'
import type { Tournament, TournamentStatus } from '@/features/tournament'
import { useAuthStore } from '@/features/auth'
import { usePlayers, AddPersonToTournamentDialog } from '@/features/players'
import type { Player } from '@/features/players'
import {
  PersonFormDialog,
  usePersons,
  useRemovePerson,
} from '@/features/persons'
import type { Person } from '@/features/persons'
import { Plus, MoreHorizontal, UserPlus } from 'lucide-react'
import { useIsAdmin } from '@/hooks/use-is-admin'
import { supabase } from '@/lib/supabase'

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function chipVariantFor(
  status: TournamentStatus
): 'default' | 'secondary' | 'outline' {
  if (status === 'live') return 'default'
  if (status === 'done') return 'secondary'
  return 'outline'
}

export function PlayersPage() {
  const playersQuery = usePlayers()
  const personsQuery = usePersons()
  const tournamentsQuery = useTournaments()

  const isAdmin = useIsAdmin()
  const removePerson = useRemovePerson()
  const currentUserId = useAuthStore((s) => s.user?.id)

  const [personDialogOpen, setPersonDialogOpen] = useState(false)
  const [editingPerson, setEditingPerson] = useState<Person | undefined>()
  const [addToTournamentPersonId, setAddToTournamentPersonId] = useState<
    string | undefined
  >()
  const [confirmingRemovePersonId, setConfirmingRemovePersonId] = useState<
    string | null
  >(null)
  const [invitingPersonId, setInvitingPersonId] = useState<string | null>(null)

  const isLoading =
    personsQuery.isLoading ||
    playersQuery.isLoading ||
    tournamentsQuery.isLoading
  const isError =
    personsQuery.isError || playersQuery.isError || tournamentsQuery.isError

  const persons = personsQuery.data ?? []
  const allPlayers = playersQuery.data
  const tournaments = tournamentsQuery.data
  const tournamentById = useMemo(
    () =>
      new Map<string, Tournament>((tournaments ?? []).map((t) => [t.id, t])),
    [tournaments]
  )

  // Build a map: personId -> list of (tournament, player) for chips.
  const tournamentsByPerson = useMemo(() => {
    const map = new Map<
      string,
      Array<{ tournament: Tournament; player: Player }>
    >()
    for (const player of allPlayers ?? []) {
      const tournament = tournamentById.get(player.tournamentId)
      if (!tournament) continue
      const arr = map.get(player.personId) ?? []
      arr.push({ tournament, player })
      map.set(player.personId, arr)
    }
    return map
  }, [allPlayers, tournamentById])

  async function handleRemovePerson(personId: string) {
    setConfirmingRemovePersonId(null)
    try {
      await removePerson.mutateAsync(personId)
      toast('Person removed', { duration: 2000 })
    } catch {
      toast.error('Could not remove person (they may still be in a tournament)')
    }
  }

  async function handleSendSignInLink(person: Person) {
    if (!person.email) return
    setInvitingPersonId(person.id)
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: person.email,
        options: { emailRedirectTo: window.location.origin },
      })
      if (error) {
        toast.error(error.message)
        return
      }
      toast(`Sign-in link sent to ${person.email}`, { duration: 2500 })
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : 'Could not send sign-in link'
      )
    } finally {
      setInvitingPersonId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold tracking-tight">Players</h1>
        <p className="text-muted-foreground text-sm">Loading players…</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold tracking-tight">Players</h1>
        <p className="text-destructive text-sm">
          Could not load players. Try again.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Players</h1>
          <p className="text-muted-foreground text-sm">
            {persons.length} {persons.length === 1 ? 'person' : 'people'} in the
            pool
          </p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Button
              onClick={() => {
                setEditingPerson(undefined)
                setPersonDialogOpen(true)
              }}
              aria-label="Add person"
            >
              <Plus className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">Add</span>
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">All players</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-0">
          {persons.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <UserPlus className="text-muted-foreground size-10" />
              <p className="text-muted-foreground text-sm">No players yet</p>
              {isAdmin && (
                <Button
                  size="sm"
                  onClick={() => {
                    setEditingPerson(undefined)
                    setPersonDialogOpen(true)
                  }}
                >
                  Add First Player
                </Button>
              )}
            </div>
          ) : (
            persons.map((person, i) => {
              const chips = tournamentsByPerson.get(person.id) ?? []
              const confirmingRemove = confirmingRemovePersonId === person.id
              const canSendSignInLink = !!person.email && !person.userId
              const isInviting = invitingPersonId === person.id
              return (
                <div key={person.id}>
                  {i > 0 && <Separator />}
                  <div className="flex items-center gap-3 py-3">
                    <Avatar className="size-9">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                        {getInitials(person.displayName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-x-2">
                        <span className="truncate text-sm font-medium">
                          {person.displayName}
                        </span>
                        {person.nickname && (
                          <span className="text-muted-foreground truncate text-xs">
                            &ldquo;{person.nickname}&rdquo;
                          </span>
                        )}
                        <Badge
                          variant="outline"
                          className="text-[10px] tabular-nums"
                        >
                          hcp: {person.currentHandicap}
                        </Badge>
                        {!!person.userId && person.userId === currentUserId && (
                          <Badge
                            variant="default"
                            className="bg-primary/15 text-primary border-primary/30 border text-[10px] font-semibold"
                          >
                            You
                          </Badge>
                        )}
                      </div>
                      {person.email && (
                        <span className="text-muted-foreground truncate text-xs">
                          {person.email}
                        </span>
                      )}
                      {chips.length > 0 && (
                        <div className="mt-0.5 flex flex-wrap gap-1">
                          {chips.map(({ tournament, player }) => (
                            <Badge
                              key={tournament.id}
                              variant={chipVariantFor(tournament.status)}
                              className="text-[10px] tabular-nums"
                            >
                              {tournament.name} · hcp: {player.groupHandicap}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    {confirmingRemove ? (
                      <span className="flex items-center gap-1.5 text-sm">
                        <span className="text-muted-foreground">Delete?</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2.5 text-sm text-green-600 hover:text-green-700"
                          onClick={() => void handleRemovePerson(person.id)}
                        >
                          Yes
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2.5 text-sm"
                          onClick={() => setConfirmingRemovePersonId(null)}
                        >
                          No
                        </Button>
                      </span>
                    ) : (
                      isAdmin && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setAddToTournamentPersonId(person.id)
                            }
                            aria-label={`Add ${person.displayName} to a tournament`}
                          >
                            <Plus className="size-4" aria-hidden="true" />
                            <span className="hidden sm:inline">Tournament</span>
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label={`More actions for ${person.displayName}`}
                              >
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem
                                onSelect={() => {
                                  setEditingPerson(person)
                                  setPersonDialogOpen(true)
                                }}
                              >
                                Edit
                              </DropdownMenuItem>
                              {canSendSignInLink && (
                                <DropdownMenuItem
                                  disabled={isInviting}
                                  onSelect={(e) => {
                                    e.preventDefault()
                                    void handleSendSignInLink(person)
                                  }}
                                >
                                  {isInviting
                                    ? 'Sending…'
                                    : 'Send sign-in link'}
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                variant="destructive"
                                onSelect={() =>
                                  setConfirmingRemovePersonId(person.id)
                                }
                              >
                                Remove
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </>
                      )
                    )}
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      <AddPersonToTournamentDialog
        personId={addToTournamentPersonId}
        open={!!addToTournamentPersonId}
        onOpenChange={(open) => {
          if (!open) setAddToTournamentPersonId(undefined)
        }}
      />

      <PersonFormDialog
        open={personDialogOpen}
        onOpenChange={(open) => {
          setPersonDialogOpen(open)
          if (!open) setEditingPerson(undefined)
        }}
        person={editingPerson}
      />
    </div>
  )
}
