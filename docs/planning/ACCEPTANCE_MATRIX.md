# Yomirra — ACCEPTANCE MATRIX
Version 1.0-planning | 2026-10-31 Asia/Jakarta
Baseline `preview@02cc664be8c66664ffe9628fcaa68523322f3ce0`
**All cases currently NOT_RUN for this planning packet** unless a later dated exact-SHA evidence entry is appended. Existing fixture tests/older CI are inputs, not current PASS. Every case below needs actual observed result (PASS/FAIL/BLOCKED/NOT_RUN), test actor, commit SHA, test environment and evidence artifact.

## How to execute and record evidence

After implementation, create a compact result line under the relevant phase handoff:
`YYYY-MM-DDTHH:mm+07:00 | ID | SHA | device/browser or CI run | actual | PASS/FAIL/BLOCKED | evidence link | tester`.
Test steps below specify the minimum and must cover both success and failure paths. PR and CI results are checked on the **exact SHA being deployed**. Browser tests cannot replace physical Safari/VoiceOver and fixture tests cannot replace live Firebase/Redis/provider verification.

Mandatory baseline commands: `pnpm typecheck`, `pnpm lint`, `pnpm test --run`, `pnpm build`, `git diff --check`. Device and live requests use disposable safe fixtures; do not expose secrets. Restrict provider probing to permitted, rate-limited traffic. No destructive migrations during tests without backup and approval.

## P00 — Planning and evidence

| ID | Steps / test input | Expected outcome | Minimum evidence | Result |
| --- | --- | --- | --- | --- |
| PLAN-01 | Inspect preview/main SHA, PRs, CI and Vercel deployment metadata | SHA and deployment targets distinguished; no assumed production parity | GitHub and Vercel metadata | NOT_RUN |
| PLAN-02 | Read MASTER_PLAN and old Q1–Q175 decision ledger; spot-check priority conflicts | All owner-approved deltas indexed, conflicts flagged, no silent overrides | doc review diff | NOT_RUN |
| PLAN-03 | Read PHASE_PLAN P00–P07 and prerequisites/rollback | Each phase has scope, dependencies, gates, owner, rollback | doc review | NOT_RUN |
| PLAN-04 | Verify TRACKING, this matrix and 8 handoffs exist and IDs reconcile | Every listed requirement has owner/status/test and phases have continuation | Git tree + crosslink check | NOT_RUN |
| PLAN-05 | Open docs PR against preview; inspect changed files and checks | Documentation-only diff; no accidental main/prod change | PR checks and branch SHAs | NOT_RUN |

## P01 — Canonical identity, source picker and NSFW

| ID | Steps / test input | Expected outcome | Minimum evidence | Result |
| --- | --- | --- | --- | --- |
| CAT-01 | Search work A published by five eligible sources | One card labelled five unique sources | multi-provider API fixture and screenshot | NOT_RUN |
| CAT-02 | Search same title for separate manga/novel/remake/authors | Distinct works not falsely merged; ambiguous match retained separately | false-match fixture | NOT_RUN |
| CAT-03 | Tap verified multi-source card | Source picker opens; no detail route entered yet | browser route assertion | NOT_RUN |
| CAT-04 | Feed healthy, slow, failed and unknown health snapshots to picker | Order follows current capability/budgets; unknown not labelled healthy | health fixture + UI | NOT_RUN |
| CAT-05 | Known binding returns 403/429 while another source healthy | Failed source accurately labelled and healthy remains actionable | source outage fixture | NOT_RUN |
| CAT-06 | Choose provider B's binding for work A | Detail route uses exactly B's `sourceId/mangaId` and fetches B detail | route and request trace | NOT_RUN |
| CAT-07 | Turn NSFW OFF; multi-source work includes adult-only provider | Adult-only binding excluded from visible picker/count without deleting underlying binding | policy test + UI | NOT_RUN |
| CAT-08 | Search page1→page2→Back; repeat query after reload/cache | Canonical card and source count stable, no duplicate reappearance from pagination | browser/navigation fixture | NOT_RUN |
| CAT-09 | Save/read provider A then switch to provider B | Per-provider chapter cursor preserved; no inferred equivalence | history + sync test | NOT_RUN |
| CAT-10 | Remove/change health of source B and restart cache | Work identity/bookmark remain stable; binding status changes only | persistence/mapping test | NOT_RUN |
| CAT-11 | Return to a work last read on healthy B, with healthy A also available | B pinned first but user must explicitly select; if B unhealthy health order wins | picker interaction test | NOT_RUN |
| CAT-12 | MAL ID match to source known/unknown/ambiguous | Auto-binding only when verified identity+edition; ambiguity goes to Cari | verified identity fixture | NOT_RUN |
| CAT-13 | Delete disposable Redis search index; retain durable canonical mapping | Work ID and saved bindings remain stable independent of Redis acceleration | isolated store/cache test | NOT_RUN |
| CAT-14 | Compare paginated, aliased and stale canonical results across restart | Stable exact work key; correction/versioning does not lose saved state | cache/version + restart fixtures | NOT_RUN |
| CAT-15 | Open grid/compact/rank card with (a) exactly 1 eligible source distinct from primary, (b) 2+ eligible sources, (c) zero after disabled/unavailable filtering | (a) exact remaining `sourceId/mangaId` detail opens without modal; (b) manual picker opens and last-used recently healthy is first; (c) click blocked and visible unavailable status, no invalid detail fetch | focused card test, browser route traces, actual Preview screenshot | NOT_RUN |
| NS-01 | Fresh install/profile without settings | `Tampilkan NSFW` OFF and underlying effective hide setting true | UI and cookie test | NOT_RUN |
| NS-02 | With OFF visit Home, Cari, Populer, Jelajah, Library and direct detail/Reader for confirmed NSFW source/title | Confirmed restricted material not rendered/fetched in protected client paths | API/UI/PWA tests | NOT_RUN |
| NS-03 | Work with absent/conflicted content rating; NSFW OFF | Work visible with **`Rating belum terverifikasi`** warning; not labelled SAFE | unknown fixture and screenshots | NOT_RUN |
| NS-04 | Select adult filter/tag then turn NSFW OFF or load old filter URL | Hidden adult-only filter is not applied/visible; unrelated safe genre stays valid | URL/pref test | NOT_RUN |
| NS-05 | In session show NSFW then switch OFF while Reader/recommendations/cache mounted | Confirmed restricted cover/title/images disappear immediately; no destructive data deletion | query/PWA/content-boundary tests | NOT_RUN |
| NS-06 | Reload, logout, guest account, opt back ON and OFF | Explicit user setting persistence and default fallback correct; no UID crossover | two-profile/browser test | NOT_RUN |
| NS-07 | Trigger rating report/correction and unknown-state view | Clear feedback, provenance and warning; no false safe assumption | classification/UI test | NOT_RUN |
| SAFE-07 | Seed stale PWA metadata/image caches for NSFW and switch OFF | Confirmed restricted cached assets not re-exposed; unknown warned; valid offline downloads handled without silent data loss | Service Worker + actual PWA | NOT_RUN |

**Owner decision recorded 2026-11-01 (Issue #101):** general-source UNKNOWN/missing rating may be visible **with explicit warning and no premature image reveal**; MAL safe-mode remains strictly `nsfw=white`. Keep MAL `gray/black/unknown` excluded while NSFW OFF. Disable automatic Library/History patcher without rewriting existing records; this policy approval **does not** count as UI/PWA/two-UID acceptance or authorize migration.

## P02 — Reader, durability, Firebase and offline downloads

| ID | Steps / test input | Expected outcome | Minimum evidence | Result |
| --- | --- | --- | --- | --- |
| RD-01 | Open far-ahead chapter, close before reading | Opening does not grant verified completion or jump milestone | milestone fixture | NOT_RUN |
| RD-02 | Complete chapter 20, reread chapter 5 and scrub pages | Cursor updates for reread but highest milestone remains chapter 20 | 2 chapter histories + DB snapshot | NOT_RUN |
| RD-03 | Simulate broken/locked image and skipped chapter | Neither corrupted chapter nor scrubber alone grants completion | Reader fixture | NOT_RUN |
| RD-04 | Read offline, reload, reconnect and reconcile cloud | Cursor and milestone remain correct; pending local writes retry without rollback | browser + disposable Firebase | NOT_RUN |
| RD-05 | UID A read/save → logout → guest → UID B login | No A state or delayed cloud write leaks to B | isolated 2 UID staging | NOT_RUN |
| RD-06 | Reader detail/Home, dots/slider drag, one-page, RTL, double tap/off, pinch | Correct destinations/pages/gesture priority/persistence without false completion | physical iPhone/iPad + keyboard | NOT_RUN |
| DATA-01 | Save local position then simulate cloud write failure | Local save survives, toast does not claim cloud sync success | local/cache and Firebase failure test | NOT_RUN |
| DATA-02 | Delete vs older snapshot, equal timestamps, re-add after delete | Tombstone precedence and new valid writes correctly reconciled | sync fixture | NOT_RUN |
| DATA-03 | Guest save/login, preview merge, switch UID mid-flight | Explicit merge scope, per-UID boundaries, no unsolicited overwrite | account staging | NOT_RUN |
| DATA-04 | Backup v1–v3 to current, corrupted/missing fields and partial imports | Recover valid records and report invalid without deleting original | export fixture/recovery | NOT_RUN |
| DATA-05 | Populate >512 detailed chapter entries and 100 saved titles | 512-detail retention plus summaries preserve resume/milestone | retention fixture | NOT_RUN |
| DATA-06 | Propose canonical/NSFW migration for legacy mixed-source records | Backup, reversible plan and owner approval before any mutation | migration spec + dry-run | NOT_RUN |
| DATA-07 | Trigger cache purge on fixture Redis with site/source config/audit keys | Only explicitly allowed disposable keys removed; operational keys intact | isolated Redis snapshot | NOT_RUN |
| OFF-01 | Download chapter with one failing page | UI reports partial coverage and offline failure; no false “complete” | download fixture/device | NOT_RUN |
| OFF-02 | iOS low quota, interrupted download and re-open offline | Safe resume/eviction and honest missing-page UI; explicit user downloads preserved | physical PWA | NOT_RUN |
| OFF-03 | Close/reopen offline with old signed image URL | Valid cached copy works; expired URLs not incorrectly reused online | PWA/proxy test | NOT_RUN |

## P03 — Redis, cache, filters, reliability and navigation

| ID | Steps / test input | Expected outcome | Minimum evidence | Result |
| --- | --- | --- | --- | --- |
| ENV-01 | Inspect nonsecret env targets; in isolated Preview perform Redis ping/read/write safe key | Preview uses own approved Redis, not production; config and real HIT observable | env targets + masked test | NOT_RUN |
| CACHE-01 | Expire search/detail/health/short-lived page URLs under provider error | TTL and stale policy respects data type; no unlimited stale content | fake-time/Redis test | NOT_RUN |
| CACHE-02 | Query with two NSFW modes, languages, filters, versions and UID scopes | No key collision, no private/result policy leakage | key contract tests | NOT_RUN |
| CACHE-03 | Simulate Redis unavailable and retry/purge | Public flows degrade within bounds, privileged writes fail closed, no wildcard destructive purge | isolated outage test | NOT_RUN |
| CACHE-04 | Cold-start function, 10 concurrent identical searches | Redis initialization successful when configured; collapse duplicate upstream calls as designed | live Preview timings + unit | NOT_RUN |
| CACHE-05 | Inspect admin telemetry with `yomirra:*`, `source:*`, `rating:*` keys | Accurate bounded namespace counts; SCAN not KEYS; hit/miss measured | isolated Redis and logs | NOT_RUN |
| SEC-01 | Set NSFW OFF cookie then issue direct API request with `hideNsfw=false` query | Effective safety preference cannot be silently bypassed by URL; approved opt-in path still works | API test | NOT_RUN |
| SEC-02 | Test Preview/Production and user A/B cache isolation, credential-bearing URL | No cross-environment, UID or secret disclosure | isolated cache/security tests | NOT_RUN |
| HEALTH-01 | Listing succeeds, chapters/pages fail for sampled source | Health status says exactly what was measured; no false fully-healthy claim | shallow/deep probes | NOT_RUN |
| HEALTH-02 | Read health status after TTL expires/without probe | CheckedAt visible and stale/unknown statuses unambiguously labelled | simulated clock + UI | NOT_RUN |
| HEALTH-03 | Provider gets 403/429 then recovers | Degraded/rate limited/recovered status and cooldown correct | fixture + safe live sample | NOT_RUN |
| HEALTH-04 | Call `/api/health` ten times under source failure | Endpoint lightweight; no repeated upstream full-provider probes induced by liveness checks | request-count trace | NOT_RUN |
| PROVIDER-04 | Simulate 403/429/503/timeouts and Retry-After | Distinct errors, bounded retries and no bypass of provider protection | transport test | NOT_RUN |
| PR-01 | One of five selected providers fails search | Healthy results still appear | multi-source fixture | NOT_RUN |
| PR-02 | Four providers fail simultaneously | One calm summarized banner; expandable per-source diagnostic | mobile screenshot | NOT_RUN |
| PR-03 | Retry one failed provider while other results loaded | Only failed provider retried; active context unchanged | request spy | NOT_RUN |
| PR-04 | All providers down vs zero eligible vs no results | Distinct actionable states and no fabricated empty success | source state UI fixtures | NOT_RUN |
| PF-01 | Search → detail → Back with cached results | Immediate cached results before optional revalidation | browser trace | NOT_RUN |
| PF-02 | Back/Forward after filter/page/source and scrolling | Correct prior query, page, scroll and source selection | Playwright on 3 viewports | NOT_RUN |
| PF-03 | Rapid query/source changes and duplicate mount | Abort stale work and avoid duplicate effective request | request log | NOT_RUN |
| PF-04 | Slow upstream returns stale-valid data | No full blocking skeleton; background update with freshness indication | browser/fixture | NOT_RUN |
| PF-05 | Navigate repeatedly on physical mobile and desktop | No freeze/stacked transition; compare p50/p95 with baseline trace | browser performance profile | NOT_RUN |
| PF-06 | Re-enter reader from saved title then back to Home | Scroll/route preserved and no unnecessary provider refetch | browser/PWA navigation trace | NOT_RUN |
| FL-01 | Open filter sheet on small iPhone Safari with toolbar visible | `Terapkan` always fully visible/clickable above browser chrome | physical screenshot | NOT_RUN |
| FL-02 | Scroll long filter list at 52% then 92% snap | Header/footer stay reachable; body scrolls without clipping | physical touch recording | NOT_RUN |
| FL-03 | Edit draft then Cancel; open, Reset and Apply | Cancel unchanged, Reset draft-only, Apply commits once | test + mobile UX | NOT_RUN |
| FL-04 | Open virtual keyboard, rotate, iPad split view and installed PWA | Footer/input remain reachable, no unintended keyboard jump | device matrix | NOT_RUN |
| FL-05 | Keyboard/VoiceOver/reduced motion/open-close gestures | Modal focus and gesture arbitration correct, accessible labels/actions | a11y/device capture | NOT_RUN |

## P04–P05 — Experience, notifications, help and visual system

| ID | Steps / test input | Expected outcome | Minimum evidence | Result |
| --- | --- | --- | --- | --- |
| HOME-01 | Load Beranda with valid reading history | Continue Reading first and opens exact last safe cursor | home fixture and screenshot | NOT_RUN |
| HOME-02 | Load fresh guest with no history | Discovery-first, no empty Continue Reading block | home fixture | NOT_RUN |
| HOME-03 | All provider endpoints fail during Home hydration | Home shell, local reading and Quick Search remain available | failure browser test | NOT_RUN |
| UX-01 | Click Pusat Bantuan from header/settings | True `/help` route with working Back and focus | route assertion | NOT_RUN |
| UX-02 | Audit Settings gear, Bahasa, shortcuts and display | No deceptive/inert controls; chapter language setting remains functional | interaction audit | NOT_RUN |
| UX-03 | Navigate Home→Cari→Detail→Reader→Detail/Home and back | Named navigation routes and prior scroll/context correct | route/user journey | NOT_RUN |
| UX-04 | Exercise empty/loading/partial/offline/restricted/search/no source states | Distinct honest Indonesian labels and action-oriented recovery | state screenshots | NOT_RUN |
| NOTIF-01 | Trigger progress toast, save action, sync failure | No duplicate/false success, close action, safe-area placement | in-app UI tests | NOT_RUN |
| NOTIF-02 | Complete >3 distinct eligible chapters, with repeats/skips mixed | Single bookmark suggestion once; existing bookmark never removed | Reader integration tests | NOT_RUN |
| NOTIF-03 | Turn update alerts/muted title prefs off | Respect preferences, deduplicate/cooldown | notification fixtures | NOT_RUN |
| NOTIF-04 | Test OS notification claim in installed PWA if included in release scope | No OS-push promise without user opt-in and real device delivery | device validation or approved defer | NOT_RUN |
| BOOK-01 | One-tap save twice and reload | Idempotent bookmark, no accidental toggle on repeated Save | UI/state fixture | NOT_RUN |
| BOOK-02 | Change status/collection and source binding | Work identity preserved and status semantics correct | library state test | NOT_RUN |
| BOOK-03 | Save offline, reconnect with cloud failure | Local save honest; pending cloud sync clearly distinguished | offline/Firebase fixture | NOT_RUN |
| PWA-01 | Open downloaded partial/full chapter offline | Coverage and unavailable pages explicit; cache quota visible | installed PWA screenshot | NOT_RUN |
| DS-01 | Inspect shared button/chip/card/modal radius/border/spacing tokens | Semantic design tokens reused, no arbitrary inconsistent variants | static + screenshot diff | NOT_RUN |
| DS-02 | Run keyboard, contrast, zoom, VoiceOver and reduced motion | Accessible focus, ≥44px interactive touch targets where applicable, readable layout | axe + manual device review | NOT_RUN |
| DS-03 | Compare iPhone/iPad/desktop, light/dark, loading/error states | No regression/clipped modal or visual inconsistency | visual regression artifacts | NOT_RUN |
| HELP-01 | Direct open `/help`, navigate from Settings and header | Server renders real page; title and route correct; Back functional | Playwright | NOT_RUN |
| HELP-02 | Open FAQ source outage, sync, offline, Reader, NSFW warning | Actionable verified guidance; no fabricated feature claim | content review/links | NOT_RUN |
| HELP-03 | Keyboard/screen reader/empty support state and return | Accessible headings, links, focus and actionable help copy | a11y review | NOT_RUN |

## P06 — Integrations, metadata sources and rights

| ID | Steps / test input | Expected outcome | Minimum evidence | Result |
| --- | --- | --- | --- | --- |
| META-01 | Compare MAL/provider/optional AniList title and genre data | Source, classification confidence and timestamp preserved; UNKNOWN warned | normalization fixtures | NOT_RUN |
| META-02 | Audit official AniList terms and existing GraphQL fallback usage | Written permissible-use and rate-budget decision before expansion | current policy/link + owner decision | NOT_RUN |
| META-03 | Render rating from MangaDex vs AniList | Explicit provenance; scores not falsely claimed equal | UI/response fixture | NOT_RUN |
| MAL-01 | Missing `MAL_CLIENT_ID` in Preview | `503 MAL_NOT_CONFIGURED`, honest Populer fallback | HTTP status/body | NOT_RUN |
| MAL-02 | Configure approved Preview key and request real rankings | Official `bypopularity` records, ranks and attribution correct | masked env + live 200 | NOT_RUN |
| MAL-03 | Test MAL white/gray/black/null and safe-mode decision | Existing strict path preserved until owner policy reconciliation, no NSFW false-safe | fixture/product decision | NOT_RUN |
| MAL-04 | Verify cross-provider same/ambiguous/unmatched MAL item | Explicit source search unless verified binding; never fabricated chapter/rank | identity + UI test | NOT_RUN |
| INTEG-01 | Test enabled provider search/detail/chapter/page using allowed live fixture | Working claims backed by real response/images; 403 accurately attributed | safe trace + test report | NOT_RUN |
| INTEG-02 | Test configured Komga/Kavita/Suwayomi/archive and corrupt archive as relevant | Supported scope runs or clearly labelled unavailable, no fake readiness | isolated connector fixture | NOT_RUN |
| INTEG-03 | Inspect admin Redis config/audit, signed image proxy, secret redaction | Durable writes fail-closed; secrets not leaked; logs truthful | security tests | NOT_RUN |
| INTEG-04 | Audit third-party licenses/rights/reporting and optional AI user consent | No unauthorized provider bypass or ungrounded legal claims | rights review / consent tests | NOT_RUN |
| SEC-03 | Use approved legal/security checklist for content/source policies | Release scope and risks reviewed; unresolved rights issues block claim | owner/legal review record | NOT_RUN |

## P07 — Independent release verification

| ID | Steps / test input | Expected outcome | Minimum evidence | Result |
| --- | --- | --- | --- | --- |
| REL-01 | Review all PRs, compare current heads and P0 requirements | No unreviewed code, P0 fails or unresolved dangerous migration | PR/HEAD checklist | NOT_RUN |
| REL-02 | Run typecheck/lint/unit/full build on release candidate | All pass on **same SHA**; failures recorded, never hidden | CI workflow links | NOT_RUN |
| REL-03 | Run browser matrix, source failure, a11y and visual regression | Tested scope passes; known gaps explicitly deferred/blocked | Playwright/artifacts | NOT_RUN |
| REL-04 | Run physical iPhone/iPad Safari/PWA, Reader and filter/VoiceOver | Functional gestures, keyboard/safe areas, offline behavior verified | device OS/SHA recordings | NOT_RUN |
| REL-05 | Run disposable Firebase UID A/B, Preview Redis outage/recovery, provider quota and legal review | Correct isolation/durability/recovery, no missing legal gate | staging evidence | NOT_RUN |
| REL-06 | Verify Vercel target and deployed SHA, billing/quota, rollback | Preview READY exact commit; no accidental production; approved rollback executable | inspector URL/SHA | NOT_RUN |
| REL-07 | Owner reviews release gate and approves deliberate production promotion | Production not changed without signed approval; exact production SHA recorded | owner approval + deployment | NOT_RUN |

## Result append protocol

Do not retroactively edit the original test steps or overwrite failed evidence. Add dated results with actual output, a reproducible issue and next action. On a fail, set TRACKING requirement `IN_PROGRESS` or `BLOCKED` and add it to owning handoff; do not promote unrelated cases. On a blocked physical device or missing env, record `BLOCKED` and expected human action. Full release PASS remains unavailable until actual external tests run.

Crosslinks: [MASTER_PLAN](MASTER_PLAN.md) · [PHASE_PLAN](PHASE_PLAN.md) · [TRACKING](TRACKING.md) · [P00 handoff](handoffs/PHASE_00_HANDOFF.md)


## Automated evidence checkpoints (not full release acceptance)

The tests below **ran and passed** at the cited source PR SHA, but must not be promoted to `VERIFIED` across release gates without exact merged-Preview runtime, security/content-safety, provider, iOS and account validation as applicable. All steps above retain `NOT_RUN` until their *complete* acceptance procedure has evidence. This appendix distinguishes **automated CI PASS** from **live acceptance NOT_RUN/BLOCKED**.

| Partial requirement evidence | PR / source SHA | Observed GitHub workflow | Still missing |
| --- | --- | --- | --- |
| CAT-01 duplicate source binding; CAT-11 last healthy source ordering | #86 `e4ea15f` | [CI 41223026141](https://github.com/rzqllh/Yomirra/actions/runs/41223026141) SUCCESS (Verify & Build + Browser Smoke) | Stable canonical ID, live source health and cross-page/cross-session UX |
| PR-02 summarized partial provider failures | #87 `4fa9860` | [CI 41224083435](https://github.com/rzqllh/Yomirra/actions/runs/41224083435) SUCCESS | Live provider 403/429, actual browser on deployed SHA |
| HELP-01 standalone /help navigation | #88 `f141cada` | [CI 41224161809](https://github.com/rzqllh/Yomirra/actions/runs/41224161809) SUCCESS | Exact-head Preview and device accessibility |
| FL-01/02 mobile visual viewport geometry | #89 `1188f7b` | [CI 41224001961](https://github.com/rzqllh/Yomirra/actions/runs/41224001961) SUCCESS | Physical iPhone Safari keyboard, browser chrome and PWA |
| HOME-01/02 Continue Reading-first for history | #90 `a25e195` | [CI 41224490239](https://github.com/rzqllh/Yomirra/actions/runs/41224490239) SUCCESS | Real eligible history/source availability, exact-head live Home |
| ENV-01 per-branch Redis key scope and admin SCAN | #91 `47e14e5` | [CI 41225659697](https://github.com/rzqllh/Yomirra/actions/runs/41225659697) SUCCESS | Restricted Preview Redis credentials, actual hit/ping, Preview READY SHA |
| NS-01 `Tampilkan NSFW` OFF UI semantics | #92 `3184fd7` | [CI 41227124316](https://github.com/rzqllh/Yomirra/actions/runs/41227124316) SUCCESS | Full UNKNOWN warning across surfaces, opt-in safety end to end |

| SEC-01 opt-in cookie cannot be bypassed by URL | #93 `8d5fa0d` | [CI 41227250647](https://github.com/rzqllh/Yomirra/actions/runs/41227250647) SUCCESS | Live direct API/cookie cross-account test on merged Preview SHA |
| CAT-02 unmatched cluster confidence not falsely HIGH | #94 `f1b453b` | [CI 41227360802](https://github.com/rzqllh/Yomirra/actions/runs/41227360802) SUCCESS | Durable canonical identity, false merge corpus and external IDs |
| CACHE-01 bounded stale expiry/retention | #95 `995e819` | [CI 41227619930](https://github.com/rzqllh/Yomirra/actions/runs/41227619930) SUCCESS | Live Preview Redis availability and measurable stale tests |
| NOTIF-02 four-chapter prompt persists across sessions | #96 `44513d3` | [CI 41227852748](https://github.com/rzqllh/Yomirra/actions/runs/41227852748) SUCCESS | Physical Reader completion/UID/offline acceptance |

**Blockers carried forward:** B-02 physical Safari, B-03 disposable Firebase 2 UIDs, B-04 legacy mixed data, B-06 Vercel exact Preview READY/build quota, B-10 isolated Preview Redis access, B-11 AniList terms. Do not count the docs PR or source PR unit tests as proof that these external gates passed.

