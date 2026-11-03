# Discovery/search implementation contract — 31 October 2026

Owner authorized execution by priority, with approval required before destructive or dangerous operations. This work is stacked on the P0 discovery safety change; it does not authorize a production release or a user-data migration.

## Navigation and compatibility

| UI | Existing route | Scope |
| --- | --- | --- |
| Jelajah | `/library` | Browse one selected eligible provider |
| Library | `/bookmark` | Saved personal titles, reading history and collections |
| Cari | `/search` | Discovery search with independent provider choices |
| Quick Search | Global dialog | Search Jelajah's resolved source; shortcut also works on Cari |
| Reader | `/manga/*/read/*` | Existing reading routes |

Labels, metadata, breadcrumbs, help text and manifest shortcut names follow this map. Technical Manga/Library contracts, storage keys, Firebase data and public URLs remain compatible. The existing PWA history-tab identifier risk R-19 remains a separate release gate.

## Source and search behavior

- Shared runtime eligibility and safe-content policy constrain every source set. Cari does not inherit the discovery selection or its opt-out list; system-disabled, unavailable or restricted providers remain ineligible.
- Jelajah's active source is remembered only in memory for client navigation. An explicit URL source wins. No new persisted preference or backup schema is introduced. On a fresh session, the first eligible source is the default.
- Quick Search resolves exactly that discovery scope. An unavailable remembered source produces an explanatory state; it never silently widens to other providers. The installed catalog currently selects one source, so no fictitious multi-source picker is introduced.
- Cari's source choices remain independently persisted. Explicit zero-source selection is allowed and stays zero. Opening Cari from the dialog transfers the query, not provider selection.
- Quick Search keys include query, resolved sources, safety and language. Requests consume AbortSignal; previous-source results are never presented as new-source results. The debounce is 180 ms for this overlay, separate from Reader persistence and Cari input timing.
- Provider failure, disabled selection, registry failure, loading and a successful empty result have separate messages. Retry is visible without being suppressed by the Cari command item.

## Interaction and layout

At >=1024 CSS px filters render as an integrated, collapsible nonmodal panel, initially collapsed so the catalog stays visible. The toolbar and applied filters remain visible. Smaller screens retain the buffered bottom sheet with Apply/Cancel/Reset. Applied filters have removable labels. Source changes reset provider-specific filters; collection/reading filters retain their local meaning. A source selection pushes a URL with page reset, while Back/Forward can restore the previous source/page. No-op page replacements must not cancel source navigation.

The Quick Search dialog is portaled, centered against visualViewport and bounded by viewport height and safe-area insets. Its CSS animation scales without adding a second centering translation. Focus, Escape, Arrow keys, Enter and trigger restoration use Radix/cmdk. Keyboard-visible viewport handling still needs physical iOS acceptance.

Chapter-list failure preserves valid title metadata, disables the reading action and offers retry. It is not rendered as healthy zero chapters. Cross-source chapter identity is never fabricated.

Populer uses `Lintas sumber` / `Populer lintas sumber`; the home ranking says `Populer di sumber`. These describe provider ranking input. No internal Yomirra traffic ranking or MAL identity integration has been fabricated.

## Verification and remaining gates

The fixture-backed actual-route suite covers source switch, Back/Forward page restoration, independent Cari selection, Quick Search keyboard/focus behavior, provider failure, and filter/dialog behavior at 320x568, 390x844, 820x1180, 1366x900 and 1920x1080. It checks `/library`, `/search`, `/bookmark` and `/settings` for horizontal overflow. These fixtures establish UI behavior, not live-provider or Firebase availability.

A live MangaDex search attempt in this environment returned HTTP 503 at the catalog boundary. Live chapter/image acceptance is therefore **NOT VERIFIED**. Automated adapter fixtures cover pagination, grouping, language, parent identity, safe rating and at-home image URLs; staging must still verify a real title -> chapters -> Reader -> image flow.

Release also requires staging deployment SHA verification, physical iPhone/iPad Safari/installed PWA checks, virtual keyboard/safe area, VoiceOver, zoom, touch, Firebase account switching/offline sync, and legacy backup/progress acceptance. R-01/R-10/R-11/R-13–R-19 remain a risk register, not claims of fixes in this PR. MAL access/terms, ambiguous identity mapping and the data threshold for an internal popularity ranking remain unresolved.
