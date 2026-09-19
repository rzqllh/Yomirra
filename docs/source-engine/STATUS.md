# Source Engine V1 — Development Status

```
Current Phase:     3 — Domain Resolution & Health (DONE)
Current Branch:    feat/source-engine-v1
Last Verified Commit: 1d8ebbc
Last Updated:      2026-09-19
Known Blockers:    None

```

## Test Baseline

**69 test files, 466 tests — ALL PASSING** as of 2026-09-19 (435 baseline + 31 Phase 3 Domain Resolution & Health tests across 5 test suites).

Any change must preserve this baseline.

### Phase 3 Key Incident Evidence & Architecture
- **Komikindo `ROUTE_CHANGED` Incident:** In commit `5f56ad9` (regression test `ed6b21d`), Komikindo upstream search route changed from `/manga/page/{page}/` to `/page/{page}/?s={query}`. While the homepage returned HTTP 200, search was non-functional. Conclusive evidence that transport reachability != functional source health.
- **Phase 3 Resolution:** Built runtime domain resolution (`domain-resolver.ts`) with verified fallback mirrors (`komikindo.ch` → `komikindo.cv`), normalized machine-readable errors (`SourceError`, `SourceErrorCode`), functional layered health probes (`probe.ts`), consecutive failure tracking with recovery events (`health-store.ts`), and multi-source search failure isolation.

---

## Work Items

| # | Work Item | Status | Evidence | Tests | Commit | Notes |
|---|-----------|--------|----------|-------|--------|-------|
| 1 | Repository audit | DONE | Verified from repo inspection | N/A | N/A | See audit artifact |
| 2 | Source research — Shinigami | DONE | API probe confirmed, existing adapter verified | 298 baseline | N/A | api.shngm.io responds |
| 3 | Source research — Komikindo | DONE | Existing adapter verified (HTML/cheerio) | 298 baseline | N/A | Domain: komikindo.ch |
| 4 | Source research — MangaDex | DONE | API probe confirmed, existing adapter verified | 298 baseline | N/A | Official API |
| 5 | Source research — Komiku | DONE | Existing adapter verified (HTML/cheerio + api fallback) | 298 baseline | N/A | api.komiku.org returns HTML |
| 6 | Source research — Komiku II | DONE | VERIFIED_FROM_SOURCE | N/A | N/A | Direct JSON API (01.komiku.asia/api/v2) |
| 7 | Source research — KomikNesia | DONE | VERIFIED_FROM_SOURCE | N/A | N/A | AES-256-CBC encrypted API verified & reverse-engineered |
| 8 | Source research — Asura Scans | DONE | VERIFIED_FROM_SOURCE | N/A | N/A | Direct JSON API (api.asurascans.com/api) & CDN verified |
| 9 | Contract gap analysis | DONE | VERIFIED_FROM_REPO | N/A | N/A | MangaSource interface compatible with all 7 sources |
| 10 | Normalized model design | DONE | VERIFIED_FROM_REPO | N/A | N/A | Additive capabilities model designed in PLAN.md |
| 11 | Implementation plan | DONE | VERIFIED_FROM_REPO | N/A | N/A | Staged 6-phase roadmap documented in PLAN.md |
| 12 | Feature branch creation | DONE | VERIFIED_FROM_REPO | N/A | N/A | Checked out feat/source-engine-v1 |
| 13 | Contract Extension (`source-types.ts`, `source-capabilities.ts`) | DONE | VERIFIED_FROM_REPO | 6 tests passing | e828303 | Additive capabilities, hasCapability helper, optional fields |
| 14 | HttpClient Source Configuration (`http-client.ts`) | DONE | VERIFIED_FROM_REPO | 15 tests passing | e828303 | Config object, host validation, post/getText, setBaseUrl |
| 15 | Source Registry Preparation (`source-registry.ts`) | DONE | VERIFIED_FROM_REPO | 3 tests passing | e828303 | Isolated pendingSourceRegistry for Phase 2 |
| 16 | Source Manager & MangaDex fetch audit | DONE | VERIFIED_FROM_REPO | 298 baseline | e828303 | Audited; no breaking changes required for Phase 1 |
| 17 | Infrastructure Tests & Verification | DONE | VERIFIED_FROM_REPO | 319 passing | e828303 | Typecheck and full test suite passing cleanly |
| 18 | Phase 2A: Komiku II Adapter (`komiku-ii`) | DONE | VERIFIED_FROM_SOURCE + VERIFIED_FROM_REPO | 26 adapter tests (345 total) | c043853 | REST JSON API adapter + fixtures + tests + image redirect fallback + browser flow verified |
| 19 | Phase 2B: Asura Scans Adapter (`asurascans`) | DONE | VERIFIED_FROM_SOURCE + VERIFIED_FROM_REPO | 24 adapter tests (369 total) | fba2da3 | REST JSON API adapter + locked content boundary + fixtures + tests + browser flow verified |
| 20 | Phase 2C: KomikNesia Adapter (`komiknesia`) | DONE | VERIFIED_FROM_SOURCE + VERIFIED_FROM_REPO | 65 adapter tests (434 total) | 9b2b49a | AES-256-CBC decrypt adapter + ephemeral X-Device-Id + embedded chapter list + fixtures + tests + CDN allowlist updated |
| 21 | Phase 3: Domain Resolution & Health (`domain-resolver`, `health-engine`, error normalization) | DONE | VERIFIED_FROM_SOURCE + VERIFIED_FROM_REPO | 31 new tests (466 total) | 1d8ebbc | Runtime domain resolution with fallback mirrors, functional layered probes, normalized SourceError, consecutive failure & recovery tracking |




---

## Evidence Labels

- `VERIFIED_FROM_REPO` — confirmed by reading repository source code
- `VERIFIED_FROM_SOURCE` — confirmed by probing upstream API/website
- `INFERRED` — likely based on available evidence
- `PROPOSED` — suggested but not implemented
- `UNKNOWN` — not verified
