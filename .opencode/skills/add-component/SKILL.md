---
name: add-component
description: Add a new shadcn/ui component or create a custom reusable component
---

## What I do

Help add UI components to the project, either from shadcn/ui or as custom reusable components.

## For shadcn/ui components

1. Check if the component already exists in `src/components/ui/`.
2. If not, install it using the shadcn CLI:
   ```bash
   npx shadcn@latest add <component-name>
   ```
3. Verify the component was added to `src/components/ui/<component-name>.tsx`.
4. Do NOT modify the generated shadcn component unless there is a specific reason documented in `docs/decisions.md`.

### Common shadcn components to consider

- `accordion`, `alert`, `avatar`, `badge`, `breadcrumb`
- `calendar`, `checkbox`, `collapsible`, `command`, `context-menu`
- `data-table`, `date-picker`, `form`, `hover-card`
- `label`, `menubar`, `navigation-menu`, `pagination`, `popover`
- `progress`, `radio-group`, `scroll-area`, `select`, `separator`
- `sheet`, `skeleton`, `slider`, `switch`, `table`, `tabs`
- `textarea`, `toast`, `toggle`, `tooltip`

## For custom reusable components

1. Create the component in `src/components/` (NOT in `src/components/ui/` -- that is reserved for shadcn).
2. Follow this structure:
   ```
   src/components/
     MyComponent.tsx        # Component implementation
     MyComponent.test.tsx   # Tests (if non-trivial)
   ```
3. Use shadcn primitives as building blocks where possible (Button, Card, Dialog, etc.).
4. Use the `cn()` utility from `@/lib/utils` for conditional class merging.
5. Make the component accept reasonable props with TypeScript interfaces.
6. Ensure keyboard accessibility: focusable elements, proper aria attributes, label associations.

## Rules

- Prefer composing existing shadcn primitives over building custom UI from scratch.
- Use Tailwind classes consistent with the project theme (CSS variables from `src/index.css`).
- Do NOT install new UI libraries without asking first.
- If the component is feature-specific, it belongs in `src/features/<feature>/components/`, not in `src/components/`.
