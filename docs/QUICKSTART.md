# Quickstart -- Golfpungar

## Setup

```bash
git clone <repo-url> && cd golfpungar
npm install
npm run dev
```

App opens at `http://localhost:5173` with a test account (Kjartan, admin role) auto-logged in.

## Seed Demo Data

Click **"Seed Demo Data"** on the Feed page to populate:

- 2 tournaments ("Spain 2026" active, "Portugal 2025" past)
- 14 players with varied handicaps
- 3 rounds: completed (handicap), active with partial scores (scramble + teams), upcoming (stableford)
- Portugal 2025: 2 completed rounds on "Quinta do Lago South"
- Side events across all rounds (birdies, eagles, snakes, snopp, NTP, longest drives, etc.)
- Penalties, bets (pending, accepted, resolved, paid), and admin announcements
- Feed events for handicap changes, team name changes, and more

Click **"Clear Demo Data"** to reset all stores.

## Role Switching

Use the **role switcher** on the Feed page (dev only) to toggle between admin and player views:

- **Admin**: sees all tournaments, can create/edit rounds, add players, update handicaps, post announcements
- **Player**: sees only the active tournament, can enter scores for their group, log side events, manage their own bets

## Key Navigation

- **Feed**: tournament overview, active round leaders, live event feed, notable event banners
- **Enter**: group-based score entry grid (select your group, persisted across sessions)
- **Leaderboards**: round/total/gross/net standings, side event leaderboards, tap player to expand scorecard
- **Rounds**: round list (active/upcoming/completed), course cards with hole data
- **Players**: player list, invite management

## Multi-Tournament

- Admin can create multiple tournaments and set one as "active"
- Players see only the active tournament
- Past tournaments are browsable with read-only leaderboards
- Visit the Tournaments page via the header to switch tournaments

## Commands

```bash
npm run dev            # localhost:5173
npm run test           # vitest watch
npm run test:coverage  # tests with coverage
npm run build          # type-check + production build
npm run lint           # eslint check
npm run lint:fix       # eslint auto-fix
npm run format         # prettier auto-format
npm run format:check   # prettier check (no write)
```

## Path aliases

Use `@/` to import from `src/`:

```tsx
import { Button } from '@/components/ui/button'
```

## Add shadcn/ui components

```bash
npx shadcn@latest add <component>
npx eslint --fix src/components/ui/<component>.tsx  # fix double quotes
```

## CSV Course Import

Upload `.csv` with columns: `holeNumber`, `par`, `strokeIndex`. Sample files in `docs/csv-examples/`.

## Project Structure

```
src/features/<name>/    # feature slices (components/, api/, state/, types.ts)
src/components/ui/      # shadcn/ui primitives
src/pages/              # route pages
src/lib/                # shared utils (leaderboard-calc, demo-data)
docs/                   # outline, plan, decisions, CSV docs
```
