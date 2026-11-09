# F03 — Responsive layout / typography / component density

**Classification:** PROPOSAL / NOT APPROVED FOR CODE CHANGES

**Scope:** SHARED COMPONENTS

**Linked issues:** SYS-03, SYS-04, RDR-03, CHP-04, DET-02, DET-05, DET-06, LIB-02, SET-01, SYS-10, LIB-09, SET-10

**Current evidence:** Screenshot-linked observations in `03_ISSUE_TRACKER/ISSUES_FULL.md` and exact locators in `02_PAGE_MAPS/`. No source file paths established.

**Goal:** Find source of truncated labels and compressed rows. Enforce sensible constraints per component family, not universal padding changes.

**Prerequisites:** F00, F01

**Investigation steps (read only first):**
1. Use issue ID and screenshot manifest; open crop then full original.
2. Search repository using visible exact UI copy or screen route; record actual file and exported component/function.
3. Identify if issue is a shared primitive/root cause or per-page usage. Build affected-page list.
4. Reproduce with initial viewport and state; record observations and non-observations.
5. Show owner the minimal behavior-preserving fix plan; request explicit approval before modifications.

**Execution after approval:** change smallest shared cause with local exceptions only if justified, preserve existing visual identity, no new dependency without owner consent.

**Expected deliverable:** Typography/spacing proposal and changed component set; before/after at multiple widths

**Closure gate:** Critical controls never lose meaning; density balanced, no induced overflow.

**QA:** use related entries in `06_QA/TEST_MATRIX.csv`; provide screenshot before/after and actual test reports; mark blocked tests honestly.

**Handoff:** source path, initial defect reproduction, files changed, behavioral effect, tests run, remaining risks and requested decisions.
