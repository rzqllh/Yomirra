# F11 — Reader + global Settings semantics and destructive safety

**Classification:** PROPOSAL / NOT APPROVED FOR CODE CHANGES

**Scope:** SETTINGS

**Linked issues:** CHP-05, CHP-06, CHP-07, CHP-08, CHP-09, SET-02, SET-03, SET-04, SET-05, SET-06, SET-07, SET-08, SET-09

**Current evidence:** Screenshot-linked observations in `03_ISSUE_TRACKER/ISSUES_FULL.md` and exact locators in `02_PAGE_MAPS/`. No source file paths established.

**Goal:** Verify actual preference scope, data clearing and background behavior before edits; improve responsive SettingsRow and explanation.

**Prerequisites:** F00, F01, F03; OWNER: change to destructive/preference semantics

**Investigation steps (read only first):**
1. Use issue ID and screenshot manifest; open crop then full original.
2. Search repository using visible exact UI copy or screen route; record actual file and exported component/function.
3. Identify if issue is a shared primitive/root cause or per-page usage. Build affected-page list.
4. Reproduce with initial viewport and state; record observations and non-observations.
5. Show owner the minimal behavior-preserving fix plan; request explicit approval before modifications.

**Execution after approval:** change smallest shared cause with local exceptions only if justified, preserve existing visual identity, no new dependency without owner consent.

**Expected deliverable:** Settings behavior matrix, data safety tests in isolated test account, scoped copy

**Closure gate:** No silent scope changes or unintended deletion; state and consequences clear.

**QA:** use related entries in `06_QA/TEST_MATRIX.csv`; provide screenshot before/after and actual test reports; mark blocked tests honestly.

**Handoff:** source path, initial defect reproduction, files changed, behavioral effect, tests run, remaining risks and requested decisions.
