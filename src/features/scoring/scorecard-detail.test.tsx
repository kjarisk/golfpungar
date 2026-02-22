/// <reference types="vitest/globals" />
import { render, screen, within } from '@testing-library/react'
import { ScorecardDetail, SideEventBadges } from './components/scorecard-detail'
import type { Hole } from '@/features/courses'
import type { SideEventLog } from '@/features/side-events'
import type { HoleStroke } from './types'

function makeHole(num: number, par: number, si: number): Hole {
  return {
    id: `hole-${num}`,
    courseId: 'course-001',
    holeNumber: num,
    par,
    strokeIndex: si,
  }
}

const HOLES_9: Hole[] = [
  makeHole(1, 4, 7),
  makeHole(2, 4, 11),
  makeHole(3, 3, 15),
  makeHole(4, 5, 1),
  makeHole(5, 4, 3),
  makeHole(6, 3, 17),
  makeHole(7, 4, 5),
  makeHole(8, 4, 9),
  makeHole(9, 5, 13),
]

const HOLES_18: Hole[] = [
  ...HOLES_9,
  makeHole(10, 4, 8),
  makeHole(11, 3, 16),
  makeHole(12, 4, 2),
  makeHole(13, 5, 10),
  makeHole(14, 4, 4),
  makeHole(15, 3, 18),
  makeHole(16, 4, 6),
  makeHole(17, 4, 12),
  makeHole(18, 5, 14),
]

function makeSideEvent(
  type: SideEventLog['type'],
  playerId: string,
  holeNumber: number,
  overrides: Partial<SideEventLog> = {}
): SideEventLog {
  return {
    id: `evt-${type}-${holeNumber}`,
    tournamentId: 'tournament-001',
    roundId: 'round-001',
    holeNumber,
    playerId,
    type,
    createdAt: new Date().toISOString(),
    createdByPlayerId: playerId,
    ...overrides,
  }
}

describe('ScorecardDetail', () => {
  it('renders a table with all 18 holes', () => {
    const strokes: HoleStroke[] = Array(18).fill(4)

    render(
      <ScorecardDetail
        holes={HOLES_18}
        holeStrokes={strokes}
        sideEvents={[]}
        grossTotal={72}
        netTotal={68}
        stablefordPoints={36}
      />
    )

    const detail = screen.getByTestId('scorecard-detail')
    expect(detail).toBeInTheDocument()

    // Check headers
    expect(screen.getByText('Hole')).toBeInTheDocument()
    expect(screen.getByText('Par')).toBeInTheDocument()
    expect(screen.getByText('SI')).toBeInTheDocument()
    expect(screen.getByText('Score')).toBeInTheDocument()
    expect(screen.getByText('Events')).toBeInTheDocument()

    // Check subtotal rows
    expect(screen.getByText('Out')).toBeInTheDocument()
    expect(screen.getByText('In')).toBeInTheDocument()
  })

  it('renders Front 9 only for 9-hole rounds', () => {
    const strokes: HoleStroke[] = [4, 4, 3, 5, 4, 3, 4, 4, 5]

    render(
      <ScorecardDetail
        holes={HOLES_9}
        holeStrokes={strokes}
        sideEvents={[]}
        grossTotal={36}
        netTotal={null}
        stablefordPoints={null}
      />
    )

    expect(screen.getByText('Out')).toBeInTheDocument()
    expect(screen.queryByText('In')).not.toBeInTheDocument()
  })

  it('shows dashes for missing hole strokes', () => {
    const strokes: HoleStroke[] = [4, null, 3, null, 4, 3, null, 4, 5]

    render(
      <ScorecardDetail
        holes={HOLES_9}
        holeStrokes={strokes}
        sideEvents={[]}
        grossTotal={23}
        netTotal={null}
        stablefordPoints={null}
      />
    )

    // There should be dashes for the 3 null holes
    const table = screen.getByRole('table')
    const cells = within(table).getAllByText('-')
    // 3 nulls = 3 dashes in score column, possibly more from subtotal
    expect(cells.length).toBeGreaterThanOrEqual(3)
  })

  it('shows gross, net, and stableford in summary', () => {
    const strokes: HoleStroke[] = Array(18).fill(4)

    render(
      <ScorecardDetail
        holes={HOLES_18}
        holeStrokes={strokes}
        sideEvents={[]}
        grossTotal={72}
        netTotal={68}
        stablefordPoints={40}
      />
    )

    expect(screen.getByText('Gross:')).toBeInTheDocument()
    expect(screen.getByText('72')).toBeInTheDocument()
    expect(screen.getByText('Net:')).toBeInTheDocument()
    expect(screen.getByText('68')).toBeInTheDocument()
    expect(screen.getByText('Stableford:')).toBeInTheDocument()
    expect(screen.getByText('40')).toBeInTheDocument()
  })

  it('hides net and stableford when null', () => {
    const strokes: HoleStroke[] = Array(18).fill(4)

    render(
      <ScorecardDetail
        holes={HOLES_18}
        holeStrokes={strokes}
        sideEvents={[]}
        grossTotal={72}
        netTotal={null}
        stablefordPoints={null}
      />
    )

    expect(screen.getByText('72')).toBeInTheDocument()
    expect(screen.queryByText('Net:')).not.toBeInTheDocument()
    expect(screen.queryByText('Stableford:')).not.toBeInTheDocument()
  })

  it('renders side event icons on the correct hole rows', () => {
    const strokes: HoleStroke[] = Array(9).fill(4)
    const events: SideEventLog[] = [
      makeSideEvent('birdie', 'player-1', 3),
      makeSideEvent('snake', 'player-1', 5),
    ]

    render(
      <ScorecardDetail
        holes={HOLES_9}
        holeStrokes={strokes}
        sideEvents={events}
        grossTotal={36}
        netTotal={null}
        stablefordPoints={null}
      />
    )

    // Birdie icon should have a title containing "Birdie"
    const birdieIcon = screen.getByTitle('Birdie')
    expect(birdieIcon).toBeInTheDocument()

    // Snake icon should have a title containing "Snake"
    const snakeIcon = screen.getByTitle('Snake')
    expect(snakeIcon).toBeInTheDocument()
  })

  it('shows count for multiple events of same type on one hole', () => {
    const strokes: HoleStroke[] = Array(9).fill(4)
    const events: SideEventLog[] = [
      makeSideEvent('snopp', 'player-1', 2, { id: 'evt-snopp-2a' }),
      makeSideEvent('snopp', 'player-1', 2, { id: 'evt-snopp-2b' }),
      makeSideEvent('snopp', 'player-1', 2, { id: 'evt-snopp-2c' }),
    ]

    render(
      <ScorecardDetail
        holes={HOLES_9}
        holeStrokes={strokes}
        sideEvents={events}
        grossTotal={36}
        netTotal={null}
        stablefordPoints={null}
      />
    )

    // Should show "Snopp x3" in the title
    const snoppIcon = screen.getByTitle('Snopp x3')
    expect(snoppIcon).toBeInTheDocument()
  })

  it('shows participant name when provided', () => {
    const strokes: HoleStroke[] = Array(9).fill(4)

    render(
      <ScorecardDetail
        holes={HOLES_9}
        holeStrokes={strokes}
        sideEvents={[]}
        grossTotal={36}
        netTotal={null}
        stablefordPoints={null}
        participantName="Kjartan"
      />
    )

    expect(screen.getByText('Kjartan')).toBeInTheDocument()
  })

  it('computes correct Front 9 subtotal', () => {
    // par: 4,4,3,5,4,3,4,4,5 = 36
    // strokes: 5,4,3,5,4,3,4,4,6 = 38
    const strokes: HoleStroke[] = [5, 4, 3, 5, 4, 3, 4, 4, 6]

    render(
      <ScorecardDetail
        holes={HOLES_9}
        holeStrokes={strokes}
        sideEvents={[]}
        grossTotal={38}
        netTotal={null}
        stablefordPoints={null}
      />
    )

    // Out row should show 38
    const table = screen.getByRole('table')
    const outRow = within(table).getByText('Out').closest('tr')!
    expect(within(outRow).getByText('38')).toBeInTheDocument()
    // Also shows total par for front 9 (36)
    expect(within(outRow).getByText('36')).toBeInTheDocument()
  })
})

describe('SideEventBadges', () => {
  it('returns null when player has no events', () => {
    const { container } = render(
      <SideEventBadges sideEvents={[]} playerId="player-1" />
    )
    expect(container.firstChild).toBeNull()
  })

  it('shows badges for player events', () => {
    const events: SideEventLog[] = [
      makeSideEvent('birdie', 'player-1', 1),
      makeSideEvent('birdie', 'player-1', 5),
      makeSideEvent('snake', 'player-1', 3),
    ]

    render(<SideEventBadges sideEvents={events} playerId="player-1" />)

    // Should show birdie badge with count 2
    const birdieBadge = screen.getByTitle('2 Birdies')
    expect(birdieBadge).toBeInTheDocument()

    // Should show snake badge with count 1
    const snakeBadge = screen.getByTitle('1 Snake')
    expect(snakeBadge).toBeInTheDocument()
  })

  it('does not show events from other players', () => {
    const events: SideEventLog[] = [
      makeSideEvent('birdie', 'player-2', 1),
      makeSideEvent('eagle', 'player-2', 5),
    ]

    const { container } = render(
      <SideEventBadges sideEvents={events} playerId="player-1" />
    )
    expect(container.firstChild).toBeNull()
  })

  it('shows multiple event types', () => {
    const events: SideEventLog[] = [
      makeSideEvent('birdie', 'player-1', 1),
      makeSideEvent('eagle', 'player-1', 5),
      makeSideEvent('gir', 'player-1', 1),
      makeSideEvent('gir', 'player-1', 5),
      makeSideEvent('gir', 'player-1', 7),
    ]

    render(<SideEventBadges sideEvents={events} playerId="player-1" />)

    expect(screen.getByTitle('1 Birdie')).toBeInTheDocument()
    expect(screen.getByTitle('1 Eagle')).toBeInTheDocument()
    expect(screen.getByTitle('3 GIRs')).toBeInTheDocument()
  })
})
