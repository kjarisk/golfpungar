# Quickstart -- Golfpungar

## Setup

```bash
git clone <repo-url> && cd golfpungar
npm install
npm run dev
```

App opens at `http://localhost:5173` with a test account (Kjartan) auto-logged in.

## Seed Demo Data

Click **"Seed Demo Data"** on the Feed page to populate:

- 3 rounds with scorecards
- ~85 side events (birdies, snakes, longest drives, etc.)
- 7 penalties
- 6 bets
- ~10 feed events

Click **"Clear Demo Data"** to reset.

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
src/lib/                # shared utils
docs/                   # outline, plan, decisions, CSV docs
```
