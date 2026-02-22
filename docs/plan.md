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

---

# v2 Phases

## Phase 12 -- Admin & Roles

- [x] Add `role: 'admin' | 'player'` to User type + auth store
- [x] Create `useIsAdmin()` hook for role checks
- [x] Add admin guards to: create tournament, create round, add/edit/remove player, update handicap, invite player, post announcement
- [x] Player-facing UI hides admin-only actions (buttons hidden, not just disabled)
- [x] Tests for role-based access (6 tests)

## Phase 13 -- Multi-Tournament

- [x] Tournament list view (admin sees all; player sees active + past)
- [x] Tournament switcher/selector in app header or settings
- [x] "Set as Active" action (admin only)
- [x] Past tournament browser: read-only leaderboards, scorecards, feed history
- [x] No-active-tournament state: show past tournaments list
- [x] Update all pages to respect active tournament selection
- [x] Tests for tournament switching + past tournament views

## Phase 14 -- Round Status & Management

- [x] Update Round status type: `upcoming | active | completed`
- [x] Admin controls: set round status (upcoming → active → completed)
- [x] Enforce only one active round per tournament
- [x] Edit Round dialog (name, format, date, groups)
- [x] Delete round action with confirmation
- [x] Round list ordering: active first, upcoming next, completed last
- [x] Active round concept: Enter page defaults to it, Leaderboards defaults to Round tab
- [x] `useActiveRound()` hook for app-wide access
- [x] Tests for status transitions + ordering (13 tests)

## Phase 15 -- Team Configuration

- [x] Team setup UI after round creation (assign 2-player teams within groups)
- [x] Team name: defaults to "Player A & Player B", custom name editable
- [x] Team name editable by team members or admin
- [x] Team name changes during active round appear in feed
- [x] Team scorecard model: single scorecard per team (not per player) for Scramble/Best Ball
- [x] Update scoring store to support team scorecards
- [x] Tests for team creation, naming, scorecard linking

## Phase 16 -- Enter Page Redesign

- [x] Remove "Total" entry mode (hole-by-hole only)
- [x] Default to active round (no manual round selection needed when one is active)
- [x] Group selector: pick your group, persisted in localStorage as default
- [x] Grid layout: hole rows × player/team columns (spreadsheet style)
  - [x] Tap cell → number pad input → auto-advance to next cell
  - [x] Show hole number, par, stroke index per row
  - [x] Color-coded cells (eagle/birdie/par/bogey/double+)
  - [x] Side event icons visible on cells (birdie bird, snake, etc.)
- [x] Team format: single column per team (labeled with team name)
- [x] Side events integrated in same view:
  - [x] Inline quick-action buttons in number pad panel (birdie, eagle, snake, snopp, GIR, bunker, HIO)
  - [x] Full SideEventLogger card below grid for distance events (LD, NTP, longest putt)
  - [x] Scoped to group players only
- [x] Front 9 / Back 9 split with subtotals
- [x] Running totals row at bottom (gross, net, stableford, points)
- [x] Tests for grid entry + team column behavior (13 tests)

## Phase 17 -- Feed Page Redesign

- [x] Remove player count stat card
- [x] Add active round leaders card (top 3–5 current standings)
- [x] Keep "Your Points" summary
- [x] Announcement cards for notable events:
  - [x] Eagle, birdie, hole-in-one, albatross, nearest to pin
  - [x] Large colorful card with slide-in animation (auto-dismiss ~5s)
  - [x] Queue system: one announcement at a time, stack if multiple
- [x] Admin announcement posting (text input + send button, admin only)
- [x] Announcement model in feed store
- [x] Handicap change events in feed
- [x] Tests for announcement rendering + auto-dismiss

## Phase 18 -- Leaderboards Enhancement

- [x] Default to Round tab when active round exists; Total tab otherwise
- [x] Player scorecard detail: tap player row → expand inline or sheet
  - [x] Full 18-hole scorecard with strokes per hole
  - [x] Side event icons per hole (birdie, eagle, snake, snopp, GIR, etc.)
  - [x] Gross/net/stableford summary
- [x] Side event icons on leaderboard rows (small badges)
- [x] Tests for scorecard detail rendering (13 tests)

## Phase 19 -- Betting Improvements

- [ ] Bet list organized into sections:
  - [ ] Round bets (current active round)
  - [ ] Tournament bets
  - [ ] Settled bets (won/lost/paid, collapsed by default)
- [ ] Visual differentiation between sections (headers, dividers)
- [ ] Tests for section filtering

## Phase 20 -- Rounds & Course View Polish

- [ ] Course card redesign: cleaner grid layout, better alignment
  - [ ] Proper table with Front 9 / Back 9 sections
  - [ ] Hole numbers, par, stroke index in aligned columns
  - [ ] Out/In subtotals
- [ ] Round cards: more compact, clearer status prominence
- [ ] Round ordering: active → upcoming → completed
- [ ] Tests for sort order

## Phase 21 -- Player & Invite Refinements

- [ ] Admin-only: add player, edit player, invite player buttons
- [ ] Handicap change creates feed event (show old → new value)
- [ ] Player-invite linking: create player with email, invite same email, auto-link on acceptance
- [ ] Player profile: editable by self (name, nickname) but not handicap
- [ ] Tests for handicap feed events + invite linking

## Phase 22 -- Updated Demo Data & Final Polish (v2)

- [ ] Update `seedDemoData()` in `src/lib/demo-data.ts` for full v2 demo:
  - [ ] Multiple tournaments (one active "Spain 2026", one past "Portugal 2025")
  - [ ] 12–16 players with varied handicaps
  - [ ] 3 rounds with different statuses (completed, active, upcoming)
  - [ ] Teams configured for scramble/best ball rounds
  - [ ] Scores entered for completed + partially for active round
  - [ ] Side events spread across rounds (birdies, eagles, snakes, snopp, NTP, etc.)
  - [ ] Penalties, bets (pending, accepted, resolved, paid), announcements
  - [ ] Trophy-worthy data (clear leaders in each category)
- [ ] `clearDemoData()` resets all stores cleanly
- [ ] `isDemoSeeded()` check still works
- [ ] Dev-only seed/clear buttons remain on Feed page
- [ ] Verify all admin/player guards work end-to-end
- [ ] Empty states for no-active-tournament, no-active-round
- [ ] Accessibility pass on new components
- [ ] Performance pass (grid rendering, large feeds)
- [ ] Update README + QUICKSTART for v2 features
- [ ] Final test count verification + docs update
