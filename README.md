# Golfpungar -- Golf Trip Tournament App

An invite-only golf trip tournament app for 12-20 players that tracks rounds, points, side-competitions, penalties, and peer-to-peer bets with live leaderboards and quick in-app event logging. Designed to complement GameBook.

## Features

- **Tournament management** -- create tournaments with name, dates, location
- **Player management** -- invite players via email, group handicaps
- **Course import** -- upload CSV files to create courses with hole data
- **Round creation** -- Scramble, Stableford, Best Ball, Handicap formats with group/team assignment
- **Score entry** -- hole-by-hole grid or whole-round totals, auto-calculated standings
- **Side events** -- birdies, eagles, snakes (3-putts), snopp (anger events), bunker saves, group longest drives, longest drive (meters + photo evidence), longest putt, nearest to pin, GIR
- **Penalties** -- manual penalty ledger with "Penalty King" leaderboard
- **Betting** -- peer-to-peer bets (round or tournament scope), accept/reject flow, winner resolution, paid confirmation
- **Trophies** -- auto-generated trophy standings ("Road to Winner") from points, side events, penalties, and bets
- **Leaderboards** -- total points, round standings, gross/net totals, side competition rankings, penalty king, biggest bettor
- **Live feed** -- real-time event stream with toast notifications

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

Click **"Seed Demo Data"** on the Feed page to populate sample rounds, scores, side events, penalties, and bets.

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
- Vitest + Testing Library (221+ tests)

## Project Structure

```
src/
  components/ui/          # shadcn/ui primitives
  components/             # shared components (app-shell, error-boundary)
  features/
    auth/                 # mock auth (test account)
    tournament/           # tournament CRUD + store
    players/              # player CRUD + invite logic
    courses/              # CSV parser + course store
    rounds/               # round creation + groups/teams
    scoring/              # score entry, points calc, standings
    side-events/          # side event logging, evidence gallery
    penalties/            # penalty ledger + "Penalty King"
    betting/              # peer-to-peer bets, accept/reject/resolve/paid
    trophies/             # trophy standings, "Road to Winner"
    feed/                 # live feed store
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

All phases (0-11) complete. All core features built with mock data stores. Backend (Supabase) integration deferred.

See `docs/plan.md` for the full implementation plan.
