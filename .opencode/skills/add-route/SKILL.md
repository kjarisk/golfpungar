---
name: add-route
description: Add React Router and configure a new route/page
---

## What I do

Help add routing to the project using React Router, or add a new route to an existing router setup.

## If React Router is NOT yet installed

1. Confirm with the user that routing is needed (it is listed as "optional, ask first" in the tech stack).
2. Install React Router:
   ```bash
   npm install react-router
   ```
3. Create the router configuration in `src/router.tsx`:

   ```tsx
   import { createBrowserRouter } from 'react-router'

   export const router = createBrowserRouter([
     {
       path: '/',
       // TODO: add layout wrapper
       children: [
         {
           index: true,
           lazy: () => import('./features/<first-feature>/components/<Page>'),
         },
       ],
     },
   ])
   ```

4. Update `src/main.tsx` to use `RouterProvider`:

   ```tsx
   import { RouterProvider } from 'react-router'
   import { router } from './router'

   // Replace <App /> with <RouterProvider router={router} />
   ```

5. Log this decision in `docs/decisions.md` with the date and reasoning.

## If React Router is already installed

1. Identify the router configuration file (likely `src/router.tsx`).
2. Add the new route entry using lazy loading:
   ```tsx
   {
     path: '/<route-name>',
     lazy: () => import('./features/<feature>/components/<Page>'),
   }
   ```
3. Create the page component inside the relevant feature slice at `src/features/<feature>/components/<Page>.tsx`.
4. Export a default `Component` from the page file for React Router lazy loading.

## Rules

- Always use lazy loading for route components to enable code splitting.
- Page components live inside their feature slice, not in a top-level `pages/` directory.
- Do NOT create a separate `src/pages/` directory. Pages are feature components.
- Update `docs/plan.md` if the new route represents a new flow.
