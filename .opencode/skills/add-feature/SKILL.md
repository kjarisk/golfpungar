---
name: add-feature
description: Scaffold a new feature slice following the project architecture conventions
---

## What I do

Create a new feature slice under `src/features/<name>/` with the correct directory structure and boilerplate files.

## Steps

1. Confirm the feature name matches a bullet in `docs/outline.md`. If it does not, STOP and ask.
2. Create the feature directory: `src/features/<name>/`
3. Create the following files inside it:

### `types.ts`

```ts
// Types for the <name> feature
export interface Example {
  id: string
}
```

### `index.ts`

```ts
// Public API for the <name> feature
// Re-export components, hooks, and types that other features can use
```

### `components/` directory

- Create directory with a `.gitkeep` or an initial component file if the feature name suggests one.

### `api/` directory

- Create directory with a starter query hook file:

```ts
// src/features/<name>/api/use-<name>-query.ts
import { useQuery } from '@tanstack/react-query'

export function use<Name>Query() {
  return useQuery({
    queryKey: ['<name>'],
    queryFn: async () => {
      // TODO: implement fetch
      return []
    },
  })
}
```

### `state/` directory (only if needed)

- Only create if the feature requires client-side UI state beyond server state.
- If created, use Zustand:

```ts
// src/features/<name>/state/<name>-store.ts
import { create } from 'zustand'

interface <Name>State {
  // TODO: define state
}

export const use<Name>Store = create<<Name>State>()(() => ({
  // TODO: initial state
}))
```

4. After scaffolding, suggest the developer fill in `types.ts` first, then build the API hook, then the components.

## Rules

- Follow naming conventions from AGENTS.md: PascalCase for components, useXxx for hooks, kebab-case for files.
- Do NOT add the feature to the router unless explicitly asked.
- Do NOT install new dependencies unless the feature requires it (ask first).
- Update `docs/plan.md` to reflect the new feature slice if it is not already listed.
