# Plan (Vertical Slices)

## Principles

- Build in end-to-end slices (UI -> state -> API/data -> tests).
- Keep tasks small; each task should be doable in ~15-60 minutes.
- After each task: run tests + commit a checkpoint.
- Use mock/local data first, swap in Supabase later.

---

## Phase 0 -- Project foundation

- [x] Scaffold React + Vite + TS + Tailwind
- [x] Add React Router with 5-tab bottom navigation
- [x] Add TanStack Query + Zustand baseline setup
- [x] Add shadcn/ui baseline components + theme tokens (green accent)
- [x] Add lint + format + test baseline
- [x] Create placeholder page skeletons (Feed, Enter, Leaderboards, Rounds, Players)
- [x] Set up mock auth with test account (skip login during dev)

## Phase 1 -- Tournament + Players (the "home base")

- [x] TypeScript types for Tournament, Player, Invite
- [x] Mock data stores with sample tournament + 6 players (Supabase deferred)
- [x] Tournament view/header on Feed page (name, dates, status badge, stats)
- [x] Create Tournament dialog (name, dates, location)
- [x] Players list screen (avatars, handicaps, edit button)
- [x] Add/edit player form dialog (displayName, nickname, groupHandicap)
- [x] Invite Players dialog (add emails, batch send)
- [x] Tests for tournament store (6 tests) + player store (8 tests)

## Phase 2 -- Courses + Rounds

- [x] Create database tables (Course, Hole, Round, Group, Team) — Zustand mock stores
- [x] CSV course import (upload, parse, create course + holes)
- [x] Course list/view screen
- [x] Create Round (select course, format, assign groups)
- [x] Team support (optional per round, scramble/ryder)
- [x] Configure points model per round (default top-10, customizable later)
- [x] Rounds list screen on "Rounds" tab
- [x] Tests for CSV parsing + round creation (14 CSV tests, 8 course tests, 11 round tests)

## Phase 3 -- Score Entry

- [x] Create database tables (Scorecard, RoundPoints) — Zustand mock stores
- [x] Hole-by-hole score entry (fast grid, tap hole, enter strokes)
- [x] Whole-round total entry (alternative)
- [x] Support missing holes
- [x] Allow later edits
- [x] Auto-calculate net scores, stableford points, placings
- [x] Points awarding (top 10 individual, team placement)
- [x] Auto-recalculate after score updates
- [x] Tests for points calculation + standings (25 scoring-calc, 10 points-calc, 14 store = 49 tests)

## Phase 4 -- Side Events (the fun stuff)

- [x] Create database tables (SideEventLog, EvidenceImage) — Zustand mock stores
- [x] Fast action buttons (Birdie, Eagle, Snake, Bunker Save, etc.)
- [x] Hole selector (1-18 quick grid)
- [x] Longest drive entry (meters + photo upload placeholder)
- [x] Group longest drive (Par 5 only, log winner per group)
- [x] Snake logic (3-putt tracking, "last snake in group" derivation)
- [x] Tests for snake logic + side-event aggregation (16 logic + 13 store = 29 tests)

## Phase 5 -- Leaderboards + Live Feed

- [x] Create database table (FeedEvent)
- [x] Round leaderboard (standings for a single round)
- [x] Total points leaderboard (overall tournament)
- [x] Side competition leaderboards (birdies, snakes, longest drive)
- [x] Live feed (real-time events via Supabase Realtime)
- [x] Toast animations for in-app notifications
- [x] Evidence gallery for longest drives
- [x] Tests for leaderboard calculations

## Phase 6 -- Polish + hardening

- [x] Loading + error states on every screen
- [x] Empty states with helpful messages
- [x] Accessibility pass (keyboard/focus, labels, ARIA)
- [x] Performance pass (avoid unnecessary rerenders)
- [x] Responsive polish (desktop + mobile)
- [x] README with run instructions + CSV format
- [x] Final cleanup + docs

## Phase 7 -- Missing Side Events (snopp, longest putt, NTP, GIR)

- [x] Add `snopp`, `longest_putt`, `nearest_to_pin`, `gir` to SideEventType + SideEventTotals
- [x] Update computePlayerTotals() in side-events-logic for 4 new types
- [x] Add quick-action buttons to side-event-logger (snopp, GIR, longest putt, NTP)
- [x] Add SIDE_EVENT_CONFIG entries in feed.tsx for 4 new types
- [x] Add leaderboard cards (Most Snopp, Longest Putt, Nearest to Pin, Most GIR)
- [x] Add computeLongestPuttLeaderboard + computeNearestToPinLeaderboard to leaderboard-calc
- [x] Tests for new aggregations + leaderboards

## Phase 8 -- Penalties / Ledger

- [x] Create src/features/penalties/ feature slice (types, store, components)
- [x] LedgerEntry type + Zustand store (add/remove/query/totals)
- [x] Penalty entry dialog (player, amount, note, round)
- [x] Penalty list view
- [x] "Penalty King" leaderboard card
- [x] Feed integration
- [x] Tests for ledger store + aggregation

## Phase 9 -- Gross & Net Tournament Leaderboards

- [x] computeGrossLeaderboard + computeNetLeaderboard in leaderboard-calc
- [x] Add Gross and Net leaderboard cards to leaderboards page
- [x] Tests for gross/net aggregation + tie handling

## Phase 10 -- Betting (simplified v1)

- [x] Create src/features/betting/ feature slice (types, store, components)
- [x] Bet + BetParticipant types
- [x] Zustand store (create, accept, reject, resolve, query)
- [x] Create Bet dialog (scope, target, amount, opponents)
- [x] Bet list view (pending, active, resolved)
- [x] Bet acceptance flow + manual winner resolution
- [x] "Biggest bettor" leaderboard + betting overview
- [x] Tests for bet state transitions + aggregation

## Phase 11 -- Trophies & Road to Winner

- [x] Create src/features/trophies/ feature slice (types, store, components)
- [x] Trophy type + auto-generation from points/side events/ledger/bets
- [x] "Road to Winner" overview component
- [x] Add trophy overview to Feed or Leaderboards
- [x] Tests for trophy computation
