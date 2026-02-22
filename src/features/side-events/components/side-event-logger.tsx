import { useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { HoleSelector } from './hole-selector'
import { useSideEventsStore } from '../state/side-events-store'
import { useAuthStore } from '@/features/auth'
import type { SideEventType } from '../types'
import type { Player } from '@/features/players/types'
import type { Hole } from '@/features/courses'
import {
  Bird,
  Zap,
  Target,
  Skull,
  Ruler,
  Trophy,
  Camera,
  Star,
} from 'lucide-react'

interface SideEventLoggerProps {
  tournamentId: string
  roundId: string
  players: Player[]
  holes: Hole[]
  /** Player IDs in the current user's group (for group-longest-drive) */
  groupPlayerIds?: string[]
  holesPlayed: 9 | 18
}

/** Event type config for the quick-action buttons */
const EVENT_BUTTONS: {
  type: SideEventType
  label: string
  icon: typeof Bird
  color: string
  requiresValue?: boolean
  requiresImage?: boolean
  par5Only?: boolean
}[] = [
  {
    type: 'birdie',
    label: 'Birdie',
    icon: Bird,
    color: 'bg-green-500 hover:bg-green-600 text-white',
  },
  {
    type: 'eagle',
    label: 'Eagle',
    icon: Zap,
    color: 'bg-yellow-500 hover:bg-yellow-600 text-white',
  },
  {
    type: 'hio',
    label: 'Hole in One',
    icon: Star,
    color: 'bg-amber-400 hover:bg-amber-500 text-white',
  },
  {
    type: 'albatross',
    label: 'Albatross',
    icon: Bird,
    color: 'bg-purple-500 hover:bg-purple-600 text-white',
  },
  {
    type: 'bunker_save',
    label: 'Bunker Save',
    icon: Target,
    color: 'bg-orange-500 hover:bg-orange-600 text-white',
  },
  {
    type: 'snake',
    label: 'Snake',
    icon: Skull,
    color: 'bg-red-500 hover:bg-red-600 text-white',
  },
  {
    type: 'group_longest_drive',
    label: 'Group LD',
    icon: Trophy,
    color: 'bg-blue-500 hover:bg-blue-600 text-white',
    par5Only: true,
  },
  {
    type: 'longest_drive_meters',
    label: 'Longest Drive',
    icon: Ruler,
    color: 'bg-indigo-500 hover:bg-indigo-600 text-white',
    requiresValue: true,
    requiresImage: true,
  },
]

export function SideEventLogger({
  tournamentId,
  roundId,
  players,
  holes,
  holesPlayed,
}: SideEventLoggerProps) {
  const logEvent = useSideEventsStore((s) => s.logEvent)
  const addImage = useSideEventsStore((s) => s.addImage)
  const getEventsByRound = useSideEventsStore((s) => s.getEventsByRound)
  const user = useAuthStore((s) => s.user)

  const [selectedHole, setSelectedHole] = useState<number | null>(null)
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('')
  const [driveMeters, setDriveMeters] = useState<string>('')
  const [showDriveInput, setShowDriveInput] = useState(false)

  // Get the current user's player record for createdByPlayerId
  const currentPlayer = players.find((p) => p.userId === user?.id)
  const createdByPlayerId = currentPlayer?.id ?? players[0]?.id ?? ''

  // Default selected player to current user
  const effectivePlayerId = selectedPlayerId || currentPlayer?.id || ''

  // Get holes where events were logged this round (for dot indicators)
  const roundEvents = getEventsByRound(roundId)
  const markedHoles = [
    ...new Set(roundEvents.map((e) => e.holeNumber).filter(Boolean)),
  ] as number[]

  // Par 5 holes for group longest drive restriction
  const par5Holes = holes.filter((h) => h.par === 5).map((h) => h.holeNumber)

  function handleQuickLog(eventType: SideEventType) {
    if (!selectedHole) return
    if (!effectivePlayerId) return

    const eventConfig = EVENT_BUTTONS.find((b) => b.type === eventType)

    // For longest_drive_meters, show the input form instead of logging immediately
    if (eventConfig?.requiresValue) {
      setShowDriveInput(true)
      return
    }

    logEvent({
      tournamentId,
      roundId,
      holeNumber: selectedHole,
      playerId: effectivePlayerId,
      type: eventType,
      createdByPlayerId,
    })

    const playerName =
      players.find((p) => p.id === effectivePlayerId)?.displayName ?? 'Player'
    const message = `${playerName} — ${eventConfig?.label ?? eventType} on ${selectedHole}`

    // Show toast notification
    toast(message, {
      duration: 3000,
    })
  }

  function handleLogDrive() {
    if (!selectedHole || !effectivePlayerId) return
    const meters = parseFloat(driveMeters)
    if (isNaN(meters) || meters <= 0) return

    logEvent({
      tournamentId,
      roundId,
      holeNumber: selectedHole,
      playerId: effectivePlayerId,
      type: 'longest_drive_meters',
      value: meters,
      createdByPlayerId,
    })

    const playerName =
      players.find((p) => p.id === effectivePlayerId)?.displayName ?? 'Player'
    const message = `${playerName} — ${meters}m DRIVE on ${selectedHole}`

    // Show toast notification
    toast(message, {
      duration: 4000,
    })

    setDriveMeters('')
    setShowDriveInput(false)
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.length) return
    const file = e.target.files[0]
    // Create object URL for now (local preview). In production, upload to Supabase Storage.
    const objectUrl = URL.createObjectURL(file)

    // Attach to the most recent longest_drive_meters event from this player
    const driveEvents = roundEvents
      .filter(
        (ev) =>
          ev.type === 'longest_drive_meters' &&
          ev.playerId === effectivePlayerId
      )
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )

    if (driveEvents[0]) {
      addImage(driveEvents[0].id, objectUrl)
    }
  }

  const isHoleSelected = selectedHole !== null
  const isPlayerSelected = effectivePlayerId !== ''

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Log Side Events</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {/* Player selector */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium">Player</span>
          <Select value={effectivePlayerId} onValueChange={setSelectedPlayerId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select player" />
            </SelectTrigger>
            <SelectContent>
              {players.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.displayName}
                  {p.nickname ? ` (${p.nickname})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Hole selector */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium">Hole</span>
          <HoleSelector
            holesPlayed={holesPlayed}
            selectedHole={selectedHole}
            onSelectHole={setSelectedHole}
            markedHoles={markedHoles}
          />
        </div>

        {/* Quick action buttons */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium">Quick Actions</span>
          <div className="grid grid-cols-4 gap-2">
            {EVENT_BUTTONS.map((btn) => {
              const Icon = btn.icon
              const disabled =
                !isHoleSelected ||
                !isPlayerSelected ||
                (btn.par5Only && !par5Holes.includes(selectedHole ?? 0))

              return (
                <Button
                  key={btn.type}
                  variant="ghost"
                  size="sm"
                  disabled={disabled}
                  className={`flex h-auto flex-col gap-1 py-2 ${disabled ? '' : btn.color}`}
                  onClick={() => handleQuickLog(btn.type)}
                >
                  <Icon className="size-4" />
                  <span className="text-[10px] leading-tight">{btn.label}</span>
                </Button>
              )
            })}
          </div>
        </div>

        {/* Longest drive meters input (shown when tapping "Longest Drive") */}
        {showDriveInput && (
          <div className="bg-muted/50 flex flex-col gap-2 rounded-lg p-3">
            <label htmlFor="drive-meters" className="text-xs font-medium">
              Longest Drive — Enter distance
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="drive-meters"
                  type="number"
                  placeholder="e.g. 285"
                  value={driveMeters}
                  onChange={(e) => setDriveMeters(e.target.value)}
                  className="pr-8"
                  min={0}
                  step={1}
                />
                <span className="text-muted-foreground absolute top-1/2 right-2 -translate-y-1/2 text-xs">
                  m
                </span>
              </div>
              <Button size="sm" onClick={handleLogDrive}>
                Log
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowDriveInput(false)}
              >
                Cancel
              </Button>
            </div>
            {/* Photo upload */}
            <div className="flex items-center gap-2">
              <label
                htmlFor="drive-photo"
                className="bg-muted hover:bg-muted/80 flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
              >
                <Camera className="size-3.5" />
                Add Photo Evidence
              </label>
              <input
                id="drive-photo"
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleImageUpload}
              />
            </div>
          </div>
        )}

        {/* Hint when nothing selected */}
        {!isHoleSelected && (
          <p className="text-muted-foreground text-center text-xs">
            Select a hole to enable quick actions
          </p>
        )}

        {/* Recent events for this round */}
        {roundEvents.length > 0 && (
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium">
              Recent Events ({roundEvents.length})
            </span>
            <div className="flex max-h-32 flex-col gap-0.5 overflow-y-auto">
              {[...roundEvents]
                .sort(
                  (a, b) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime()
                )
                .slice(0, 10)
                .map((event) => {
                  const player = players.find((p) => p.id === event.playerId)
                  const config = EVENT_BUTTONS.find(
                    (b) => b.type === event.type
                  )
                  return (
                    <div
                      key={event.id}
                      className="flex items-center gap-2 rounded px-2 py-1 text-xs"
                    >
                      <Badge variant="secondary" className="text-[10px]">
                        {event.holeNumber ? `#${event.holeNumber}` : '—'}
                      </Badge>
                      <span className="flex-1 truncate">
                        {player?.displayName ?? 'Unknown'} —{' '}
                        {config?.label ?? event.type}
                        {event.value ? ` (${event.value}m)` : ''}
                      </span>
                    </div>
                  )
                })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
