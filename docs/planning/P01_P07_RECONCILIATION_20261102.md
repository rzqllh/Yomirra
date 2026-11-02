# Yomirra P01–P07 — Evidence Reconciliation (2026-11-02)

**Purpose:** reconcile the original planning packet with shipped source and verified evidence; this is an evidence ledger, **not a claim that the product is enterprise-release-ready**.

- **Baseline:** `preview@88175e21aa94233a73e95331bcdd1818638c33c1`, after [PR #119](https://github.com/rzqllh/Yomirra/pull/119) squash merge `88175e21`.
- **PR #119 verification:** exact-head `b8b511b94ed2658edfb6979e9160ead6fa302093`, [GitHub Actions #41416213790](https://github.com/rzqllh/Yomirra/actions/runs/41416213790), **Verify & Build PASS; Browser Smoke (Chromium + WebKit) PASS**. This is source-PR CI, not evidence of the merged Preview deployment's runtime.
- **Acceptance baseline:** `ACCEPTANCE_MATRIX.md` has **112 `NOT_RUN` rows** across P00 (5), P01 (23), P02 (16), P03 (28), P04–P05 (21), P06 (12), P07 (7). These are *uncompleted acceptance procedures*, not necessarily unimplemented features. This reconciliation intentionally does **not** change their result column.
- **MAL:** owner confirmed the official Client ID was set in local/Vercel environments and subsequently reported live verification. No credential was read or displayed for this report. A redacted HTTP 200/status=ready/item-count record **for the deployed SHA** is still needed before marking MAL-02's full acceptance `PASS`.
- **Source of truth:** current GitHub tree + named CI run + explicit owner decisions. Earlier Agy CLI prose is useful context but not independent code/runtime evidence.

## Status definitions

- **SOURCE_PRESENT:** implementation and/or automated tests can be located, but its complete acceptance gate remains unproven.
- **PARTIAL:** important code or behavioral contracts still need implementation, integration, or testing.
- **GATED:** requires a real-device/external environment/security/legal/owner-controlled decision to complete.
- **NOT_VERIFIED:** neither an implementation nor all required proof was established within this read-only source reconciliation. It must not automatically be treated as absent.
- **VERIFIED:** used only for the exact observed CI or source fact, never inferred end-to-end readiness.

## Phase-by-phase reconciliation

| Phase | Source evidence already present | Remaining engineering or acceptance | Current recommendation |
| --- | --- | --- | --- |
| **P00** Planning | `MASTER_PLAN.md`, `PHASE_PLAN.md`, `TRACKING.md`, `ACCEPTANCE_MATRIX.md`, P00–P07 handoffs exist. | Source/owner decisions and tracking were behind the Nov 2 implementation; acceptance dates and release evidence are not fully reconciled. | SOURCE_PRESENT; document evidence without laundering historical `NOT_RUN` into PASS. |
| **P01** Canonical identity & content policy | `canonical-search.ts`, `canonical-source-dialog.tsx`, `content-policy.ts`, `manga-card.tsx`, canonical test suites. Shared `isContentVisible` permits UNKNOWN when NSFW is OFF while explicit NSFW is denied. | Verify 0/1/2+ eligible bindings across routes, false-merge/edition corpus, metadata provenance, cached/direct Reader behavior and adult-only provider scope; decide whether any persistent canonical mapping is necessary. | SOURCE_PRESENT/PARTIAL. No automatic unverified MAL→provider mapping, no legacy Library/History mutation. |
| **P02** Reader, state, offline | Reader components, `reader-store.ts`, `backup-engine.ts`, `download-engine.ts`, History/Library stores, fixtures and `use-sync.ts` exist. `sync-retry.ts` is **imported and called** by `use-sync.ts` (Q146 implementation fact). | Q97 Reader preferences are locally persisted, not proven cloud-synced. Q138 durable **per-UID IndexedDB write-behind/replay** is not demonstrated by the existing in-flight promise map. Q146 needs real offline/restart/UID-switch tests. RD/DATA/OFF acceptance, real two-UID Firebase, physical PWA remain pending. | PARTIAL/GATED; do not migrate or rewrite personal data. |
| **P03** Cache, providers, filters | `redis-key-scope.ts` namespacing and bounded SCAN, cache modules, split `/api/health` liveness, provider health snapshots, search error UI and filter components exist. | Confirm actual Preview Redis namespace and cache hits safely; one Redis instance with separate namespaces is owner-approved, but a prefix is **not** credential isolation. Test 403/429/bounded retry, partial errors, real scroll restoration and iOS filter/keyboard interaction. | SOURCE_PRESENT/PARTIAL; runtime test without touching Production keys. |
| **P04** Home, Search, Popular, Library, notifications | `home-hero.tsx`, `popular-page-view.tsx` (tabs “Populer di Yomirra” and “Tren MyAnimeList”), Quick Search, bookmark and toast code exist. | Re-test real reader resume, image/sources loaded, notification truthfulness and four-chapter suggestion, guest/local cloud pending state, source picker and provider error recovery at merged SHA. | SOURCE_PRESENT; UX still needs real runtime acceptance. |
| **P05** Design system, a11y, settings/help | Responsive UI components, design tokens, `/help`, and updated Settings exist. | Visual/accessibility full matrix NOT_RUN. **Discrepancy:** Agy reported dock 16/10px, dynamic skeleton, webtoon continuous bar, mobile toast blur 12px/+26px, and hidden preload intensity as DONE, but `preview@1cf579d` (parent of #119) still contains old/other patterns at the exact files below. Verify CLI working tree vs committed SHA and treat each claim as INCOMPLETE until evidence confirms. | PARTIAL; reconcile actual code before accepting CLI claims. |
| **P06** MAL, AniList, integrations/rights | Official server-only `MAL_CLIENT_ID` adapter, MAL safe `nsfw=white`, ranking UI, `rating-batch` and source integration code exist. Owner states MAL is live and verified. | Capture masked **real** Preview API result/attribution/cover; check mapping identity, rate/usage terms for optional AniList broadening, provider rights and non-mocked integration failures. Do not label local source ranking as actual user usage, nor invent provider ID matches. | MAL configuration OWNER-CONFIRMED, source PRESENT; external acceptance/rights still GATED. |
| **P07** Release QA | PR #119 exact source-head Verify & Build and Browser Smoke PASS. Production PR #79 remains draft under owner control. | Exact **merged** Preview SHA and READY runtime smoke, full functional/offline/UX/security gates, real iOS Safari/PWA/VoiceOver, disposable Firebase UID A/B, Redis incident drill, provider/rights, rollback verification, owner production signoff. | NOT RELEASE READY. |

## Explicit CLI-report/source discrepancies to resolve

Inspection of `preview@1cf579d9` (and its #119 merge parent) showed:

1. `src/components/chrome/bottom-dock.tsx`: outer `rounded-xl`, inner `rounded-lg`, Search `size-14` rather than a claimed outer `rounded-[16px]`, inner `rounded-[10px]`, Search `size-12`.
2. `src/app/(web)/manga/[sourceId]/[mangaId]/read/[chapterId]/loading.tsx`: **two** `aspect-[2/3]` Skeletons remain, not the claimed minimal continuous loader.
3. `src/components/reader/reader-page-scrubber.tsx`: SVG `Array.from({ length: total })` circles and page-count slider remain; no webtoon percentage path in this component.
4. `src/app/(web)/globals.css`: mobile `--mobile-offset-top` still `+16px`; Sonner styles still include `blur(24px)`. The claimed `+26px` / 12px change is not established.
5. `src/components/reader/reader-settings-drawer.tsx`: `preloadIntensity` selection still rendered.
6. `src/components/settings/settings-view.tsx`: “Total waktu membaca” remains visible.

**Interpretation:** these files *were* included in the 85-file `1cf579d9` commit, but the specific reported final changes are not present in the remote content inspected. This could be uncommitted local CLI work, a report/implementation mismatch, or subsequent differences. **Do not mark them DONE, nor redevelop blindly** before checking `git status`, `git diff`, and the actual deployed SHA.

## Confirmed remaining implementation and verification risks

- **Q97:** Reader-setting cloud data contract, precedence, UID scope, and conflict resolution require a separate approved design before writes; no unapproved migration.
- **Q138:** durable offline sync operation journal with idempotency/restart/UID-isolation, separate from the existing download queue and in-flight map.
- **Q146:** exponential backoff + jitter **exists in the code and is invoked**; remaining work is deterministic integration and live recovery evidence, not a fresh implementation from scratch.
- **Q147:** `next.config.ts` still sends `Content-Security-Policy-Report-Only`; blocking enforcement must follow a domain/resource compatibility audit and separate security approval.
- **Content policy:** update legacy Issue #101 prose: general UNKNOWN with no positive adult signal may display normal image/Detail/Reader; no false `SAFE` provenance. Explicit NSFW and adult-only sources remain restricted when OFF. **MAL remains strictly white-only** while OFF.
- **MAL/Redis:** owner no longer needs to register MAL; one Redis instance with per-environment key namespaces is the accepted approach. Capture actual Preview-safe evidence instead of perpetuating obsolete B-01 / new-instance B-10 wording.
- **Out-of-scope/deferred:** automatic legacy data migration, OS background push, and automatic MAL→reading-provider ID mapping are **not new mandatory deliverables**. Physical mobile and Firebase two-UID verification happen at the final acceptance gate.
- **Risk:** `src/shared/lib/canonical-migration.ts` defines executable local data transformation; ensure the approved no-unrequested-migration contract holds at runtime. Static file presence does not prove invocation or safety.

## Next actions in dependency order

1. **P07 current-head gate:** check Vercel READY SHA `88175e21aa94233a73e95331bcdd1818638c33c1` and smoke actual Preview (MAL + Settings guest gating + Quick Search); retain protected Preview access, no secret exposure.
2. **P05 discrepancy triage:** compare owner CLI status/worktree with committed source for the six mismatches above, then targeted functional/visual tests. Do not silently overwrite any local unpushed work.
3. **P01/P02 integrity:** canonical identity false-merges and 0/1/2+ source navigation; RD/DATA/OFF and durable offline sync designs/tests. Q97 schema is separately gated.
4. **P03/P04/P06:** safe Redis hit/namespace proof, provider 403/429 & failures, image/Reader/Popular flow, MAL provenance and third-party terms.
5. **P07 final acceptance:** physical iOS/PWA/VoiceOver, disposable Firebase two-UID, data/privacy/security evidence, deployment/rollback drill; only then owner-controlled production promotion.

## Exit criteria / evidence rules

For every acceptance ID, retain its original test steps, link to an **actual** tested commit/run and observed input/output before changing from `NOT_RUN` to `PASS`. Existing source code alone proves implementation, not pass. No external credential, personal data, billing, production branch or Production release changes are authorized in this reconciliation.

**Verdict:** planning reconciliation identifies real code/document drift; P01–P07 are **not** all accepted, and enterprise Production readiness remains **NO-GO**.
