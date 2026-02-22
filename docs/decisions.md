# Decisions Log

Keep this short: what we decided, and why.

## Decisions

- 2026-02-07: Chose shadcn/ui as default UI layer for speed + consistency.
- 2026-02-07: State strategy = TanStack Query (server) + Zustand (UI/client).
- 2026-02-22: Added React Router for 5-tab bottom navigation (Feed, Enter, Leaderboards, Rounds, Players).
- 2026-02-22: Backend = Supabase (Auth magic links, Postgres, Storage for images, Realtime for live feed).
- 2026-02-22: Green accent theme inspired by moodboard (oklch green primary).
- 2026-02-22: Mock auth with test account during dev (auto-logged-in as "Kjartan"). Will swap for Supabase Auth later.

## UI system choice (per project)

- Default: shadcn/ui
- Allowed alternative: Tailwind UI (copy components into repo), but must be declared in the UI System section of `AGENTS.md`.
