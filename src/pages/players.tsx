import { useState } from 'react'
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
import { Mail, Plus, UserPlus, Pencil } from 'lucide-react'

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

  const [showAddPlayer, setShowAddPlayer] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [editingPlayer, setEditingPlayer] = useState<Player | undefined>()

  if (!tournament) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold tracking-tight">Players</h1>
        <p className="text-muted-foreground text-sm">
          Create a tournament first to manage players.
        </p>
      </div>
    )
  }

  const players = getActivePlayers(tournament.id)
  const invites = getInvites(tournament.id)
  const pendingInvites = invites.filter((i) => i.status === 'pending')

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
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowInvite(true)}
          >
            <Mail className="size-4" />
            <span className="hidden sm:inline">Invite</span>
          </Button>
          <Button size="sm" onClick={() => setShowAddPlayer(true)}>
            <Plus className="size-4" />
            <span className="hidden sm:inline">Add</span>
          </Button>
        </div>
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
              <Button size="sm" onClick={() => setShowAddPlayer(true)}>
                Add First Player
              </Button>
            </div>
          ) : (
            players.map((player, i) => (
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
                    <span className="text-muted-foreground text-xs">
                      HCP {player.groupHandicap}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-xs tabular-nums">
                    {player.groupHandicap}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => setEditingPlayer(player)}
                  >
                    <Pencil className="size-3.5" />
                    <span className="sr-only">Edit {player.displayName}</span>
                  </Button>
                </div>
              </div>
            ))
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
            {pendingInvites.map((invite, i) => (
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
                    <span className="text-muted-foreground text-xs">
                      Invite sent
                    </span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    Pending
                  </Badge>
                </div>
              </div>
            ))}
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

      <InvitePlayersDialog
        open={showInvite}
        onOpenChange={setShowInvite}
        tournamentId={tournament.id}
      />
    </div>
  )
}
