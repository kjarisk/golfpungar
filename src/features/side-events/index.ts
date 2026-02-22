// Public API for the side-events feature
export { useSideEventsStore } from './state/side-events-store'
export { SideEventLogger } from './components/side-event-logger'
export { EvidenceGallery } from './components/evidence-gallery'
export type {
  SideEventLog,
  SideEventType,
  EvidenceImage,
  CreateSideEventInput,
  SideEventTotals,
  LastSnakeInGroup,
} from './types'
