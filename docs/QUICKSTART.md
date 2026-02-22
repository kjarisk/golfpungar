# Quickstart

## From template

```bash
degit YOUR_USER/vibecoding-template my-app && cd my-app && npm i
```

## Commands

```bash
npm run dev            # localhost:5173
npm run test           # vitest watch
npm run build          # production
npm run lint           # eslint + prettier check
npm run lint:fix       # eslint + prettier auto-fix
npm run format         # prettier auto-format all files
npm run format:check   # prettier check (no write)
```

## Add features (optional)

```bash
# Router
npm i react-router-dom

# Forms
npm i react-hook-form zod @hookform/resolvers

# shadcn/ui components
npx shadcn@latest add <component>
```

## Path aliases

Use `@/` to import from `src/`:

```tsx
import { Button } from '@/components/ui/button'
```
