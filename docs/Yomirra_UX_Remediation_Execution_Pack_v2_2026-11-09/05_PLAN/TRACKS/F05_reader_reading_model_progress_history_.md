# F05 — Reader reading model, progress, history and dock

**Classification:** PROPOSAL / NOT APPROVED FOR CODE CHANGES

**Scope:** READER

**Linked issues:** RDR-01, RDR-02, RDR-04, RDR-05, RDR-06, RDR-08, RDR-09, RDR-10, RDR-12

**Current evidence:** Screenshot-linked observations in `03_ISSUE_TRACKER/ISSUES_FULL.md` and exact locators in `02_PAGE_MAPS/`. No source file paths established.

**Goal:** Validate scroll-vs-image semantics, resume correctness and read-position stability; improve reader dock hierarchy without removing controls unapproved.

**Prerequisites:** F00, F01, F02; OWNER: mode / navigation decisions

**Investigation steps (read only first):**
1. Use issue ID and screenshot manifest; open crop then full original.
2. Search repository using visible exact UI copy or screen route; record actual file and exported component/function.
3. Identify if issue is a shared primitive/root cause or per-page usage. Build affected-page list.
4. Reproduce with initial viewport and state; record observations and non-observations.
5. Show owner the minimal behavior-preserving fix plan; request explicit approval before modifications.

**Execution after approval:** change smallest shared cause with local exceptions only if justified, preserve existing visual identity, no new dependency without owner consent.

**Expected deliverable:** Behavior truth table, reader UI change proposal, persistence QA proof

**Closure gate:** History resumes correctly; percent/image labels accurate; chapter skips unlikely.

**QA:** use related entries in `06_QA/TEST_MATRIX.csv`; provide screenshot before/after and actual test reports; mark blocked tests honestly.

**Handoff:** source path, initial defect reproduction, files changed, behavioral effect, tests run, remaining risks and requested decisions.
