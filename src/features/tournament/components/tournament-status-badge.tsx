import { Badge } from '@/components/ui/badge'
import type { TournamentStatus } from '@/features/tournament'
import { cn } from '@/lib/utils'

const statusConfig: Record<
  TournamentStatus,
  { label: string; className: string }
> = {
  draft: {
    label: 'Draft',
    className: 'bg-muted text-muted-foreground',
  },
  live: {
    label: 'Live',
    className: 'bg-primary/15 text-primary border-primary/25',
  },
  done: {
    label: 'Done',
    className: 'bg-muted text-muted-foreground',
  },
}

interface TournamentStatusBadgeProps {
  status: TournamentStatus
}

export function TournamentStatusBadge({ status }: TournamentStatusBadgeProps) {
  const config = statusConfig[status]
  return (
    <Badge
      variant="outline"
      className={cn('text-xs font-medium', config.className)}
    >
      {config.label}
    </Badge>
  )
}
