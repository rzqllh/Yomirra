# F07 — Home / Explore / Search information architecture

**Classification:** PROPOSAL / NOT APPROVED FOR CODE CHANGES

**Scope:** DISCOVERY

**Linked issues:** HOM-01, HOM-02, HOM-03, HOM-04, HOM-05, DSC-01, DSC-02, DSC-04, DSC-05, DSC-06

**Current evidence:** Screenshot-linked observations in `03_ISSUE_TRACKER/ISSUES_FULL.md` and exact locators in `02_PAGE_MAPS/`. No source file paths established.

**Goal:** Improve discoverability and filter cohesion, reduce confusing duplicate entry points only with reason; keep source filters.

**Prerequisites:** F01, F02, F03

**Investigation steps (read only first):**
1. Use issue ID and screenshot manifest; open crop then full original.
2. Search repository using visible exact UI copy or screen route; record actual file and exported component/function.
3. Identify if issue is a shared primitive/root cause or per-page usage. Build affected-page list.
4. Reproduce with initial viewport and state; record observations and non-observations.
5. Show owner the minimal behavior-preserving fix plan; request explicit approval before modifications.

**Execution after approval:** change smallest shared cause with local exceptions only if justified, preserve existing visual identity, no new dependency without owner consent.

**Expected deliverable:** Task flows: resume, explore, search and filter, see updates

**Closure gate:** No blocking overlays, truncation or unexpected filter reset.

**QA:** use related entries in `06_QA/TEST_MATRIX.csv`; provide screenshot before/after and actual test reports; mark blocked tests honestly.

**Handoff:** source path, initial defect reproduction, files changed, behavioral effect, tests run, remaining risks and requested decisions.
