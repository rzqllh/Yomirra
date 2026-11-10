# Yomirra — Daily-Tools Integration PRD, Source Adapter Plan and Acceptance Contract

> Version: 0.1 · Planned: 2026-11-10 Asia/Jakarta · Owner intent: nhentai = FULL target, 177-file Daily-Tools inventory reviewed.
>
> Evidence: Daily-Tools main ef0e7b52048a856dd39d2b75e11b11e6982e057e; Yomirra main 85b15079bb5799171d973257d87814366f337414 at inspection. No local checkout, third-party live API or runtime was verified in this research.
>
> State: DOCS-ONLY specification. Code work starts for AGY only AFTER safe remote/local reconciliation, permission checks and applicable approvals. Do not conflate this with the separately scoped 88-ticket UI/UX remediation.

## 1. Product goal and PRD

Add an opt-in, correctly classified restricted-source adapter for adult users and authorized content, based on nhentai gallery-ID metadata/page parsing, with a desired FULL Yomirra capability contract: popular, latest, text search, filters, detail, chapters and pages. A desired capability must stay NOT IMPLEMENTED / NOT VERIFIED until its endpoint and tests exist. Do not present full support based solely on an ID lookup.

Primary journeys: authorized adult opts in to restricted sources -> searches/browses eligible catalog -> sees accurate metadata and content rating -> views gallery detail -> opens its stable synthetic chapter -> reads images with correct ordering and referer -> returns to source/search/library. Without eligibility or verified policy, no restricted result, thumbnail, proxy content, offline cache or server query should be exposed. Preserve safe defaults and privacy.

Not goals: scraping prohibited or unauthorized content, bypassing site controls/DRM, bypassing age checks, unrestricted mirroring or search indexing, downloading complete third-party galleries into Yomirra servers, new AI/content-processing pipelines or reworking unrelated UX/88 tickets.

## 2. Existing contract, ownership and references

Use built-in TypeScript adapter, NOT an arbitrary dynamic manifest of raw HTML/JS. Required contract from src/shared/sources/source-types.ts: getPopular, getLatest, search, getDetail, getChapters, getPages, getFilters; metadata in source-registry.ts; registration in adapters/index.ts. Keep server-only adapter source URL and sensitive headers out of client. Existing DoujinDesu adapter may serve as pattern, not approval to inherit its access/credentials.

Yomirra currently has src/shared/sources/content-policy.ts, discovery-source-policy.ts, src/server/lib/security/outbound-policy.ts, src/app/api/proxy/image/route.ts, source health/errors, caching and browser reader. Preserve them: unknown is not automatically safe; opt-out default hides restricted content; server must independently enforce eligibility. Existing content preferences alone do NOT constitute age verification or legal authorization.

Source snapshot: https://github.com/KiyoEditz/Daily-Tools/blob/main/nhentai.js . Source uses a gallery-ID endpoint, HTML mirror fallbacks, gallery page URL construction and PDF writer. These are subject to upstream change. Do not reuse arbitrary mirror hosts without a separate approved inventory. Verify original source license/provenance before any verbatim copy.

## 3. Target functionality with actual gaps

| Capability | Daily-Tools evidence | Proposed Yomirra requirement / status |
| --- | --- | --- |
| Popular | Absent | Design endpoint, pagination, ranking provenance; BLOCKED until verified |
| Latest | Absent | Stable timestamp/sort and pagination; BLOCKED until verified |
| Search | Absent | Explicit query, pagination, optional filters and content restrictions; BLOCKED |
| Filters | Absent | Advertise only truly supported values, reject/enforce unsupported hard filters |
| Detail | ID lookup provided | Normalize source ID/title/cover/tags/page count/rating; fixture test |
| Chapters | No chapter model | Map one gallery to one synthetic chapter with stable gallery-scoped ID |
| Pages | Ordered gallery URLs provided | Validate count/type/order/host/response, server referer and proxy behavior |
| PDF | Present, writes file | Not necessary for reader; NO default bulk download or new PDF feature |

No full catalog/search implementation should be inferred from public endpoints not inspected. If upstream cannot lawfully serve full capabilities, report reduced scope and ask the owner rather than manufacture fake listings.

## 4. Proposed data mapping and architecture

- New server-only folder: src/server/lib/sources/adapters/nhentai/ with index.ts, parser/normalizer.ts, fixtures and focused tests as needed; use existing HttpClient/safeFetch and protection boundaries.
- Source registry: stable id = nhentai, isNsfw = true, isEnabled/isInstalled/status/capabilities reflect ACTUAL verified rollout; keep not-ready capabilities disabled/not advertised.
- MangaItem: stable gallery ID (not title or index), English/Japanese title alternatives, image cover, tag/genre, contentRating = pornographic where applicable, isNsfw = true; no false safe/unknown classification.
- MangaDetail: exact normalized title, description if known, genres, status = UNKNOWN unless established, source provenance. Never infer authors/language from UI labels.
- Chapter: ID derived from gallery ID, deterministic chapter number 1 and parent manga ID; one chapter per galley is a modeling decision requiring fixture proof. Do not use array index as ID.
- ChapterPages: index 0..N-1 with safe HTTPS image URLs, referer only where appropriate and allowed; no API token/cookie in page objects. URL validation applies at outbound fetch and proxy boundaries.
- Search result: MangaPageResult with hasNextPage sourced from real pagination; safe mode yields no restricted results server-side. Do not leak restricted titles through global search, recommendations, previews, rankings, or notifications.
- Filtering: keys genre[], format[], status, sort only when supported; if not enforceable, report unsupported, do not silently return broad matches.
- Download/offline: default no bulk downloader, avoid caching restricted images in generic public service worker/cache paths, prevent cross-account/stale preference leakage. Explicitly review existing offline classification/caching before any enablement.

## 5. Prioritized implementation backlog and acceptance

| ID | Requirement | Exit evidence |
| --- | --- | --- |
| YOM-DT-00 | Remote/local reconciliation and baseline | Exact remote/local SHAs, branch status, backup of untracked/dirty content, no discarded changes |
| YOM-DT-01 | Upstream rights, content eligibility and host review | Source rights/terms, legal distribution, age assurance requirements, prohibited-content controls verified; otherwise BLOCKED |
| YOM-DT-02 | Gallery detail normalization | Fixture ID, title, pages, cover, multilingual tags, error/empty/invalid IDs |
| YOM-DT-03 | Synthetic chapter / page IDs | Stable IDs, count/order, no duplicate/missing pages, referer handling |
| YOM-DT-04 | Search contract | Bounded query, pagination and truthful results, server policy gate, network 403/429/timeout tests |
| YOM-DT-05 | Popular/latest and filters | Exact upstream support, deterministic ordering, pagination, unsupported filters rejected |
| YOM-DT-06 | Content and age safeguards | Safe-by-default in API/UI/cache/search; age-gated and prohibited-content exclusion, independent server enforcement |
| YOM-DT-07 | SSRF and image proxy | Host allowlist, DNS/IP/redirect safety, response size/types, referer, cache rules |
| YOM-DT-08 | Failures and health | Safe errors for rate limit, domain change, 403, schema drift, CDN errors, no other-source regression |
| YOM-DT-09 | Browser reader regression | Search -> detail -> chapter -> reader, image failures, mobile, keyboard, pagination, offline/restore |
| YOM-DT-10 | Feature flag, rollback and owner release | Disabled by default pending gates; verifiable disable/rollback; no production launch without owner approval |

Per docs/ADDING_A_SOURCE.md: required fixture tests for metadata, popular/latest, pagination, search, filter mapping, detail, chapters, pages, malformed upstream and failure isolation. Run installed project commands after alignment and explicit setup authorization: pnpm typecheck, pnpm lint, pnpm test -- --run, pnpm build, then authorized live smoke/browser. Record exact exit codes and no false PASS.

## 6. Supplementary candidates and non-goals

Harimanga supports latest/search/detail/chapter metadata but no complete page parser. Komikcast supports search/detail/chapters via backend and a limited one-image PDF, not full chapter pages. Both are BACKLOG only. The Jikan manga info plugin is metadata-only; existing Yomirra discovery/identity contracts take precedence. Wattpad is prose text, not an image-manga source. Do not enable these without a new product decision and complete adapter/rights checks.

## 7. Security, rights, privacy and abuse risk register

| Risk | Impact | Mitigation / disposition |
| --- | --- | --- |
| Restricted or prohibited content appears in search/offline/previews | Critical | Server-side classification, age/restriction control, deny-by-default, no prohibited material |
| Third-party source permits no scraping or redistribution | Critical | License/terms/permission audit; do not scrape without authorization |
| Arbitrary fallback mirrors / outbound SSRF | Critical | Fixed approved host list and existing safeFetch, no arbitrary redirect or proxy |
| API endpoints/HTML drift, anti-bot, 403/429 | High | Fixture-based parser, fail-closed errors, rate budgets, no evasion |
| Wrong gallery/chapter/page mapping | High | Stable IDs and deterministic image order/count tests |
| Cache leaks restricted covers or downloaded pages | High | Isolate or prohibit restricted caching, test safe-toggle/account transitions |
| Legacy reader and bookmark regression | High | Compatibility tests for library/history, source changes and reader navigation |
| Copying unlicensed upstream source | High | Provenance/rights gate, clean-room minimal implementation preferred |

## 8. Dependency gates and AGY execution order

Y0 DISCOVER: examine BOTH remotes and BOTH local checkouts, current branches, status, worktrees, ignored secrets and SHAs; reconcile pre-existing UX-88 work without overwriting it.
Y1 PROTECT/ALIGN: preserve all dirty and untracked files outside repo, download/fetch remote updates and verify main docs hash, no destructive reset/force pull. Stop if conflicts cannot be reconciled.
Y2 READ CONTRACT: this PRD, docs/ADDING_A_SOURCE.md, docs/ARCHITECTURE.md, docs/EXECUTION_GUARD.md, docs/TESTING.md, docs/CONTENT_RIGHTS_REPORTING.md and existing source/content policy implementations. Compare local changes with remote SHA.
Y3 PERMISSIONS: confirm sources, terms, licensing, NSFW legal obligations and age/content gates. If not established, stop before live source access or publication. No unauthorized circumvention.
Y4 IMPLEMENT: only after successful alignment and accepted gates, on isolated feature branch; independent tests and no unrelated UX refactor. Any dependency/security/architecture changes not already authorized require owner approval first.
Y5 VERIFY: typecheck/lint/unit/contract/browser/live authorized checks, failure isolation and content restriction test matrix, record raw evidence/exits.
Y6 HANDOFF: explicit per-requirement PASS/FAIL/BLOCKED, changed paths, SHA, decisions, rollback, no commit/push/deploy beyond authorized workflow.

Preserve existing 88-ticket remediation scope and its separate authority/status, do not invent a new UX acceptance gate or claim it finished. No mass HTML/image capture or secret/private token upload to agents/CI.


## Appendix A — Exhaustive Daily-Tools JavaScript inventory (177 files)

Audit method: read-only enumeration of the complete recursive Git tree and static inspection of the source files. A category is an integration disposition, not a malware finding or live-test PASS. Names after a folder header are relative to that folder. Counts reconcile to 177.

### A1. Yoru source-related — 9
- anichin.js; kusonime.js; otakudesu.js
- lib/: wibu.js
- needs to check/: anilist.js; bstation.js; info-anime.js; jadwal-anime.js; kusonime.js

### A2. Yomirra source-related — 4
- nhentai.js
- needs to check/: harimanga.js; info-manga.js; komikcast.js

### A3. Yomirra adjacent / novel / experiments — 6
- lib/: wattpad.js
- needs to check/: wattpad-list.js; wattpad-read.js; wattpad-search.js
- scratch/: test_komikcast_v3.js; test_komikcast_v3_full.js

### A4. Block direct adoption / high-maintenance or unsuitable — 22
- lib/: hdvid.js; hehe.js; nekopoi.js; spotify.js; tiktok.js
- needs to check/: enhance.js; fakektp.js; hdvid.js; nekopoi-search.js; qcr.js; qcs.js; removenoise.js; resizevideo.js; rule34.js; togif.js; tomp3.js; topdf.js; toptt.js; tovideo.js
- root: rule34.js; z-library-copy.js; z-library.js

### A5. Shared helpers (selective reuse of concepts only) — 26
- root: check_duplicate_files.js; check_local_downloads.js; display_metadata.js; drop_metadata.js; gdrive.js; group_lookup_duplicates.js; justpaste.js
- lib/: gdrive.js; krakendl.js; pixeldrain.js; scrape-old.js; scrape.js; terabox.js; uploadFile.js; uploadImage.js
- needs to check/: base64.js; fetch.js; gdrive.js; krakendl.js; mediafire.js; pastebin.js; pixeldrain.js; qrcode.js; sfile.js; terabox.js; translate.js

### A6. Optional creative/image-related, out of approved integration scope — 35
- backup/: pinterest.js
- lib/: bingimage.js; huggingFace.js; moewalls.js; pixiv.js; wallq.js
- needs to check/: _openaiimage.js; bingimg.js; bingimg2.js; brat.js; chord.js; editimage.js; faceswap.js; hytam.js; jadianime.js; logogen.js; moewalls.js; nulis.js; photooxy.js; pinterest.js; pinterest2.js; pixivid.js; postimg.js; putih.js; randomimage.js; remini.js; removebg.js; ssweb.js; stablediffusion.js; styletext.js; toanime.js; txt2img.js; wallpaperanime.js; wallq.js
- root: pinterest.js

### A7. Optional audio/video/social, out of approved integration scope — 35
- lib/: YTDL.js; igstalk.js; threads.js; voiceba.js; xminus.js; y2mate.js
- needs to check/: _autodl.js; _kobovoice.js; applemusic.js; capcut.js; downloader-spotify.js; fb.js; ig.js; ighightlight.js; igstalk.js; igstory.js; play-musekk .js; play.js; playstore.js; playtiktok.js; search-spotify.js; threadsdl.js; tiktok2.js; tiktokimg.js; tiktokstalk.js; tts.js; tts2.js; twitter.js; voiceBA.js; yta.js; yts.js; ytv.js
- root: playstore.js; playtiktok.js; search-spotify.js

### A8. Other utility / no Yoru-Yomirra product fit — 40
- lib/: aielaina.js; chatbot.js; lyrics.js; npmstalk.js; randomm.js; sasangeyouu.js; steam.js; wuwa.js
- needs to check/: _openai-character-ai.js; aillama.js; alkitab.js; blackbox.js; brainly.js; calc.js; cocstalk.js; cookpad.js; corona.js; cuaca.js; dongeng.js; gemini.js; gemini2.js; gitclone.js; githubstalk.js; gmaps.js; google.js; gpt4.js; honkai-star-rail.js; jadwalsholat.js; kbbi.js; kodebahasa.js; kodepos.js; lirik.js; mahasiswa.js; npmsearch.js; npmstalk.js; steam.js; toimg2.js; wikipedia.js; yahoo.js
- scratch/: convert_all_plugins.js

Reconciliation: 9 + 4 + 6 + 22 + 26 + 35 + 35 + 40 = **177**.

### A9. Concrete findings, not runtime results
- Daily-Tools main tree: ef0e7b52048a856dd39d2b75e11b11e6982e057e (2026-11-10 inspection). Package entry references an absent index.js; npm test is a non-test error placeholder; CommonJS/ESM and wrapper forms are mixed.
- Otakudesu: videoData regular expression contains private-use U+E001 markers; native video extraction cannot be considered working. The module invokes runCLI without an export. Its output may be iframe, download URL, or unverified candidate, not a validated native source.
- nhentai: gallery-ID details/pages and PDF export exist; full search, popular, latest and filter contracts do not.
- Komikcast: search/detail/chapter metadata exists, but its PDF path is not a chapter-pages scraper. Harimanga also lacks a complete page-reader contract.
- lib/hdvid.js is obfuscated; lib/hehe.js begins with invalid JavaScript syntax; lib/tiktok.js evaluates remotely obtained script with Function; lib/spotify.js embeds application credentials; several generated wrappers import modules absent from the tree.
- z-library files use public proxy rotation and locally persisted account/cookie material; file/image helpers send payloads to third-party hosts. No wholesale import, open proxy or credential reuse.
- The package declares ISC in package.json, but no root LICENSE file was in the inspected tree; third-party contributions may have independent rights. Do not verbatim-copy until provenance and reuse permissions are checked.
- No fresh upstream live probe, permission confirmation, install, static analyzer, unit tests, browser tests, device tests or production verification was performed as part of this research.


## 9. Document maintenance

This PRD complements the existing docs/README.md, docs/ARCHITECTURE.md, docs/ADDING_A_SOURCE.md, docs/TESTING.md and other canonical contracts. It is planning evidence only; update implementation docs and changelog when actual code behavior changes. Paired Yoru PRD: https://github.com/rzqllh/Yoru/blob/main/docs/planning/DAILY_TOOLS_INTEGRATION_PRD_2026-11-10.md .
