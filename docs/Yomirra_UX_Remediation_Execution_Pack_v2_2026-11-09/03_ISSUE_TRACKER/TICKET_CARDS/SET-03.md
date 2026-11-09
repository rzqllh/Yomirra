# SET-03 — App settings / AppSettings / KeepAwake

**Priority:** P1 | **Evidence:** REQUIRES_QA | **Track:** F11

**Locate:** App settings → AppSettings / KeepAwake → `screen wake lock during reading/downloading`

**Original screenshot:** 09_VISUAL_EVIDENCE/screenshots/IMG_3797(1).png
**Focus region:** 09_VISUAL_EVIDENCE/focus_regions/E30_settings_account.jpg

**Observation:** `Jaga layar tetap menyala saat mengunduh atau membaca chapter` bisa menahan layar saat tidak perlu atau menghabiskan baterai.

**Proposed fix direction (unapproved):** Verifikasi kapan wake lock aktif/dilepas; copy harus memaparkan scope.

## Required agent actions (one ticket per context)
- [ ] Open original and crop, verify symptom actually visible.
- [ ] Find **real** route/component and source path; record it. Names in this card are conceptual.
- [ ] Reproduce in app if possible; separate visual observation from code-proven cause.
- [ ] List every other page using the same shared primitive.
- [ ] Propose smallest **systemic, behavior-preserving** fix. Obtain owner authorization before modifying.
- [ ] After approval, capture matching before/after states and execute linked QA tests.
- [ ] Update tracker with evidence, status and any remaining open owner question.

**Current state:** BACKLOG_UNVALIDATED / NOT_APPROVED / UNRUN.
