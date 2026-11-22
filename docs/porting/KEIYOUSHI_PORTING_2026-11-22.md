# Keiyoushi -> Yomirra Porting (2026-11-22)

## Scope and provenance
Owner-provided `port-keiyoshi-ext.zip`: 40 standalone TypeScript source folders, `registry.json` and generator. The ZIP claims 40/40 verified, but does not include a runnable test suite, live-probe evidence or license provenance for its generated TypeScript.

Yomirra already has **9** matching built-ins: Shinigami, Komikindo, MangaDex, Komiku, Komiku II, Asura Scans, KomikNesia, Doujindesu and WestManga. **Do not replace or duplicate those.** KomikIndoID shares a domain with Komikindo and needs an additional identity review.

New candidate inventory: **31** (7 SFW, 6 MIXED, 18 NSFW), in `src/shared/sources/keiyoushi-candidates.ts`. The ZIP's category is a provisional source-level label, not item-level proof. MIXED is treated restricted until validated.

## Implementation status
- 31/31 candidate records in isolated `pendingSourceRegistry`. All `isEnabled: false` and `status: "in-dev"`. Pending records are excluded from active discovery and `getAllSourceMetadata()`.
- 28/28 HTML/NatsuId candidates have a **staged, generic HTML parser** using the existing SSRF-protected `HttpClient`, 10-second timeout, bounded response size and same-origin URL checks. It extracts metadata, search, chapter and pages from common selectors. Real upstream compatibility is **not yet established**.
- 3/3 dedicated API candidates (Ainz, MANGA Plus, MangaToon) have **staged protocol prototypes** based on ZIP response assumptions. They reject invalid IDs/schema drift. MANGA Plus protobuf/JSON compatibility, encrypted images and rights/availability remain **unverified**; MangaToon paid episodes are marked locked when indicated by API.
- Diagnostic-only `sourceManager.getSource(id, null, { allowDisabled: true })` may find staged sources. Normal user/API access does not resolve staged sources. The 9 live built-ins and existing sourceMap remain unchanged.
- Regression tests cover inventory, restricted default, HTML extraction, ts_reader JSON, unsafe URLs, API normalization, locks and schema drift.

## NOT verified / no-go for promotion
1. Upstream reachability and real live search/detail/chapter/reader parity for each of the 31 candidates.
2. Host/domain migrations, redirects, source terms, mature-content classification per manga, user rights and image restrictions.
3. Cache hit/miss and quantitative effect on Vercel Fluid CPU / Fast Origin Transfer.
4. End-to-end browser mobile and desktop smoke for a real chapter per source.

**Promotion gate:** validate fixture against current upstream; require all operations (popular, latest, search, detail, chapters, pages) or correctly mark unsupported; check image referer/format; confirm per-item restriction and paywall policy; pass CI + browser smoke; measure resource impact; then enable *one source at a time* via explicit owner approval. Do not automatically promote all 31.

## Branch cleanup note
As audited before starting: 13 old branches, plus one new porting branch. Open PR #150 is not merged; `feat/yomirra-restricted-sources-off-20261110` is also not proven merged. Squash-merged branches can appear diverged even when content is on main. Avoid deletion without patch-equivalence checks. GitHub connector does not expose deleting Git refs.

## Verification labels
Structural code and tests can be VERIFIED by CI. Any source that has not been exercised live remains **UNVERIFIED**, even if this PR is green. A green CI is **not** a 31-source production release sign-off.
