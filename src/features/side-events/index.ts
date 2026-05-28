// Public API for the side-events feature
export {
  useSideEvents,
  useSideEventsByTournament,
  useSideEventsByRound,
  useSideEventsByType,
  useCreateSideEvent,
  useRemoveSideEvent,
  useEvidenceImages,
  useEvidenceImagesForEvent,
  useCreateEvidenceImage,
  useRemoveEvidenceImage,
  useEvidenceSignedUrls,
  sideEventsQueryKey,
  evidenceImagesQueryKey,
} from './api/use-side-events'
export {
  uploadEvidenceImage,
  getEvidenceSignedUrl,
  getEvidenceSignedUrls,
} from './lib/evidence-storage'
export {
  fetchSideEvents,
  createSideEvent,
  removeSideEvent,
} from './api/side-events-api'
export {
  fetchEvidenceImages,
  createEvidenceImage,
  removeEvidenceImage,
} from './api/evidence-images-api'
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
