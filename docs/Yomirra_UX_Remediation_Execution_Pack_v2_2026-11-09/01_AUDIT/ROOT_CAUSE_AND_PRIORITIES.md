# Diagnosis and prioritized root-cause hypotheses

**Objective:** repair how Yomirra works as a system while retaining its identity. This is not an order to rebuild pages. Prioritization is qualitative from screenshots, not from analytics or user-study data.

## P0 / discovery blockers (do before changing source)
1. Identify actual AppShell, global bottom dock, scroll container, popover/toast host, typography and design tokens. Current file paths are UNKNOWN.
2. Identify real semantics for chapter/page/image, source identity, reading history, saved titles, collection counts, schedule and ranking metrics. Current backend implementation is UNKNOWN.
3. Create reproducible baseline for 3 representative issues: dock overlap, reader toast collision, Library filter truncation. Capture viewport, scroll position, theme, screen, console and test status.

## P1 / systemic defects and potentially high-impact state risks
### R1 — Shell content obstruction
**Observed**: Dock overlays actions/text in Settings, Help, Detail, Home, Library, Schedule and Popular. **Hypothesis**: shared fixed dock vs content inset/scroll boundary contract missing or inconsistent; *not verified in code*. **Fix unit**: global layout shell + page exceptions + iOS safe area, not one-off bottom margins. **IDs** SYS-01, HOM-06, SCH-04, HLP-02, HLP-03, LIB-05, DET-05.

### R2 — Overlay layering and notification priority
**Observed & owner-confirmed**: reader toast blocks controls; global toast can cover UI; notification list is partially obscured by its own footer. **Hypothesis**: no shared hierarchy across header/popover/sheet/toast/dock, uncertain. **Fix unit**: semantic overlay positioning, stacking, focus, scrolling, viewport fit, dismissal. **IDs** SYS-02, SYS-05, SYS-09, SYS-11, RDR-07, RDR-11, NTF-01–04, DSC-03.

### R3 — Incompatible navigation semantics inside Reader
**Observed & confirmed**: same chevron visual used for different granularity; `Hal.` maps to asset index, % to scroll; chapter CTA visually overdominant. **Fix unit**: reader navigation semantics, hierarchy and accessibility with mode-specific copy. **IDs** RDR-01–05, RDR-10, CHP-01–03. **Product decision required** before any removal of functions or new reading modes.

### R4 — Integrity of read-position / history state
**NOT VERIFIED defect**: resume message and current image index differ in screenshots; history 0% vs other reader screenshot 3%. Timing / snapshot / image heights can explain it. **Fix unit only if reproduced**: state persistence and scroll-anchor restoration. **IDs** RDR-08, RDR-09, RDR-12, SCH-03, LIB-07.

### R5 — Destructive actions and preference scope
**Observed**: two broad wipe actions in settings, segmented per-title/global reader controls, option labels with unclear consequences. **Unknown**: guards, prompts, backend effects. **Fix unit**: inspect actual behavior before touching; product + security approval for anything changing data deletion or synchronization. **IDs** SET-05, CHP-08, SET-02–03, SET-08. No deletion test on owner's real data.

## P2 / consistency and clarity
### R6 — Component geometry and text resilience
**Observed**: filter label truncation, reader dock cramped, settings actions squeezed, option clipped, card text clipped. **Fix unit**: shared primitive responsive rules (flex min-width, wrap/clamp policy, adaptive stacked rows, padding); do not simply increase padding across every component. **IDs** SYS-03–04, CHP-04, SET-01, SET-10, LIB-02, HOM-03, POP-02.

### R7 — Component state semantics
**Observed**: bookmark, selected chapter, search/filter, popover, segmented controls and disabled controls use several styles. **Fix unit**: shared semantics for selected/saved/active/info/success/destructive/disabled, while preserving visual identity. **IDs** SYS-07, LIB-05, SET-06/09, NTF-03.

### R8 — Content model and local language
**Observed**: mixed Bab/Chapter/Hal./Gambar terminology, 'Progress', 'Progres halaman', 'Siap dibaca', 'Arah baca', technical help copy. **Fix unit**: product terminology dictionary based on real underlying behavior, avoid blanket replace. **IDs** RDR-02, CHP-05–07, HOM-04, SCH-02/05, POP-01, HLP-01.

### R9 — Page information architecture
**Observed**: navigation and card density can make primary action less prominent; some controls duplicate entry points without clear semantic distinction. **Fix unit**: page-specific hierarchy following approved tasks, not a sweeping redesign. **IDs** DET-01, HOM-02, DSC-01, LIB-03/04, POP-02, SCH-01.

## Things worth keeping
- Brand identity: red accents, round surfaces, visually rich comics and dark hero/reader variant.
- Contextual reader controls and immersive reading by tapping/scrolling.
- Clear active chapter 152 state within the chapter grid.
- Separation of history-read position and bookmarked title.
- MAL distinction and source attribution / snapshot context.
- Search and source filters as capabilities; improve affordance, don't delete without evidence.

## No fake scores
This package does NOT claim WCAG compliance/failure, performance regressions, design-token mismatches in code, wrong architecture, miscalculated percentages, or broken persistence. These need measured tests.
