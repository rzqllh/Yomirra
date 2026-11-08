# EXECUTION_GUARD.md

Rules for every executor agent (Gemini / Codex). Read before any task.
Breaking a rule = the task is not done, even if the code works.

## 1. No guessing

- Every claim about code needs `path:line` and the literal snippet, taken from a command run in THIS session.
- Every number comes from a command. Paste the command and its raw output.
  If you could not run it, write `UNVERIFIED`. Never estimate. `~`, `N+`, "around", "typically" are banned.
- If `rg` / `Get-Content` does not find a file, symbol, token, or variant, it does not exist. Say so. Do not invent names, line numbers, counts, or test results.
- Never write PASS for something you did not run. Quote the command and exit code.
- Numbers that should add up must be shown adding up (A + B + C = total). If they do not, say so and do not mark the step done.
- After a context compaction: re-read the task prompt, this file, and `git status` before doing anything. Do not continue from the summary.

## 2. No scope creep

- Do only the steps in the current prompt. No "while I'm here".
- Anything else you notice goes under **Found, not touched**. Do not fix it.
- Values come from the locked contract (`docs/audit/DESIGN_CONTRACT_AUDIT.md`). Never invent, rename, or renumber a token.
  If a token you need is missing or two docs disagree, STOP and put it under **Needs decision**.
- Do not delete a symbol, variant, class, or file without pasted `rg` proof of 0 consumers.
  Search dynamic strings, `cn()` / template literals, `buttonVariants()`, variant maps (e.g. IconButton), tests, and docs.
- Variants the owner has named as planned (e.g. `washi`) are kept even at 0 consumers.

## 3. No untracked work

- Start: `git status --short` must be clean. If not, report and stop.
- No scratch files in the repo. Temp scripts go in `$env:TEMP` and are deleted afterwards.
- After each step: run `git diff --stat` and the ratchet (`node scripts/check-design-tokens.mjs`), paste both, and append an entry to the project EXECUTION_LOG (`docs/revamp/EXECUTION_LOG.md`): step id, files, reason, before/after counts, commands with exit codes.
- End: `git status --short` must list only files named in the log. Any `??` or unlisted file is a violation.
- Do not commit unless the prompt says so.
- A failed command is reported with its error. Do not retry silently. Do not "fix" a failure by weakening a test, the ratchet, or the baseline.
- The ratchet baseline only goes down, and only in a step that says so.

## 4. Report format (always this, nothing else)

1. Done: step ids
2. Evidence: command -> result
3. Files changed: `git diff --stat`
4. Found, not touched
5. UNVERIFIED
6. Needs decision
