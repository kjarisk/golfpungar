---
description: Type-check and build for production
---

Run `npm run build` to type-check with TypeScript and build for production with Vite.

If the build fails:

1. Separate TypeScript errors from Vite build errors.
2. For TypeScript errors: list each error with file, line, and the issue. Fix them one at a time starting with the simplest.
3. For Vite build errors: check for missing imports, circular dependencies, or asset issues.
4. After fixing, run `npm run build` again to confirm success.

If the build succeeds, report the output size summary.
