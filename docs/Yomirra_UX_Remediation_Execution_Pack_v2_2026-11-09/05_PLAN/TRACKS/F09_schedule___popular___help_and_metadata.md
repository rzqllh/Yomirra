# F09 — Schedule / Popular / Help and metadata clarity

**Classification:** PROPOSAL / NOT APPROVED FOR CODE CHANGES

**Scope:** CONTENT PAGES

**Linked issues:** SCH-01, SCH-02, SCH-03, POP-01, POP-02, POP-03, POP-04, HLP-01, SCH-05, POP-05

**Current evidence:** Screenshot-linked observations in `03_ISSUE_TRACKER/ISSUES_FULL.md` and exact locators in `02_PAGE_MAPS/`. No source file paths established.

**Goal:** Clarify predicted schedule, ranking source semantics, help instructions and card density; do not mutate external data.

**Prerequisites:** F01, F03; OWNER: semantics unknown

**Investigation steps (read only first):**
1. Use issue ID and screenshot manifest; open crop then full original.
2. Search repository using visible exact UI copy or screen route; record actual file and exported component/function.
3. Identify if issue is a shared primitive/root cause or per-page usage. Build affected-page list.
4. Reproduce with initial viewport and state; record observations and non-observations.
5. Show owner the minimal behavior-preserving fix plan; request explicit approval before modifications.

**Execution after approval:** change smallest shared cause with local exceptions only if justified, preserve existing visual identity, no new dependency without owner consent.

**Expected deliverable:** Copy and IA changes with data owner confirmation; task QA

**Closure gate:** Labels accurately describe provenance and tasks; content scrolls to end.

**QA:** use related entries in `06_QA/TEST_MATRIX.csv`; provide screenshot before/after and actual test reports; mark blocked tests honestly.

**Handoff:** source path, initial defect reproduction, files changed, behavioral effect, tests run, remaining risks and requested decisions.
