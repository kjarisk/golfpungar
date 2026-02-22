import { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useSideEventsStore } from '../state/side-events-store'
import { Camera, X } from 'lucide-react'

interface EvidenceGalleryProps {
  tournamentId: string
  getPlayerName: (playerId: string) => string
}

/**
 * Displays photo evidence for longest drive events.
 * Shows a grid of thumbnails with player name and distance.
 * Tapping a thumbnail opens a fullscreen lightbox.
 */
export function EvidenceGallery({
  tournamentId,
  getPlayerName,
}: EvidenceGalleryProps) {
  const getEventsByType = useSideEventsStore((s) => s.getEventsByType)
  const getImagesForEvent = useSideEventsStore((s) => s.getImagesForEvent)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  const closeLightbox = useCallback(() => setLightboxUrl(null), [])

  // Focus close button when lightbox opens + handle Escape key
  useEffect(() => {
    if (!lightboxUrl) return

    closeButtonRef.current?.focus()

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') closeLightbox()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [lightboxUrl, closeLightbox])

  // Get all longest_drive_meters events with images
  const driveEvents = getEventsByType(tournamentId, 'longest_drive_meters')
    .filter((e) => e.value != null)
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))

  // Collect all evidence entries: { event, image }
  const evidenceEntries = driveEvents.flatMap((event) => {
    const images = getImagesForEvent(event.id)
    return images.map((img) => ({
      event,
      image: img,
    }))
  })

  if (evidenceEntries.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Camera className="size-4 text-indigo-500" />
            Drive Evidence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <p className="text-muted-foreground text-sm">
              No drive photos uploaded yet.
            </p>
            <p className="text-muted-foreground/60 text-xs">
              Photos will appear here when players upload evidence for longest
              drives.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Camera className="size-4 text-indigo-500" />
            Drive Evidence ({evidenceEntries.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {evidenceEntries.map(({ event, image }) => (
              <button
                key={image.id}
                className="group relative aspect-square overflow-hidden rounded-lg"
                onClick={() => setLightboxUrl(image.imageUrl)}
                type="button"
              >
                <img
                  src={image.imageUrl}
                  alt={`${getPlayerName(event.playerId)} — ${event.value}m drive`}
                  className="size-full object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                  <p className="truncate text-xs font-medium text-white">
                    {getPlayerName(event.playerId)}
                  </p>
                  <Badge
                    variant="secondary"
                    className="mt-0.5 bg-white/20 text-[10px] text-white backdrop-blur-sm"
                  >
                    {event.value}m
                  </Badge>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Lightbox overlay */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={closeLightbox}
          role="dialog"
          aria-modal="true"
          aria-label="Drive evidence photo"
        >
          <button
            ref={closeButtonRef}
            className="absolute top-4 right-4 rounded-full bg-white/20 p-2 text-white backdrop-blur-sm transition-colors hover:bg-white/30"
            onClick={closeLightbox}
            type="button"
            aria-label="Close"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
          <img
            src={lightboxUrl}
            alt="Drive evidence"
            className="max-h-[85vh] max-w-full rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}
