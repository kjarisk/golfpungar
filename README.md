# Golfpungar -- Golf Trip Tournament App

An invite-only golf trip tournament app for 12-20 players that tracks rounds, points, side-competitions, penalties, and peer-to-peer bets with live leaderboards and quick in-app event logging. Designed to complement GameBook.

## Features

### Core

- **Multi-tournament support** -- create and manage multiple tournaments; admin sets one as active, past tournaments browsable read-only
- **Admin/player roles** -- admin controls tournament setup, rounds, players, announcements; players manage their own group data
- **Player management** -- invite via email, group handicaps (changes logged in feed), auto-link invites to players by email
- **Course import** -- upload CSV files to create courses with hole data

### Rounds & Scoring

- **Round management** -- Scramble, Stableford, Best Ball, Handicap formats; status flow (upcoming/active/completed); only one active round at a time
- **Team configuration** -- 2-player teams within groups for Scramble/Best Ball; custom team names (changes appear in feed)
- **Group-based score entry** -- spreadsheet grid (hole rows x player/team columns), tap cell for number pad, color-coded cells, side event icons inline
- **Auto-calculated standings** -- gross, net, stableford points, placings, all recalculated on every score change

### Side Events & Competitions

- **Side events** -- birdies, eagles, snakes (3-putts), snopp (anger events), bunker saves, group longest drives, longest drive (meters + photo), longest putt, nearest to pin, GIR
- **Penalties** -- manual penalty ledger with "Penalty King" leaderboard
- **Betting** -- peer-to-peer bets (round or tournament scope), accept/reject flow, winner resolution, dual-party paid confirmation; organized into round/tournament/settled sections
- **Trophies** -- auto-generated trophy standings ("Road to Winner") from points, side events, penalties, and bets

### Leaderboards & Feed

- **Leaderboards** -- total points, round standings, gross/net totals, side competition rankings, penalty king, biggest bettor; tap any player to expand full scorecard with side event icons
- **Live feed** -- chronological event stream with animated announcement cards for notable events (birdie, eagle, hole-in-one), admin announcement posting, active round leaders card

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Install & Run

```bash
npm install
npm run dev
```

The app starts at `http://localhost:5173` with a test account auto-logged in.

Click **"Seed Demo Data"** on the Feed page to populate a full v2 demo:

- 2 tournaments ("Spain 2026" active, "Portugal 2025" past)
- 14 players with varied handicaps
- 3 rounds (completed, active with partial scores, upcoming) + teams for scramble rounds
- Side events, penalties, bets, announcements, and feed events
- Use the role switcher (admin/player) on the Feed page to see different permission levels

### Commands

| Command                 | Description                   |
| ----------------------- | ----------------------------- |
| `npm run dev`           | Start dev server              |
| `npm run build`         | Type-check + production build |
| `npm run lint`          | Run ESLint                    |
| `npm run lint:fix`      | Run ESLint with auto-fix      |
| `npm run format`        | Format with Prettier          |
| `npm run test`          | Run tests in watch mode       |
| `npm run test:coverage` | Run tests with coverage       |
| `npm run preview`       | Preview production build      |

## Tech Stack

- React 19 + Vite + TypeScript
- Tailwind CSS v4 (inline theme, no config file)
- shadcn/ui components
- TanStack Query (server state -- wired to Supabase later)
- Zustand (client/UI state + mock data stores)
- React Router v7 (5-tab bottom navigation)
- Vitest + Testing Library (347 tests)

## Project Structure

```
src/
  components/ui/          # shadcn/ui primitives
  components/             # shared components (app-shell, error-boundary)
  features/
    auth/                 # auth with admin/player roles
    tournament/           # multi-tournament CRUD + active selection
    players/              # player CRUD + invite linking
    courses/              # CSV parser + course store
    rounds/               # rounds, groups, teams, status management
    scoring/              # group-based score grid, points calc, scorecard detail
    side-events/          # side event logging, evidence gallery
    penalties/            # penalty ledger + "Penalty King"
    betting/              # peer-to-peer bets (round/tournament/settled sections)
    trophies/             # trophy standings, "Road to Winner"
    feed/                 # live feed, announcements, notable event banners
  lib/                    # shared utils (leaderboard-calc, demo-data)
  pages/                  # route pages (feed, enter, leaderboards, rounds, players)
  test/                   # test setup
docs/
  outline.md              # scope lock (single source of truth)
  plan.md                 # phased implementation plan
  decisions.md            # architecture decision log
  csv-format.md           # CSV import format spec
  csv-examples/           # sample course CSV files
```

## CSV Course Import

Upload a `.csv` file with these required columns:

| Column        | Type   | Description                   |
| ------------- | ------ | ----------------------------- |
| `holeNumber`  | number | Hole number (1-18)            |
| `par`         | number | Par for the hole (3, 4, or 5) |
| `strokeIndex` | number | Stroke index / handicap index |

Optional: `courseName` (string).

Example:

```csv
holeNumber,par,strokeIndex
1,4,11
2,5,3
3,3,17
4,4,7
5,4,1
6,4,13
7,3,15
8,5,5
9,4,9
10,4,12
11,5,4
12,3,18
13,4,8
14,4,2
15,4,14
16,3,16
17,5,6
18,4,10
```

Sample files available in `docs/csv-examples/`:

- `los-naranjos.csv` -- Los Naranjos Golf Club, Marbella
- `valderrama.csv` -- Real Club Valderrama, Sotogrande
- `rio-real.csv` -- Rio Real Golf, Marbella

## Current Status

All phases (0-22) complete plus post-v2 improvement pass. v2 features include admin/player roles, multi-tournament, round status management, group-based score entry grid with Dialog overlay, team configuration, feed announcements with animated banners, scorecard detail views, and comprehensive demo data. Post-v2 improvements: score entry overlay redesign, auto-detect side events from scores, soft delete/restore for rounds, full Edit Round dialog with course + group editing, and dead code cleanup. All data is in Zustand mock stores. Backend (Supabase) integration deferred.

347 tests across 21 test files. See `docs/plan.md` for the full implementation plan.
