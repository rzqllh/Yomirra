# F02 — Overlay system: toast, select, menu, sheet

**Classification:** PROPOSAL / NOT APPROVED FOR CODE CHANGES

**Scope:** SYSTEM / ALL

**Linked issues:** SYS-02, SYS-05, SYS-09, RDR-07, DSC-03, NTF-01, NTF-02, NTF-03, SYS-11, RDR-11, NTF-04

**Current evidence:** Screenshot-linked observations in `03_ISSUE_TRACKER/ISSUES_FULL.md` and exact locators in `02_PAGE_MAPS/`. No source file paths established.

**Goal:** Define stacking/viewport bounds, proper dismissal/focus and reader toast offset without blocking navigation; preserve current visual language.

**Prerequisites:** F00

**Investigation steps (read only first):**
1. Use issue ID and screenshot manifest; open crop then full original.
2. Search repository using visible exact UI copy or screen route; record actual file and exported component/function.
3. Identify if issue is a shared primitive/root cause or per-page usage. Build affected-page list.
4. Reproduce with initial viewport and state; record observations and non-observations.
5. Show owner the minimal behavior-preserving fix plan; request explicit approval before modifications.

**Execution after approval:** change smallest shared cause with local exceptions only if justified, preserve existing visual identity, no new dependency without owner consent.

**Expected deliverable:** Shared overlay behavior + tests across Reader, Explore, Library, Settings, notifications

**Closure gate:** Overlay never hides essential control or list footer; keyboard/VoiceOver navigation works.

**QA:** use related entries in `06_QA/TEST_MATRIX.csv`; provide screenshot before/after and actual test reports; mark blocked tests honestly.

**Handoff:** source path, initial defect reproduction, files changed, behavioral effect, tests run, remaining risks and requested decisions.
