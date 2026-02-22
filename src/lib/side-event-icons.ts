import {
  Bird,
  Zap,
  Star,
  Skull,
  Flame,
  CircleDot,
  Target,
  Trophy,
  Ruler,
  Crosshair,
} from 'lucide-react'

/**
 * Canonical side event icon/color config.
 *
 * Single source of truth — used by score grid, scorecard detail,
 * feed, leaderboards, and side event logger.
 */
export interface SideEventIconConfig {
  /** Lucide icon component */
  icon: typeof Bird
  /** Tailwind text color class (for inline icons) */
  className: string
  /** Tailwind background color class (for buttons/banners) */
  bgClassName: string
  /** Human-readable label */
  label: string
}

export const SIDE_EVENT_ICONS: Record<string, SideEventIconConfig> = {
  birdie: {
    icon: Bird,
    className: 'text-green-500',
    bgClassName: 'bg-green-500',
    label: 'Birdie',
  },
  eagle: {
    icon: Zap,
    className: 'text-yellow-500',
    bgClassName: 'bg-yellow-500',
    label: 'Eagle',
  },
  hio: {
    icon: Star,
    className: 'text-amber-500',
    bgClassName: 'bg-amber-400',
    label: 'Hole in One',
  },
  albatross: {
    icon: Bird,
    className: 'text-purple-500',
    bgClassName: 'bg-purple-500',
    label: 'Albatross',
  },
  bunker_save: {
    icon: Target,
    className: 'text-orange-500',
    bgClassName: 'bg-orange-500',
    label: 'Bunker Save',
  },
  snake: {
    icon: Skull,
    className: 'text-red-500',
    bgClassName: 'bg-red-500',
    label: 'Snake',
  },
  snopp: {
    icon: Flame,
    className: 'text-red-700',
    bgClassName: 'bg-red-700',
    label: 'Snopp',
  },
  gir: {
    icon: CircleDot,
    className: 'text-emerald-500',
    bgClassName: 'bg-emerald-500',
    label: 'GIR',
  },
  group_longest_drive: {
    icon: Trophy,
    className: 'text-blue-500',
    bgClassName: 'bg-blue-500',
    label: 'Group LD',
  },
  longest_drive_meters: {
    icon: Ruler,
    className: 'text-indigo-500',
    bgClassName: 'bg-indigo-500',
    label: 'Longest Drive',
  },
  longest_putt: {
    icon: Ruler,
    className: 'text-cyan-500',
    bgClassName: 'bg-cyan-500',
    label: 'Longest Putt',
  },
  nearest_to_pin: {
    icon: Crosshair,
    className: 'text-teal-500',
    bgClassName: 'bg-teal-500',
    label: 'Nearest Pin',
  },
}
