# F06 — Chapter picker and Comic detail flow

**Classification:** PROPOSAL / NOT APPROVED FOR CODE CHANGES

**Scope:** CHAPTER / DETAIL

**Linked issues:** CHP-01, CHP-02, CHP-03, DET-01, DET-03, DET-04, CHP-10, DET-07

**Current evidence:** Screenshot-linked observations in `03_ISSUE_TRACKER/ISSUES_FULL.md` and exact locators in `02_PAGE_MAPS/`. No source file paths established.

**Goal:** Preserve grid where useful; clarify current chapter, sort, unread/last-read, chapter list and detail actions.

**Prerequisites:** F00, F01, F02; OWNER: chapter indicators if ambiguous

**Investigation steps (read only first):**
1. Use issue ID and screenshot manifest; open crop then full original.
2. Search repository using visible exact UI copy or screen route; record actual file and exported component/function.
3. Identify if issue is a shared primitive/root cause or per-page usage. Build affected-page list.
4. Reproduce with initial viewport and state; record observations and non-observations.
5. Show owner the minimal behavior-preserving fix plan; request explicit approval before modifications.

**Execution after approval:** change smallest shared cause with local exceptions only if justified, preserve existing visual identity, no new dependency without owner consent.

**Expected deliverable:** Chapter selection task flow and detail-page state map

**Closure gate:** Find current, jump safely, return; action meanings unambiguous.

**QA:** use related entries in `06_QA/TEST_MATRIX.csv`; provide screenshot before/after and actual test reports; mark blocked tests honestly.

**Handoff:** source path, initial defect reproduction, files changed, behavioral effect, tests run, remaining risks and requested decisions.
