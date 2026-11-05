import type { RoundFormat } from '@/features/rounds'

/** Round format options for selectors and display */
export const FORMAT_OPTIONS: {
  value: RoundFormat
  label: string
  desc: string
}[] = [
  {
    value: 'stableford',
    label: 'Stableford',
    desc: 'Individual stableford points',
  },
  {
    value: 'handicap',
    label: 'Handicap',
    desc: 'Individual stroke play with handicap',
  },
  {
    value: 'scramble',
    label: 'Scramble',
    desc: 'Team best ball, play from best shot',
  },
  {
    value: 'bestball',
    label: 'Best Ball',
    desc: 'Team format, each plays own ball',
  },
]

/** Whether a round format uses teams (scramble or best ball) */
export function isTeamFormat(format: RoundFormat): boolean {
  return format === 'scramble' || format === 'bestball'
}
