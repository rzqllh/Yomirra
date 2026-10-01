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

- [ ] **T1.9** Search server/adapters for literal reusable credentials or privileged headers.
- [ ] **T1.10** Move required secrets to server-only configuration.
- [ ] **T1.11** Define safe behavior when optional provider credentials are missing.
- [ ] **T1.12** Ensure logs redact credential-bearing headers, signed URLs, cookies, and tokens.
- [ ] **T1.13** Add focused tests for missing/malformed provider configuration.

## Rate limiting

- [ ] **T1.14** Enumerate public browse/search, proxy, account/sync, report, admin read, admin mutation, and probe routes.
- [ ] **T1.15** Define namespaces + limits per route class.
- [ ] **T1.16** Attach the existing rate-limit utility to intended routes.
- [ ] **T1.17** Explicitly choose fail-open/fail-closed behavior per route class.
- [ ] **T1.18** Add response-header and rejection tests.

## CSP + error disclosure

- [ ] **T1.19** Add CSP report-only baseline.
- [ ] **T1.20** Verify Next/Firebase/assets/connect requirements in browser/PWA.
- [ ] **T1.21** Document required directives in code/config comments, not credential values.
- [ ] **T1.22** Remove raw internal `error.message` from user-facing generic error surfaces.
- [ ] **T1.23** Preserve safe logging/digest identifiers.
- [ ] **T1.24** Add security regression tests.

### Security PR gate

- [ ] Focused auth/security tests pass.
- [ ] Typecheck passes.
- [ ] Lint passes.
- [ ] Full relevant test suite passes.
- [ ] Production build passes.
- [ ] Manual admin unauthorized/authorized smoke passes.
- [ ] No secret appears in client bundle/public docs.

---

# T2 — Motion Foundation + Navigation PR

## Motion tokens and primitives

- [ ] **T2.1** Inventory feature-local animation durations/springs.
- [ ] **T2.2** Reconcile semantic motion tokens in `src/shared/lib/motion/`.
- [ ] **T2.3** Update `MotionProvider` defaults only if evidence requires it.
- [ ] **T2.4** Create `AnimatedStateIcon` primitive.
- [ ] **T2.5** Create `MorphIcon` wrapper with reduced-motion fallback.
- [ ] **T2.6** Create/reconcile shared press/tap preset.
- [ ] **T2.7** Create/reconcile shared layout-transition preset.
- [ ] **T2.8** Create/reconcile `PageTransition` behavior.
- [ ] **T2.9** Add primitive tests including reduced-motion behavior.

## Morphicons

- [ ] **T2.10** Verify current package API/version/license at implementation time.
- [ ] **T2.11** Add dependency only after wrapper design is fixed.
- [ ] **T2.12** Measure bundle delta.
- [ ] **T2.13** Keep package-specific imports out of feature components.
- [ ] **T2.14** Implement only approved morph pairs first: bookmark, grid/list, disclosure, play/pause or equivalent supported pairs.
- [ ] **T2.15** Keep stable route identities non-morphing.

## Navigation continuity

- [ ] **T2.16** Audit `AppShell`, navigation intent, route loading, page loading, and `DirectionalTransition`.
- [ ] **T2.17** Identify and remove duplicate full-screen pending/skeleton behavior.
- [ ] **T2.18** Preserve optimistic dock active state.
- [ ] **T2.19** Delay progress indicator so fast navigation does not flash it.
- [ ] **T2.20** Ensure recovery timeout does not become the normal completion mechanism.
- [ ] **T2.21** Align each route skeleton geometry with its final page.
- [ ] **T2.22** Add tests for quick navigation, delayed navigation, duplicate-click prevention, and pending cleanup.

## Scroll/focus

- [ ] **T2.23** Replace pathname-only restoration with intent-aware restoration if current behavior fails intended flows.
- [ ] **T2.24** Restore catalog position after detail → back.
- [ ] **T2.25** Preserve browser Back/Forward restoration.
- [ ] **T2.26** Keep reader progress independent from page-scroll restoration.
- [ ] **T2.27** Verify focus behavior for pointer and keyboard navigation.
- [ ] **T2.28** Return overlay focus to trigger.

### Motion/navigation PR gate

- [ ] Fast route transitions do not flash a loader.
- [ ] Slow route transitions clearly acknowledge input.
- [ ] No blank frame/double skeleton.
- [ ] Back/Forward scroll works.
- [ ] Reduced-motion flow works.
- [ ] iOS Safari/PWA smoke passes.
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
