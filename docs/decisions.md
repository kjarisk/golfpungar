# Decisions Log

Keep this short: what we decided, and why.

## Decisions

- 2026-02-07: Chose shadcn/ui as default UI layer for speed + consistency.
- 2026-02-07: State strategy = TanStack Query (server) + Zustand (UI/client).
- 2026-02-22: Added React Router for 5-tab bottom navigation (Feed, Enter, Leaderboards, Rounds, Players).
- 2026-02-22: Backend = Supabase (Auth magic links, Postgres, Storage for images, Realtime for live feed).
- 2026-02-22: Green accent theme inspired by moodboard (oklch green primary).
- 2026-02-22: Mock auth with test account during dev (auto-logged-in as "Kjartan"). Will swap for Supabase Auth later.
- 2026-02-22: Phase 2 — CSV course import uses papaparse-style manual parser; no external dep needed for simple CSV.
- 2026-02-22: Phase 3 — Scoring store computes gross/net/stableford inline on `setHoleStroke` for instant feedback.
- 2026-02-22: Phase 4 — Side events store uses timestamp-based "last snake in group" derivation; no separate snake counter.
- 2026-02-22: Phase 5 — Live feed combines side events + penalties + bets into unified chronological feed on Feed page.
- 2026-02-22: Phase 7 — Added snopp, longest putt, nearest to pin, GIR as side event types with dedicated leaderboard cards.
- 2026-02-22: Phase 8 — Penalty ledger uses simple LedgerEntry type with kind='penalty'. "Penalty King" = highest total.
- 2026-02-22: Phase 9 — Gross/net tournament leaderboards aggregate across all rounds; ties broken by lower last-round score.
- 2026-02-22: Phase 10 — Simplified betting v1: states are pending -> accepted/rejected -> won/lost. Dual-party paid confirmation added in polishing step.
- 2026-02-22: Phase 11 — Trophies auto-generated from points/side events/ledger/bets via `computeTrophyStandings()`.
- 2026-02-22: Demo data seeded via button on Feed page (`seedDemoData()`), not auto-loaded, to keep fresh state possible.
- 2026-02-22: v2 scope — Outline updated to Scope Lock v2 with admin/player roles, multi-tournament, round status management, group-based score entry grid, team configuration, feed announcements, and scorecard detail view.
- 2026-02-22: v2 — Score entry redesigned as group-based spreadsheet grid (hole rows × player/team columns). "Total" manual entry mode removed; totals always derived from hole-by-hole strokes.
- 2026-02-22: v2 — Team names default to "Player A & Player B", customizable by team members or admin. Changes during active round appear in feed.
- 2026-02-22: v2 — Feed page: removed player count stat, added active round leaders card and animated announcement cards for notable events (birdie, eagle, NTP, etc.).
- 2026-02-22: v2 — Admin can post in-app announcements to the feed (no push notifications, feed messages only).
- 2026-02-22: v2 — Supabase remains deferred. All v2 features use Zustand mock data. Real-time behavior is client-reactive only.
- 2026-02-22: v2 — Demo data (`seedDemoData()`) will be expanded in Phase 22 to cover multi-tournament, teams, round statuses, announcements, and full v2 feature set. Same seed/clear pattern preserved.
- 2026-02-22: Phase 16 — Enter page redesigned as group-based spreadsheet grid (GroupScoreGrid). "Total" manual entry mode removed. Group selector with localStorage persistence added. Side event quick-actions (birdie, eagle, snake, snopp, GIR, bunker, HIO) integrated inline in the number pad panel; distance events (LD, NTP, longest putt) remain in SideEventLogger card below grid.
- 2026-02-22: Improvement Pass 1 — Score entry overlay: replaced inline number pad with Dialog overlay. Added player tabs, quick number buttons (1–10), +/- auto-save, hole navigation. Manual side event buttons removed from score entry grid; replaced with auto-detection.
- 2026-02-22: Auto-detect side events: birdie/eagle/albatross/HIO now auto-logged and removed on every score change in GroupScoreGrid. Logic lives in the component (not the scoring store) to avoid cross-store coupling.
- 2026-02-22: Soft delete for rounds: `removeRound` sets `deleted: true` instead of hard delete. Admin can view and restore deleted rounds via collapsible section on Rounds page.
- 2026-02-22: Edit Round dialog rewrite: now supports editing all round data including course selector and full group assignment UI (auto-assign, add/remove groups, player dropdowns). Uses key-based remount pattern to avoid React Compiler lint violation with useEffect+setState.
- 2026-02-22: Dead code cleanup: removed 5 files (ScoreEntryGrid, RoundTotalEntry, sheet.tsx, dropdown-menu.tsx, .gitkeep), 4 unused types (SetTotalInput, CreateScorecardInput, UpdateStrokesInput, AddEvidenceInput), 2 unused barrel re-exports (HoleSelector, scoring types), 1 unused store action (getPlayersByTournament).
- 2026-02-22: Improvement Pass 2 — Score entry overlay now uses Drawer (vaul) on mobile and Dialog on desktop, selected via `useIsMobile` hook using `useSyncExternalStore` (React Compiler safe).
- 2026-02-22: Improvement Pass 2 — Par button highlighted with `ring-2 ring-primary/50` in score entry quick number grid for faster entry.
- 2026-02-22: Improvement Pass 2 — Relative score badge (`+2`, `-1`, `E`) shown as colored pill below the stroke count in the score overlay.
- 2026-02-22: Improvement Pass 2 — Keyboard navigation on score grid: arrow keys to move between cells (roving tabindex), Enter/Space opens overlay (browser default via button click).
- 2026-02-22: Improvement Pass 2 — PWA support via `vite-plugin-pwa` with `generateSW` strategy, SVG icons, workbox precaching. App installable as standalone PWA.
- 2026-02-22: Improvement Pass 2 — Dark mode via `next-themes` ThemeProvider. Sun/moon toggle in app shell header. Dark tokens already existed in `index.css` via Tailwind v4.
- 2026-02-22: Improvement Pass 2 — Shared `SIDE_EVENT_ICONS` module at `src/lib/side-event-icons.ts` — single source of truth for icon, className, bgClassName, label across all 12 side event types.
- 2026-02-23: Improvement Pass 3 — SideEventLogger redesigned: `<Select>` player dropdown replaced with touch button row; hole buttons enlarged (`h-11`) with per-player event type icons; tap-to-remove with undo toast. Birdie/eagle/HIO/albatross removed from quick actions (auto-detected from scores).
- 2026-02-23: Improvement Pass 3 — Standings section removed from Enter page. Round standings available on Leaderboards and Feed pages; duplicate on Enter page was redundant.
- 2026-02-23: Improvement Pass 3 — Auto-detected side events (birdie/eagle/albatross/HIO) now push `NotableEvent` to feed store, triggering animated announcement banners on the Feed page. Previously the banner component existed but was never triggered in production.
- 2026-02-23: Improvement Pass 4 — Magic-link login page with auth guard route. `/login` is outside `AppShell`; all app routes wrapped in `<AuthGuard>` that redirects unauthenticated users to `/login`.
- 2026-02-23: Improvement Pass 4 — Scorecard detail rewrite: removed separate "Events" column, side event icons now inline on Score cells. Added optional Net column (per-hole net strokes, color-coded via `netStrokesForHole()`). Added relative-to-par header (`+13 / -2`). Added SubtotalRow with event icon counts. Added EventTotals footer. No yardage column (Hole type has no distance field). No per-hole putts count column; snake icon shown where 3-putt occurred.
- 2026-02-23: Improvement Pass 5 — Enter page streamlined (removed penalties/bets, added View Course dialog, Last Snake indicator). Feed page enriched with betting summary card, "Your Position" stat, "My Round" scorecard. Notable feed events styled with colored borders. Notification dot on Feed tab for pending bets. Side leaderboards grouped into collapsible sections. ScorecardComparison component for side-by-side 2-player view. Compare button added to leaderboard expanded rows. Round completion summary dialog shows standings + highlights before admin confirms.
- 2026-02-23: Improvement Pass 6 — Betting store now emits real `FeedEvent` records (type `'bet'`) for all lifecycle transitions (create, accept, reject, resolve, paid) via cross-store call to `useFeedStore.getState().addEvent()`. Removed fake bet injection from Feed page that previously synthesized `UnifiedFeedItem` objects from bet state.
- 2026-02-23: Improvement Pass 6 — `removeBet(betId, callerPlayerId, isAdmin)` guard rules: admin can delete any bet; non-admin can only delete their own bets in `pending` or `rejected` status. Returns `boolean` success.
- 2026-02-23: Improvement Pass 6 — `/bets` page is a standalone route, NOT added to bottom nav (accessible via "View All Bets" links from Feed and Leaderboards pages). Keeps nav bar focused on the 5 core tabs.
- 2026-02-23: Improvement Pass 6 — Demo data creates 8 bets via store actions, generating ~20 auto-generated bet feed events. No hardcoded `type: 'bet'` feed events; all flow through real `FeedEvent` records.
- 2026-02-23: Improvement Pass 7 WP1 — Country entity as a full Zustand store (`src/features/countries/`) with CRUD, case-insensitive duplicate prevention. Countries shared between tournaments and courses. `CountrySelect` component with dropdown + "Add new" inline input.
- 2026-02-23: Improvement Pass 7 WP1 — Tournament type extended with `countryId?: string`. `removeTournament(id)` does hard delete (not soft). Reassigns active to first remaining live tournament or null.
- 2026-02-23: Improvement Pass 7 WP1 — Done tournament viewing fixed: `/leaderboards?tournamentId=xxx` route param instead of changing `activeTournamentId`. Banner shows "Viewing: X (Archived)" with "Back to active" link.
- 2026-02-23: Improvement Pass 7 WP1 — Tournament list rewritten: status transition buttons (Go Live, Mark Complete), edit/delete per card, done tournaments in collapsible "Archive" section at bottom (collapsed by default).
- 2026-02-23: Improvement Pass 7 WP1 — Edit Tournament dialog uses key-based remount pattern (same as EditRoundDialog) for React Compiler safety.
- 2026-02-23: Improvement Pass 7 WP2 — "View All Bets" replaced with "Go to Bets" `<Button variant="outline">` (full-width, touchable) on Feed page. Feed tab notification changed from red dot to count badge (shows number, "9+" for >9).

## UI system choice (per project)

- Default: shadcn/ui
- Allowed alternative: Tailwind UI (copy components into repo), but must be declared in the UI System section of `AGENTS.md`.
