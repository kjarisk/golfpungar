import { useEffect, useRef, useCallback } from 'react'
import { useFeedStore } from '../state/feed-store'
import type { NotableEvent } from '../types'
import { Bird, Zap, Star, Crosshair, X } from 'lucide-react'

const EVENT_CONFIG: Record<
  string,
  { label: string; icon: typeof Bird; bg: string; text: string }
> = {
  birdie: {
    label: 'BIRDIE',
    icon: Bird,
    bg: 'bg-green-500',
    text: 'text-white',
  },
  eagle: {
    label: 'EAGLE',
    icon: Zap,
    bg: 'bg-yellow-500',
    text: 'text-white',
  },
  hio: {
    label: 'HOLE IN ONE',
    icon: Star,
    bg: 'bg-amber-500',
    text: 'text-white',
  },
  albatross: {
    label: 'ALBATROSS',
    icon: Bird,
    bg: 'bg-purple-500',
    text: 'text-white',
  },
  nearest_to_pin: {
    label: 'NEAREST PIN',
    icon: Crosshair,
    bg: 'bg-teal-500',
    text: 'text-white',
  },
}

const AUTO_DISMISS_MS = 5000
const SLIDE_OUT_MS = 300

/**
 * Displays animated notable event cards (birdie, eagle, HIO, etc.)
 * at the top of the feed page. Shows one at a time, auto-dismisses after 5s.
 *
 * Uses DOM manipulation for animation state to avoid setState-in-effect lint issues.
 * The banner ref is animated via className toggling directly.
 * Respects prefers-reduced-motion by skipping animation delays.
 */
export function NotableEventBanner() {
  const notableEvents = useFeedStore((s) => s.notableEvents)
  const dismissNotableEvent = useFeedStore((s) => s.dismissNotableEvent)
  const bannerRef = useRef<HTMLDivElement>(null)
  const activeIdRef = useRef<string | null>(null)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
  }, [])

  /** Manually dismiss the current event */
  const handleDismiss = useCallback(() => {
    if (!activeIdRef.current) return
    clearTimers()
    const el = bannerRef.current
    if (el) el.dataset.visible = 'false'
    const id = activeIdRef.current
    const t = setTimeout(() => {
      dismissNotableEvent(id)
      activeIdRef.current = null
    }, SLIDE_OUT_MS)
    timersRef.current.push(t)
  }, [clearTimers, dismissNotableEvent])

  const current: NotableEvent | undefined = notableEvents[0]
  const currentId = current?.id ?? null

  useEffect(() => {
    if (currentId === null || !bannerRef.current) {
      activeIdRef.current = null
      return
    }

    if (currentId === activeIdRef.current) return

    clearTimers()
    activeIdRef.current = currentId
    const el = bannerRef.current

    // Start hidden
    el.dataset.visible = 'false'

    // Slide in after a frame
    const t1 = setTimeout(() => {
      el.dataset.visible = 'true'
    }, 50)

    // Begin slide out after auto-dismiss delay
    const t2 = setTimeout(() => {
      el.dataset.visible = 'false'

      // Actually dismiss after animation completes
      const t3 = setTimeout(() => {
        dismissNotableEvent(currentId)
        activeIdRef.current = null
      }, SLIDE_OUT_MS)
      timersRef.current.push(t3)
    }, AUTO_DISMISS_MS)

    timersRef.current.push(t1, t2)

    return clearTimers
  }, [currentId, clearTimers, dismissNotableEvent])

  if (!current) return null

  const config = EVENT_CONFIG[current.kind]
  if (!config) return null

  const Icon = config.icon
  const holeStr = current.holeNumber ? ` on hole ${current.holeNumber}` : ''
  const valueStr = current.value ? ` — ${current.value}m` : ''

  return (
    <div
      ref={bannerRef}
      role="status"
      aria-live="assertive"
      data-visible="false"
      className={`overflow-hidden rounded-xl shadow-lg transition-all duration-300 ease-out motion-reduce:transition-none data-[visible=true]:translate-y-0 data-[visible=true]:scale-100 data-[visible=true]:opacity-100 data-[visible=false]:-translate-y-4 data-[visible=false]:scale-95 data-[visible=false]:opacity-0 ${config.bg}`}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/20">
          <Icon className={`size-5 ${config.text}`} aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className={`text-xs font-bold tracking-wider ${config.text}`}>
            {config.label}
          </p>
          <p className={`truncate text-sm font-semibold ${config.text}`}>
            {current.playerName}
            {holeStr}
            {valueStr}
          </p>
        </div>
        {notableEvents.length > 1 && (
          <span className={`text-xs font-medium ${config.text} opacity-70`}>
            +{notableEvents.length - 1}
          </span>
        )}
        <button
          type="button"
          onClick={handleDismiss}
          className={`flex size-7 shrink-0 items-center justify-center rounded-full bg-white/20 transition-colors hover:bg-white/30 ${config.text}`}
          aria-label="Dismiss notification"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
