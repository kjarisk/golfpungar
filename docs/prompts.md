# Prompt Pack (Reusable)

These are prompts you paste into your AI tool (OpenCode, Claude Code, etc.).

## 0) Project boot prompt

"Read /docs/outline.md, /docs/plan.md, and AGENTS.md.
Summarize the goal in 1 sentence.
Then propose the next _single smallest task_ to implement (max 10 lines).
Do NOT add features not in outline. If something is missing, ask."

## 1) Task execution prompt

"Implement ONLY this task: <task>.
Before coding: tell me which exact bullet in /docs/outline.md it supports.
After coding: provide commands to run tests and lint.
Do not change unrelated files."

## 2) Code review prompt

"Review the diff for correctness, simplicity, and scope.
Flag anything that violates AGENTS.md or adds unrequested functionality.
Suggest the smallest fix set."

## 3) Test generation prompt

"Generate tests for the feature we just added.
Use Vitest + Testing Library.
Prefer testing behavior over implementation details."

## 4) Refactor prompt (guarded)

"Refactor only for readability and consistency with the Architecture section of AGENTS.md.
No new features. No new dependencies without asking."
