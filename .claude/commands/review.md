---
description: Review recent changes for quality, scope, and correctness
---

Review the current git diff (staged + unstaged) against the rules in `CLAUDE.md`.

Check for:
1. **Scope** — does every change map to a bullet in `docs/outline.md`? Flag anything that doesn't.
2. **Architecture** — are feature slices self-contained? Is state managed in the right layer (TanStack Query vs Zustand)?
3. **Quality** — loading/error/empty states covered? Keyboard accessibility? No unnecessary global state?
4. **Tests** — are critical flows covered?

Report findings as a short list. Suggest the smallest fix set for any issues found.
