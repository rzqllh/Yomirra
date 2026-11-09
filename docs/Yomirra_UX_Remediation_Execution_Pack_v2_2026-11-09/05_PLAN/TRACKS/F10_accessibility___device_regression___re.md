# F10 — Accessibility / device regression / release QA

**Classification:** PROPOSAL / NOT APPROVED FOR CODE CHANGES

**Scope:** ALL

**Linked issues:** SYS-08

**Current evidence:** Screenshot-linked observations in `03_ISSUE_TRACKER/ISSUES_FULL.md` and exact locators in `02_PAGE_MAPS/`. No source file paths established.

**Goal:** Use native/real target device and browser plus automated checks where available. Record test evidence; no asserted pass based on mock screenshot.

**Prerequisites:** All authorized changed tracks

**Investigation steps (read only first):**
1. Use issue ID and screenshot manifest; open crop then full original.
2. Search repository using visible exact UI copy or screen route; record actual file and exported component/function.
3. Identify if issue is a shared primitive/root cause or per-page usage. Build affected-page list.
4. Reproduce with initial viewport and state; record observations and non-observations.
5. Show owner the minimal behavior-preserving fix plan; request explicit approval before modifications.

**Execution after approval:** change smallest shared cause with local exceptions only if justified, preserve existing visual identity, no new dependency without owner consent.

**Expected deliverable:** Completed QA matrix, issues linked to failed cases, owner signoff

**Closure gate:** No P1 regressions, all changed paths verified; exceptions documented.

**QA:** use related entries in `06_QA/TEST_MATRIX.csv`; provide screenshot before/after and actual test reports; mark blocked tests honestly.

**Handoff:** source path, initial defect reproduction, files changed, behavioral effect, tests run, remaining risks and requested decisions.
