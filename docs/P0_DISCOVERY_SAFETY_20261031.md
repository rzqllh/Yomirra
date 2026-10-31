# P0 discovery safety and MangaDex reading

Owner authorized priority-based implementation on 31 October 2026, with explicit approval required for destructive or dangerous operations. This tranche changes request handling and presentation; it does not migrate saved data, change Firebase schema, or release production.

Safe content is the request default for discovery and direct detail/Reader entry points. Cache scopes separate content policy, languages and image quality. MangaDex uses content ratings instead of treating the entire mixed catalog as adult-only. The existing explicit opt-in remains available; old saved records are not bulk-reclassified.

The MangaDex adapter preserves rating evidence, paginates the chapter feed, respects language preference, separates volumes and unnumbered specials, rejects external-only/unreadable chapters, and verifies chapter parent identity before image retrieval. Short-lived image delivery URLs use a separate five-minute cache without stale-on-error revival. The signed image proxy and outbound security boundaries are unchanged.

Search and related-title responses apply source/content eligibility. Unknown legacy MangaDex records are excluded from safe related-title output without deleting them. User cancellations and restricted/missing content do not count as provider outages. An empty chapter list no longer emits a misleading parser-incident notification.

## Verification

- Local application snapshot: `16dbf24` (the documentation/workflow follow-up does not alter application behavior).
- TypeScript: passed with the repository's installed compiler.
- Full Vitest run: **224 files, 1,538 tests passed**.
- Production build: passed with the same dummy image-proxy secret used by CI; no production credentials were used.
- Lint: see exact-head CI; local lint emits existing warnings that are not represented as a warning-free codebase.
- Browser engine installation: blocked by an invalid downloaded archive; no browser PASS is claimed by this tranche.
- Live MangaDex catalog → chapters → image decode, physical iPhone/iPad, Firebase staging and production parity: **not verified**.

The fixtures establish behavior under controlled responses. They do not establish that the upstream provider or deployed network currently works. Existing Reader and reliability changes from the preview baseline remain intact.
