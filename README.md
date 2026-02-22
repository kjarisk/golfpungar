# Vibecoding Template (React + Vite)

This repo is designed for AI-assisted development with strong guardrails.

## Getting started

See [docs/QUICKSTART.md](docs/QUICKSTART.md) for setup and available commands.

## How to work

1. Update `/docs/outline.md` (scope) and `/docs/plan.md` (vertical slices).
2. Follow `AGENTS.md` strictly.
3. Implement one small task at a time.
4. Run tests + lint before every checkpoint commit.

## Tech

- React + Vite + TypeScript
- Tailwind CSS
- TanStack Query (server state)
- Zustand (client/UI state)
- shadcn/ui by default (Tailwind UI optional)
- Vitest + Testing Library for tests

## Docs

| File                 | Purpose                              |
| -------------------- | ------------------------------------ |
| `AGENTS.md`          | Agent rules — single source of truth |
| `docs/outline.md`    | Scope lock — what to build           |
| `docs/plan.md`       | Phased implementation plan           |
| `docs/decisions.md`  | Architecture decision log            |
| `docs/prompts.md`    | Reusable prompts for AI tools        |
| `docs/QUICKSTART.md` | Setup + commands                     |
| `docs/screenshots/`  | UI inspiration images                |
| `docs/moodboard/`    | Visual direction assets              |

## Rule of thumb

If it's not in `/docs/outline.md`, we don't build it.
