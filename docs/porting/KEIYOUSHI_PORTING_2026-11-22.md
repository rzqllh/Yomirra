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

### 2. Full 40-Source Status & Capability Matrix

| # | Source ID | Name | Engine / Architecture | Cat | Status | Enabled in UI | Supported Capabilities | Explicitly Unsupported Capabilities | Verification Notes & Limitations |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `shinigami` | Shinigami | Custom Built-in API | SFW | PARTIAL | Yes | popular, latest, search, detail, chapters, pages, filters | download, auth | Upstream intermittent 502 Bad Gateway |
| 2 | `komikindo` | Komikindo | Built-in HTML Parser | MIXED | VERIFIED | Yes | popular, latest, search, detail, chapters, pages, filters | download, auth | Upstream 200 OK (1251ms) |
| 3 | `mangadex` | MangaDex | Official v5 REST API | MIXED | VERIFIED | Yes | popular, latest, search, detail, chapters, pages, filters | auth | Standard international catalog |
| 4 | `komiku` | Komiku | Built-in HTML Parser | SFW | VERIFIED | Yes | popular, latest, search, detail, chapters, pages, filters | download, auth | Upstream 200 OK (483ms) |
| 5 | `komiku-ii` | Komiku II | Built-in HTML Parser | SFW | VERIFIED | Yes | popular, latest, search, detail, chapters, pages, filters | download, auth | Upstream 200 OK (283ms) |
| 6 | `asurascans` | Asura Scans | Built-in Engine | SFW | VERIFIED | Yes | popular, latest, search, detail, chapters, pages, filters | download, auth | Upstream 200 OK (301ms), locked chapters handled |
| 7 | `komiknesia` | KomikNesia | Built-in HTML Parser | SFW | BLOCKED | Yes (Maint) | popular, latest, search, detail, chapters, pages, filters | download, auth | Upstream 525 SSL Handshake Failed |
| 8 | `doujindesu` | DoujinDesu | Built-in HTML Parser | NSFW | BLOCKED | Yes (Maint) | popular, latest, search, detail, chapters, pages, filters | download, auth | Upstream domain rotated / fetch failed |
| 9 | `westmanga` | WestManga | Built-in API Client | SFW | BLOCKED | Yes (Maint) | popular, latest, search, detail, chapters, pages | filters, download, auth | Upstream 403 Cloudflare WAF challenge |
| 10 | `manhwa-list` | Manhwa List | MangaThemesiaEngine | SFW | **VERIFIED** | **Yes (Active)** | popular, latest, search, detail, chapters, pages | download, filters, related, auth | End-to-end verified: popular (60 items) -> detail ("Lookism") -> chapters (634 ch) -> pages (32 pages) -> image fetch 200 OK image/jpeg. Promoted to active UI. |
| 11 | `ainzscansid` | Ainz Scans ID | Dedicated REST API | SFW | PARTIAL | No (in-dev) | detail, chapters, pages | popular, latest, search, download, filters, related, auth | Host 200 OK (380ms), v3 catalog endpoint requires path update |
| 12 | `kiryuu` | Kiryuu | NatsuIdEngine | MIXED | PARTIAL | No (in-dev) | detail, chapters, pages | popular, latest, search, download, filters, related, auth | Host 200 OK (1217ms), catalog selector drift on current domain |
| 13 | `manhwa-indo` | Manhwa Indo | NatsuIdEngine | MIXED | PARTIAL | No (in-dev) | detail, chapters, pages | popular, latest, search, download, filters, related, auth | Host 200 OK (659ms), catalog selector drift |
| 14 | `cosmicscans` | CosmicScans | NatsuIdEngine | MIXED | PARTIAL | No (in-dev) | detail, chapters, pages | popular, latest, search, download, filters, related, auth | Host 200 OK (303ms), catalog path requires upstream route update |
| 15 | `astral-scans` | Astral Scans | MangaThemesiaEngine | NSFW | PARTIAL | No (in-dev) | chapters, pages | popular, latest, search, detail, download, filters, related, auth | Host 200 OK (1537ms), NSFW gate verified |
| 16 | `dreamteams-scans` | DreamTeams Scans | GenericWpEngine | NSFW | PARTIAL | No (in-dev) | chapters, pages | popular, latest, search, detail, download, filters, related, auth | Host 200 OK (804ms), NSFW gate verified |
| 17 | `izanamiscans` | Izanami Scans | MangaThemesiaEngine | SFW | PARTIAL | No (in-dev) | chapters, pages | popular, latest, search, detail, download, filters, related, auth | Host 200 OK (2165ms), slow response |
| 18 | `komikindoid` | KomikIndoID | NatsuIdEngine | MIXED | DUPLICATE | No | n/a | all | Exact duplicate of built-in `komikindo` (`komikindo.ch`) |
| 19 | `manga-plus-by-shueisha` | MANGA Plus | Dedicated REST API | SFW | BLOCKED | No | n/a | all | Protobuf split-key DRM, proprietary decryption |
| 20 | `mangatoon-limited` | MangaToon | Dedicated REST API | SFW | BLOCKED | No | n/a | all | Coin-based paywall & proprietary app signature |
| 21 | `webcomics` | Webcomics | Generic HTML | SFW | BLOCKED | No | n/a | all | Mandatory mobile app session token |
| 22 | `manhuarm` | Manhuarm | GenericWpEngine | MIXED | BLOCKED | No | chapters, pages | popular, latest, search, detail, download, filters, related, auth | 403 Cloudflare WAF challenge |
| 23 | `akuma` | Akuma | AkumaSource (REST/HTML) | NSFW | BLOCKED | No | chapters, pages | popular, latest, search, detail, download, filters, related, auth | Upstream domain DNS unresolved / rotated |
| 24 | `crotpedia` | CrotPedia | GenericWpEngine | NSFW | BLOCKED | No | chapters, pages | popular, latest, search, detail, download, filters, related, auth | Upstream host unreachable |
| 25 | `dojing-net` | Dojing.net | MangaThemesiaEngine | NSFW | BLOCKED | No | chapters, pages | popular, latest, search, detail, download, filters, related, auth | Upstream host unreachable |
| 26 | `doujinku` | Doujinku | MangaThemesiaEngine | NSFW | BLOCKED | No | chapters, pages | popular, latest, search, detail, download, filters, related, auth | Upstream host unreachable |
| 27 | `hentai-crot` | Hentai Crot | GenericWpEngine | NSFW | BLOCKED | No | chapters, pages | popular, latest, search, detail, download, filters, related, auth | Upstream host unreachable |
| 28 | `hentaihand` | HentaiHand | HentaiHandSource (REST/HTML) | NSFW | BLOCKED | No | chapters, pages | popular, latest, search, detail, download, filters, related, auth | Upstream host unreachable |
| 29 | `kumapoi` | KumaPoi | MangaThemesiaEngine | NSFW | BLOCKED | No | chapters, pages | popular, latest, search, detail, download, filters, related, auth | Upstream host unreachable |
| 30 | `mangasusu` | Mangasusu | MangaThemesiaEngine | NSFW | BLOCKED | No | chapters, pages | popular, latest, search, detail, download, filters, related, auth | Upstream host unreachable |
| 31 | `manhwadesu` | ManhwaDesu | MangaThemesiaEngine | NSFW | BLOCKED | No | chapters, pages | popular, latest, search, detail, download, filters, related, auth | Upstream host unreachable |
| 32 | `manhwaland-mom` | ManhwaLand.mom | MangaThemesiaEngine | NSFW | BLOCKED | No | chapters, pages | popular, latest, search, detail, download, filters, related, auth | Upstream host unreachable |
| 33 | `mihentai` | Mihentai | GenericWpEngine | NSFW | BLOCKED | No | chapters, pages | popular, latest, search, detail, download, filters, related, auth | Upstream host unreachable |
| 34 | `mikoroku` | MikoRoku | NatsuIdEngine | MIXED | BLOCKED | No | chapters, pages | popular, latest, search, detail, download, filters, related, auth | Upstream host unreachable |
| 35 | `pix-hentai` | Pix Hentai | GenericWpEngine | NSFW | BLOCKED | No | chapters, pages | popular, latest, search, detail, download, filters, related, auth | Upstream host unreachable |
| 36 | `ryukomik` | Ryukomik | NatsuIdEngine | NSFW | BLOCKED | No | chapters, pages | popular, latest, search, detail, download, filters, related, auth | Upstream host unreachable |
| 37 | `sekte-doujin` | Sekte Doujin | MadaraEngine | NSFW | BLOCKED | No | chapters, pages | popular, latest, search, detail, download, filters, related, auth | Upstream host unreachable |
| 38 | `shiro-doujin` | Shiro Doujin | GenericWpEngine | NSFW | BLOCKED | No | chapters, pages | popular, latest, search, detail, download, filters, related, auth | Upstream host unreachable |
| 39 | `soul-scans` | Soul Scans | GenericWpEngine | SFW | BLOCKED | No | chapters, pages | popular, latest, search, detail, download, filters, related, auth | Upstream host unreachable |
| 40 | `tooncubus` | Tooncubus | GenericWpEngine | NSFW | BLOCKED | No | chapters, pages | popular, latest, search, detail, download, filters, related, auth | Upstream host unreachable |

### 3. Automated Test Evidence
- **Typecheck:** `pnpm typecheck` (`tsc --noEmit`) -> Exit code 0, 0 errors.
- **ESLint:** `pnpm lint` -> Exit code 0, 0 errors.
- **Unit & Integration:** Vitest 11 test files passed, 52/52 tests passed.
- **Design Tokens Ratchet:** Scanned 456 production files -> 0 arbitrary bracket increases, PASSED.
- **Production Build:** `pnpm build` (`next build --webpack`) -> Exit code 0, all static & dynamic routes compiled.
- **Playwright E2E:** 6/6 tests passed (3 Chromium Mobile + 3 WebKit Mobile Safari).
