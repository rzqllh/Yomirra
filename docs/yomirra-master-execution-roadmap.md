# Yomirra — Master Execution Roadmap P0–P4

## Pembaruan 30 Oktober 2026: keamanan data bacaan

Bagian ini mengoreksi klaim penyelesaian menyeluruh dalam catatan historis di bawah. Pekerjaan saat ini menangani tujuh temuan pada history, penulisan lintas akun, rollback progres, backup/restore, batas impor, dan integritas download. Kontrak perilaku ada di [READING_DATA.md](READING_DATA.md).

- Implementasi dan regresi sudah disiapkan pada branch `fix/reading-data-safety-20261030`; CI PR masih menunggu hasil.
- Pemeriksaan lokal terisolasi: 8 skenario lulus pada kode perubahan; baseline gagal pada 8 skenario yang sama. Ini bukan seluruh suite Vitest atau pengujian layanan nyata.
- Retensi: 512 detail terbaru ditambah ringkasan resume dan milestone per judul. Tidak ada penghapusan otomatis setelah tiga bulan; definisi ketidakaktifan masih keputusan pemilik.
- Release gates tetap terbuka: Firebase lintas perangkat/recovery nyata, iOS/iPadOS PWA terpasang, verifikasi independen Q1–Q175, serta review hak konten/publikasi. Fitur partial dan blocked pada tracker tidak otomatis berubah menjadi verified.
- Tidak ada tag rilis atau kenaikan versi package untuk perubahan ini. Status produksi tidak disimpulkan dari CI.

### Catatan historis

**Status:** Roadmap historis (baseline 2026-10-07); lihat checkpoint integrasi baru di bawah. Gerbang manual dan eksternal tetap terbuka.
**Target repo path:** `docs/yomirra-master-execution-roadmap.md`  
**Role:** Single source of truth for the remaining Yomirra work covered by this roadmap.  
**Execution model:** Reconcile the newest Git/cloud state first, then execute strictly phase-by-phase with a mandatory verification gate after every phase.

## Checkpoint integrasi — 2026-10-09

- `main@e407c46` memuat [Cloud Sync PR #49](https://github.com/rzqllh/Yomirra/pull/49), [Download Engine PR #50](https://github.com/rzqllh/Yomirra/pull/50), dan [Redis Cold-Start PR #51](https://github.com/rzqllh/Yomirra/pull/51), semuanya squash-merged. Ini checkpoint integrasi, bukan penandaan semua item roadmap selesai.
- Angka 189 file / 1.231 tests pada audit 2026-10-07 adalah historis. PR #51 melaporkan 195 file / 1.311 tests lulus sebelum merge; verifikasi CI pada squash commit harus dibaca terpisah.
- Manual smoke Redis remote/serverless, timer download di browser, signed URL lama di Safari, Cloud Sync dua perangkat, dan installed PWA/iOS tetap terbuka; jangan tandai PASS hanya karena CI hijau.
- Perubahan policy AI endpoint, source routing, health semantics, status baca lintas perangkat, CSP, dan durabilitas Redis lanjutan memerlukan keputusan serta scope terpisah. Code dan regression tests di `main` mengungguli checklist historis.


## Current Reconciliation — 2026-10-07

- Post-restructure audit menetapkan `components/chrome`, `components/overlays`, `components/home`, dan `components/komik` sebagai implementation owner tunggal; duplicate implementation dan compatibility proxy lama sudah dihapus.
- Public route `/manga/*`, existing `Manga*` naming, UI behavior, dan persistent data contract tetap dipertahankan.
- Client-safe report, admin, dan source-health contracts dimiliki shared modules; static runtime graph tidak menemukan circular dependency atau client-to-server implementation leak.
- Automated release baseline saat ini adalah 189 Vitest files dan 1.231 tests. Typecheck, full suite, lint tanpa error, production build, dan local production HTTP smoke menjadi gate batch ini.
- Browser interaction, authenticated Admin flows, real-device PWA/iOS behavior, production credentials, deployment, tag, dan destructive branch cleanup tetap merupakan gate/aksi terpisah.

---

## 0. Non-Negotiable Execution Rules

1. **Do not start from a stale local checkout.** Recent work has been performed in cloud/Codex, including an Admin Dashboard revamp that may still be on a remote branch/PR when execution starts.
2. **The current Admin Dashboard revamp is an upstream workstream, not a task to reimplement.** First locate its latest branch/commit/PR and reconcile it into the authoritative base. Verify it; do not duplicate its UI work.
3. **Never overwrite unique local work.** Inspect before stash/reset/switching branches. No blind `reset --hard`, force-push, or destructive cleanup.
4. **Do not assume `main` is newest.** Determine the authoritative state using ancestry, unique commits, actual code content, PR state, and deployment state—not timestamps alone.
5. **Do not repeat completed work.** Mark existing implementation as `VERIFIED/DONE` after inspection and tests.
6. **One master roadmap.** This file is the execution source of truth. Existing detailed plans may remain as historical/reference documents, but conflicting instructions are reconciled into this file.
7. **TDD/regression baseline.** Add/update tests for behavior changes where practical; high-risk source, reader, auth, search, migration, and entitlement paths require regression coverage.
8. **No unrelated repo-wide refactors.** Record out-of-scope findings separately.
9. **No unnecessary packages.** Reuse Next.js 16, React 19, TypeScript, Zustand, Vitest/Testing Library, existing Redis/server utilities, and current UI primitives unless evidence requires otherwise.
10. **No Codex/GPT bot comments or automated PR commentary.** Keep review/PR communication manual unless explicitly requested.
11. **Do not blindly paste plan snippets.** File paths, signatures, line numbers, and example code in prior plans are intent/specification; reconcile them with the actual latest types and architecture before implementation.
12. **Admin secrets must never be hardcoded into the browser bundle.** Any development fallback/default passkey visible in client code must be removed or replaced with a server-only/local-development-safe mechanism before production verification.
13. **Preserve product contracts:**
    - Bookmark is explicit only; rating/collection must not auto-add to Library.
    - User source toggles govern Library/Popular/normal browsing.
    - Search ignores the user's ordinary browsing toggle and may list all runtime-available sources.
    - **Admin kill-switch is authoritative globally:** an admin-disabled source is not usable publicly, including Search/Reader, while internal admin diagnostics may explicitly bypass the kill-switch.
    - Unavailable/down sources must not be offered as active reading sources.
    - Canonical identity, progress, bookmarks, and update state must not be silently discarded.
    - Built-in adapters must be preserved unless a separate explicit migration/removal decision exists.
14. **Redis/runtime configuration must fail safe.** Redis outage, cold start, latency spike, malformed runtime state, or Standby must not crash public SSR. Fall back immediately to the hardcoded built-in registry where appropriate.
15. **Every phase has a hard gate:** update changelog → targeted tests → full relevant tests → typecheck → lint → production build → manual smoke checks → diff/status review → clean checkpoint commit.
16. Confirm actual commands from `package.json`; do not invent scripts. Expected equivalents are `pnpm vitest run`, `pnpm typecheck`, `pnpm lint`, and `pnpm build`.

---

# Phase 0 — Local / Remote / Cloud / Admin-Revamp Reconciliation

**Priority:** P0 / mandatory prerequisite  
**Difficulty:** Easy–Medium  
**Blocks:** Everything else

## Goal

Make the local repository match the newest safe Yomirra state, including the Admin Dashboard revamp currently being developed in cloud/Codex, before any new roadmap work begins.

## 0.1 Inspect local state before touching anything

Capture:

- current branch and HEAD SHA;
- `git status` including untracked files;
- local branches/tracking status;
- configured remotes;
- recent local history;
- local unique commits/uncommitted changes.

Do not stash/reset first. Determine whether the local state contains unique work.

## 0.2 Fetch and inspect all remote/cloud state

Run the safe equivalent of:

```bash
git fetch --all --prune
```

Inspect:

- `origin/main`;
- active remote feature branches;
- cloud/Codex branches;
- open/recent PRs when GitHub access is available;
- CI status;
- current Vercel production deployment;
- ahead/behind counts and unique commits.

Useful inspection commands may include:

```bash
git branch -vv
git branch -a
git log --all --graph --decorate --oneline --date-order -n 150
git rev-list --left-right --count <A>...<B>
git log <A>..<B> --oneline
git log <B>..<A> --oneline
```

## 0.3 Locate the current Admin Dashboard revamp

The latest known revamp touches the Admin portal UI around:

- `admin-layout.tsx`;
- Overview;
- Sources;
- Search;
- Reports;
- Site;
- Telemetry;
- core source modal;
- custom source modal;
- admin portal tests.

Do not assume these exact paths are unchanged. Identify the real current branch/commit by Git evidence.

Required actions:

1. Locate the branch/PR/commit containing the latest Admin revamp.
2. Compare it with local and `origin/main`.
3. Preserve any unique commits.
4. If the Admin revamp is complete and valid, reconcile it into the authoritative base before Phase 1.
5. If it is already merged, verify rather than reimplement.
6. If it is incomplete but contains required unique work, preserve it and finish/reconcile only what is necessary to establish a coherent handoff; do not silently discard it.

## 0.4 Security handoff check for Admin

Before treating the Admin revamp as production-ready, inspect authentication behavior and client bundles.

Mandatory requirement:

- no production/default admin passkey, secret, token, or equivalent privileged credential may be embedded in a Client Component or browser bundle;
- development-only convenience must be gated safely and remain server/local-only;
- admin APIs remain server-authorized regardless of UI state.

This is a **P0 production blocker**.

## 0.5 Determine authoritative latest state

Decision rules:

1. If `origin/main` contains all required local/cloud/Admin work, fast-forward local safely.
2. If a remote feature/PR branch contains newer valid work not in `main`, inspect and reconcile it first.
3. If local has unique commits/uncommitted work, preserve before switching/updating.
4. If histories diverge, compare unique commits and reconcile intentionally.
5. Leave branch deletion for the final phase.

## 0.6 Verify previous work instead of repeating it

Inspect the actual status of:

- PR16 and successors;
- navigation/perceived-performance work;
- previous source fixes;
- canonical/search work;
- `future_dev.md` and prior specs/plans;
- Admin APIs/services used by the new UI;
- `admin-source-service`;
- `custom-source-service`;
- source health/probe flow;
- any existing runtime-source merger/wiring already produced by another worker.

Mark completed items `VERIFIED/DONE`.

## 0.7 Establish roadmap execution branch

After reconciliation:

1. ensure the base contains all work that must be retained;
2. synchronize local `main` if appropriate;
3. create one dedicated roadmap branch from the authoritative base;
4. record branch name + base SHA in changelog/execution notes.

Recommended naming:

```text
feat/yomirra-master-roadmap
```

## Phase 0 Acceptance Gate

- [ ] Unique local work preserved.
- [ ] Remote refs fetched/pruned.
- [ ] Latest Admin revamp branch/commit found and reconciled or verified merged.
- [ ] No privileged admin credential is shipped in the client bundle.
- [ ] Authoritative base selected by ancestry/content.
- [ ] Existing completed roadmap work identified to avoid duplication.
- [ ] CI/deployment baseline recorded.
- [ ] Dedicated roadmap branch created.
- [ ] Changelog updated with reconciliation summary.
- [ ] Baseline targeted/full tests as appropriate pass or pre-existing failures are documented.
- [ ] Typecheck passes or baseline failure documented.
- [ ] Lint passes or baseline failure documented.
- [ ] Production build passes or baseline failure documented.
- [ ] Clean checkpoint commit created.

---

# Phase 1 — P0 Admin Runtime Source Overrides & Public Frontend Wiring

**Priority:** P0  
**Difficulty:** Medium  
**Dependencies:** Phase 0 complete; current Admin revamp and existing admin source/custom-source services reconciled  
**Origin:** Incorporates `docs/superpowers/plans/2026-09-30-connect-admin-sources-to-frontend.md`

## Goal

Connect the Admin source configuration to public runtime behavior without making Redis a public availability dependency.

The hardcoded `sourceRegistry` remains the safe baseline. Runtime core overrides and custom sources are layered on top at request/runtime time.

## Architecture Contract

```text
client-safe sourceRegistry
        ↓
server-only runtime-sources merger
        ├── core overrides from Redis
        └── custom sources from Redis
        ↓
public API / SSR feeds / source resolution
```

Redis failure path:

```text
Redis unavailable / cold / timeout / malformed runtime state
        ↓
catch + log
        ↓
hardcoded built-in sourceRegistry
        ↓
public app continues rendering
```

Admin kill-switch path:

```text
admin override isEnabled=false
        ↓
public source resolution rejects SOURCE_DISABLED
        ↓
Home/Popular/Search/Reader cannot use source

admin health probe
        ↓
explicit allowDisabled=true
        ↓
probe may still diagnose disabled source
```

## 1.1 Runtime Source Merger Service

Expected files, adjusted to actual repo layout if necessary:

- Create: `src/server/lib/sources/runtime-sources.ts`
- Test: `src/server/lib/sources/__tests__/runtime-sources.test.ts`

Expected public server interfaces:

```ts
getRuntimeSources(): Promise<SourceMetadata[]>
getRuntimeSource(id: string): Promise<SourceMetadata | null>
isSourceEnabledServer(id: string): Promise<boolean>
```

Consumes:

- client-safe hardcoded `sourceRegistry`;
- `getCoreSourceOverrides()`;
- `getCustomSources()`.

Required behavior/tests:

- baseline registry returned when runtime config is empty;
- `isEnabled` core override applied;
- active-domain override applied to effective server metadata;
- custom Redis sources merged and marked dynamic using the actual current schema;
- one Redis dependency failing must not necessarily destroy valid data from the other if they are independently recoverable;
- total/unhandled runtime failure falls back to built-in registry;
- normalization handles source IDs consistently;
- malformed runtime entries cannot crash SSR;
- `source-registry.ts` remains client-safe and imports no Redis/server module.

TDD gate:

```bash
pnpm vitest run src/server/lib/sources/__tests__/runtime-sources.test.ts
```

Write/confirm failing tests before implementing missing behavior.

## 1.2 SourceManager Admin Kill-Switch Enforcement

Expected files:

- Modify current source manager implementation.
- Add a focused override/kill-switch test file.

Required contract:

```ts
sourceManager.getSource(
  id,
  manifestUrl?,
  options?: { allowDisabled?: boolean }
)
```

Behavior:

- core source with admin `isEnabled=false` rejects public resolution with structured/recognizable `SOURCE_DISABLED` semantics;
- `allowDisabled: true` bypasses only this runtime kill-switch for internal diagnostics;
- Redis read failure is fail-open to the hardcoded built-in behavior, not a public outage;
- the kill-switch exception itself must not be swallowed by the Redis fallback catch;
- preserve existing source resolution/caching semantics unless evidence requires change.

Prefer a typed/domain error if the existing error architecture supports it. Do not force a string-only error contract if the latest repo has a better established error type.

## 1.3 Public API Wiring

Update public source metadata API to consume `getRuntimeSources()` rather than a raw static registry helper.

Requirements:

- preserve existing rate limit/security behavior;
- endpoint is runtime/dynamic where required;
- response exposes effective source metadata without leaking admin-only secrets/config internals;
- admin-disabled sources may be represented as disabled metadata if that matches current public API contract, but clients must not treat them as usable.

## 1.4 Home SSR Wiring

Update Home server-side source selection to start from runtime sources.

Required filtering semantics:

```text
Admin runtime enabled
AND installed/usable
AND not unavailable
AND not user-disabled for browsing
```

User-disabled-source cookie parsing must fail safely. Invalid cookie data must not crash SSR.

## 1.5 Popular SSR Wiring

Use runtime sources instead of raw `sourceRegistry`.

Popular follows browsing toggles/availability contracts, not Search independence rules.

## 1.6 Admin Health Probe Bypass

Internal Admin diagnostics must use the explicit bypass:

```ts
{ allowDisabled: true }
```

This bypass must be narrowly scoped to authorized admin/internal diagnostic paths.

## 1.7 Search Contract Reconciliation

Because Phase 1 changes the server authority of source state, explicitly verify this distinction:

- **admin-disabled:** unavailable publicly everywhere until re-enabled;
- **user-disabled browsing toggle:** hidden from Library/Popular/home browsing, but still available to Search if runtime/admin availability permits;
- **runtime unavailable/down:** not usable for active reading;
- **custom source:** follows its actual runtime/admin availability and capability metadata.

Do not accidentally make `/api/sources` user-preference-aware if it is intended to represent global runtime availability.

## 1.8 Runtime Plan Regression Tests

At minimum cover:

- no overrides/custom sources;
- disabled core override;
- active domain override;
- custom source merge;
- Redis timeout/offline fallback;
- source-manager public rejection;
- admin diagnostic bypass;
- API behavior;
- Home/Popular runtime filtering where test architecture permits;
- Search does not conflate user browsing toggle with admin kill-switch.

## Phase 1 Acceptance Gate

- [ ] Runtime merger implemented/verified.
- [ ] Built-in adapters remain intact.
- [ ] `sourceRegistry` remains client-safe.
- [ ] SourceManager kill-switch works.
- [ ] Admin probe bypass is explicit and authorized.
- [ ] Public `/api/sources` uses runtime metadata.
- [ ] Home and Popular SSR use runtime metadata.
- [ ] Search/admin/user-toggle semantics remain distinct.
- [ ] Redis failure cannot take public SSR down.
- [ ] Changelog updated.
- [ ] Targeted source/API tests pass.
- [ ] Full relevant Vitest suite passes.
- [ ] Typecheck passes.
- [ ] Lint passes.
- [ ] Production build passes.
- [ ] Manual smoke test covers admin disable → public effect → admin probe → re-enable.
- [ ] Diff/status checked for unrelated changes.
- [ ] Clean checkpoint commit created.

Suggested task-level commits may be used if they fit repo convention, but the phase gate above is mandatory regardless of commit granularity.

---

# Phase 2 — P0 Core Stability

**Priority:** P0  
**Difficulty:** Easy → Hard  
**Dependencies:** Phase 1 complete

## 2.1 Repository / PR / CI hygiene

- Resolve stale PR/CI state that blocks roadmap execution.
- Preserve manual review flow.
- Do not delete active branches yet.

## 2.2 Navigation perceived-performance foundation

Implement/verify:

- dock/navigation active state changes immediately on intent;
- route transition starts immediately;
- destination shell may render before slow content finishes;
- visible PWA/page loading feedback;
- no duplicate navigation events;
- accessibility/focus preserved;
- routine navigation does not generate noisy toasts.

## 2.3 Single scroll owner + page hierarchy cleanup

Standardize primary shells for:

- Home;
- Library;
- Bookcase/Bookmark;
- Search;
- Popular and related browsing pages.

Resolve:

- duplicated headers;
- nested/parent scroll conflicts;
- inconsistent containers/toolbars/section spacing;
- responsive shell mismatch.

## 2.4 Source Registry / Search-State Reconciliation

Build on Phase 1 runtime authority.

- Search source selection lists every runtime/admin-available source even when the user's ordinary browsing toggle is OFF.
- Library/Popular/Home obey user browsing toggles.
- Admin kill-switch wins globally.
- Runtime unavailable source cannot be selected for reading.
- Migrate/remove stale persisted source/search state safely.
- Ensure custom runtime sources participate according to capabilities.

## 2.5 Reader FIFO Image Loading

Implement deterministic top-to-bottom reader scheduling:

- controlled concurrency, target ~2 unless measurement justifies otherwise;
- later pages do not visibly reveal ahead of earlier queued pages in confusing order;
- image failure does not deadlock queue;
- current/next page priority in paged mode;
- resume-reading preserved;
- existing virtualization/placeholders preserved or improved;
- verify long chapters/slow network.

## Phase 2 Acceptance Gate

- [ ] Changelog updated.
- [ ] Navigation/page/source/reader regression tests updated.
- [ ] Targeted tests pass.
- [ ] Full relevant suite passes.
- [ ] Typecheck passes.
- [ ] Lint passes.
- [ ] Production build passes.
- [ ] Browser smoke test: navigation, source settings, Search independence, scroll ownership, FIFO reader.
- [ ] Diff/status clean and scoped.
- [ ] Clean checkpoint commit created.

---

# Phase 3 — P1 Core Reading Experience

**Priority:** P1  
**Difficulty:** Easy → Hard  
**Dependencies:** P0 runtime/source/shell/reader foundations complete

## 3.1 Library UX finishing

- Home-aligned hierarchy/header;
- list/grid/compact behavior;
- progress/update indicators;
- quick actions;
- deterministic filtering/pagination;
- mobile/tablet/desktop behavior;
- explicit-bookmark semantics preserved.

## 3.2 Bookmark / Bookcase UX finishing

- reduce visual noise;
- clear batch delete/edit behavior;
- consistent compact/grid/list modes;
- sticky controls only when useful;
- rating/collection never auto-adds to Library.

## 3.3 Scoped reusable-component consolidation

Consolidate only components proven by stabilized pages:

- PageContainer;
- SectionHeading;
- PageToolbar;
- Search Input;
- tabs/segmented controls;
- badge/chip;
- content cards;
- list/grid toggle;
- confirmation modal;
- settings row;
- loading/skeleton/empty/error states.

No aesthetic repo-wide rewrite.

## 3.4 Reader navigation cleanup

- next/previous chapter transition;
- immediate feedback;
- remove unnecessary toast noise;
- chapter list centers/opens around current chapter;
- compact chapter chips where appropriate;
- drawer/sheet language matches product;
- reading position survives navigation.

## 3.5 Shinigami / Amgadex reliability

Audit adapters independently:

- request path;
- parsing;
- runtime availability detection;
- rate limit/error handling;
- contract compatibility;
- normalization;
- fallback behavior.

Do not weaken global `safeFetch` for one adapter without evidence.

## 3.6 Canonical multi-source hardening — foundation

Stabilize:

- canonical title identity;
- source aliases/title normalization;
- default preferred source vs current session source;
- source switch without identity loss;
- reading progress continuity;
- bookmark continuity;
- update-store orphan cleanup.

Dependency:

```text
runtime source authority → source reliability → canonical identity
```

## Phase 3 Acceptance Gate

- [ ] Changelog updated.
- [ ] Library/Bookmark tests updated.
- [ ] Reader navigation tests updated.
- [ ] Adapter tests/fixtures updated.
- [ ] Canonical/progress behavior tested.
- [ ] Targeted/full relevant tests pass.
- [ ] Typecheck passes.
- [ ] Lint passes.
- [ ] Production build passes.
- [ ] Responsive smoke test completed.
- [ ] Clean checkpoint commit created.

---

# Phase 4 — P2 Search Intelligence Foundation

**Priority:** P2  
**Difficulty:** Medium → Hard  
**Dependencies:** stable canonical model from P1

## 4.1 Search tag parser + filter chips

- structured recognized tags/filters;
- removable chips;
- include/exclude semantics;
- plain-text resilience;
- persist URL/state only if it does not reintroduce stale-source bugs.

## 4.2 Alias / title normalization

Normalize:

- alternate titles;
- punctuation/casing;
- common romanization differences;
- source-specific formatting.

Canonical identity remains separate from fuzzy matching.

## 4.3 Typo tolerance

- exact/strong matches stay dominant;
- bounded fuzzy matching;
- short queries do not explode into unrelated results;
- regression tests for misspellings/near matches.

## 4.4 Persistent canonical catalog

Introduce durable catalog/storage appropriate to current architecture:

- stable IDs;
- source mappings;
- aliases;
- normalized metadata;
- migration strategy;
- incremental updates;
- no accidental dependency on paid/P4 features.

## 4.5 Exact chapter fallback + durable migration

- exact mapping where possible;
- deterministic fallback;
- durable migration state/snapshot;
- progress remains attached to canonical title/chapter;
- failures do not silently corrupt reading state.

## 4.6 Search/ranking quality suite

Fixtures/cases:

- exact title;
- alias;
- typo;
- tag/include/exclude;
- duplicated multi-source title;
- admin-disabled source;
- unavailable source;
- user-disabled browsing source still searchable where allowed;
- custom runtime source;
- chapter/source migration edges.

## Phase 4 Acceptance Gate

- [ ] Changelog updated.
- [ ] Parser/normalization/typo tests pass.
- [ ] Canonical catalog migration tests pass.
- [ ] Ranking quality suite passes.
- [ ] Typecheck passes.
- [ ] Lint passes.
- [ ] Production build passes.
- [ ] Manual exact/alias/typo/tag/source-state search smoke test passes.
- [ ] Clean checkpoint commit created.

---

# Phase 5 — P3 Advanced Discovery

**Priority:** P3  
**Difficulty:** Medium → Very Hard  
**Dependencies:** persistent canonical catalog + search-quality baseline

## 5.1 Related titles — lexical/metadata first

Implement deterministic non-AI baseline first.

## 5.2 Smart collections — basic

Use explainable metadata/history rules before semantic recommendation.

## 5.3 Progressive indexing

- incremental updates;
- index version/migrations;
- recovery path;
- bounded serverless resource usage.

## 5.4 Embeddings / vector layer

Only after catalog/indexing stability.

Defi