# F01 — Global shell / safe-area / fixed dock

**Classification:** PROPOSAL / NOT APPROVED FOR CODE CHANGES

**Scope:** SYSTEM / ALL

**Linked issues:** SYS-01, SCH-04, HLP-02, HOM-06, HLP-03

**Current evidence:** Screenshot-linked observations in `03_ISSUE_TRACKER/ISSUES_FULL.md` and exact locators in `02_PAGE_MAPS/`. No source file paths established.

**Goal:** Establish one content-clearance behavior for every route with floating dock, not ad hoc margins; include variable dock sizes and safe areas.

**Prerequisites:** F00

**Investigation steps (read only first):**
1. Use issue ID and screenshot manifest; open crop then full original.
2. Search repository using visible exact UI copy or screen route; record actual file and exported component/function.
3. Identify if issue is a shared primitive/root cause or per-page usage. Build affected-page list.
4. Reproduce with initial viewport and state; record observations and non-observations.
5. Show owner the minimal behavior-preserving fix plan; request explicit approval before modifications.

**Execution after approval:** change smallest shared cause with local exceptions only if justified, preserve existing visual identity, no new dependency without owner consent.

**Expected deliverable:** Shared fix proposal + affected routes + before/after + no-overlap tests

**Closure gate:** Content/action at scroll end always fully accessible.

**QA:** use related entries in `06_QA/TEST_MATRIX.csv`; provide screenshot before/after and actual test reports; mark blocked tests honestly.

**Handoff:** source path, initial defect reproduction, files changed, behavioral effect, tests run, remaining risks and requested decisions.
