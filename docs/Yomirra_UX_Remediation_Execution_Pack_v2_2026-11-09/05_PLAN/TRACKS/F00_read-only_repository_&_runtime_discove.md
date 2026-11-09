# F00 — Read-only repository & runtime discovery

**Classification:** PROPOSAL / NOT APPROVED FOR CODE CHANGES

**Scope:** SYSTEM / ALL

**Linked issues:** All (discovery)

**Current evidence:** Screenshot-linked observations in `03_ISSUE_TRACKER/ISSUES_FULL.md` and exact locators in `02_PAGE_MAPS/`. No source file paths established.

**Goal:** Locate app routes, UI primitives, CSS/token sources, router layout, state ownership and test commands. Verify screenshot against running build before any change.

**Prerequisites:** none

**Investigation steps (read only first):**
1. Use issue ID and screenshot manifest; open crop then full original.
2. Search repository using visible exact UI copy or screen route; record actual file and exported component/function.
3. Identify if issue is a shared primitive/root cause or per-page usage. Build affected-page list.
4. Reproduce with initial viewport and state; record observations and non-observations.
5. Show owner the minimal behavior-preserving fix plan; request explicit approval before modifications.

**Execution after approval:** change smallest shared cause with local exceptions only if justified, preserve existing visual identity, no new dependency without owner consent.

**Expected deliverable:** Repo path + evidence log + severity triage + explicit unknown list

**Closure gate:** No unauthorized writes, installs, API calls or changed data.

**QA:** use related entries in `06_QA/TEST_MATRIX.csv`; provide screenshot before/after and actual test reports; mark blocked tests honestly.

**Handoff:** source path, initial defect reproduction, files changed, behavioral effect, tests run, remaining risks and requested decisions.
