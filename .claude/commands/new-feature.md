---
description: Scaffold a new feature slice under src/features/<name>
---

Scaffold a new feature slice for the feature name provided in the argument (e.g. `/new-feature betting`).

Create the following structure under `src/features/<name>/`:
- `components/` (empty dir — add a `.gitkeep` if needed)
- `api/` (empty dir)
- `state/` (empty dir)
- `types.ts` (empty — add a comment: `// Types for the <name> feature`)
- `index.ts` (barrel export — export everything from components, api, state, types)

Before scaffolding: confirm the feature name maps to a section in `docs/outline.md`. If it doesn't, stop and ask.
