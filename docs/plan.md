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

- [x] Bet list organized into sections:
  - [x] Round bets (current active round)
  - [x] Tournament bets
  - [x] Settled bets (won/lost/paid, collapsed by default)
- [x] Visual differentiation between sections (headers, dividers)
- [x] Tests for section filtering

## Phase 20 -- Rounds & Course View Polish

- [x] Course card redesign: cleaner grid layout, better alignment
  - [x] Proper table with Front 9 / Back 9 sections
  - [x] Hole numbers, par, stroke index in aligned columns
  - [x] Out/In subtotals
- [x] Round cards: more compact, clearer status prominence
- [x] Round ordering: active → upcoming → completed
- [x] Tests for sort order

## Phase 21 -- Player & Invite Refinements

- [x] Admin-only: add player, edit player, invite player buttons
- [x] Handicap change creates feed event (show old → new value)
- [x] Player-invite linking: create player with email, invite same email, auto-link on acceptance
- [x] Player profile: editable by self (name, nickname) but not handicap
- [x] Tests for handicap feed events + invite linking

## Phase 22 -- Updated Demo Data & Final Polish (v2)

- [x] Update `seedDemoData()` in `src/lib/demo-data.ts` for full v2 demo:
  - [x] Multiple tournaments (one active "Spain 2026", one past "Portugal 2025")
  - [x] 12–16 players with varied handicaps
  - [x] 3 rounds with different statuses (completed, active, upcoming)
  - [x] Teams configured for scramble/best ball rounds
  - [x] Scores entered for completed + partially for active round
  - [x] Side events spread across rounds (birdies, eagles, snakes, snopp, NTP, etc.)
  - [x] Penalties, bets (pending, accepted, resolved, paid), announcements
  - [x] Trophy-worthy data (clear leaders in each category)
- [x] `clearDemoData()` resets all stores cleanly
- [x] `isDemoSeeded()` check still works
- [x] Dev-only seed/clear buttons remain on Feed page
- [x] Verify all admin/player guards work end-to-end
- [x] Empty states for no-active-tournament, no-active-round
- [x] Accessibility pass on new components
- [x] Performance pass (grid rendering, large feeds)
- [x] Update README + QUICKSTART for v2 features
- [x] Final test count verification (342 tests, 21 files) + docs update

---

# Post-v2 Improvements

## Improvement Pass 1 -- Score entry, round management, cleanup

- [x] Score entry overlay: replace inline number pad with Dialog overlay (player tabs, quick buttons, +/- auto-save, hole nav)
- [x] Auto-detect side events from scores: birdie, eagle, albatross, HIO auto-logged/removed on every score change
- [x] Soft delete for rounds: `removeRound` sets `deleted: true`, admin can view/restore deleted rounds
- [x] Edit Round dialog rewrite: full editing of name, format, holes, date, course, and group assignments
- [x] `updateGroups` store action for replacing all groups in a round
- [x] Dead code cleanup: removed 5 unused files, 6 unused types/exports, 1 unused store action
- [x] Fix React Compiler lint: replaced useEffect+setState with key-based remount in EditRoundDialog
- [x] Test count: 347 tests across 21 files

## Improvement Pass 2 -- UX polish, dark mode, PWA

- [x] 404 catch-all route (`NotFoundPage`)
- [x] Safe-area padding on bottom nav (`pb-[env(safe-area-inset-bottom)]`, `viewport-fit=cover`)
- [x] Highlight current user in leaderboards (`bg-primary/10` on matching rows)
- [x] Extract shared `SIDE_EVENT_ICONS` module (`src/lib/side-event-icons.ts`)
- [x] Dark mode toggle (next-themes `ThemeProvider`, sun/moon toggle in header)
- [x] Score entry: responsive overlay (Drawer on mobile, Dialog on desktop)
- [x] Score entry: highlight par button in quick number grid (ring indicator)
- [x] Score entry: prominent relative score badge (+N/-N colored pill)
- [x] Score entry: keyboard navigation (arrow keys + Enter/Space on grid)
- [x] PWA support (`vite-plugin-pwa`, manifest, service worker, precaching)
- [x] `useIsMobile` hook (`useSyncExternalStore` pattern, no React Compiler lint issues)
- [x] Test count: 347 tests across 21 files

## Improvement Pass 3 -- Enter page cleanup, side event logger redesign

- [x] SideEventLogger: replace `<Select>` player dropdown with touch button row (selected = `bg-primary`)
- [x] SideEventLogger: bigger hole buttons (`h-11`) with per-player event icons (tap icon to remove with undo toast)
- [x] SideEventLogger: remove auto-detect quick actions (birdie/eagle/HIO/albatross) — these are auto-detected from scores
- [x] SideEventLogger: inline `HoleButton` component with event type icons + overflow indicator
- [x] Remove Standings section from Enter page (redundant with Leaderboards/Feed pages)
- [x] Clean up dead code in Enter page (removed `isAdmin`, `recalculatePoints`, `getParticipantName`, unused imports)
- [x] Connect auto-detected side events to feed notable event banners (`pushNotableEvent` on birdie/eagle/albatross/HIO)
- [x] Test count: 347 tests across 21 files

## Improvement Pass 4 -- Login page, scorecard enhancement, cleanup

- [x] Magic-link login page (`src/pages/login.tsx`): golf-themed green gradient, rolling hills SVG, email input, mock magic link flow, "Check your email" confirmation state
- [x] Auth guard layout route (`src/components/auth-guard.tsx`): redirects unauthenticated → `/login`, spinner during loading
- [x] Route restructure: `/login` outside `AppShell`, all app routes wrapped in `<AuthGuard>`
- [x] Delete dead code: removed `hole-selector.tsx`
- [x] Scorecard detail rewrite (`scorecard-detail.tsx`):
  - [x] Removed "Events" column — side event icons now render inline on Score cells
  - [x] Added optional Net column (per-hole net strokes, color-coded) when `groupHandicap` provided
  - [x] Added relative-to-par header (`+13 / -2` style, "E" for even)
  - [x] Added `SubtotalRow` with GIR/Sand/Snake icon counts in Out/In rows
  - [x] Added `EventTotals` component — event type counts in summary footer
- [x] Leaderboards updated: all `ScorecardDetail` call sites now pass `groupHandicap`
- [x] Scorecard detail tests: 5 new tests (Net column, relative-to-par, event totals)
- [x] Test count: 352 tests across 21 files

## Improvement Pass 5 -- UX restructure, page focus, player comparison

- [x] WP1: Enter page focus — remove penalties/bets, add View Course dialog, Last Snake indicator
- [x] WP2: Feed — betting summary card with accept/reject, "Your Position" stat, "My Round" scorecard card
- [x] WP3: Feed cleanup — gate demo controls behind `import.meta.env.DEV`, style notable events with colored borders
- [x] WP4: Nav badge — notification dot on Feed tab for pending bet invites
- [x] WP5: Side leaderboard sections — group Side tab into collapsible sections (Scoring, Distance, Penalties & Betting)
- [x] WP6a: ScorecardComparison component — side-by-side 2-player view with per-hole winner highlighting, match score, event icons
- [x] WP6b: Compare button in leaderboard ExpandableRow — select any player to compare against expanded player
- [x] WP6c: Round completion summary dialog — admin sees standings, highlights, scorecard status before confirming round completion
- [x] Test count: 352 tests across 21 files

## Improvement Pass 6 -- Dedicated bets page, real bet feed events, delete guards

- [x] WP1: Add `'bet'` to `FeedEventType`, betting store emits real feed events for all 5 lifecycle actions (create, accept, reject, resolve, paid)
- [x] WP2: Remove fake bet injection from Feed page (~40 lines); bet events now flow through `FeedEvent` records
- [x] WP3: Create `/bets` page (`src/pages/bets.tsx`) with `BetList` + bet activity feed
- [x] WP4: Add `/bets` route in `App.tsx`, "View All Bets" links from Feed and Leaderboards pages
- [x] WP5: `removeBet(betId, callerPlayerId, isAdmin)` guard — admin can delete any bet, non-admin only own pending/rejected; inline delete confirmation in `BetList`; 4 new tests
- [x] Full codebase audit: lint clean, build passes, 356 tests across 21 files
- [x] Dead code cleanup: removed PenaltyList component, PointsConfig type, unused barrel re-exports (Trophy, TrophySourceType), 3 unused store selectors (getEventsByPlayer, clearEvents, getPointsForParticipant), 6 test-only functions from side-events-logic.ts + their 20 tests
- [x] Test count: 336 tests across 21 files

## Improvement Pass 7 -- UX/permissions overhaul

### WP1: Tournament CRUD + archive (admin-only)

- [x] Country entity: `src/features/countries/` with types, Zustand store (add, remove, duplicate prevention), barrel export
- [x] Country store tests: 7 tests (add, remove, duplicate case-insensitive, empty name, multiple, trim)
- [x] Add `countryId?: string` to Tournament + CreateTournamentInput types
- [x] Add `removeTournament(id)` to tournament store (hard delete, reassign active to first live or null)
- [x] `updateTournament` now accepts `countryId` in partial updates
- [x] Tournament store tests: 5 new tests (remove, remove reassigns active, remove sets null, create with countryId, update countryId)
- [x] `CountrySelect` component: dropdown of existing countries + "Add new" inline input + "No country" option
- [x] Create Tournament dialog: added country selector
- [x] Edit Tournament dialog (new component): pre-filled form with name, location, country, dates; key-based remount
- [x] Tournament list rewrite: status transition buttons (Go Live, Mark Complete), edit/delete buttons, delete confirmation dialog, country display on cards
- [x] Archive section: done tournaments in collapsible "Archive" at bottom, collapsed by default
- [x] Fix done tournament viewing: `/leaderboards?tournamentId=xxx` route param instead of changing activeTournamentId; "Viewing: X (Archived)" banner with "Back to active" link
- [x] Demo data: countries seeded (Spain, Portugal), `countryId` set on both tournaments, cleared on reset
- [x] Docs updated: plan.md, decisions.md

### WP2: "Go to Bets" button + Feed notification count

- [x] Rename "View All Bets" → "Go to Bets" as full-width `<Button variant="outline">` on Feed page
- [x] Feed tab: red dot → count badge (shows number, "9+" for >9)

### WP3: Score entry grid — dark mode + visual fixes

- [x] Dark mode colors: eagle/bogey/double+ use semi-transparent dark variants for better contrast
- [x] Header rows (#, Par, SI): more compact (`text-[10px]`, reduced padding)
- [x] Score cells: subtle left border (`border-l border-border/50`) for grid definition
- [x] Side event icons: increased to `size-3` with `drop-shadow-sm` for visibility
- [x] Relative score badge in overlay: dark mode colors matched to grid cells
- [x] App test updated for badge count in nav link textContent
- [x] Test count: 348 tests across 22 files

### WP4: Enter page — group/round permissions

- [x] Players auto-locked to own group (group selector hidden for non-admin)
- [x] Admin keeps group selector, can edit all groups
- [x] Non-active rounds: grid is read-only (overlay disabled, cursor-default)
- [x] Read-only banner for completed/upcoming rounds
- [x] Side event logger hidden when round is read-only
- [x] `readOnly` prop added to `GroupScoreGrid`
- [x] Test count: 348 tests across 22 files

### WP5: Courses rework — countries, manual creation, grouped display

- [x] `Course` type extended with `countryId?: string`
- [x] `addCourse()` store action accepts optional `countryId` as 5th param
- [x] Import Course dialog: added `CountrySelect` for country assignment
- [x] Create Course dialog (new): manual course creation with name, country, hole count (9/18), tap-to-cycle par, editable SI
- [x] Rounds page Courses tab rewritten: courses grouped by country (tournament country first with badge, others collapsible, "No country" last)
- [x] Create Round dialog: course selector groups courses by tournament country vs. "Other countries"
- [x] Course card: shows country name below title
- [x] Demo data: Los Naranjos → Spain countryId, Quinta do Lago → Portugal countryId
- [x] Course store tests: 3 new tests (countryId stored, undefined when omitted, manual source with countryId)
- [x] Test count: 351 tests across 22 files

### WP6: Round creation — inline team assignment + editable points

- [x] `pointsTable?: number[]` field added to `Round`, `CreateRoundInput`, `UpdateRoundInput` types
- [x] Rounds store: `createRound()` persists `pointsTable` from input; `updateRound()` supports `pointsTable` updates
- [x] `PointsTableEditor` component (new): reusable view/edit modes, 5-column grid of number inputs, add/remove places, reset to default
- [x] `TeamPairingEditor` component (new): inline team pairing per group with shuffle + rename; exports `autoPairGroups()` helper
- [x] Team pairing lib (`src/features/rounds/lib/team-pairing.ts`): extracted shared types (`GroupTeamDraft`, `TeamPairingResult`) + `autoPairGroups()` to fix react-refresh lint rule
- [x] Create Round dialog: integrated PointsTableEditor + TeamPairingEditor, team configs auto-regenerate on format/group changes
- [x] Edit Round dialog: integrated PointsTableEditor + TeamPairingEditor, `buildInitialTeamConfigs()` reconstructs existing teams, submit saves pointsTable + teams
- [x] Cross-store points wiring: scoring store's `setHoleStroke` reads per-round `pointsTable` from rounds store via `useRoundsStore.getState()`
- [x] Demo data: Round 2 (Scramble) has custom `pointsTable: [20, 15, 12, 10, 8, 6, 4]`
- [x] Rounds store tests: 6 new tests (per-round points table CRUD, teams at round creation)
- [x] Test count: 357 tests across 22 files
