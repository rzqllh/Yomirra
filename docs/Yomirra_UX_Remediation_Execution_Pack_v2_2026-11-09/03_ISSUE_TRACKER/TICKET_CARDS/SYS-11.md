# SYS-11 — Shared shell / BottomDock / ExpandedOverlay

**Priority:** P1 | **Evidence:** REQUIRES_QA | **Track:** F02

**Locate:** Shared shell → BottomDock / ExpandedOverlay → `raised overlay above bottom nav`

**Original screenshot:** 09_VISUAL_EVIDENCE/screenshots/IMG_3778.jpeg, 09_VISUAL_EVIDENCE/screenshots/IMG_3779.jpeg, 09_VISUAL_EVIDENCE/screenshots/IMG_3782.jpeg, 09_VISUAL_EVIDENCE/screenshots/IMG_3802.png
**Focus region:** 09_VISUAL_EVIDENCE/focus_regions/E17_notification_list.jpg, 09_VISUAL_EVIDENCE/focus_regions/E18_account_menu.jpg, 09_VISUAL_EVIDENCE/focus_regions/E21_library_source_menu.jpg, 09_VISUAL_EVIDENCE/focus_regions/E34_settings_toast.jpg

**Observation:** Screenshots show overlay layers share the same screen; event capture and z-order have not been tested.

**Proposed fix direction (unapproved):** QA overlay stack: dock below active modal, pointer/focus confined where appropriate, background scroll contract.

## Required agent actions (one ticket per context)
- [ ] Open original and crop, verify symptom actually visible.
- [ ] Find **real** route/component and source path; record it. Names in this card are conceptual.
- [ ] Reproduce in app if possible; separate visual observation from code-proven cause.
- [ ] List every other page using the same shared primitive.
- [ ] Propose smallest **systemic, behavior-preserving** fix. Obtain owner authorization before modifying.
- [ ] After approval, capture matching before/after states and execute linked QA tests.
- [ ] Update tracker with evidence, status and any remaining open owner question.

**Current state:** BACKLOG_UNVALIDATED / NOT_APPROVED / UNRUN.
