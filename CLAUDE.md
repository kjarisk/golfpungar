# Agent Instructions – Golfpungar

Invite-only golf trip tournament app for 12–20 players. Manages rounds, points, side-competitions, penalties, and peer-to-peer bets with live leaderboards.

## Before writing any code

1. Read `docs/outline.md` — scope lock. Only build what is listed there.
2. Read `docs/plan.md` — phased implementation plan.
3. Check `docs/screenshots/` and `docs/moodboard/` for visual references. If empty, use your best judgment.

---

## Rules

### 1. Scope & Guardrails (NON-NEGOTIABLE)

- Do not add features not explicitly described in `docs/outline.md`.
- If a feature seems missing: STOP and ask "This is not in outline. Add it? (Yes/No)".
- Implement the single smallest next task only.
- Avoid big rewrites. Avoid multi-feature PRs.
- Before making changes, state which section + bullet in `docs/outline.md` this supports. If none → STOP and ask.
- Do not add libraries unless needed for the current task. Ask before adding any new dependency.

### 2. Tech Stack

**In use:**

- React 19 + Vite + TypeScript
- Tailwind CSS v4 (no `tailwind.config` — uses `@theme inline` in `src/index.css`)
- shadcn/ui components in `src/components/ui/`
- TanStack Query v5 for server state
- Zustand v5 for UI/client state
- React Router v7
- Sonner for toasts
- Vitest + Testing Library for tests

**React 19 patterns:**

- Use `use()` for async resources where appropriate
- Use `useOptimistic()` for optimistic UI
- Pass `ref` directly as a prop (no `forwardRef`)

**Not allowed without explicit approval:**

- Switching frameworks (no Next.js)
- Switching state approach (no Redux, MobX, etc.)
- Adding UI libraries besides shadcn/ui

### 3. UI System

- shadcn/ui components in `src/components/ui/`
- Tailwind CSS variables consistent with shadcn setup
- Prefer composing shadcn primitives over custom one-off UI
- Mobile-first: this app is used on-course on phones

### 4. Architecture & Structure

```
src/
  components/ui/        # shadcn/ui primitives (do not modify without reason)
  components/           # shared reusable UI
  features/<name>/      # feature slices:
    components/
    api/                # query hooks, request functions
    state/              # zustand store if needed
    types.ts
    index.ts
  hooks/                # shared custom hooks
  lib/                  # shared utilities
  test/                 # test setup
docs/
  outline.md            # scope lock — single source of truth
  plan.md               # phased implementation plan
  decisions.md          # architecture decision log
  prompts.md            # reusable prompts
  screenshots/          # UI inspiration
  moodboard/            # visual direction
```

**State boundaries:**

- TanStack Query: anything server-backed (fetching, caching, mutations)
- Zustand: UI state (dialogs, filters, selections) and non-server client state

**Data fetching:**

- No fetching directly in components. Use dedicated query hooks: `useXQuery`, `useYMutation`.

**Error/loading states:**

- Every data-driven UI must handle: loading, error, and empty state.

**Naming conventions:**

- Components: PascalCase
- Hooks: `useXxx`
- Files: kebab-case or PascalCase — be consistent within a feature

### 5. Quality

- Vitest + Testing Library. Prefer behavior-based tests. Critical flows should have tests.
- Interactive elements must be keyboard accessible. Inputs must have labels. Dialogs must manage focus.
- Run `npm run lint` and `npm run build` before checkpoint commits.
- Avoid unnecessary global state. Avoid re-fetching loops. Memoize only when needed.

### 6. Commits & Checkpoints

- Commit after each small, working improvement.
- Commit style: `chore:`, `feat:`, `fix:`, `refactor:`, `test:`
- Do not leave the repo in a failing state on main.
- Before commit: app runs locally, lint passes.

---

## Workflow

1. Read `docs/outline.md` and `docs/plan.md`.
2. Propose the next single smallest task.
3. Before coding: cite which exact bullet in the outline it supports.
4. If the task involves UI, check `docs/screenshots/` and `docs/moodboard/`.
5. Implement without adding features not in the outline.
6. After coding: run `npm run lint` and `npm run build` to verify.
7. Suggest a checkpoint commit message.
