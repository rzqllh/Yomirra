# Yomirra Quality, Motion, and Seamless UX Plan

**Status:** Planning only. This PR must not change production code.  
**Scope:** security hardening, motion architecture, navigation continuity, layout/grid, component morphing, reader loading, PWA/offline behavior, accessibility, and performance.  
**Relationship to roadmap:** implementation + tests remain the highest source of truth; the master roadmap remains the higher-level sequence.

## Goal

Make Yomirra feel immediate, calm, and continuous:

- no blank navigation frames;
- no duplicate loading layers;
- no decorative motion that competes with reading;
- state changes visually explain what changed;
- stable layout across viewport sizes;
- predictable overlays, drawers, filters, and back navigation;
- deterministic reader image priority;
- secure production boundaries before visual polish;
- no regression in reduced-motion, keyboard, screen-reader, PWA, or source behavior.

The target is **zero-distraction continuity**, not maximum animation.

## Non-goals

This workstream must not:

- replace the existing icon system globally;
- rewrite every page or component;
- animate for decoration alone;
- add animation-speed/transition-style user settings;
- weaken network/security policy for convenience;
- expose server-only credentials;
- depend on experimental platform behavior without a safe fallback;
- encode one provider's quirks into generic UI contracts;
- combine unrelated roadmap work into the same implementation PR.

## Execution rules

1. Reconcile the latest Git state before every implementation PR.
2. Do not redo merged work.
3. Keep implementation phases independently verifiable.
4. Prefer existing Motion, Next.js, React Query, Zustand, Vaul, Radix, and Yomirra primitives.
5. Add a package only when a phase explicitly requires it and bundle/runtime impact is measured.
6. Use focused regression tests for behavior changes.
7. Reduced-motion behavior is part of acceptance.
8. Mobile Safari/PWA is a first-class target.
9. No hard-coded production credential, privileged identity, token, or secret.
10. Public docs and PR prose remain provider-neutral.
11. No automated bot PR commentary.
12. Do not merge a phase while failures introduced by that phase remain.

Verification baseline:

```bash
pnpm typecheck
pnpm lint
pnpm test --run
pnpm build
```

---

# Phase 0 — Security Preconditions

**Priority:** P0

Do not invest in polished motion while privileged boundaries remain weaker than intended.

## 0.1 Admin authentication must fail closed

Audit `src/server/lib/auth/admin-auth.ts` and every admin entry point.

Required:

- production has no built-in fallback admin credential;
- missing production admin configuration means admin access is unavailable;
- privileged identities/allowlists come from server configuration or verified claims;
- every admin API authorizes server-side regardless of UI state;
- raw credentials are not logged.

Preferred browser flow:

```text
credential / verified identity
→ server verification
→ short-lived server-issued session
→ HttpOnly + Secure + SameSite cookie
→ server authorization
```

If cookie-authenticated mutation routes are used, explicitly address CSRF.

## 0.2 Provider credential hygiene

Audit adapters and server utilities for literal credentials or privileged headers.

Required:

- secrets remain server-only;
- reusable production credentials are not committed as literals;
- optional configuration is validated at the server boundary;
- missing optional credentials produce a clear unavailable/degraded result;
- logs redact authorization headers, cookies, signatures, and secrets.

Never document credential values.

## 0.3 Rate-limit enforcement

A rate-limit helper is not sufficient unless routes use it.

Classify and protect:

- public browse/search;
- image proxy;
- account/sync;
- reports;
- admin reads;
- admin mutations;
- health/probe operations.

Use route-specific namespaces/limits and explicit fail-open/fail-closed policy.

## 0.4 Content Security Policy

Roll out incrementally:

1. `Content-Security-Policy-Report-Only`;
2. observe legitimate runtime origins;
3. remove unnecessary exceptions;
4. add nonce/hash strategy if required;
5. enforce only after browser/PWA smoke verification.

## 0.5 Error disclosure

User-facing errors use generic copy and optional safe identifiers. Internal details stay in logs. Do not render stack traces, signed URLs, source payloads, tokens, or secrets.

### Phase 0 gate

- [ ] Production admin path fails closed when unconfigured.
- [ ] No privileged production fallback credential remains.
- [ ] Provider credentials are server-only/config-driven.
- [ ] Rate limiting is attached to intended route classes.
- [ ] CSP report-only baseline is verified before enforcement.
- [ ] Public errors do not disclose sensitive internals.
- [ ] Security tests, typecheck, lint, tests, and build pass.

---

# Phase 1 — Motion Foundation

**Priority:** P0/P1  
**Goal:** one motion language before adding more animation.

## 1.1 Semantic motion tokens

Keep one source of truth under `src/shared/lib/motion/`.

Proposed vocabulary:

```text
instant         60–90ms      visual state synchronization
feedback        80–120ms     tap/press response
snappy          spring       compact state changes
smooth          spring       shared component/layout movement
surface         160–240ms    drawer/popover/modal surfaces
navigation      140–200ms    page-content continuity
sharedElement   220–320ms    card → detail continuity
```

Tune on real devices. Do not copy values blindly.

Rules:

- avoid arbitrary feature-local duration/stiffness values;
- prefer transform/opacity;
- avoid continuous blur animation;
- avoid large page translations;
- no bounce unless semantically justified;
- transitions must be interruptible where state can reverse quickly.

## 1.2 Motion primitives

Create/reconcile reusable primitives:

- `AnimatedStateIcon`;
- `MorphIcon`;
- `SharedSurface`;
- `PageTransition`;
- press/tap preset;
- layout-transition preset.

Every primitive respects `prefers-reduced-motion`.

## 1.3 Morphicons integration

Morphicons is additive, not a global icon replacement.

Good candidates:

- bookmark ↔ saved;
- grid ↔ list;
- play ↔ pause;
- expand ↔ collapse;
- menu ↔ close;
- visible ↔ hidden;
- notification state when geometry is clean.

Do not morph stable navigation identities simply because route changed.

Requirements:

- package API is hidden behind a Yomirra wrapper;
- reduced-motion policy matches `MotionProvider`;
- imports tree-shake;
- bundle impact is measured;
- a non-morph fallback exists;
- feature components do not import package-specific APIs directly.

### Phase 1 gate

- [ ] Semantic motion tokens exist.
- [ ] Motion primitives respect reduced motion.
- [ ] Touched components stop inventing one-off timing values.
- [ ] Morphicons is isolated behind a wrapper.
- [ ] Bundle impact is recorded.
- [ ] Navigation semantics do not depend on icon animation.
- [ ] Tests/typecheck/lint/build pass.

---

# Phase 2 — Navigation and Loading Continuity

**Priority:** P0/P1

Audit overlap between:

- navigation intent;
- optimistic dock state;
- progress bar;
- global pending surface;
- route `loading.tsx`;
- page transition;
- page-level skeleton.

Desired flow:

```text
tap
→ immediate press + optimistic active state
→ route transition starts
→ destination shell/skeleton appears if needed
→ content resolves
→ short settle/crossfade
```

## 2.1 Remove duplicate loading layers

There must be one dominant destination loading surface. Prefer route loading/skeleton boundaries over a second full-screen generic overlay when both would be visible.

## 2.2 Delay progress feedback

Fast navigations should not flash a progress line.

Target:

- navigation begins immediately;
- progress appears only after a short pending delay;
- completion exits quickly;
- timeout remains recovery only.

## 2.3 Geometry-preserving skeletons

Destination skeletons must preserve:

- header offset;
- toolbar height;
- card ratio;
- grid/list density;
- gutters;
- bottom-dock safe area.

Skeleton → content should not visibly jump.

## 2.4 Intent-aware scroll restoration

Differentiate:

- browser Back/Forward;
- detail → catalog return;
- explicit navigation to a new destination;
- reader position.

Do not use one pathname-only behavior for all navigation intents.

## 2.5 Focus behavior

- pointer navigation should not steal focus unnecessarily;
- keyboard navigation lands predictably;
- long loading may expose a live-region status;
- drawers/modals restore trigger focus.

### Phase 2 gate

- [ ] No double pending/skeleton layer.
- [ ] Dock responds immediately.
- [ ] Fast navigation does not flash progress.
- [ ] Slow navigation remains visibly responsive.
- [ ] Back/Forward restoration is correct.
- [ ] Reduced-motion navigation is coherent.
- [ ] Mobile Safari/PWA smoke test passes.

---

# Phase 3 — Shared-Element and Component Continuity

**Priority:** P1

## 3.1 Catalog card → detail

Primary shared elements:

- cover;
- title;
- optionally the containing surface when stable.

Do not animate every badge/metadata row.

If the paired element is missing/offscreen, fall back to a short normal transition. Experimental platform/Next behavior is progressive enhancement, not the only production path.

## 3.2 Detail → reader

Reader is a context shift. Keep it simpler:

- CTA responds immediately;
- detail settles/fades;
- reader surface enters;
- no elaborate full-page morph.

## 3.3 Stateful components

Apply controlled continuity to:

- bookmark;
- grid/list toggle;
- accordion/synopsis;
- drawer open/close;
- tabs/segmented indicator;
- switches;
- reader controls.

One dominant motion per interaction.

### Phase 3 gate

- [ ] Card → detail has a safe fallback.
- [ ] Back navigation does not animate from nonexistent geometry.
- [ ] Stateful transitions are interruptible.
- [ ] Animation is never the only state indicator.
- [ ] Reduced-motion path remains clear.

---

# Phase 4 — Layout, Grid, and Overlay System

**Priority:** P1

## 4.1 Container-aware catalog grid

Evaluate replacing viewport-only column counts with container-aware density.

Target:

- stable card width;
- columns respond to available content width;
- desktop rail does not produce awkward density;
- grid/list changes animate layout without chaotic reflow.

Prefer CSS/container-query or auto-fit/minmax approaches where browser support and design targets remain acceptable.

## 4.2 Real `PageContainer` variants

`wide`, `management`, and `focused` must become real layout contracts rather than aliases.

Suggested intent:

- `wide`: discovery/catalog;
- `management`: settings/source/account management;
- `focused`: forms/focused content.

## 4.3 Semantic overlay layers

Use named strata:

```text
base
sticky
dock
popover
sheet
modal
critical/system
```

Touched features should not invent arbitrary z-index values.

Avoid modal-over-modal flows; replace the parent surface with the child flow where practical.

## 4.4 Safe-area and keyboard contract

Create one reusable bottom-surface contract for drawers/sheets/command surfaces/mobile dialogs/reader panels.

It must account for:

- `dvh`;
- `env(safe-area-inset-*)`;
- visual viewport changes from software keyboard;
- footer/action visibility at all snap points.

### Phase 4 gate

- [ ] Grid density is stable across supported widths.
- [ ] PageContainer variants have real contracts.
- [ ] Touched overlays use semantic layers.
- [ ] Bottom actions survive safe areas + keyboard.
- [ ] iOS portrait smoke test passes.

---

# Phase 5 — Filter and Source Capability UX

**Priority:** P1

Filter UI is capability-driven.

Rules:

- provider-backed Genre/Format/Status/Sort appears only when actually supported/supplied;
- local Collection and Reading Status remain local Yomirra filters;
- source switch clears incompatible provider values;
- URL/tag intent is synchronized into drawer state;
- controls are not presented as functional when capability is unavailable;
- application is deterministic and testable.

Add a provider-capability contract matrix instead of relying on one reference source.

### Phase 5 gate

- [ ] Drawer reflects actual capabilities.
- [ ] No stale filters leak across providers.
- [ ] URL/tag state and drawer state agree.
- [ ] Local filters remain independent.
- [ ] Representative capability matrix tests pass.

---

# Phase 6 — Reader FIFO and Perceived Performance

**Priority:** P1

Goal: visible reading pages load in deterministic top-to-bottom priority.

## 6.1 Queue contract

- bounded small concurrency;
- current/nearest pages first;
- later pages cannot consume all bandwidth before earlier pages;
- one image failure cannot deadlock queue;
- small look-ahead prefetch window;
- cancellation/reprioritization on chapter change.

## 6.2 Reveal contract

```text
placeholder reserved
→ bytes arrive
→ decode
→ reveal
```

Avoid visibly revealing lower pages ahead of unresolved earlier queued pages.

## 6.3 Measurement cases

- long chapter;
- throttled mobile;
- one failed image;
- rapid next/previous;
- resume reading;
- PWA/offline chapter.

### Phase 6 gate

- [ ] FIFO/priority tests pass.
- [ ] Failure cannot deadlock queue.
- [ ] Concurrency is bounded.
- [ ] Reader position stays stable.
- [ ] Long-chapter mobile test passes.

---

# Phase 7 — PWA and Offline Hygiene

**Priority:** P1/P2

Audit service-worker and persisted-data lifecycle.

Required:

- explicit cache version/migration strategy;
- incomplete downloads can be cleaned;
- storage pressure/quota is recoverable;
- sign-out distinguishes account state from device-local downloads;
- explicit clear-offline-data clears intended caches/stores;
- private/session data is not treated as reusable public cache;
- stale cached pages cannot override newer security/session state.

### Phase 7 gate

- [ ] Offline reading still works.
- [ ] Cache cleanup is deterministic.
- [ ] Sign-out behavior is explicit.
- [ ] Shared-device cleanup works.
- [ ] Service-worker upgrade is tested.

---

# Phase 8 — Accessibility, Performance, and Final Polish

**Priority:** mandatory final gate

## Accessibility

Verify:

- reduced motion;
- keyboard/focus;
- focus return;
- touch targets;
- accessible names;
- state conveyed without relying on morph alone;
- contrast;
- no infinite decorative motion on critical/error surfaces.

## Performance budget

Record before/after where practical:

- client JS added by motion/icon work;
- navigation interaction latency;
- LCP on Home/detail;
- CLS during navigation and skeleton replacement;
- concurrent card-detail enrichment requests;
- reader image concurrency.

## Card enrichment budget

When list endpoints omit synopsis/metadata:

- fetch only near viewport;
- use React Query dedupe/cache;
- apply a small concurrency budget;
- prefer list/server enrichment where practical;
- avoid N+1 bursts.

## Calm error states

Error surfaces should prioritize:

- clear copy;
- retry;
- offline-aware action when relevant;
- no continuous decorative animation competing for attention.

### Final gate

- [ ] Selected phases completed or explicitly deferred.
- [ ] Tests/typecheck/lint/build pass.
- [ ] No new secret is exposed.
- [ ] Public docs remain provider-neutral.
- [ ] Mobile Safari/PWA navigation smoke passes.
- [ ] Reduced-motion smoke passes.
- [ ] Reader throttled-network smoke passes.
- [ ] Final diff contains no unrelated work.

---

# Scoped Follow-up — Home Opening & Skeleton Geometry

Home opening revamp berjalan sebagai PR terpisah setelah Motion & Navigation Foundation.

## Home opening scope

- compact Home Hero dengan shared global-search entry;
- session-stable decorative cover collage tanpa artwork skeleton;
- source-aware `SOROTAN TERBARU` maksimal lima item;
- conservative cross-source duplicate handling;
- landscape desktop + purpose-built compact mobile Spotlight;
- 6-second restrained carousel autoplay dengan pause/reset dan reduced-motion opt-out;
- source-scoped Top 5 ranking dengan restrained rank-1 hierarchy;
- Home-specific loading geometry yang sama antara route loading, Suspense fallback, dan client hydration.

Lower Home sections tidak didesain ulang kecuali spacing/integration yang langsung dibutuhkan oleh opening baru.

## Separate skeleton geometry workstream

Setelah Home selesai dan visual gate-nya benar-benar diverifikasi, audit skeleton seluruh aplikasi dalam branch/PR terpisah.

Minimum routes: Home, Library, Popular, Search, Rak Buku/Bookmark, Downloads, Updates, Manga Detail, Reader, Settings, dan source-related pages.

Audit membandingkan skeleton terhadap **current final page**, termasuk section order, responsive columns, card ratios, toolbar/header geometry, persisted shell ownership, dan layout shift. Jangan mencampur global skeleton cleanup ke Home PR.

---

# Scoped Follow-up — Page Frame & Discovery Consistency

This follow-up supersedes the earlier assumption that whole routes need different outer maxima.

## Locked contract

- all ordinary destination pages share one canonical outer frame/gutter;
- `PageContainer` owns route alignment, not page-specific max-width;
- narrower utility/management content uses an inner `ContentLane`;
- Sumber, Unduhan, and Pengaturan keep the canonical mobile `PageHeader` but do not duplicate a desktop title banner below TopNav;
- Pengaturan uses explicit desktop stacks, never CSS newspaper columns;
- the user's discovery toggle controls Beranda + Library + Populer;
- Search remains independent from that user toggle;
- runtime/system eligibility remains separate from user preference;
- Library without an explicit source resolves to the first eligible discovery source instead of a hard-coded provider;
- Populer must not silently disappear an eligible source solely because its feed request failed.

## Verification

- compare left/right route edges at desktop widths;
- verify mobile fixed headers remain present and reserve safe space;
- verify focused/management lanes constrain only inner content;
- verify source toggle behavior across Home, Library, Popular, and Search;
- verify Settings one-column and two-column hierarchy;
- verify Home Hero/Spotlight/Top-5 residual geometry;
- run focused tests, full test suite, typecheck, lint, build, and browser/preview smoke when the environment permits.

---

# Recommended Implementation PR Split

Do not implement this plan in one production PR.

1. **Security boundary PR** — Phase 0.
2. **Motion foundation + navigation PR** — Phases 1–2.
3. **Component continuity + layout PR** — Phases 3–4.
4. **Filter capability PR** — Phase 5 only if remaining gaps exist.
5. **Reader FIFO PR** — Phase 6.
6. **PWA/offline hygiene PR** — Phase 7.
7. **Accessibility/performance cleanup PR** — Phase 8.

Each implementation PR must reconcile the latest merged state first and finish with its own gate.
