import { useState } from 'react'
import { Link } from 'react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { useTournamentStore } from '@/features/tournament'
import { usePlayersStore } from '@/features/players'
import type { Player } from '@/features/players'
import { PlayerFormDialog } from '@/features/players/components/player-form-dialog'
import { InvitePlayersDialog } from '@/features/players/components/invite-players-dialog'
import { Check, Link2, Mail, Plus, UserPlus, Pencil } from 'lucide-react'
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
  const tournament = useTournamentStore((s) => s.activeTournament())
  const getActivePlayers = usePlayersStore((s) => s.getActivePlayers)
  const getInvites = usePlayersStore((s) => s.getInvitesByTournament)
  const acceptInvite = usePlayersStore((s) => s.acceptInvite)
  const players = tournament ? getActivePlayers(tournament.id) : []
  const isAdmin = useIsAdmin()
  const authUser = useAuthStore((s) => s.user)

  const [showAddPlayer, setShowAddPlayer] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [editingPlayer, setEditingPlayer] = useState<Player | undefined>()

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

  const invites = getInvites(tournament.id)
  const pendingInvites = invites.filter((i) => i.status === 'pending')

  // Build a map of player ID → player name for linked invites
  const playerMap = new Map(players.map((p) => [p.id, p]))

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

      {/* Player list */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">All Players</CardTitle>
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
                      >
                        <Pencil className="size-4" />
                        <span className="sr-only">
                          Edit {player.displayName}
                        </span>
                      </Button>
                    )}
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
              const linkedPlayer = invite.linkedPlayerId
                ? playerMap.get(invite.linkedPlayerId)
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
                      {linkedPlayer ? (
                        <span className="text-muted-foreground flex items-center gap-1 text-xs">
                          <Link2 className="size-3" aria-hidden="true" />
                          Linked to {linkedPlayer.displayName}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">
                          Invite sent
                        </span>
                      )}
                    </div>
                    {linkedPlayer && (
                      <Badge
                        variant="outline"
                        className="text-xs text-green-600"
                      >
                        Linked
                      </Badge>
                    )}
                    {!linkedPlayer && (
                      <Badge variant="secondary" className="text-xs">
                        Pending
                      </Badge>
                    )}
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => acceptInvite(invite.id)}
                        aria-label={`Accept invite for ${invite.email}`}
                        title="Accept invite (mock)"
                      >
                        <Check className="size-4" />
                      </Button>
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
        showEmail={isAdmin}
      />

      {editingPlayer && (
        <PlayerFormDialog
          open={!!editingPlayer}
          onOpenChange={(open) => {
            if (!open) setEditingPlayer(undefined)
          }}
          tournamentId={tournament.id}
          player={editingPlayer}
          canEditHandicap={isAdmin}
          showEmail={isAdmin}
        />
      )}

      <InvitePlayersDialog
        open={showInvite}
        onOpenChange={setShowInvite}
        tournamentId={tournament.id}
      />
    </div>
  )
}
