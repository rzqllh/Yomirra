# NTF-01 — Global overlays / NotificationPopover

**Priority:** P2 | **Evidence:** VISUAL_OR_OWNER_CONFIRMED | **Track:** F02

**Locate:** Global overlays → NotificationPopover → `last row, scroll and footer`

**Original screenshot:** 09_VISUAL_EVIDENCE/screenshots/IMG_3778.jpeg
**Focus region:** 09_VISUAL_EVIDENCE/focus_regions/E17_notification_list.jpg

**Observation:** Notification popover besar menampilkan list dengan baris terbawah terpotong di balik footer `Tampilkan semua`: .

**Proposed fix direction (unapproved):** Buat scroll region yang jelas, footer fixed tanpa menutup item, semantics unread/new.

## Required agent actions (one ticket per context)
- [ ] Open original and crop, verify symptom actually visible.
- [ ] Find **real** route/component and source path; record it. Names in this card are conceptual.
- [ ] Reproduce in app if possible; separate visual observation from code-proven cause.
- [ ] List every other page using the same shared primitive.
- [ ] Propose smallest **systemic, behavior-preserving** fix. Obtain owner authorization before modifying.
- [ ] After approval, capture matching before/after states and execute linked QA tests.
- [ ] Update tracker with evidence, status and any remaining open owner question.

**Current state:** BACKLOG_UNVALIDATED / NOT_APPROVED / UNRUN.
