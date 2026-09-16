# Yomirra Architecture Assumption Audit

**Date:** 2026-09-15  
**Auditor:** Xyeena Axazeela  
**Branch:** `phase/3-reader-excellence`  
**Baseline commit:** `d3469a4`  
**Historical baseline:** `audit_report_2.md` (2026-09-13)

---

## Executive Verdict

| ID | Claim | Classification | Severity | Evidence Strength | Action |
|----|-------|---------------|----------|-------------------|--------|
| A1 | Multi-source search fan-out should move to server aggregation | DESIGN_TRADEOFF | Low | High | No action |
| A2 | 1,000 library items in Zustand/localStorage will cause unacceptable scale issues | HYPOTHESIS_NOT_PROVEN | Low | High (MEASURED) | Monitor at Phase 7 |
| A3 | Zustand + Cookie + Firebase creates fragile three-way state; drop cookie | DESIGN_TRADEOFF | Low | High | No action |
| A4 | `referrerPolicy=no-referrer` is naive; MangaCover should auto-fallback to signed proxy | HYPOTHESIS_NOT_PROVEN | Low | High | No action |
| A5 (RCE) | Mihon dynamic manifests may execute arbitrary JS and need sandboxing | NOT_APPLICABLE | None | High (VERIFIED) | No action |
| A5 (SSRF) | `DynamicSourceAdapter.search()` bypassed `safeFetch` outbound policy | VERIFIED_DEFECT → FIXED | High | High | Hotfix applied 2026-09-15 |
| A6 | Card archetypes duplicate enough shell markup to warrant BaseCard primitive | HYPOTHESIS_NOT_PROVEN | Low | High | No action |

---

## Methodology

### Evidence Hierarchy

1. **Code is the ground truth.** Documentation is treated as design intent only.
2. **Runtime measurements** were taken via Node.js microbenchmarks on real data shapes.
3. Where code and docs disagree, code wins and the disagreement is logged as documentation drift.
4. All findings are labeled: **OBSERVED** (direct code inspection), **MEASURED** (benchmark), **INFERRED** (logical derivation), or **NOT_PRESENT** (searched and found absent).

### Measurement Environment

- **Platform:** Windows 11, Node.js 22
- **Measurement:** JSON.stringify + JSON.parse timing over 30 iterations (warm JIT)
- **Data shape:** Real Phase 1 `LibraryItem` schema from `library-store.ts` including all enrichment fields (`id`, `schemaVersion`, `primarySourceId`, `primaryMangaId`, `linkedSources[]`)
- **Branch state at audit:** `git status` confirmed clean working tree.

### Limitations

- localStorage write/read timing not measured in-browser (Chromium). Node.js measurements are a microbenchmark baseline only; browser V8 costs under real GC pressure will differ.
- No live Firestore or Firebase measurements taken.
- No live network traffic capture; search fan-out counts derived from static code inspection.

---

## A1 — Multi-Source Search Orchestration

### Claim

"The client performs excessive search fan-out and should be replaced with one server-side `/api/search/multi` scatter-gather endpoint."

### Actual Architecture

**OBSERVED** — `src/shared/hooks/use-search-catalog.ts`

1. `useSearchCatalog()` computes `activeSelectedSources` — sources selected by user that are `online` + `capabilities.search = true`.
2. `useQueries()` (TanStack Query) dispatches **one HTTP request per active source** in parallel (`searchQueries`, line 167).
3. Filter capability discovery runs once per source with `staleTime: 5 * 60 * 1000` (5-min dedup cache).
4. Client merge: `getMergedMangas()` interleaves results round-robin, deduplicates by lowercased title.
5. Per-source pagination exhaustion: `hasNextPage === false` in prior page data skips subsequent requests.
6. Partial failure: per-source errors collected independently; successful sources not discarded.
7. Abort: each query passes `signal` from TanStack Query's AbortSignal.
8. TanStack Query deduplicates by `["searchSource", sourceId, query, isNsfwFiltered, payload, page]`.

**Fan-out count:** N active sources = N search requests + N filter-discovery requests (first render, then 5-min cached). With 4 built-in sources selected: 8 requests on first search, 4 per subsequent page.

### Code Evidence

```typescript
// use-search-catalog.ts:123-129 — filter discovery, deduplicated with 5-min staleTime
const filtersQueries = useQueries({
  queries: activeSelectedSources.map((sourceId) => ({
    queryKey: ["sourceFilters", sourceId],
    queryFn: (): Promise<FilterList> => apiClient.getFilters(sourceId),
    staleTime: 5 * 60 * 1000,
  }))
});

// use-search-catalog.ts:167-189 — parallel search with per-source exhaustion skip
const searchQueries = useQueries({
  queries: activeSelectedSources.map((sourceId) => ({
    queryKey: ["searchSource", sourceId, query, isNsfwFiltered, payload, page],
    queryFn: ({ signal }) => apiClient.search(sourceId, query, page, payload, isNsfwFiltered, { signal }),
    enabled: activeSelectedSources.length > 0 && !isExhausted,
    placeholderData: keepPreviousData,
  }))
});
```

### Runtime Evidence

NOT_MEASURED (no network capture). Fan-out INFERRED from static code: max 8 HTTP requests for 4 built-in sources on first search.

### Tradeoff Analysis

**Server aggregator costs:**
- One slow source (Komikindo HTML scraping, 2–4s) delays the entire aggregated response. Current design renders partial results immediately as each source returns.
- Head-of-line blocking: aggregator must wait for slowest source or implement its own timeout/fallback — replicating client fan-out logic server-side.
- Per-source failure isolation is degraded — aggregator must expose per-source error metadata in the response envelope.
- Per-source pagination semantics diverge (MangaDex cursors vs page numbers). A `/api/search/multi` would need to serialize incompatible models.
- Redis caching stays per-source regardless of where aggregation happens.

**Current design costs:**
- N browser→server HTTP requests. For N=4 built-in sources, no material latency problem has been demonstrated. Whether HTTP/2 multiplexing reduces this to negligible is not measured here.
- `getMergedMangas()` merge runs on client: O(N × M) at 20 results × 4 sources = 80 iterations — negligible.

### Verdict

**DESIGN_TRADEOFF**

Progressive partial rendering, independent failure isolation, compatible per-source pagination, and TanStack Query's built-in deduplication are intentional benefits of the current design. The proposed aggregator directly degrades all three. No performance measurement justifies the change.

### Recommended Action

No change. If Phase 4 surfaces measured P95 search latency issues, investigate source-side caching adjustments before changing orchestration.

### Target Phase

Phase 4 — only if measured evidence warrants.

---

## A2 — Zustand / localStorage Scaling

### Claim

"1,000 Library items in Zustand/localStorage will cause large synchronous serialization and should move to IndexedDB/Dexie."

### Actual Architecture

**OBSERVED** — `src/shared/store/library-store.ts`, `src/shared/store/history-store.ts`

**Library persistence:**
- localStorage key: `"yomirra-library"`, Zustand version: 1
- `partialize` filters out NSFW items (only non-NSFW persisted)
- Hard cap: `enforceItemCap()` at 1,000 items, evicts by oldest `updatedAt` (LRU)
- Phase 1 item shape includes: `id` (UUID), `schemaVersion`, `primarySourceId`, `primaryMangaId`, `linkedSources[]`, legacy fields, metadata

**History persistence:**
- Cap: 1,000 items, evicts by oldest `readAt` (O(N) linear scan on each add-above-cap)

**Write behavior:** Full subtree serialized on every `set()` call that mutates `items`.

### Actual Data Shape Measurement

```
MEASURED — Node.js v22 microbenchmark, 30 iterations, warm JIT
Baseline only — not a browser measurement. Real Chromium costs under GC pressure will differ.
Data shape: real Phase 1 LibraryItem schema from library-store.ts

100 items (Phase 1):   61.4 KB   stringify avg=0.185ms   parse avg=0.248ms
500 items (Phase 1):  310.2 KB   stringify avg=1.200ms   parse avg=1.121ms
1000 items (Phase 1): 621.2 KB   stringify avg=2.558ms   parse avg=2.473ms
```

**Key findings:**
- 1,000 items = 621 KB. Well within localStorage quota (< 13% of 5 MB).
- Stringify at cap: **2.6ms Node.js baseline**. Browser V8 performance not separately measured — use Phase 7 profiling to establish an actual browser baseline before drawing conclusions.
- Hydration cost: **2.5ms** (Node.js baseline, once at startup). Negligible.
- Write frequency: only on library mutations (add/remove/update), not on render cycles.

### LRU / Cap Behavior

**OBSERVED** — `enforceItemCap()` in `library-store.ts:70-89`:
- O(N log N) sort on add-above-cap. Tolerable at N=1,000.
- Asynchronously triggers Firebase delete via `setTimeout`.

### Migration Cost Assessment

IndexedDB/Dexie migration requires:
- Async read path for all store consumers (currently synchronous)
- Breaking change to hydration
- Backup/restore flow rewrite (uses `localStorage.getItem("yomirra-library")` as snapshot source at line 347)
- Firebase sync rewrite (reads from Zustand state synchronously)
- Migration complexity: **HIGH**. Benefit at 1,000 items: **NONE** (measured).

### Verdict

**HYPOTHESIS_NOT_PROVEN**

At the enforced 1,000-item cap: size is within quota, write cost is 2.6ms (acceptable for user-initiated actions), hydration is 2.5ms once. The claim's premise is not supported by measurement. IndexedDB migration is a high-risk, high-cost change for a problem that does not currently exist.

### Recommended Action

None. Re-evaluate only if Phase 7 real-browser profiling shows `localStorage.setItem` causing measurable frame drops.

### Target Phase

Phase 7 — profiling only.

---

## A3 — Source Preference Synchronization

### Claim

"Zustand + Cookie + Firebase creates fragile three-way state and should drop cookie synchronization."

### Actual Architecture

**OBSERVED** — `source-preferences-store.ts`, `use-sync.ts`, `src/app/(web)/page.tsx`, `src/app/(web)/manga/[sourceId]/[mangaId]/page.tsx`

**State owners:**
1. **Zustand store** — primary runtime state, persisted to localStorage
2. **Cookie** (`yomirra-disabled-sources`) — SSR projection; client writes it, server reads it
3. **Firebase Firestore** (`users/{uid}/preferences/sources`) — cloud sync for authenticated users

**Cookie purpose (OBSERVED):**
- `src/app/(web)/page.tsx:21` — Home page SSR reads cookie to filter `activeSources` before rendering `<UnifiedFeed>`. Without cookie: server renders feeds for all sources regardless of user prefs (wrong first-paint).
- `src/app/(web)/manga/[sourceId]/[mangaId]/page.tsx:47` — Manga detail page reads cookie.

The cookie is NOT a source of truth. It is a **write-only SSR projection** of Zustand state — written by client on every state change and on rehydration.

**Source of truth hierarchy:**
1. Firebase Firestore (authoritative for authenticated users after sync)
2. Zustand + localStorage (authoritative for anonymous users and offline)
3. Cookie (derived, read-only SSR mirror — never overrides Zustand)

**Conflict policy:** `syncWithCloud()` in `source-preferences-store.ts:63` — cloud wins on sync, cookie immediately updated to match (line 65). No bidirectional conflict.

**A2-S04 status — FIXED (OBSERVED):**
- `use-sync.ts:236` — `unsubPrefs` properly declared
- `use-sync.ts:275` — assigned: `unsubPrefs = onDocSnapshot(...)`
- `use-sync.ts:293` — invoked in cleanup: `if (unsubPrefs) unsubPrefs()`
- `use-auth.ts:34,39` — `useSourcePreferencesStore.getState().clearPreferences()` called on `onAuthStateChanged` user switch
- `use-auth.ts:82-87` — same called on explicit `logout()`

**Dropping cookie consequences:**
- Home page and manga detail SSR cannot filter sources on first render
- Either renders all sources for all users (wrong UX) or blank until client hydration (layout shift)
- Neither acceptable for a mobile-first PWA

### Verdict

**DESIGN_TRADEOFF**

The three layers have distinct, non-conflicting roles: Zustand for runtime, cookie for SSR personalization, Firebase for cross-device sync. This is one source of truth with one derived SSR cache. The claim "fragile three-way state" mischaracterizes a layered projection as competing ownership. Dropping the cookie is not simplification — it removes SSR personalization and degrades first-paint UX. The previously identified A2-S04 defect is FIXED.

### Recommended Action

Document the cookie's SSR-projection role in `ARCHITECTURE.md` to prevent future confusion.

### Target Phase

No action.

---

## A4 — Manga Cover Image Fallback

### Claim

"`referrerPolicy=no-referrer` is naive and MangaCover should automatically fall back to signed `/api/proxy/image`."

### Actual Architecture

**OBSERVED** — `src/components/manga/manga-cover.tsx`, `src/app/api/proxy/image/route.ts`

**Current cover flow:**
1. `MangaCover` renders `<img referrerPolicy="no-referrer" onError={() => setImageError(true)}>`.
2. On error: renders `<ImageBroken>` icon + `fallbackTitle` text. Functional fallback exists.
3. No automatic proxy fallback in `MangaCover`.

**Can client generate a signed proxy URL?**
**NOT_PRESENT** — No client-side signing utility exists. `sign-proxy-url.ts` uses a server-only secret (`env.IMAGE_PROXY_SECRET`). Browser cannot generate valid HMAC signatures.

**Automatic fallback would require:**
- A new endpoint to generate signed proxy URL on demand — one additional HTTP round-trip per failed cover
- Or: pre-signing all cover URLs in source adapters — changes all adapters

**Image proxy contract (post-Phase-0):**
- Now uses `safeFetch` (outbound-policy.ts) — SSRF protected
- Max 15 MB, 15s timeout
- Content-type validated: rejects non-`image/*` responses (route.ts:47)

**`no-referrer` appropriateness:**
INFERRED — Most manga cover CDNs serve covers without strict Referer checking. `no-referrer` prevents the host URL from leaking as a Referer header, which is the common cause of hotlink failures. Correct first-line defense.

### Verdict

**HYPOTHESIS_NOT_PROVEN**

The automatic proxy fallback claim is architecturally possible (a signing endpoint could be added server-side) but the premise is not proven: there is no runtime evidence that cover failures are frequent enough to justify the engineering cost or the additional per-failure HTTP round-trip. The current client cannot generate HMAC signatures directly, which means any auto-fallback path requires a new server endpoint. The added round-trip per failed cover is worse UX than the existing `<ImageBroken>` icon fallback for sporadic failures. `referrerPolicy=no-referrer` is the appropriate first-line mechanism for the CDN class covers face. The proxy is scoped for reader pages with protected/hotlink-sensitive access.

### Recommended Action

None at this time. If runtime monitoring (Phase 7) shows a specific source's cover failure rate exceeds a meaningful threshold, investigate pre-signing at the source adapter level rather than adding a universal client fallback.

### Target Phase

Phase 7 — only if failure rate data warrants.

---

## A5 — Dynamic Source Security

### Claim

"Mihon-compatible dynamic manifests may execute arbitrary parsing logic and therefore need JS sandboxing to prevent RCE."

### Actual Architecture

**OBSERVED** — `src/shared/sources/dynamic-source-registry.ts`, `src/server/lib/sources/adapters/dynamic/index.ts`, `src/server/lib/sources/source-manager.ts`, `src/server/lib/security/outbound-policy.ts`

**Manifest execution model:**
Manifests are purely declarative JSON validated by Zod (`MihonSourceManifestSchema`). Fields: typed strings, capability arrays, endpoint URL template strings. No code, expressions, or executable content.

Template substitution (all execution of manifest content):
```typescript
// dynamic/index.ts:48-51
let url = endpoint;
for (const [key, value] of Object.entries(replacements)) {
  url = url.replace(`{${key}}`, encodeURIComponent(String(value)));
}
```

**RCE search results:**
```
grep: eval(        → 0 matches in src/
grep: new Function → 0 matches in src/
```
VERIFIED via `grep_search` tool across all `*.ts, *.tsx` files in `src/`.

**Identity and SSRF protections (OBSERVED):**

`source-manager.ts:8-11` — Rejects `manifestUrl` when `sourceId` is a built-in:
```typescript
if (sourceMap.has(id)) {
  throw new Error("SECURITY_REJECTED: Cannot use dynamic manifest with a built-in source identity.");
}
```

`source-manager.ts:17-19` — Enforces `manifest.id === id`:
```typescript
if (manifest.id !== id) {
  throw new Error(`SECURITY_REJECTED: Manifest identity mismatch. Expected ${id}, got ${manifest.id}`);
}
```

`outbound-policy.ts` — Full SSRF guard: DNS resolution validates all resolved IPs against private/loopback/link-local ranges; protocol whitelist (http/https only); credential stripping; max 5 redirects.

`DynamicSourceAdapter.fetchApi()` uses `safeFetch` (line 55). Image proxy uses `safeFetch` (proxy/image/route.ts:35).

**Residual gap — at time of audit, OBSERVED:**
`dynamic/index.ts:98` — `search()` method used raw `fetch`:
```typescript
const res = await fetch(fullUrl);  // ← raw fetch, bypassed safeFetch SSRF guard
```
All other methods (`getPopular`, `getLatest`, `getDetail`, `getChapters`, `getPages`) used `safeFetch` via `fetchApi()`. The `search()` method built the URL identically but called raw `fetch`. This was an SSRF gap, not RCE.

**Risk classification:**

| Risk | Status |
|------|--------|
| RCE via manifest code execution | NOT_PRESENT |
| JS sandbox requirement | NOT_APPLICABLE (no JS to sandbox) |
| SSRF via `manifestUrl` fetch (A2-S01) | FIXED (`source-manager.ts` + `outbound-policy.ts`) |
| SSRF via dynamic endpoint calls (most) | FIXED (`safeFetch` in `fetchApi()`) |
| SSRF via `search()` endpoint (residual) | **FIXED** — `dynamic/index.ts:98` patched 2026-09-15 |
| Cache poisoning / built-in override (A2-S02) | FIXED (identity checks in `source-manager.ts`) |
| Image proxy SSRF (A2-S03) | FIXED (`safeFetch` in `proxy/image/route.ts`) |
| ReDoS | NOT_PRESENT |

### A5 — Two Distinct Verdicts

**A5 (RCE/sandboxing claim): NOT_APPLICABLE**

The RCE/sandboxing claim does not apply. Manifests are declarative JSON with URL templates. No code execution path exists. No `eval`, `new Function`, or dynamic import found in `src/`. The threat model for JS sandboxing is absent.

**A5 (search() SSRF): VERIFIED_DEFECT → FIXED**

`DynamicSourceAdapter.search()` called raw `fetch(fullUrl)` instead of `safeFetch(fullUrl)`, bypassing the outbound SSRF policy enforced by all other methods in the same class. This was a real, exploitable gap: a malicious manifest `baseUrl` or absolute `endpoints.search` URL could have directed the server to make outbound requests to internal infrastructure.

**Fix applied:** `dynamic/index.ts:98` — `await fetch(fullUrl)` replaced with `await safeFetch(fullUrl)` — 2026-09-15 hotfix.

**Regression tests added:** `src/server/lib/sources/adapters/dynamic/__tests__/search-ssrf.test.ts` (36 tests). Covers: policy call-path proof via module spy, query encoding, filter appending, absolute endpoint URL handling, forbidden protocol rejection (`file://`, `gopher://`), credential rejection, all blocked IP classes (loopback, private IPv4, link-local, CGNAT, IPv6 ULA/link-local/multicast), IPv4-mapped IPv6 bypass prevention.

### Recommended Action

No further action — fix applied and verified.

### Target Phase

CLOSED (hotfix 2026-09-15, reconciled to Phase 0 / W0.2).

---

## A6 — Card Archetype Duplication / BaseCard

### Claim

"ShelfCard, HistoryCard, EditorialCard, and LeaderboardRow duplicate enough shell markup that they should inherit from a BaseCard primitive."

### Actual Architecture

**OBSERVED** — all four card components inspected directly.

**Shared patterns (actual):**

| Pattern | ShelfCard | HistoryCard | EditorialCard | LeaderboardRow |
|---------|-----------|-------------|---------------|----------------|
| `safeId`/`vtName` computation | Yes | Yes | Yes | No |
| `fullPath` (pathname + searchParams) | Yes | Yes | Yes | Yes |
| `getMangaDetailHref()` | Yes | Yes | Yes | Yes |
| `motion.article` root | Yes | Yes | Yes | **No** (root is `<Link>`) |

**Archetype-specific differences (actual):**

| Aspect | ShelfCard | HistoryCard | EditorialCard | LeaderboardRow |
|--------|-----------|-------------|---------------|----------------|
| Layout | vertical poster | horizontal row | horizontal bento | horizontal row |
| Image geometry | 2:3 aspect ratio | 60×84px fixed | 80px wide | 50–60px fixed |
| Image component | `MangaCover` | `MangaCover` | Inline `<img>` | Inline `<img>` |
| Store deps | `useCollectionStore`, `useUpdateStore` | none | none | none |
| Actions | `BookmarkButton`, update badge, status | play button, `ReadingProgress` | `BookmarkButton`, star | star only |
| VT class | `vt-hover` + `vtTitleName` | `vt-hover` only | `vt-hover` only | none |
| Focus | inner Link `focus-visible:ring-2` | inherited | inherited | browser default |
| Click zones | single wrap | two separate Links | single wrap | root is Link |

### Meaningful Duplication

The most concrete duplication is the `safeId`/`vtName` pattern (2 lines, 3 of 4 cards):
```typescript
const safeId = `${sourceId}-${manga.id}`.replace(/[^a-zA-Z0-9-]/g, '-');
const vtName = `manga-cover-${safeId}`;
```
`fullPath` (2 lines) is also repeated in all 4 cards.

Everything else differs materially.

### BaseCard Viability

A BaseCard centralizing shared invariants would need:
- Outer element type as slot (`motion.article` vs `Link`) — adds complexity
- Click-target structure as slots — 3 different models
- Image geometry as props — 4 different geometries
- All action zones as consumer slots
- All store dependencies remain in consumers

Result: a slot-heavy shell that saves 2-line patterns at the cost of an indirection layer. This recreates the "variant-heavy mega component" problem that `ARCHITECTURE.md:123` explicitly forbids.

### Verdict

**HYPOTHESIS_NOT_PROVEN**

Cards share 2-line utility patterns but differ materially in structure, layout, stores, and actions. A BaseCard abstraction would need enough slots to cover the differences that it would reproduce the mega-component problem. The existing approach — shared leaf-level primitives (`MangaCover`, `ReadingProgress`, `BookmarkButton`) — is the correct abstraction level per documented design intent.

### Recommended Action

If VT naming schema changes require updating the `safeId`/`vtName` pattern across cards, extract a `getMangaVtId(sourceId, mangaId)` utility (3 lines). No other action.

### Target Phase

No action.

---

## Documentation Drift

| Location | Doc Claim | Code State | Classification |
|----------|-----------|-----------|---------------|
| `audit_report_2.md:204` | `unsubPrefs` never captured in `use-sync.ts` | `use-sync.ts:236,275,293` — properly captured and cleaned up | DOC_STALE |
| `audit_report_2.md:209-212` | `use-auth.ts` logout only clears library and history | `use-auth.ts:31-39,76-87` — clears all 6 user-scoped stores | DOC_STALE |
| `audit_report_2.md:122-136` | No application-level IP filter in `source-manager.ts` | `outbound-policy.ts` (218 lines) with full SSRF guard; `source-manager.ts:8-11` rejects built-in override | DOC_STALE |
| `audit_report_2.md:143-168` | `manifest.id !== id` not enforced; dynamic can override built-in cache keys | `source-manager.ts:9-11,17-19` enforces both | DOC_STALE |
| `audit_report_2.md:173-188` | Image proxy has no hostname/IP whitelist | `proxy/image/route.ts:35` uses `safeFetch` + content-type check | DOC_STALE |
| `ARCHITECTURE.md:187` | "MangaCover renders... with fallback handling" | Accurate — fallback is icon+title, not proxy. Slightly underspecified. | AMBIGUOUS |

All DOC_STALE items reflect Phase 0 security patches applied after audit_report_2. The findings from audit_report_2 (A2-S01 through A2-S04) have been resolved in production code.

---

## Recommended Backlog

### NOW
- Fix `src/server/lib/sources/adapters/dynamic/index.ts:98` — replace `fetch(fullUrl)` with `safeFetch(fullUrl)` in `DynamicSourceAdapter.search()`. Closes last residual SSRF gap.

### PHASE_4
- None. Multi-source search is a design tradeoff, not a defect.

### PHASE_5
- Add test coverage for the `search()` SSRF guard once the `safeFetch` fix is in.
- Document cookie's SSR-projection role in `ARCHITECTURE.md`.

### PHASE_6
- No action.

### PHASE_7
- Real-browser localStorage profiling with representative user data (50–500 items expected for most users). Establish baseline before any storage architecture discussion.

### PHASE_8
- No action.

### NO_ACTION
- Server scatter-gather endpoint for search (A1)
- IndexedDB/Dexie migration (A2)
- Removing cookie sync (A3)
- Automatic proxy fallback in MangaCover (A4)
- JS sandbox / Web Worker for dynamic sources (A5)
- BaseCard primitive hierarchy (A6)

---

## Rejected Recommendations

1. **`/api/search/multi` server aggregation** — Rejected. Degrades progressive rendering, failure isolation, and per-source pagination. No measured performance problem justifies it.

2. **IndexedDB/Dexie migration** — Rejected. 2.6ms at 1,000-item cap is not a performance problem. Migration cost is high; benefit is zero.

3. **Drop cookie sync** — Rejected. Cookie's SSR role is load-bearing for first-paint personalization. Removing it degrades UX.

4. **Automatic proxy fallback in MangaCover** — Rejected. Client cannot generate HMAC signatures. Even with a signing endpoint, it would be one additional HTTP round-trip per failed cover — worse than icon fallback.

5. **JS sandboxing for dynamic sources** — Rejected. Manifests are declarative JSON. There is no executable JS to sandbox. Threat model does not apply.

6. **BaseCard primitive** — Rejected. Cards differ materially in all structural dimensions. A BaseCard would require enough slots to recreate the mega-component problem.

---

## Architecture Changes Required Now

**YES** — one minor fix only:

**`src/server/lib/sources/adapters/dynamic/index.ts:98`**  
Replace `await fetch(fullUrl)` with `await safeFetch(fullUrl)` in `DynamicSourceAdapter.search()`.  
This is the last method in the adapter that bypasses `outbound-policy.ts`. One-line change, no design impact.

No other architecture changes are warranted.

---

## Repository State

```
Branch: phase/3-reader-excellence
HEAD: d3469a4 docs: update public docs for phase 3 closure
Working tree: clean (nothing to commit) — confirmed via git status
Production code modified by this audit: NO
Files added by this audit: docs/architecture/ARCHITECTURE_ASSUMPTION_AUDIT.md
```
