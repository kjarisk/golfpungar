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

## UI system choice (per project)

- Default: shadcn/ui
- Allowed alternative: Tailwind UI (copy components into repo), but must be declared in the UI System section of `AGENTS.md`.
