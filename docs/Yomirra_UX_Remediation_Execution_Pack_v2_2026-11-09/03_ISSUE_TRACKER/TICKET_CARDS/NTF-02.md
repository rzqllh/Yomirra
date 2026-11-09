# NTF-02 — Global overlays / AccountPopover

**Priority:** P2 | **Evidence:** VISUAL_OR_OWNER_CONFIRMED | **Track:** F02

**Locate:** Global overlays → AccountPopover → `account information, menu items, logout`

**Original screenshot:** 09_VISUAL_EVIDENCE/screenshots/IMG_3779.jpeg
**Focus region:** 09_VISUAL_EVIDENCE/focus_regions/E18_account_menu.jpg

**Observation:** Profile popover memuat tema/sumber/pengaturan/help/logout; density dan fokus menu berbeda dari dropdown lain: .

**Proposed fix direction (unapproved):** Satukan popover family, pemisahan destructive logout, dan visible focus.

## Required agent actions (one ticket per context)
- [ ] Open original and crop, verify symptom actually visible.
- [ ] Find **real** route/component and source path; record it. Names in this card are conceptual.
- [ ] Reproduce in app if possible; separate visual observation from code-proven cause.
- [ ] List every other page using the same shared primitive.
- [ ] Propose smallest **systemic, behavior-preserving** fix. Obtain owner authorization before modifying.
- [ ] After approval, capture matching before/after states and execute linked QA tests.
- [ ] Update tracker with evidence, status and any remaining open owner question.

**Current state:** BACKLOG_UNVALIDATED / NOT_APPROVED / UNRUN.
