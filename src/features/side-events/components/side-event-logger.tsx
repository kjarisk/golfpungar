import { useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useSideEventsStore } from '../state/side-events-store'
import { useAuthStore } from '@/features/auth'
import { SIDE_EVENT_ICONS } from '@/lib/side-event-icons'
import { cn } from '@/lib/utils'
import type { SideEventType, SideEventLog } from '../types'
import type { Player } from '@/features/players/types'
import type { Hole } from '@/features/courses'
import {
  Target,
  Skull,
  Ruler,
  Trophy,
  Camera,
  Flame,
  CircleDot,
  Crosshair,
  X,
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

/** Event type config for the quick-action buttons.
 *  Birdie/Eagle/HIO/Albatross removed — those are auto-detected from scores. */
const EVENT_BUTTONS: {
  type: SideEventType
  label: string
  icon: typeof Target
  color: string
  requiresValue?: boolean
  requiresImage?: boolean
  par5Only?: boolean
  valueInputKey?: string
}[] = [
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
    type: 'snopp',
    label: 'Snopp',
    icon: Flame,
    color: 'bg-red-700 hover:bg-red-800 text-white',
  },
  {
    type: 'gir',
    label: 'GIR',
    icon: CircleDot,
    color: 'bg-emerald-500 hover:bg-emerald-600 text-white',
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
    valueInputKey: 'longest_drive',
  },
  {
    type: 'longest_putt',
    label: 'Longest Putt',
    icon: Ruler,
    color: 'bg-cyan-500 hover:bg-cyan-600 text-white',
    requiresValue: true,
    valueInputKey: 'longest_putt',
  },
  {
    type: 'nearest_to_pin',
    label: 'Nearest Pin',
    icon: Crosshair,
    color: 'bg-teal-500 hover:bg-teal-600 text-white',
    requiresValue: true,
    valueInputKey: 'nearest_to_pin',
  },
]

/** Short display name for a player */
function shortName(player: Player): string {
  return player.nickname || player.displayName.split(' ')[0]
}

export function SideEventLogger({
  tournamentId,
  roundId,
  players,
  holes,
  groupPlayerIds,
  holesPlayed,
}: SideEventLoggerProps) {
  const logEvent = useSideEventsStore((s) => s.logEvent)
  const removeEvent = useSideEventsStore((s) => s.removeEvent)
  const addImage = useSideEventsStore((s) => s.addImage)
  const allEvents = useSideEventsStore((s) => s.events)
  const getLastSnakeInGroup = useSideEventsStore((s) => s.getLastSnakeInGroup)
  const user = useAuthStore((s) => s.user)

  const [selectedHole, setSelectedHole] = useState<number | null>(null)
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('')
  const [valueMeters, setValueMeters] = useState<string>('')
  /** Which value-input panel is currently open (null = hidden) */
  const [activeValueInput, setActiveValueInput] =
    useState<SideEventType | null>(null)

  // Get the current user's player record for createdByPlayerId
  const currentPlayer = players.find((p) => p.userId === user?.id)
  const createdByPlayerId = currentPlayer?.id ?? players[0]?.id ?? ''

  // Default selected player to current user
  const effectivePlayerId = selectedPlayerId || currentPlayer?.id || ''

  // Get round events (subscribe to raw array to get reactive updates)
  const roundEvents = allEvents.filter((e) => e.roundId === roundId)

  // Par 5 holes for group longest drive restriction
  const par5Holes = holes.filter((h) => h.par === 5).map((h) => h.holeNumber)

  // Events for the selected player, grouped by hole
  const playerEvents = roundEvents.filter(
    (e) => e.playerId === effectivePlayerId
  )
  const eventsByHole = new Map<number, SideEventLog[]>()
  for (const evt of playerEvents) {
    if (evt.holeNumber) {
      const existing = eventsByHole.get(evt.holeNumber) ?? []
      existing.push(evt)
      eventsByHole.set(evt.holeNumber, existing)
    }
  }

  // Holes with events for any player (for the green dot indicator)
  const markedHoles = [
    ...new Set(roundEvents.map((e) => e.holeNumber).filter(Boolean)),
  ] as number[]

  function handleQuickLog(eventType: SideEventType) {
    if (!selectedHole) return
    if (!effectivePlayerId) return

    const eventConfig = EVENT_BUTTONS.find((b) => b.type === eventType)

    // For value-based events, show the input form instead of logging immediately
    if (eventConfig?.requiresValue) {
      setActiveValueInput(eventType)
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

    toast(message, { duration: 3000 })
  }

  function handleLogValue() {
    if (!selectedHole || !effectivePlayerId || !activeValueInput) return
    const meters = parseFloat(valueMeters)
    if (isNaN(meters) || meters <= 0) return

    logEvent({
      tournamentId,
      roundId,
      holeNumber: selectedHole,
      playerId: effectivePlayerId,
      type: activeValueInput,
      value: meters,
      createdByPlayerId,
    })

    const eventConfig = EVENT_BUTTONS.find((b) => b.type === activeValueInput)
    const playerName =
      players.find((p) => p.id === effectivePlayerId)?.displayName ?? 'Player'
    const message = `${playerName} — ${meters}m ${eventConfig?.label ?? activeValueInput} on ${selectedHole}`

    toast(message, { duration: 4000 })

    setValueMeters('')
    setActiveValueInput(null)
  }

  function handleRemoveEvent(event: SideEventLog) {
    const playerName =
      players.find((p) => p.id === event.playerId)?.displayName ?? 'Player'
    const config =
      SIDE_EVENT_ICONS[event.type] ??
      EVENT_BUTTONS.find((b) => b.type === event.type)
    const label = config?.label ?? event.type

    removeEvent(event.id)

    toast(`Removed ${label} from ${playerName} on hole ${event.holeNumber}`, {
      duration: 3000,
      action: {
        label: 'Undo',
        onClick: () => {
          // Re-log the event
          logEvent({
            tournamentId: event.tournamentId,
            roundId: event.roundId ?? roundId,
            holeNumber: event.holeNumber,
            playerId: event.playerId,
            type: event.type,
            value: event.value,
            createdByPlayerId: event.createdByPlayerId,
          })
        },
      },
    })
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

  // Events for the selected player on the selected hole (for the event list)
  const selectedHoleEvents = selectedHole
    ? (eventsByHole.get(selectedHole) ?? [])
    : []

  const holeNumbers = Array.from({ length: holesPlayed }, (_, i) => i + 1)
  const frontNine = holeNumbers.filter((h) => h <= 9)
  const backNine = holeNumbers.filter((h) => h > 9)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Log Side Events</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {/* Player selector — touch buttons */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium">Player</span>
          <div className="flex flex-wrap gap-1.5">
            {players.map((p) => {
              const isSelected = p.id === effectivePlayerId
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedPlayerId(p.id)}
                  className={cn(
                    'rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors',
                    isSelected
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card hover:bg-muted border-border'
                  )}
                >
                  {shortName(p)}
                </button>
              )
            })}
          </div>
        </div>

        {/* Hole selector — bigger buttons with event icons */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium">Hole</span>
          <div
            className="flex flex-col gap-1.5"
            role="group"
            aria-label="Hole selector"
          >
            {/* Front 9 */}
            <div className="grid grid-cols-9 gap-1">
              {frontNine.map((hole) => (
                <HoleButton
                  key={hole}
                  hole={hole}
                  isSelected={selectedHole === hole}
                  onSelect={setSelectedHole}
                  events={eventsByHole.get(hole)}
                  hasAnyEvent={markedHoles.includes(hole)}
                />
              ))}
            </div>
            {/* Back 9 */}
            {backNine.length > 0 && (
              <div className="grid grid-cols-9 gap-1">
                {backNine.map((hole) => (
                  <HoleButton
                    key={hole}
                    hole={hole}
                    isSelected={selectedHole === hole}
                    onSelect={setSelectedHole}
                    events={eventsByHole.get(hole)}
                    hasAnyEvent={markedHoles.includes(hole)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Events on selected hole for selected player (tap icon to remove) */}
        {isPlayerSelected &&
          isHoleSelected &&
          selectedHoleEvents.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium">
                Events on hole {selectedHole} for{' '}
                {shortName(
                  players.find((p) => p.id === effectivePlayerId) ?? players[0]
                )}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {selectedHoleEvents.map((evt) => {
                  const iconConfig = SIDE_EVENT_ICONS[evt.type]
                  const btnConfig = EVENT_BUTTONS.find(
                    (b) => b.type === evt.type
                  )
                  const Icon = iconConfig?.icon ?? btnConfig?.icon
                  const label =
                    iconConfig?.label ?? btnConfig?.label ?? evt.type
                  return (
                    <button
                      key={evt.id}
                      type="button"
                      onClick={() => handleRemoveEvent(evt)}
                      className={cn(
                        'flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium transition-colors',
                        'bg-muted/50 hover:bg-destructive/10 hover:border-destructive/30 group'
                      )}
                      title={`Remove ${label}`}
                    >
                      {Icon && (
                        <Icon
                          className={cn(
                            'size-3.5',
                            iconConfig?.className ?? 'text-muted-foreground'
                          )}
                        />
                      )}
                      <span>{label}</span>
                      {evt.value != null && (
                        <span className="text-muted-foreground">
                          ({evt.value}m)
                        </span>
                      )}
                      <X className="size-3 text-muted-foreground group-hover:text-destructive" />
                    </button>
                  )
                })}
              </div>
            </div>
          )}

        {/* Quick action buttons (8 buttons — no birdie/eagle/HIO/albatross) */}
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

        {/* Value input panel (shown for longest drive, longest putt, nearest pin) */}
        {activeValueInput && (
          <div className="bg-muted/50 flex flex-col gap-2 rounded-lg p-3">
            <label htmlFor="value-meters" className="text-xs font-medium">
              {EVENT_BUTTONS.find((b) => b.type === activeValueInput)?.label ??
                activeValueInput}{' '}
              — Enter distance
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="value-meters"
                  type="number"
                  placeholder={
                    activeValueInput === 'nearest_to_pin'
                      ? 'e.g. 2.5'
                      : activeValueInput === 'longest_putt'
                        ? 'e.g. 12'
                        : 'e.g. 285'
                  }
                  value={valueMeters}
                  onChange={(e) => setValueMeters(e.target.value)}
                  className="pr-8"
                  min={0}
                  step={activeValueInput === 'nearest_to_pin' ? 0.1 : 1}
                />
                <span className="text-muted-foreground absolute top-1/2 right-2 -translate-y-1/2 text-xs">
                  m
                </span>
              </div>
              <Button size="sm" onClick={handleLogValue}>
                Log
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setActiveValueInput(null)}
              >
                Cancel
              </Button>
            </div>
            {/* Photo upload — only for longest drive */}
            {activeValueInput === 'longest_drive_meters' && (
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
            )}
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
                  const config =
                    SIDE_EVENT_ICONS[event.type] ??
                    EVENT_BUTTONS.find((b) => b.type === event.type)
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

        {/* Last Snake in Group indicator */}
        {groupPlayerIds &&
          groupPlayerIds.length > 0 &&
          (() => {
            const lastSnake = getLastSnakeInGroup(
              roundId,
              'current-group',
              groupPlayerIds
            )
            if (!lastSnake.playerId) return null
            const snakePlayer = players.find((p) => p.id === lastSnake.playerId)
            return (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 dark:border-red-900 dark:bg-red-950/30">
                <Skull className="size-4 shrink-0 text-red-500" />
                <div className="flex flex-1 flex-col">
                  <span className="text-xs font-medium text-red-700 dark:text-red-400">
                    Last Snake
                  </span>
                  <span className="text-sm font-semibold">
                    {snakePlayer?.displayName ?? 'Unknown'}
                    {lastSnake.holeNumber && (
                      <span className="text-muted-foreground ml-1 text-xs font-normal">
                        on hole {lastSnake.holeNumber}
                      </span>
                    )}
                  </span>
                </div>
              </div>
            )
          })()}
      </CardContent>
    </Card>
  )
}

/** Individual hole button with event icons for the selected player */
function HoleButton({
  hole,
  isSelected,
  onSelect,
  events,
  hasAnyEvent,
}: {
  hole: number
  isSelected: boolean
  onSelect: (hole: number) => void
  events?: SideEventLog[]
  hasAnyEvent: boolean
}) {
  // Get unique event types for this hole (for icon display)
  const eventTypes = events ? [...new Set(events.map((e) => e.type))] : []

  return (
    <button
      type="button"
      onClick={() => onSelect(hole)}
      aria-label={`Hole ${hole}`}
      aria-pressed={isSelected}
      className={cn(
        'relative flex h-11 w-full flex-col items-center justify-center rounded-md text-sm font-medium transition-colors',
        isSelected
          ? 'bg-primary text-primary-foreground'
          : 'bg-muted hover:bg-muted/80 text-foreground cursor-pointer'
      )}
    >
      {hole}
      {/* Event type icons below the number */}
      {eventTypes.length > 0 && (
        <div className="flex gap-px">
          {eventTypes.slice(0, 3).map((type) => {
            const config = SIDE_EVENT_ICONS[type]
            if (!config) return null
            const Icon = config.icon
            return (
              <Icon
                key={type}
                className={cn(
                  'size-2.5',
                  isSelected ? 'text-primary-foreground/80' : config.className
                )}
              />
            )
          })}
          {eventTypes.length > 3 && (
            <span
              className={cn(
                'text-[8px]',
                isSelected
                  ? 'text-primary-foreground/80'
                  : 'text-muted-foreground'
              )}
            >
              +{eventTypes.length - 3}
            </span>
          )}
        </div>
      )}
      {/* Fallback dot for events by other players when no icons shown */}
      {eventTypes.length === 0 && hasAnyEvent && (
        <>
          <span
            className={cn(
              'absolute -top-0.5 -right-0.5 size-1.5 rounded-full',
              isSelected ? 'bg-primary-foreground/70' : 'bg-primary'
            )}
          />
          <span className="sr-only">(has events)</span>
        </>
      )}
    </button>
  )
}
