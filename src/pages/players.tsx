import { useState } from 'react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { useActiveTournament } from '@/features/tournament'
import {
  useActivePlayers,
  useTournamentInvites,
  usePlayers,
  useInvites,
  useRemovePlayer,
} from '@/features/players'
import type { Player } from '@/features/players'
import {
  PersonFormDialog,
  usePersons,
  useRemovePerson,
} from '@/features/persons'
import type { Person } from '@/features/persons'
import { PlayerFormDialog } from '@/features/players/components/player-form-dialog'
import { InvitePlayersDialog } from '@/features/players/components/invite-players-dialog'
import {
  Link2,
  Mail,
  Plus,
  UserPlus,
  Pencil,
  Trash2,
  UserCheck,
} from 'lucide-react'
import { useIsAdmin } from '@/hooks/use-is-admin'
import { useAuthStore } from '@/features/auth'

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function PlayersPage() {
  const tournament = useActiveTournament()
  const players = useActivePlayers(tournament?.id)
  const invites = useTournamentInvites(tournament?.id)
  const playersQuery = usePlayers()
  const invitesQuery = useInvites()
  const personsQuery = usePersons()
  const isAdmin = useIsAdmin()
  const authUser = useAuthStore((s) => s.user)
  const removePlayer = useRemovePlayer()
  const removePerson = useRemovePerson()

  const [showAddPlayer, setShowAddPlayer] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [editingPlayer, setEditingPlayer] = useState<Player | undefined>()

  const [personDialogOpen, setPersonDialogOpen] = useState(false)
  const [editingPerson, setEditingPerson] = useState<Person | undefined>()

  const [addPersonToTournament, setAddPersonToTournament] = useState<
    string | undefined
  >()

  const [confirmingRemovePersonId, setConfirmingRemovePersonId] = useState<
    string | null
  >(null)
  const [confirmingRemovePlayerId, setConfirmingRemovePlayerId] = useState<
    string | null
  >(null)

  if (!tournament) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold tracking-tight">Players</h1>
        <p className="text-muted-foreground text-sm">
          No active tournament. Select or create one to manage players.
        </p>
        <Button asChild variant="outline" className="w-fit">
          <Link to="/tournaments">View Tournaments</Link>
        </Button>
      </div>
    )
  }

  const isLoading =
    playersQuery.isLoading || invitesQuery.isLoading || personsQuery.isLoading
  const isError =
    playersQuery.isError || invitesQuery.isError || personsQuery.isError

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

  const persons = personsQuery.data ?? []
  const personIdsInTournament = new Set(players.map((p) => p.personId))
  const pendingInvites = invites.filter((i) => i.status === 'pending')
  // Map for invite "Linked to" display
  const personById = new Map(persons.map((p) => [p.id, p]))

  async function handleRemovePlayer(playerId: string) {
    setConfirmingRemovePlayerId(null)
    try {
      await removePlayer.mutateAsync(playerId)
      toast('Player removed from tournament', { duration: 2000 })
    } catch {
      toast.error('Could not remove player')
    }
  }

  async function handleRemovePerson(personId: string) {
    setConfirmingRemovePersonId(null)
    try {
      await removePerson.mutateAsync(personId)
      toast('Person removed', { duration: 2000 })
    } catch {
      toast.error('Could not remove person (they may still be in a tournament)')
    }
  }

  function openAddToTournament(personId: string) {
    setAddPersonToTournament(personId)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Players</h1>
          <p className="text-muted-foreground text-sm">
            {players.length} player{players.length !== 1 ? 's' : ''} in{' '}
            {tournament.name}
          </p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowInvite(true)}
              aria-label="Invite players"
            >
              <Mail className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">Invite</span>
            </Button>
            <Button
              onClick={() => setShowAddPlayer(true)}
              aria-label="Add player"
            >
              <Plus className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">Add</span>
            </Button>
          </div>
        )}
      </div>

      {/* Players in this tournament */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Players in {tournament.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-0">
          {players.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <UserPlus className="text-muted-foreground size-10" />
              <p className="text-muted-foreground text-sm">No players yet</p>
              {isAdmin && (
                <Button size="sm" onClick={() => setShowAddPlayer(true)}>
                  Add First Player
                </Button>
              )}
            </div>
          ) : (
            players.map((player, i) => {
              const isOwnProfile = player.userId === authUser?.id
              const canEdit = isAdmin || isOwnProfile
              const confirmingRemove = confirmingRemovePlayerId === player.id
              return (
                <div key={player.id}>
                  {i > 0 && <Separator />}
                  <div className="flex items-center gap-3 py-3">
                    <Avatar className="size-9">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                        {getInitials(player.displayName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium">
                          {player.displayName}
                        </span>
                        {player.nickname && (
                          <span className="text-muted-foreground truncate text-xs">
                            &ldquo;{player.nickname}&rdquo;
                          </span>
                        )}
                      </div>
                      {isAdmin && player.email ? (
                        <span className="text-muted-foreground truncate text-xs">
                          {player.email} &middot; HCP {player.groupHandicap}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">
                          HCP {player.groupHandicap}
                        </span>
                      )}
                    </div>
                    <Badge variant="outline" className="text-xs tabular-nums">
                      {player.groupHandicap}
                    </Badge>
                    {canEdit && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setEditingPlayer(player)}
                        aria-label={`Edit ${player.displayName}`}
                      >
                        <Pencil className="size-4" />
                      </Button>
                    )}
                    {isAdmin &&
                      (confirmingRemove ? (
                        <span className="flex items-center gap-1.5 text-sm">
                          <span className="text-muted-foreground">Remove?</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2.5 text-sm text-green-600 hover:text-green-700"
                            onClick={() => void handleRemovePlayer(player.id)}
                          >
                            Yes
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2.5 text-sm"
                            onClick={() => setConfirmingRemovePlayerId(null)}
                          >
                            No
                          </Button>
                        </span>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setConfirmingRemovePlayerId(player.id)}
                          aria-label={`Remove ${player.displayName} from tournament`}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      ))}
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      {/* People pool */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
          <div>
            <CardTitle className="text-base">People pool</CardTitle>
            <p className="text-muted-foreground text-xs">
              Everyone you can add to a tournament.
            </p>
          </div>
          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditingPerson(undefined)
                setPersonDialogOpen(true)
              }}
              aria-label="Add person"
            >
              <Plus className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">Add Person</span>
            </Button>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-0">
          {persons.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <UserPlus className="text-muted-foreground size-10" />
              <p className="text-muted-foreground text-sm">
                No one in the pool yet
              </p>
              {isAdmin && (
                <Button
                  size="sm"
                  onClick={() => {
                    setEditingPerson(undefined)
                    setPersonDialogOpen(true)
                  }}
                >
                  Add First Person
                </Button>
              )}
            </div>
          ) : (
            persons.map((person, i) => {
              const inTournament = personIdsInTournament.has(person.id)
              const confirmingRemove = confirmingRemovePersonId === person.id
              return (
                <div key={person.id}>
                  {i > 0 && <Separator />}
                  <div className="flex items-center gap-3 py-3">
                    <Avatar className="size-9">
                      <AvatarFallback className="bg-muted text-muted-foreground text-xs font-medium">
                        {getInitials(person.displayName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium">
                          {person.displayName}
                        </span>
                        {person.nickname && (
                          <span className="text-muted-foreground truncate text-xs">
                            &ldquo;{person.nickname}&rdquo;
                          </span>
                        )}
                      </div>
                      {person.email && (
                        <span className="text-muted-foreground truncate text-xs">
                          {person.email}
                        </span>
                      )}
                    </div>
                    {inTournament && (
                      <Badge variant="outline" className="text-xs">
                        <UserCheck className="mr-1 size-3" aria-hidden="true" />
                        In tournament
                      </Badge>
                    )}
                    {!inTournament && isAdmin && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openAddToTournament(person.id)}
                      >
                        <Plus className="size-4" aria-hidden="true" />
                        <span className="hidden sm:inline">
                          Add to tournament
                        </span>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => {
                        setEditingPerson(person)
                        setPersonDialogOpen(true)
                      }}
                      aria-label={`Edit ${person.displayName}`}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    {isAdmin &&
                      (confirmingRemove ? (
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
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setConfirmingRemovePersonId(person.id)}
                          aria-label={`Remove ${person.displayName}`}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      ))}
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      {/* Pending invites */}
      {pendingInvites.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Pending Invites ({pendingInvites.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-0">
            {pendingInvites.map((invite, i) => {
              const linkedPerson = invite.linkedPersonId
                ? personById.get(invite.linkedPersonId)
                : undefined
              return (
                <div key={invite.id}>
                  {i > 0 && <Separator />}
                  <div className="flex items-center gap-3 py-3">
                    <Avatar className="size-9">
                      <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                        <Mail className="size-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm">{invite.email}</span>
                      {linkedPerson ? (
                        <span className="text-muted-foreground flex items-center gap-1 text-xs">
                          <Link2 className="size-3" aria-hidden="true" />
                          Linked to {linkedPerson.displayName}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">
                          Invite sent
                        </span>
                      )}
                    </div>
                    {linkedPerson && (
                      <Badge
                        variant="outline"
                        className="text-xs text-green-600"
                      >
                        Linked
                      </Badge>
                    )}
                    {!linkedPerson && (
                      <Badge variant="secondary" className="text-xs">
                        Pending
                      </Badge>
                    )}
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <PlayerFormDialog
        open={showAddPlayer}
        onOpenChange={setShowAddPlayer}
        tournamentId={tournament.id}
      />

      {editingPlayer && (
        <PlayerFormDialog
          open={!!editingPlayer}
          onOpenChange={(open) => {
            if (!open) setEditingPlayer(undefined)
          }}
          tournamentId={tournament.id}
          player={editingPlayer}
        />
      )}

      {addPersonToTournament && (
        <PlayerFormDialog
          open={!!addPersonToTournament}
          onOpenChange={(open) => {
            if (!open) setAddPersonToTournament(undefined)
          }}
          tournamentId={tournament.id}
          initialPersonId={addPersonToTournament}
          forceMode="existing"
        />
      )}

      <PersonFormDialog
        open={personDialogOpen}
        onOpenChange={(open) => {
          setPersonDialogOpen(open)
          if (!open) setEditingPerson(undefined)
        }}
        person={editingPerson}
      />

      <InvitePlayersDialog
        open={showInvite}
        onOpenChange={setShowInvite}
        tournamentId={tournament.id}
      />
    </div>
  )
}
