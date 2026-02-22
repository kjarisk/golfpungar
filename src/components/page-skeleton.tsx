import { Skeleton } from '@/components/ui/skeleton'

/**
 * Full-page loading skeleton shown as Suspense fallback
 * while page components are loading.
 */
export function PageSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {/* Title skeleton */}
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Stats row skeleton */}
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>

      {/* Card skeleton */}
      <Skeleton className="h-48 rounded-xl" />

      {/* List skeleton */}
      <div className="flex flex-col gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 rounded-lg" />
        ))}
      </div>
    </div>
  )
}
