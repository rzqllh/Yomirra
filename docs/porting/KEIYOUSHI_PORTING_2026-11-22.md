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

---

## Reconciliation Update (2026-11-22 Post-Audit)

### 1. Architecture Reconciliation (feat/keiyoushi-full-integration vs PR #157)
- **High-fidelity shared engines integrated:** Rather than relying on a naive monolithic HTML parser for 28 disparate sites, the 27 viable sources are now backed by specialized CMS engines:
  - `MangaThemesiaEngine` (11 sources)
  - `NatsuIdEngine` (5 sources)
  - `MadaraEngine` (1 source)
  - `GenericWpEngine` (7 sources)
  - Dedicated REST APIs (`AinzScansSource`, `AkumaSource`, `HentaiHandSource`) (3 sources)
- **Remaining 4 sources handled strictly:**
  - `KomikIndoID`: Aliased/deduplicated to canonical built-in `komikindo`.
  - `MANGA Plus by SHUEISHA`: Classified BLOCKED (Protobuf split-key DRM, non-free upstream).
  - `MangaToon (Limited)`: Classified BLOCKED (Coin paywall & proprietary app signature).
  - `Webcomics`: Classified BLOCKED (Mandatory mobile login token).
- **Public Safety Gate Maintained:** Built-in sources strictly remain at 9 in `sources` and `sourceMap`. All 27 ported sources remain disabled (`isEnabled: false`), in-dev (`status: "in-dev"`), and offline-download disabled (`capabilities.download: false`).

### 2. Live Verification Matrix (40 Sources)
- **Built-in Canonical (9):**
  - `komikindo`: 200 OK (1251ms) — VERIFIED
  - `komiku`: 200 OK (483ms) — VERIFIED
  - `komiku-ii`: 200 OK (283ms) — VERIFIED
  - `asurascans`: 200 OK (301ms) — VERIFIED
  - `shinigami`: 502 Bad Gateway (upstream temporary error) — PARTIAL
  - `mangadex`: network/DNS blocked in local sandbox — PARTIAL
  - `komiknesia`: 525 SSL Handshake Failed — BLOCKED (Upstream SSL)
  - `doujindesu`: fetch failed / domain rotated — BLOCKED
  - `westmanga`: 403 Cloudflare WAF — BLOCKED (Under Maintenance)
- **Ported Candidates (31):**
  - `manhwa-list`: 200 OK (1032ms) — **VERIFIED** (End-to-end getPopular 60 items -> getDetail Lookism -> getChapters 634 ch -> getPages 32 pages -> image download 200 OK image/jpeg verified).
  - `ainzscansid`: 200 OK (380ms) — PARTIAL (Host up, v3 endpoint requires path update).
  - `kiryuu`: 200 OK (1217ms) — PARTIAL (Host up, selector drift on catalog page).
  - `manhwa-indo`: 200 OK (659ms) — PARTIAL (Host up, selector drift on catalog page).
  - `cosmicscans`: 200 OK (303ms) — PARTIAL (Host up, catalog endpoint requires path update).
  - `astral-scans`: 200 OK (1537ms) — PARTIAL (Host up, NSFW safe-mode gate verified).
  - `dreamteams-scans`: 200 OK (804ms) — PARTIAL (Host up, NSFW safe-mode gate verified).
  - `izanamiscans`: 200 OK (2165ms) — PARTIAL (Host up).
  - `komikindoid`: DUPLICATE (aliased to komikindo).
  - `manga-plus-by-shueisha`: BLOCKED (DRM/Protobuf).
  - `mangatoon-limited`: BLOCKED (Coin paywall).
  - `webcomics`: BLOCKED (App login token).
  - `manhuarm`: BLOCKED (403 Cloudflare WAF).
  - 18 remaining NSFW/CMS sources (`akuma`, `crotpedia`, `dojing-net`, `doujinku`, `hentai-crot`, `hentaihand`, `kumapoi`, `mangasusu`, `manhwadesu`, `manhwaland-mom`, `mihentai`, `mikoroku`, `pix-hentai`, `ryukomik`, `sekte-doujin`, `shiro-doujin`, `soul-scans`, `tooncubus`): BLOCKED / NOT_TESTED (Domains unreachable or rotated, kept safe and disabled).

### 3. Automated Test Evidence
- **Typecheck:** `pnpm typecheck` (`tsc --noEmit`) -> Exit code 0, 0 errors.
- **ESLint:** `pnpm lint` -> Exit code 0, 0 errors.
- **Unit & Integration:** Vitest 11 test files passed, 52/52 tests passed.
- **Design Tokens Ratchet:** Scanned 456 production files -> 0 arbitrary bracket increases, PASSED.
- **Production Build:** `pnpm build` (`next build --webpack`) -> Exit code 0, all static & dynamic routes compiled.
- **Playwright E2E:** 6/6 tests passed (3 Chromium Mobile + 3 WebKit Mobile Safari).
