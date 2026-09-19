# Source Engine V1 — Source Research

Evidence-based research for each target source. Every claim is labeled.

---

## Shinigami

**Status:** PARTIALLY_VERIFIED

### Identity
- Source ID: `shinigami` `VERIFIED_FROM_REPO`
- Frontend domain: `shinigami.asia` (currently varies: `11.shinigami.asia`, `c.shinigami.asia`) `VERIFIED_FROM_REPO`
- Backend API: `api.shngm.io` `VERIFIED_FROM_REPO` `VERIFIED_FROM_SOURCE`
- Stable identifier: `shinigami` `VERIFIED_FROM_REPO`

### Transport
- Type: **JSON API** `VERIFIED_FROM_REPO`
- Base URL: `https://api.shngm.io` `VERIFIED_FROM_REPO`

### Verified Endpoints (from existing adapter)
| Endpoint | Method | Evidence |
|----------|--------|----------|
| `/v1/manga/list` | GET | `VERIFIED_FROM_REPO` `VERIFIED_FROM_SOURCE` — API probe returned valid JSON |
| `/v1/manga/detail/{mangaId}` | GET | `VERIFIED_FROM_REPO` |
| `/v1/chapter/{mangaId}/list` | GET | `VERIFIED_FROM_REPO` |
| `/v1/chapter/detail/{chapterId}` | GET | `VERIFIED_FROM_REPO` |

### Parameters (from adapter code)
- `page`, `page_size`, `sort` (values: `popularity`, `latest`) `VERIFIED_FROM_REPO`
- `q` (search query) `VERIFIED_FROM_REPO`
- `genre`, `genre_condition` `VERIFIED_FROM_REPO`

### Response Shape
- List: `{ data: ShinigamiMangaItem[], meta: { page, page_size, total_page, total_data } }` `VERIFIED_FROM_REPO`
- Detail: `{ data: ShinigamiMangaDetail }` `VERIFIED_FROM_REPO`
- Chapters: `{ data: ShinigamiChapterItem[] }` `VERIFIED_FROM_REPO`
- Pages: `{ data: { base_url, chapter: { path, data: string[] } } }` `VERIFIED_FROM_REPO`

### Headers
- Referer: `https://c.shinigami.asia/` `VERIFIED_FROM_REPO`
- Origin: `https://c.shinigami.asia` `VERIFIED_FROM_REPO`
- Random UA rotation `VERIFIED_FROM_REPO`

### Image Handling
- Images constructed from: `${base_url}${chapter.path}${filename}` `VERIFIED_FROM_REPO`
- Referer required: `https://c.shinigami.asia` `VERIFIED_FROM_REPO`
- No scrambling detected `INFERRED`

### Manga/Chapter Identifiers
- Manga ID: `manga_id` (string) `VERIFIED_FROM_REPO`
- Chapter ID: `chapter_id` (string) `VERIFIED_FROM_REPO`
- Chapter number: numeric `VERIFIED_FROM_REPO`

### Rate Limits
- `UNKNOWN` — no explicit rate limiting in adapter

### Domain Migration
- Frontend domain has changed historically (shinigami.asia → 11.shinigami.asia → c.shinigami.asia) `INFERRED`
- API domain `api.shngm.io` appears stable `INFERRED`

### Health Probe
- `https://api.shngm.io/v1/manga/list?page=1&page_size=1` `VERIFIED_FROM_REPO`

### Normalized Mapping Coverage
- MangaItem: ✓ `VERIFIED_FROM_REPO`
- MangaDetail: ✓ (author, artist, genres via taxonomy) `VERIFIED_FROM_REPO`
- Chapter: ✓ `VERIFIED_FROM_REPO`
- Page: ✓ `VERIFIED_FROM_REPO`
- Filters: hardcoded genre list `VERIFIED_FROM_REPO`

### Unknowns
- Exact rate limit thresholds
- `slider.shinigami.io` endpoint behavior
- Whether API requires auth for any endpoints
- Domain change frequency/pattern

### Risks
- Frontend domain instability — API domain has remained stable
- Hardcoded genre list may drift from actual API-supported genres

### Next Verification
- Probe additional endpoints live
- Check if API exposes genre list dynamically

---

## Komikindo

**Status:** PARTIALLY_VERIFIED

### Identity
- Source ID: `komikindo` `VERIFIED_FROM_REPO`
- Frontend domain: `komikindo.ch` `VERIFIED_FROM_REPO`
- No known separate API domain `VERIFIED_FROM_REPO`
- Stable identifier: `komikindo` `VERIFIED_FROM_REPO`

### Transport
- Type: **HTML scraping** (cheerio) `VERIFIED_FROM_REPO`
- Base URL: `https://komikindo.ch` `VERIFIED_FROM_REPO`

### Verified Routes (from existing adapter & live verification)
| Route | Method | Evidence |
|-------|--------|----------|
| `/komik-populer/page/{page}/` | GET HTML | `VERIFIED_FROM_REPO` |
| `/komik-terbaru/page/{page}/` | GET HTML | `VERIFIED_FROM_REPO` |
| `/page/{page}/?s={query}` | GET HTML (search) | `VERIFIED_FROM_SOURCE` (updated from old `/manga/page/{page}/`) |
| `/page/{page}/?genre[]={genre}` | GET HTML (genre filter) | `VERIFIED_FROM_SOURCE` (updated from old `/manga/page/{page}/`) |
| `/komik/{mangaId}/` | GET HTML (detail + chapters) | `VERIFIED_FROM_REPO` |
| `/{chapterId}/` | GET HTML (pages) | `VERIFIED_FROM_REPO` |

### Incidents & Route Changes
- **Incident (2026-09):** `ROUTE_CHANGED`
  - **Old route:** `GET /manga/page/{page}/?s={query}`
  - **Current route:** `GET /page/{page}/?s={query}` and `GET /page/{page}/?genre[]={genre}`
  - **Failure Type:** `ROUTE_CHANGED`
  - **Evidence Classification:** `VERIFIED_FROM_SOURCE`
  - **Fix Commit:** `5f56ad9` (regression test: `ed6b21d`)
  - **Key Architecture Takeaway:** Upstream domain/homepage returned HTTP 200 while search route was completely broken (404/redirect). Proves conclusively that transport reachability alone does not equal source health.


### HTML Selectors (from adapter code)
- List: `.animepost` container, `h3 a` title, `img[itemprop='image']` cover `VERIFIED_FROM_REPO`
- Detail: `h1` title, `.thumb img` cover, `div[itemprop='description']` desc, `.spe span` metadata `VERIFIED_FROM_REPO`
- Chapters: `#chapter_list li`, `.lchx a` links `VERIFIED_FROM_REPO`
- Pages: `#chimg-auh img, .chapter-image img, #img-container img` `VERIFIED_FROM_REPO`
- Filter scraping from `/daftar-manga/` `VERIFIED_FROM_REPO`

### Image Handling
- Direct image URLs from `src`/`data-src` attributes `VERIFIED_FROM_REPO`
- Referer: `https://komikindo.ch` `VERIFIED_FROM_REPO`
- `.gif` images filtered out (ad pixels) `VERIFIED_FROM_REPO`

### Identifiers
- Manga ID: URL slug extracted from `/komik/{slug}/` `VERIFIED_FROM_REPO`
- Chapter ID: URL slug extracted from chapter links `VERIFIED_FROM_REPO`

### Unknowns
- Whether WordPress REST API is available (site uses WordPress) — `UNKNOWN`
- Rate limits
- Domain change patterns (domain has `.ch` TLD suggesting potential instability)

### Risks
- HTML structure changes will break selectors
- Domain may change (typical for Indonesian manga sites)
- No API fallback if HTML structure changes

### Next Verification
- Probe for WordPress API at `/wp-json/wp/v2/`
- Test current selectors against live HTML

---

## MangaDex

**Status:** PARTIALLY_VERIFIED

### Identity
- Source ID: `mangadex` `VERIFIED_FROM_REPO`
- Frontend domain: `mangadex.org` `VERIFIED_FROM_REPO`
- API domain: `api.mangadex.org` `VERIFIED_FROM_REPO` `VERIFIED_FROM_SOURCE`
- Stable identifier: `mangadex` `VERIFIED_FROM_REPO`

### Transport
- Type: **Official JSON API** `VERIFIED_FROM_REPO`
- Base URL: `https://api.mangadex.org` `VERIFIED_FROM_REPO`

### Verified Endpoints (from existing adapter)
| Endpoint | Method | Evidence |
|----------|--------|----------|
| `/manga` | GET | `VERIFIED_FROM_REPO` `VERIFIED_FROM_SOURCE` |
| `/manga/{id}` | GET | `VERIFIED_FROM_REPO` |
| `/manga/{id}/feed` | GET | `VERIFIED_FROM_REPO` |
| `/at-home/server/{chapterId}` | GET | `VERIFIED_FROM_REPO` |
| `/manga/tag` | GET | `VERIFIED_FROM_REPO` (via tag-cache) |

### Parameters
- `includes[]`, `contentRating[]`, `limit`, `offset` `VERIFIED_FROM_REPO`
- `translatedLanguage[]`: `["id", "en"]` `VERIFIED_FROM_REPO`
- `order[*]`: various sort fields `VERIFIED_FROM_REPO`
- `includedTags[]`, `excludedTags[]` `VERIFIED_FROM_REPO`
- `status[]` `VERIFIED_FROM_REPO`

### Special Behaviors
- 429 rate limiting with `Retry-After` header handling (bounded retry) `VERIFIED_FROM_REPO`
- Token bucket throttling via `acquireToken()` `VERIFIED_FROM_REPO`
- Chapter deduplication: prefer ID over EN for same chapter number `VERIFIED_FROM_REPO`
- User-Agent: `Yomirra/1.0.0` `VERIFIED_FROM_REPO`

### Image Handling
- MangaDex@Home CDN: `${baseUrl}/data/${hash}/${filename}` `VERIFIED_FROM_REPO`
- Referer: `https://mangadex.org` `VERIFIED_FROM_REPO`

### Identifiers
- Manga ID: UUID `VERIFIED_FROM_REPO`
- Chapter ID: UUID `VERIFIED_FROM_REPO`

### Rate Limits
- HTTP 429 with bounded `Retry-After` (max 5000ms sleep) `VERIFIED_FROM_REPO`
- Throttle via token bucket (4 requests/second) `VERIFIED_FROM_REPO`

### Unknowns
- None critical — well-documented official API

### Risks
- Rate limiting on free tier (mitigated by existing throttle)
- CDN node availability (MangaDex@Home is community-driven)

---

## Komiku

**Status:** PARTIALLY_VERIFIED

### Identity
- Source ID: `komiku` `VERIFIED_FROM_REPO`
- Frontend domain: `komiku.org` `VERIFIED_FROM_REPO`
- API domain: `api.komiku.org` (returns HTML, not JSON) `VERIFIED_FROM_REPO`
- Stable identifier: `komiku` `VERIFIED_FROM_REPO`

### Transport
- Type: **Hybrid HTML** — search tries `api.komiku.org` first (returns HTML), falls back to main site `VERIFIED_FROM_REPO`
- Base URL: `https://komiku.org` `VERIFIED_FROM_REPO`

### Verified Routes (from existing adapter)
| Route | Method | Evidence |
|-------|--------|----------|
| `/daftar-komik/?halaman={page}` | GET HTML (popular) | `VERIFIED_FROM_REPO` |
| `/` | GET HTML (latest, page 1) | `VERIFIED_FROM_REPO` |
| `https://api.komiku.org/?s={query}` | GET HTML (search) | `VERIFIED_FROM_REPO` |
| `/?s={query}` | GET HTML (search fallback) | `VERIFIED_FROM_REPO` |
| `/manga/{mangaId}/` | GET HTML (detail + chapters) | `VERIFIED_FROM_REPO` |
| `/ch/{chapterId}/` | GET HTML (pages) | `VERIFIED_FROM_REPO` |

### HTML Selectors
- List: `.ls4j, .ls12v, .ls4, .ls12, .bmaster`, `h4 a`, `h3 a` `VERIFIED_FROM_REPO`
- Search (api.komiku.org): `.bge`, `.kan a`, `.kan h3` `VERIFIED_FROM_REPO`
- Detail: `.inftable tr`, `.genre li a` `VERIFIED_FROM_REPO`
- Chapters: `#Daftar_Chapter td.judulseries a`, `.ls25 a`, `a[href*='/ch/']` `VERIFIED_FROM_REPO`
- Pages: `#Baca_Komik img`, `#baca_komik img` `VERIFIED_FROM_REPO`

### Special Behaviors
- Lazy image handling (multiple data attributes) `VERIFIED_FROM_REPO`
- Duplicate detection via `seenIds` Set `VERIFIED_FROM_REPO`
- `hasNextPage` estimation: pagination links OR `mangas.length >= 20` `VERIFIED_FROM_REPO`

### Identifiers
- Manga ID: URL slug from `/manga/{slug}/` `VERIFIED_FROM_REPO`
- Chapter ID: URL slug from `/ch/{slug}/` `VERIFIED_FROM_REPO`

### Unknowns
- Whether `api.komiku.org` supports JSON responses for any endpoint
- Rate limits
- Domain stability

### Risks
- Heavy HTML selector fragility (many fallback selectors already needed)
- `hasNextPage` uses `>= 20` fallback which may cause phantom pages

---

## Komiku II

**Status:** VERIFIED_FROM_SOURCE

### Identity
- Source ID: `komiku-ii` `PROPOSED`
- Frontend domain: `01.komiku.asia` `VERIFIED_FROM_SOURCE`
- Backend API: `https://01.komiku.asia/api/v2` `VERIFIED_FROM_SOURCE`
- Stable identifier: `komiku-ii` `PROPOSED`

### Transport
- Type: **Direct JSON API** `VERIFIED_FROM_SOURCE`
- Base URL: `https://01.komiku.asia/api/v2` `VERIFIED_FROM_SOURCE`
- Auth / Headers: Standard headers, no authentication required `VERIFIED_FROM_SOURCE`

### Verified Endpoints
| Endpoint | Method | Evidence |
|----------|--------|----------|
| `/comics?page={page}&type={type}&status={status}` | GET | `VERIFIED_FROM_SOURCE` — returns `{ items: KomikuIIItem[], page, perPage, total, totalPages }` |
| `/comics/search?q={query}` | GET | `VERIFIED_FROM_SOURCE` — returns `KomikuIIItem[]` |
| `/comics/filters` | GET | `VERIFIED_FROM_SOURCE` — returns `{ genres: string[], statuses: string[], types: string[], authors: string[] }` |
| `/comics/{slug}` | GET | `VERIFIED_FROM_SOURCE` — returns `KomikuIIDetail` with synopsis, author, rating, chapterCount |
| `/comics/{numericComicId}/chapters` | GET | `VERIFIED_FROM_SOURCE` — returns `[{ id, n, title, releasedLabel, releasedAt }]` |
| `/comics/{numericComicId}/chapters/id/{chapterId}` | GET | `VERIFIED_FROM_SOURCE` — returns `{ id, comicId, n, title, pages: [{ index, url }] }` |

### Image CDN
- Domains: `https://content.komiku.me` (covers), `https://cdnkomiku.xyz` (chapter pages) `VERIFIED_FROM_SOURCE`
- Direct access: returns 200 OK, no image scrambling, no anti-hotlinking block detected `VERIFIED_FROM_SOURCE`

### Identifiers
- Manga ID: URL slug for detail (e.g. `what-a-bountiful-harvest-demon-lord`), numeric ID for chapters endpoint (e.g. `378731`).
  - *Recommendation:* Format compound ID `slug` or `id::slug` for stable adapter resolution.
- Chapter ID: numeric chapter ID (e.g. `488513`)

---

## KomikNesia

**Status:** VERIFIED_FROM_SOURCE

### Identity
- Source ID: `komiknesia` `PROPOSED`
- Frontend domain: `komiknesia.site` `VERIFIED_FROM_SOURCE`
- Backend API: `https://api-be.komiknesia.my.id/api` `VERIFIED_FROM_SOURCE`
- Stable identifier: `komiknesia` `PROPOSED`

### Transport & Encryption Protocol
- Type: **Encrypted JSON API** `VERIFIED_FROM_SOURCE`
- Base URL: `https://api-be.komiknesia.my.id/api` `VERIFIED_FROM_SOURCE`
- Headers required:
  - `User-Agent: Mozilla/5.0 ...` `VERIFIED_FROM_SOURCE`
  - `Referer: https://komiknesia.site/` `VERIFIED_FROM_SOURCE`
  - `X-Device-Id: dv_{random}` (format: `dv_` + 8 random base36 chars + 6 timestamp chars) `VERIFIED_FROM_SOURCE`
- Envelope: `{ status: true, encrypted: true, data: "<base64>", time: 1789751534 }` `VERIFIED_FROM_SOURCE`
- Decryption Algorithm (Node native crypto compatible):
  - Key derivation: `let r = Number(time); for (let s = 0; s < 5; s++) r = r / 2; let n = r.toFixed(8); key = n.padEnd(32, '0')`
  - Cipher: `aes-256-cbc`
  - IV: First 16 bytes of base64 decoded buffer
  - Ciphertext: Remaining bytes after first 16 bytes
  - Native implementation: `crypto.createDecipheriv('aes-256-cbc', Buffer.from(key, 'utf8'), iv)` `VERIFIED_FROM_SOURCE`

### Verified Endpoints
| Endpoint | Method | Evidence |
|----------|--------|----------|
| `/contents?page={page}&limit={limit}` | GET | `VERIFIED_FROM_SOURCE` — returns `{ status, data: KomikNesiaItem[] }` |
| `/manga?page={page}&limit={limit}&search={query}` | GET | `VERIFIED_FROM_SOURCE` — returns `{ manga: KomikNesiaItem[], totalPages, currentPage, totalCount }` |
| `/manga/slug/{slug}` | GET | `VERIFIED_FROM_SOURCE` — returns full detail including embedded `chapters: KomikNesiaChapter[]` |
| `/chapters/slug/{chapterSlug}` | GET | `VERIFIED_FROM_SOURCE` — returns `{ status, data: { images: string[], number, chapters } }` |

### Image CDN
- Domain: `https://data.cdnesia.my.id` (also proxy fallback `proxy.cdnesia.my.id`) `VERIFIED_FROM_SOURCE`
- Direct access: returns 200 OK (WebP), status verified live `VERIFIED_FROM_SOURCE`

### Identifiers
- Manga ID: string slug (e.g. `even-if-i-fall-into-a-ghost-story-i-still-have-to-go-to-work`)
- Chapter ID: string slug (e.g. `even-if-i-fall-into-a-ghost-story-i-still-have-to-go-to-work-chapter-36-bahasa-indonesia`)

---

## Asura Scans

**Status:** VERIFIED_FROM_SOURCE

### Identity
- Source ID: `asurascans` `PROPOSED`
- Frontend domain: `asurascans.com` `VERIFIED_FROM_SOURCE`
- Backend API: `https://api.asurascans.com/api` `VERIFIED_FROM_SOURCE`
- Stable identifier: `asurascans` `PROPOSED`

### Transport
- Type: **Direct JSON API** `VERIFIED_FROM_SOURCE`
- Base URL: `https://api.asurascans.com/api` `VERIFIED_FROM_SOURCE`
- Headers: Standard browser `User-Agent` (no special auth or Cloudflare bypass needed for public API) `VERIFIED_FROM_SOURCE`

### Verified Endpoints
| Endpoint | Method | Evidence |
|----------|--------|----------|
| `/series?page={page}` | GET | `VERIFIED_FROM_SOURCE` — returns `{ data: AsuraSeriesItem[], meta: { total, per_page, has_more } }` |
| `/series?search={query}&page={page}` | GET | `VERIFIED_FROM_SOURCE` — search endpoint with pagination |
| `/genres` | GET | `VERIFIED_FROM_SOURCE` — returns `{ data: GenreItem[] }` (35 genres) |
| `/series/{slug}` | GET | `VERIFIED_FROM_SOURCE` — returns `{ series: AsuraSeriesDetail, recommended_series: [] }` |
| `/series/{slug}/chapters` | GET | `VERIFIED_FROM_SOURCE` — returns `{ data: AsuraChapterItem[] }` |
| `/series/{slug}/chapters/{numberOrSlug}` | GET | `VERIFIED_FROM_SOURCE` — returns `{ data: { is_locked, chapter: { pages: [{ url, width, height }] } } }` |

### Image CDN & Paywall Boundary
- CDN Domain: `https://cdn.asurascans.com/asura-images/...` `VERIFIED_FROM_SOURCE`
- Images: Direct WebP, 200 OK without referer `VERIFIED_FROM_SOURCE`
- Image scrambling: **None** (direct clean WebP files) `VERIFIED_FROM_SOURCE`
- Paywall/Premium content: Chapters with `is_locked: true` have no page data. Adapter respects this boundary and exposes locked state without bypassing `VERIFIED_FROM_SOURCE`

### Identifiers
- Manga ID: string slug (e.g. `war-of-extinction`)
- Chapter ID: chapter number or chapter slug (e.g. `chapter-7` or `7`)

---

## MangaDex (ID+EN expansion)

**Status:** PARTIALLY_VERIFIED

Current adapter already handles ID+EN via `translatedLanguage[]` parameter. `VERIFIED_FROM_REPO`

### What Exists
- Language filter: `["id", "en"]` hardcoded in `getChapters` `VERIFIED_FROM_REPO`
- Chapter deduplication: prefer ID over EN `VERIFIED_FROM_REPO`
- Search/browse: no language filter (uses content rating only) `VERIFIED_FROM_REPO`

### Gap
- No per-language source binding (single `mangadex` source for both languages)
- User cannot separately enable/disable ID vs EN
- Search results show all languages (not filtered)

### Resolved Decision (D-008)
- MangaDex remains one unified source (`mangadex`) with ID/EN language preference filter. It will not be split into separate sources.
- Chapters feed deduplicates and respects language preference while preserving a single canonical source identity.
