# Short Prompt To Copy Into Agent

Read the docs in `DOCS/yomirra-zero-base-uiux-rework/` and execute them as the source of truth.

Main task:

Perform a zero-base UI/UX and design language rework for Yomirra based on actual repository scanning, not screenshots alone.

Target identity:

**Premium iOS-native manga reader × cinematic editorial media app × Yomirra Deep Lagoon.**

Before coding:
1. Scan the repo file-by-file.
2. Produce an evidence map.
3. Identify existing shell/header/search/nav/card/page architecture.
4. Protect product logic and data contracts.
5. Propose exact files to modify.

Then implement in phases:
1. tokens and primitives
2. shell/nav/search/segmented controls
3. page identity rework
4. manga cards/detail/reader
5. PWA/image cache foundation
6. cleanup and verification

Do not make screenshot-only fixes.
Do not continue polishing the old Android-like structure.
Do not rewrite adapter/store/auth/reader logic unless required and reported.

Use the acceptance checklist before marking any phase done.
