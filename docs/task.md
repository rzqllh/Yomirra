# Yomirra Quality, Motion, and Seamless UX Tasks

**Status:** Execution checklist for `docs/plan.md`.  
**Rule:** Do not start implementation from this document until the planning PR is approved/merged.  
**Completion:** A task is complete only when implementation, focused verification, and the listed acceptance criteria pass.

## T0 — Preflight

- [x] **T0.1** Fetch/reconcile latest `main`; inspect active PRs and avoid duplicate work.
- [x] **T0.2** Record baseline SHA for the implementation PR.
- [x] **T0.3** Run baseline typecheck, lint, relevant tests, and build.
- [x] **T0.4** Record proven pre-existing failures before changing production code.
- [x] **T0.5** Confirm no public docs/PR prose requires provider-specific naming.

**Gate:** clean scoped branch, known baseline, no duplicated work.

**T0 execution record (2026-10-01):**
- authoritative base: `main@63377000eed88c4c53341ff94becafdbadaa1bc6`;
- active implementation branch: `fix/security-boundary-hardening`;
- open PRs at branch creation: none;
- baseline CI from the docs-only planning PR: typecheck PASS, lint PASS, tests FAIL with four pre-existing regressions (listing compact-card QueryClient provider, two synopsis-normalizer expectations, one source-detail synopsis expectation);
- baseline production/preview build: Vercel READY on the same docs-only code path, so production build succeeds independently of the failing test gate;
- public planning docs were checked for provider-specific restricted naming and credential literals: none found.

---

# T1 — Security Boundary PR

## Admin authentication

- [x] **T1.1** Audit `src/server/lib/auth/admin-auth.ts` for production fallback credentials and hard-coded privileged identities.
- [x] **T1.2** Remove production fallback credential behavior.
- [x] **T1.3** Make missing production admin configuration fail closed.
- [x] **T1.4** Move allowlists/privileged identities to server configuration or verified claims.
- [x] **T1.5** Verify every admin API uses server-side authorization.
- [x] **T1.6** Add tests for configured, unconfigured, invalid, expired/invalid-token, and authorized states.
- [x] **T1.7** Decide whether browser admin auth remains direct-token based or moves to a short-lived server-issued session.
- [x] **T1.8** If cookie mutation auth is used, add CSRF protection/validation and tests.

**Admin-auth task record:**
- production fallback credential behavior removed; unrelated operational secrets are no longer accepted as admin credentials;
- hard-coded privileged identity allowlisting removed in favor of configured emails or verified Firebase admin claims;
- browser passkeys are exchanged server-side for an 8-hour signed HttpOnly, Secure-in-production, SameSite=Strict session scoped to admin APIs;
- the legacy browser key cookie is actively expired and raw passkeys are no longer stored in browser storage;
- session-authenticated mutations require same-origin `Origin` validation; direct server/API-key automation remains separately authenticated;
- all admin API routes were audited for server authorization, with the report-action route standardized on the common guard;
- regression coverage now includes unconfigured, invalid, valid API key, signed session, expired/tampered session, CSRF rejection, Firebase claim/allowlist, portal unlock, and legacy-cookie cleanup;
- verification on CI after the auth changes: typecheck PASS, lint PASS, auth/admin regressions PASS; the only remaining full-suite failures are the four pre-existing T0 baseline failures;
- Vercel preview build for the same auth implementation is READY.

## Provider credential hygiene

- [x] **T1.9** Search server/adapters for literal reusable credentials or privileged headers.

**Provider-credential audit record:**
- one built-in restricted adapter contained a reusable privileged request-header value committed as a literal;
- a separate decryption salt in that adapter is protocol material rather than an authorization credential and is not treated as the same risk class;
- deployment-secret availability was confirmed before removing the literal so remediation did not require an unsafe fallback.
- [x] **T1.10** Move required secrets to server-only configuration.
- [x] **T1.11** Define safe behavior when optional provider credentials are missing.
- [x] **T1.12** Ensure logs redact credential-bearing headers, signed URLs, cookies, and tokens.
- [x] **T1.13** Add focused tests for missing/malformed provider configuration.

**Provider-credential remediation record:**
- the reusable privileged upstream header is now sourced only from server environment configuration;
- the committed literal credential and duplicate header spelling were removed from the adapter;
- missing configuration fails closed before any upstream request is attempted, while source registry construction remains available so failure stays isolated to that optional source;
- dependency-injected test clients remain usable without production credentials;
- focused regression coverage verifies missing and whitespace-only configuration;
- shared logger regression coverage verifies redaction for credential-bearing fields, cookies/tokens, signatures, signed URLs, nested error data, and circular/truncated structures;
- the required server-only variable is declared in `.env.example` without documenting its value.

## Rate limiting

- [x] **T1.14** Enumerate public browse/search, proxy, account/sync, report, admin read, admin mutation, and probe routes.

**Rate-limit classification record:**
- admin destructive/expensive mutations (source flush/probe, search warm/simulate, report actions, custom-source test/write) require tight namespaced limits and fail closed when the limiter is unavailable;
- public expensive compute/search endpoints use namespaced limits; search-intelligence keeps its strict fail-closed policy and global source search now uses an explicit public-search policy;
- signed image proxy is bandwidth-expensive but high-volume by design, so any limiter must be materially looser and must not interfere with sequential reader image loading;
- authenticated cron/webhook endpoints keep credential verification as the primary boundary; the Telegram command path already has a chat-scoped Redis limiter and should not receive a redundant IP limiter;
- lightweight health/site/source metadata reads are not priority targets for the first hardening pass;
- limiter identity must follow the trusted deployment proxy chain rather than accepting an arbitrary client-supplied forwarded address.
- [x] **T1.15** Define namespaces + limits per route class.
- [x] **T1.16** Attach the existing rate-limit utility to intended routes.
- [x] **T1.17** Explicitly choose fail-open/fail-closed behavior per route class.

**Rate-limit policy contract:**
- `admin-mutation`: 30 requests / 60 s per trusted client identity, fail closed; individual high-cost operations may use a stricter sub-namespace;
- `admin-expensive` (probe all, search warm/simulate, custom-source test): 10 requests / 60 s, fail closed;
- `public-search`: 120 requests / 60 s, fail open when Redis is unavailable so ordinary discovery does not become an availability dependency;
- `search-intelligence`: retain 10 requests / 60 s, fail closed because it is optional expensive compute;
- `image-proxy`: 600 requests / 60 s, fail open; high ceiling protects bandwidth abuse without fighting reader page bursts;
- `user-report`: 5 requests / 600 s, fail closed;
- authenticated cron/webhook: no additional generic IP policy in this phase; retain credential boundary and existing command-scoped limiter;
- low-cost public metadata/health reads: no limiter in the first pass.
- [x] **T1.18** Add response-header and rejection tests.

**Rate-limit implementation/verification record:**
- common policies are centralized in `src/server/lib/security/rate-limit.ts` and use per-operation namespaces;
- public global search, search intelligence, signed image proxy, and user reports are wired to their explicit policies;
- admin session exchange, source config/write/delete/test, source probe/flush, search warm/simulate, report actions/status, site config, Redis key deletion, and manual ops triggers are rate-limited after authorization where applicable;
- limiter identity uses the right-most forwarded proxy hop with `x-real-ip` fallback instead of trusting the left-most client-supplied forwarded value;
- rejection responses return 429 or 503 according to policy and include limit/remaining/reset plus `Retry-After`; public success responses that expose the limiter include the same rate-limit headers;
- focused tests cover trusted proxy identity, fail-open public search, fail-closed admin mutation, 429/503 rejection headers, global-search response headers, and admin-session rejection;
- CI at `1f30154293de468b7d1c38396d13da0493b0360b`: typecheck PASS, lint PASS, new credential/rate-limit/admin-session/search regressions PASS; full suite is back to the four pre-existing T0 failures only.

## CSP + error disclosure

- [x] **T1.19** Add CSP report-only baseline.
- [ ] **T1.20** Verify Next/Firebase/assets/connect requirements in browser/PWA.

**T1.20 deployment-level verification (partial):**
- production Home and Account return HTTP 200 with the expected report-only CSP;
- the public PWA manifest is served as `application/manifest+json`;
- the public Service Worker is served as JavaScript;
- the CSP includes the current Next.js self/inline bootstrap requirement, HTTPS assets/API, WebSocket, Firebase auth frame hosts, blob workers, and manifest;
- the merged production deployment showed no warning/error runtime logs during this verification window;
- unauthenticated admin smoke fails closed as designed, but production currently reports admin auth as **unconfigured** (HTTP 503), which means an authorized admin smoke cannot pass until the production admin credential/Firebase Admin configuration is provisioned;
- **remaining:** provision/confirm production admin auth, then run authorized admin smoke, interactive Firebase popup flow, and installed-PWA/iOS Safari smoke. This item stays open until those real-browser/configuration checks are available; report-only CSP must not be promoted to enforcement before that check.

- [x] **T1.21** Document required directives in code/config comments, not credential values.
- [x] **T1.22** Remove raw internal `error.message` from user-facing generic error surfaces.
- [x] **T1.23** Preserve safe logging/digest identifiers.
- [x] **T1.24** Add security regression tests.

**CSP/error-disclosure implementation record:**
- browser responses now carry a `Content-Security-Policy-Report-Only` baseline covering self-hosted Next.js boot/chunks, inline boot/style requirements, HTTPS images/assets/API calls, WebSocket connections, Firebase auth frame hosts, blob workers, fonts, and the PWA manifest;
- required directives are documented next to the header configuration and deliberately remain report-only until interactive browser/PWA smoke is complete;
- generic ErrorBoundary, source-browse failure, manga-detail failure, and custom-source admin API failures no longer echo raw exception/upstream messages to users;
- global error reporting keeps only non-sensitive correlation data (digest, error name, pathname) while shared server logging retains sanitized diagnostic detail;
- focused regression coverage for CSP/error-disclosure passes together with logger, rate-limit, search-failure, admin-session, and manga-detail security coverage;
- Vercel preview for the report-only CSP build returned HTTP 200 with the expected CSP report-only header, and a later preview containing the error-disclosure changes reached READY;
- CI at `909ca43839ef87e9f0f99ba34c9250d0a3406c6d`: typecheck PASS, lint PASS, security-surface and disclosure tests PASS; the full suite remains limited to the four pre-existing T0 failures;
- **T1.20 remains open** for interactive Firebase auth + installed-PWA/iOS browser smoke and production admin authorized smoke; public manifest/Service Worker delivery is now verified, but static/deployment evidence alone does not prove the interactive flows.

**Final stabilization record (2026-10-01):**
- the four T0 baseline failures were repaired without weakening production contracts: CompactCard tests now provide QueryClient context, and stale adapter synopsis fixtures/expectations now follow the shared normalizer contract;
- reader history semantics were corrected so detail → reader and reader → detail use replace semantics where appropriate, internal `returnTo` preserves the logical parent, and chapter changes do not leave stale reader routes in history;
- regression coverage now includes safe return-target validation, parent-preserving chapter/continue-reading links, and ReaderShell back replacement;
- final CI at `62859d2e2642700bd411d8c94502ca916c8dd671`: typecheck PASS, lint PASS, **150/150 test files PASS, 1000/1000 tests PASS**, and production build PASS;
- public documentation was re-aligned in README/CHANGELOG and provider-neutral security/developer docs; no production credential value is documented;
- T1.20 and manual admin browser smoke remain separate interactive checks; CSP stays report-only until that browser/PWA verification is completed.

### Security PR gate

- [x] Focused auth/security tests pass.
- [x] Typecheck passes.
- [x] Lint passes.
- [x] Full relevant test suite passes.
- [x] Production build passes.
- [ ] Manual admin unauthorized/authorized smoke passes.
- [x] No secret appears in client bundle/public docs.

---

# T2 — Motion Foundation + Navigation PR

## Motion tokens and primitives

- [x] **T2.1** Inventory feature-local animation durations/springs.
- [x] **T2.2** Reconcile semantic motion tokens in `src/shared/lib/motion/`.
- [x] **T2.3** Update `MotionProvider` defaults only if evidence requires it.
- [x] **T2.4** Create `AnimatedStateIcon` primitive.
- [x] **T2.5** Create `MorphIcon` wrapper with reduced-motion fallback.
- [x] **T2.6** Create/reconcile shared press/tap preset.
- [x] **T2.7** Create/reconcile shared layout-transition preset.
- [x] **T2.8** Create/reconcile `PageTransition` behavior.
- [x] **T2.9** Add primitive tests including reduced-motion behavior.

**Motion-foundation record:**
- feature-local motion had multiple hard-coded springs/durations, including a 100 ms page transition, a separate dock spring, and immediate navigation feedback; semantic tokens now own page, layout, press, and navigation-feedback timing;
- the global MotionProvider keeps the same proven spring behavior but consumes the shared layout token;
- `AnimatedStateIcon` and `PageTransition` respect user reduced-motion preference and have focused regressions;
- `DirectionalTransition` remains only as a compatibility alias so new code has one page-transition owner.

## Morphicons

- [x] **T2.10** Verify current package API/version/license at implementation time.
- [x] **T2.11** Add dependency only after wrapper design is fixed.
- [x] **T2.12** Measure bundle delta.
- [x] **T2.13** Keep package-specific imports out of feature components.
- [x] **T2.14** Implement only approved morph pairs first: bookmark, grid/list, disclosure, play/pause or equivalent supported pairs.
- [x] **T2.15** Keep stable route identities non-morphing.

**Morphicons record:**
- package/API checked at implementation time: `morphicons` 1.7.1, MIT, React binding at `morphicons/react`, raw SVG path input supported, and user reduced-motion supported;
- dependency is isolated behind `src/components/motion/morph-icon.tsx`; a regression test rejects direct package imports from feature components;
- only the approved first pair data is staged (bookmark, grid/list, disclosure, playback); route/navigation identity icons are intentionally unchanged;
- active production import-graph delta for Morphicons is **0 B at this foundation stage**: the wrapper is intentionally not imported by any production feature/route yet, and a regression test locks that zero-consumer state; package cost becomes measurable in the application bundle only when T3 adopts an approved pair.

## Navigation continuity

- [x] **T2.16** Audit `AppShell`, navigation intent, route loading, page loading, and `DirectionalTransition`.
- [x] **T2.17** Identify and remove duplicate full-screen pending/skeleton behavior.
- [x] **T2.18** Preserve optimistic dock active state.
- [x] **T2.19** Delay progress indicator so fast navigation does not flash it.
- [x] **T2.20** Ensure recovery timeout does not become the normal completion mechanism.
- [x] **T2.21** Align each route skeleton geometry with its final page.
- [x] **T2.22** Add tests for quick navigation, delayed navigation, duplicate-click prevention, and pending cleanup.

**Navigation-continuity record:**
- `AppShell` keeps `pendingHref` immediately for optimistic dock/rail selection but delays the visible progress bar by 180 ms;
- the AppShell full-screen pending skeleton was removed, leaving route `loading.tsx` boundaries as the single loading-surface owner;
- pending cleanup follows actual pathname completion first; the 12-second timer is recovery-only;
- duplicate navigation intent suppression is preserved and covered;
- Home loading geometry was aligned to its final hero/spotlight/continue-reading structure; missing account/source/source-detail loading boundaries were added;
- existing Search, Library, Rak Buku, Popular, Downloads, Settings, and Updates boundaries were normalized to the same PageContainer/header geometry as their final routes; reader/detail keep their dedicated reading geometry;
- visual preview verification remains part of the PR gate, but route skeleton ownership/geometry implementation is complete.

## Scroll/focus

- [x] **T2.23** Replace pathname-only restoration with intent-aware restoration if current behavior fails intended flows.
- [x] **T2.24** Restore catalog position after detail → back.
- [x] **T2.25** Preserve browser Back/Forward restoration.
- [x] **T2.26** Keep reader progress independent from page-scroll restoration.
- [x] **T2.27** Verify focus behavior for pointer and keyboard navigation.
- [x] **T2.28** Return overlay focus to trigger.

**Scroll/focus record:**
- pathname-only sessionStorage scroll restoration and forced `history.scrollRestoration = "manual"` were removed from AppShell so browser/Next Back/Forward restoration is no longer overridden;
- PageHeader prefers native history for Back and only uses a replace fallback when no browser history entry exists, preserving the browser-owned catalog scroll entry instead of synthesizing a fresh navigation;
- reader progress remains isolated from page scroll restoration;
- pointer route transitions do not introduce forced focus, while the triggerless global search overlay records the focused trigger and restores focus on close without navigation;
- focused contracts cover native Back ownership and overlay focus restoration; the PR gate still requires a real browser/device smoke for actual Back/Forward scroll position, reduced motion, and iOS/PWA behavior before merge.

### Motion/navigation PR gate

- [x] Fast route transitions do not flash a loader.
- [x] Slow route transitions clearly acknowledge input.
- [x] No blank frame/double skeleton.
- [ ] Back/Forward scroll works in a real browser/device smoke.
- [x] Reduced-motion flow works.
- [ ] iOS Safari/PWA smoke passes.
- [x] Typecheck/lint/tests/build pass.

**Final T2 verification record (2026-10-01):**
- delayed navigation feedback is covered by focused timing tests; optimistic active-state and duplicate-intent cleanup remain intact;
- AppShell no longer owns a second full-screen pending skeleton, so route `loading.tsx` boundaries are the single loading-surface owner;
- native browser history owns catalog/Back scroll restoration; focused contracts verify Yomirra no longer overrides it with pathname-only session storage/manual restoration;
- reduced-motion behavior is covered for the shared motion primitives and page transition;
- CI at `5292442bcbe6df094ce6a9c5fe1390711f6c214e`: typecheck PASS, lint PASS, **154/154 test files PASS, 1017/1017 tests PASS**, production build PASS, and static generation 24/24 PASS;
- a branch preview containing the T2 implementation reached READY and its root route returns 200 with the report-only CSP header; later docs-only preview attempts may be skipped by the Hobby build-rate limit, and protected subroutes still do not provide an interactive browser/device surface here, so browser/device-only gates remain open instead of being inferred from HTTP fetches;
- production deployment smoke confirms CSP report-only, manifest, and Service Worker delivery, but interactive Firebase popup + installed-PWA/iOS Safari verification remains T1.20/manual gate work.

---

# Home Opening Revamp — separate stacked PR

**Base:** Motion & Navigation Foundation head; jangan campur ke PR #29.

- [x] Reconcile current Home implementation against the agreed contract.
- [x] Add source-aware Spotlight selection with a one-per-source first pass.
- [x] Keep cross-source dedupe conservative; title-only equality is not sufficient.
- [x] Replace the oversized decorative Hero with a compact shared-search opening surface.
- [x] Keep Hero artwork session-stable, decorative, failure-tolerant, and free of artwork skeletons.
- [x] Rename misleading Spotlight semantics to `SOROTAN TERBARU`.
- [x] Recompose Spotlight for landscape desktop and compact mobile layouts.
- [x] Keep explicit cover/title/CTA targets and a stable carousel container.
- [x] Add 6-second autoplay with hover/focus/touch/visibility pause, manual reset, swipe, and reduced-motion opt-out.
- [x] Keep ranking source-scoped, show Top 5, preserve source context in `Lihat semua`, and use display names.
- [x] Give rank #1 restrained emphasis without podium/gamification.
- [x] Align Home route/Suspense/client loading to one final geometry contract.
- [x] Add focused Hero/Spotlight/selection/ranking/loading regression coverage.
- [x] No new runtime dependency added.
- [ ] Responsive visual matrix is verified in a real browser at ~1440/1280/1024/768–900/430/390/360px.
- [ ] Hover/focus/swipe/reduced-motion behavior is smoke-tested in a real browser.
- [x] Final latest-head typecheck/lint/tests/build pass.
- [x] Final latest-head Vercel preview is READY.
- [x] Final diff is reviewed for unrelated work and provider/secret leakage.

**Automated final checkpoint (2026-10-01):** Home head `127701d0f39b35856e98c9c97d97bd4e93f66576` passed the latest GitHub CI pipeline and its Vercel preview reached READY. The stacked Home-only diff against `feat/motion-navigation-foundation` was reviewed as scoped to the agreed Home opening implementation/tests/docs, with no restricted provider wording or credential value found in the public documentation audit. Real-browser responsive and interaction smoke remains open and is not inferred from CI/Vercel.

**Manual-gate note:** Chromium exists in the execution container, but the container cannot resolve/reach the public preview host. Do not infer the responsive/browser matrix from jsdom, static source inspection, HTTP metadata, or Vercel READY alone.

## Skeleton Geometry Consistency — follow-up PR only after Home visual gate

- [ ] Compare every route skeleton against the current final page.
- [ ] Remove obsolete section orders and legacy card geometry.
- [ ] Match responsive columns, card ratios, toolbar/header placement, and container width.
- [ ] Avoid redundantly skeletonizing persisted shell.
- [ ] Verify grid/compact modes where applicable.
- [ ] Verify mobile + desktop replacement does not create obvious CLS.
- [ ] Keep final diff skeleton/loading scoped.
- [ ] Typecheck/lint/tests/build pass.

---

# T3 — Component Continuity + Layout PR

## Shared elements

- [ ] **T3.1** Define stable card/detail identity key.
- [ ] **T3.2** Implement cover continuity with safe fallback.
- [ ] **T3.3** Implement title continuity only if it remains stable across responsive layouts.
- [ ] **T3.4** Do not shared-transition every metadata element.
- [ ] **T3.5** Verify detail → back when original card is in viewport.
- [ ] **T3.6** Verify fallback when original card is offscreen/unmounted.
- [ ] **T3.7** Keep experimental platform transition APIs behind progressive enhancement.

## Stateful component morphs

- [ ] **T3.8** Replace bookmark bounce/swap with a calmer state morph.
- [ ] **T3.9** Morph grid/list toggle and animate layout reflow.
- [ ] **T3.10** Morph disclosure icon and animate synopsis expansion without content pop.
- [ ] **T3.11** Align tab/segmented indicator motion.
- [ ] **T3.12** Align switch state motion.
- [ ] **T3.13** Review reader control morph candidates.
- [ ] **T3.14** Verify interrupted/reversed state changes.

## Grid/layout

- [ ] **T3.15** Measure current catalog card widths across phone/tablet/desktop rail states.
- [ ] **T3.16** Prototype container-aware grid.
- [ ] **T3.17** Set min/max card-width rules from design, not arbitrary breakpoint count.
- [ ] **T3.18** Verify compact layout independently.
- [ ] **T3.19** Prevent grid/list mode change from resetting scroll.
- [ ] **T3.20** Make `PageContainer` variants materially different.
- [ ] **T3.21** Migrate only touched pages to the new variants.

## Overlay/safe area

- [ ] **T3.22** Define semantic z-index tokens.
- [ ] **T3.23** Replace arbitrary z-index values in touched overlay primitives.
- [ ] **T3.24** Create/reconcile shared bottom-surface safe-area contract.
- [ ] **T3.25** Account for software keyboard/visual viewport.
- [ ] **T3.26** Verify footer actions at compact + expanded drawer snap points.
- [ ] **T3.27** Remove modal-over-modal flow where touched.

### Component/layout PR gate

- [ ] Shared-element fallback is safe.
- [ ] Grid density is stable.
- [ ] No scroll reset on view toggle.
- [ ] Bottom actions remain visible.
- [ ] Reduced-motion works.
- [ ] iOS portrait + landscape smoke passes.
- [ ] Typecheck/lint/tests/build pass.

---

# T4 — Filter Capability PR (only if gaps remain)

- [ ] **T4.1** Build a provider capability matrix from runtime metadata and adapter filter contracts.
- [ ] **T4.2** Render provider-backed filter sections only when supported.
- [ ] **T4.3** Keep local Collection/Reading Status independent.
- [ ] **T4.4** Clear incompatible provider filter values on source switch.
- [ ] **T4.5** Synchronize URL/tag intent into drawer state.
- [ ] **T4.6** Make Reset clear both store state and relevant route params.
- [ ] **T4.7** Add representative capability matrix tests.
- [ ] **T4.8** Verify no control is shown as functional when its capability is unavailable.

### Filter PR gate

- [ ] Capability tests pass.
- [ ] URL/drawer/store state agree.
- [ ] Provider switching cannot leak stale filter state.
- [ ] Typecheck/lint/tests/build pass.

---

# T5 — Reader FIFO PR

- [ ] **T5.1** Inspect existing reader image scheduling, virtualization, preloading, and retry behavior.
- [ ] **T5.2** Define queue item state: idle/queued/loading/decoded/failed/cancelled.
- [ ] **T5.3** Implement bounded concurrency.
- [ ] **T5.4** Prioritize current/nearest pages.
- [ ] **T5.5** Add small configurable look-ahead window.
- [ ] **T5.6** Prevent later pages from starving earlier pages.
- [ ] **T5.7** Ensure one failed image releases queue capacity.
- [ ] **T5.8** Cancel/reprioritize on chapter change.
- [ ] **T5.9** Reserve geometry before image decode.
- [ ] **T5.10** Reveal after decode where practical.
- [ ] **T5.11** Test long chapter + throttled network.
- [ ] **T5.12** Test one failed image.
- [ ] **T5.13** Test rapid chapter navigation.
- [ ] **T5.14** Test resume position.
- [ ] **T5.15** Test offline-downloaded chapter.

### Reader PR gate

- [ ] Queue is bounded and deterministic.
- [ ] Failure cannot deadlock.
- [ ] Earlier pages receive priority.
- [ ] Reader position is stable.
- [ ] Typecheck/lint/tests/build pass.

---

# T6 — PWA/Offline Hygiene PR

- [ ] **T6.1** Inventory Cache Storage, persisted Zustand stores, downloads, and reading buffer.
- [ ] **T6.2** Define cache versions and migration policy.
- [ ] **T6.3** Define cleanup for partial/abandoned downloads.
- [ ] **T6.4** Verify clear-offline-data removes intended stores/caches.
- [ ] **T6.5** Keep account sign-out distinct from deleting device-local reading data.
- [ ] **T6.6** Add an explicit shared-device cleanup flow if absent.
- [ ] **T6.7** Verify private/session-sensitive responses are not cached as reusable public data.
- [ ] **T6.8** Test service-worker update from the previous production version.
- [ ] **T6.9** Test offline navigation and offline reader.

### PWA PR gate

- [ ] Offline reading remains functional.
- [ ] Cleanup is deterministic.
- [ ] Service-worker upgrade works.
- [ ] Security/session behavior is not overridden by stale cache.
- [ ] Typecheck/lint/tests/build pass.

---

# T7 — Accessibility + Performance Cleanup PR

## Accessibility

- [ ] **T7.1** Reduced-motion audit across navigation, morphs, drawer, grid/list, shared elements, and error states.
- [ ] **T7.2** Keyboard/focus audit.
- [ ] **T7.3** Focus-return audit for overlays.
- [ ] **T7.4** Touch-target audit.
- [ ] **T7.5** Accessible-name/state audit.
- [ ] **T7.6** Contrast audit on accent, muted metadata, selected chips, disabled states.
- [ ] **T7.7** Remove continuous decorative motion from critical/error surfaces.

## Performance

- [ ] **T7.8** Record client-JS delta from motion/icon work.
- [ ] **T7.9** Record navigation interaction latency before/after.
- [ ] **T7.10** Record LCP on Home and detail.
- [ ] **T7.11** Record CLS around skeleton replacement/navigation.
- [ ] **T7.12** Measure card-detail enrichment request concurrency.
- [ ] **T7.13** Add a small card-enrichment queue/budget if N+1 bursts remain.
- [ ] **T7.14** Confirm React Query dedupe/cache prevents duplicate detail requests.
- [ ] **T7.15** Record reader image concurrency.

### Final quality gate

- [ ] Tests pass.
- [ ] Typecheck passes.
- [ ] Lint passes.
- [ ] Production build passes.
- [ ] Mobile Safari/PWA smoke passes.
- [ ] Reduced-motion smoke passes.
- [ ] Throttled reader smoke passes.
- [ ] No credential appears in client bundle/public docs.
- [ ] Public docs remain provider-neutral.
- [ ] Final diff is scoped.

---

# Stop Conditions

Pause execution and ask for a decision only when one of these is true:

- a security fix requires credential rotation/access not available to the executor;
- implementing the plan would destroy or overwrite unique unmerged work;
- browser/platform support invalidates a required UX contract with no safe fallback;
- a proposed dependency materially increases bundle/runtime cost beyond the agreed budget;
- a phase requires changing a product contract rather than an implementation detail;
- production verification exposes a regression that cannot be resolved inside the current phase scope.

Routine implementation decisions should be resolved from repository evidence and tests without stopping the sequence.
