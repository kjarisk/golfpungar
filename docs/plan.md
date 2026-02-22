# Plan (Vertical Slices)

## Principles
- Build in end-to-end slices (UI → state → API/data → tests).
- Keep tasks small; each task should be doable in ~15–60 minutes.
- After each task: run tests + commit a checkpoint.

---

## Phase 0 — Project foundation
- [ ] Scaffold React + Vite + TS + Tailwind
- [ ] Add routing (if needed)
- [ ] Add TanStack Query + Zustand baseline setup
- [ ] Add shadcn/ui baseline components + theme tokens
- [ ] Add lint + format + test baseline
- [ ] Create first screen skeletons (no real data yet)

## Phase 1 — First “happy path” end-to-end
- [ ] Implement Flow 1 (happy path)
- [ ] Add loading + error states
- [ ] Add tests for Flow 1
- [ ] Commit stable slice

## Phase 2 — Expand core flows
- [ ] Implement Flow 2 + tests
- [ ] Implement Flow 3 + tests
- [ ] Implement Flow 4 + tests

## Phase 3 — Polish + hardening
- [ ] Accessibility pass (keyboard/focus, labels)
- [ ] Performance quick pass (avoid unnecessary rerenders)
- [ ] UX polish (empty states, toasts)
- [ ] Final cleanup + docs
