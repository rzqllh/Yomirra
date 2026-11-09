# Proposed shared shell, dock, and overlay contract (NOT APPROVED)

## Global shell
1. Distinguish **content scroll viewport** from **floating bottom navigation**. Content must be scrollable until its last functional element is fully visible **above** the dock, including a comfortable gap. This is a global invariant on all routes using the dock.
2. Content reserve must account for the actual rendered dock height + platform safe area + contextual controls rather than a one-off magic margin chosen for a single screenshot. The implementation approach (CSS variable, spacer, inset, safe-area) is **to be selected after source inspection**.
3. Dock remains available while appropriate and may be hidden contextually (Reader, modal) only according to existing/approved behavior. Avoid moving tab labels or changing navigation IA without owner approval.
4. Test scrolling at top, middle, bottom, after accordion expansion, while landscape, after browser zoom and keyboard changes.

## Overlay orchestration
- Define semantic layer roles: system status bar, page content, sticky header, global dock, dropdown/menu, bottom sheet/dialog, toast, progress feedback. **Exact z-index numbers not specified here**; derive from actual layout system and accessibility.
- Prefer render overlay near its event context without covering navigation or search fields; for Reader, owner explicitly requires top toast to be offset lower than current behavior **without hiding active controls**. This does not automatically authorize moving every toast to bottom.
- Toast conveys **state**; it is not a modal. Non-actionable success feedback should be brief and unintrusive. Long explanatory content belongs near the related action/page or in an expanded notice, not giant toast blocks.
- Popover must remain within visible bounds; menus with many sources need max height, inner scrolling and reliable focus/selection.
- Scrollable notification list + independently visible footer: last item must be readable and actionable.
- Bottom sheet traps appropriate focus and scrolling only while open; dismiss via intended close gestures/buttons; return focus to trigger. Verify behavior before claiming that this exists.
- No popover/toast/reader layer should accidentally prevent essential controls from being used. If an exceptional modal **must** block, explain and provide clear dismissal.

## Typography and dense controls
- Minimum target area **proposed** ~44×44pt on iOS/touch, verify actual hitbox; visible glyph size may be smaller.
- Use consistent gutter and spacing tokens after reading existing design tokens; **do not impose new arbitrary palette/radius/scale**.
- Important selected option values must not truncate to meaningless `Semua Sum...`, `Terakhir Diup...`, `Sesuai Siste...`; use shorter label, stacked row, adaptable width, or a full-text disclosure.
- Preserve title identity: allow 2 lines where possible, and expose full title from detail, rather than using extremely long single-line truncation everywhere.
- Control labels must retain meaning under dynamic text scaling/zoom. Collapsed subtitles may truncate only where no critical info is lost.

## Acceptance
At matching viewport and target scroll limit, all content is reachable above dock; overlay is placed without obscuring the user task; screen-reader and touch navigation remain usable; both light/dark themes maintain readability. Screenshot alone is not proof of hitbox/accessibility success.
