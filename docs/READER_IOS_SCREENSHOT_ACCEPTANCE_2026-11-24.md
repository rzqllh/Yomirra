# iOS Reader/Library screenshot acceptance — 24 November 2026

This ledger captures the nine owner-provided iPhone screenshots (24 Nov follow-up to the 23 Nov audit). It distinguishes code coverage from observed real-device behavior; physical iPhone acceptance is explicitly excluded from this integration.

| Evidence | Observable defect | Acceptance contract | Intended regression coverage |
|---|---|---|---|
| 01: Dark Reader, chapter end | Header and bottom dock contrast collapse; large empty gap | Independent readable Reader chrome in dark mode; no extra empty viewport after chapter-end card | `reader-shell.test.tsx`, `continuous-vertical-reader.tsx`, Playwright browser smoke |
| 02: Dark Reader, 73% scroll | Header labels and progress text nearly invisible over content | All chrome foregrounds remain legible on image backgrounds; source content and saved scroll are preserved | `reader-shell.test.tsx`, `reader-page-scrubber.tsx` |
| 03: Settings drawer, light | Settings ownership/scope and segmented values need clarity | Explicit all-comics versus this-title scope; light styling matches rendered Reader, no silent global preference change | `reader-settings-drawer.test.tsx` |
| 04: Resume banner | Resume copy is verbose and visually prominent | Concise contextual message with saved image/page cursor unchanged | `reader-shell.test.tsx` |
| 05: Library, same title from two sources | Separate source cards show an ambiguous 1% while Reader shows 100% of a chapter | Never describe per-chapter progress as whole-series completion; dedupe only on verified common identity; keep source-specific cursors | `bookmark-page-view.test.tsx`, `reading-tab.test.tsx`, canonical E2E |
| 06: Bookmark saved toast | Inconsistent terminology and oversized notice | Short Library-aligned copy; action persists original bookmark | `reader-shell.test.tsx` |
| 07: Bookmark removed toast | Same inconsistent terminology | Short confirmation; no silent deletion of unrelated source history | `reader-shell.test.tsx` |
| 08: Light Reader, chapter end | Excessive vertical whitespace and large end card gap | Chapter-end card sits near last page with sane dock safe-area; no changes to completion predicates | `continuous-vertical-reader.tsx`, browser smoke |
| 09: Chapter metadata failure | Whole reader replaced by error despite already decoded pages | Retain available decoded pages; isolate offline, transport, and per-image errors; retry only failed image | `reader-image.test.tsx`, `api-client-boundary.test.ts`, browser smoke |

## Release and evidence rules

- Reader and Library UI changes are integrated from PR #160; verified-only canonical grouping and explicit preferred-source routing are integrated from PR #161. Shared files must preserve both sets of behavior.
- A false 100% series-progress claim must never be introduced. `Posisi baca` is a scroll position within the current chapter; source-specific chapter progress is separate from canonical work identity.
- A match by title, creator, or URL similarity alone never permits destructive cross-source merge. Confirmed provenance is required; historical chapter cursors remain per source.
- The merged code must pass typecheck, lint, unit/integration, production build and Playwright browser smoke at the **same merged commit**. Browser simulation is not a physical iPhone test.
- No database cleanup, tombstone rewrite, WAF loosening, or release-gate bypass is authorized. Real-device screenshot recapture is excluded by owner request.
- Until the merged commit has passed all automated checks and the preview can be inspected, these entries are **acceptance targets, not verified fixes**.
