import { create } from 'zustand'
import type { NotableEvent } from '../types'

/**
 * Transient UI queue of notable-event banner cards (birdie, eagle, HIO,
 * albatross, nearest pin). These are intentionally NOT persisted — they're
 * fire-and-forget animated cards driven by score auto-detect.
 */
interface NotableEventsState {
  notableEvents: NotableEvent[]
  pushNotableEvent: (event: NotableEvent) => void
  dismissNotableEvent: (id: string) => void
}

export const useNotableEventsStore = create<NotableEventsState>((set) => ({
  notableEvents: [],
  pushNotableEvent: (event) =>
    set((state) => ({ notableEvents: [...state.notableEvents, event] })),
  dismissNotableEvent: (id) =>
    set((state) => ({
      notableEvents: state.notableEvents.filter((e) => e.id !== id),
    })),
}))
