# Yomirra — Grill Decision Register

## Pembaruan 30 Oktober 2026: keamanan data bacaan

Bagian ini mengoreksi klaim penyelesaian menyeluruh dalam catatan historis di bawah. Pekerjaan saat ini menangani tujuh temuan pada history, penulisan lintas akun, rollback progres, backup/restore, batas impor, dan integritas download. Kontrak perilaku ada di [READING_DATA.md](READING_DATA.md).

- Implementasi dan regresi sudah disiapkan pada branch `fix/reading-data-safety-20261030`; CI PR masih menunggu hasil.
- Pemeriksaan lokal terisolasi: 8 skenario lulus pada kode perubahan; baseline gagal pada 8 skenario yang sama. Ini bukan seluruh suite Vitest atau pengujian layanan nyata.
- Retensi: 512 detail terbaru ditambah ringkasan resume dan milestone per judul. Tidak ada penghapusan otomatis setelah tiga bulan; definisi ketidakaktifan masih keputusan pemilik.
- Release gates tetap terbuka: Firebase lintas perangkat/recovery nyata, iOS/iPadOS PWA terpasang, verifikasi independen Q1–Q175, serta review hak konten/publikasi. Fitur partial dan blocked pada tracker tidak otomatis berubah menjadi verified.
- Tidak ada tag rilis atau kenaikan versi package untuk perubahan ini. Status produksi tidak disimpulkan dari CI.

### Catatan historis

Last reviewed: 2026-10-25. **13-round interview CLOSED.** All Q1–Q175 accepted, with revised-and-accepted Q52 and Q63. See [the authoritative final ledger](GRILL_FINAL_LEDGER.md). This remains a product decision record, not an execution specification, acceptance report, release sign-off, or authorization to change production code.

## Status convention

- **Agreed**: explicitly accepted in the conversation; can be challenged when new evidence shows an unresolved conflict.
- **Revised / pending detail**: user supplied a correction, but edge cases remain undecided.
- **Open**: no decision; never treat a recommendation as approval.
- Repository production implementation is not presumed to satisfy any agreed product constraint.

## Agreed rounds

| Round | Decisions | Confirmed scope |
| --- | --- | --- |
| 1 | Q1–Q6 agreed | Pure iOS-first PWA; adaptive Liquid Glass preserving editorial identity; Library is discovery catalog and Rak Buku personal collection; value- and platform-aware parity; curated source adapters; local-first user-data safety |
| 2 | Q7–Q21 agreed | Contextual reader/navigation, per-title reader settings, gesture arbitration, explicit chapter completion, verified cross-source mapping, hybrid freshness, verified offline downloads, safe account merge, imports, opt-in AI, selective notifications, privacy, admin isolation, physical iOS testing |
| 3 | Q22–Q36 agreed | Natural Indonesian microcopy, familiar established terminology, quiet feedback, actionable errors, information hierarchy, restrained motion, accessible adaptive glass/dock/sheets, guest-first navigation, all-screen UX audit |
| 4 | Q37–Q49 agreed | Contextual route transitions, identity-safe shared elements/morphing, interruption-safe navigation, material/elevation layers, reusable domain boundaries, secure source registry, preferred routing, server-side latest free-tier-capable Gemini Flash where available, explicit AI privacy, separation of core free reader from metered AI, platform-aware validation |
| 5 | Q51, Q53–Q62 agreed | Per-owner data isolation, intentional deletes, no arbitrary destructive 1,000-record cap, synced reading status, durable restore, partial third-party import, local CBZ, incremental offline checks, background-safe resume, storage priorities, distinct discovery vs saved-title domain |
| 6 | Q64–Q72 agreed | Guest merge preview, account isolation, explicit restore after delete, partial import with unmapped records, separate media backup, Wi-Fi-first download/resume, retained valid offline copies, curated community source intake, offline guest/account access |
| 7 | Q73–Q85 agreed | Highest-milestone Continue Reading, per-chapter cursor including completed-chapter reread, explicit resets, no automatic completion from merely opening a chapter, no inference of earlier completion, verified chapter identity across sources, independent source/page coordinates, chapter-ID stability, local cursor durability, hydration guard, stable scroll restoration, cross-tab/device conflict guards |
| 8 | Q86–Q98 agreed | Trustworthy format-aware default reader; content preferences per title and device performance preferences local; preserve reading anchor across mode changes; explicit long-strip chapter boundary; failure-aware completion; clear latest-chapter state; zoom/pan gesture priority; nondestructive spread/crop presentation; adaptive prefetch; modal/chrome interaction priority; full input accessibility; content settings synced across devices |
| 9 | Q99–Q114 agreed | Exhaustive responsive audit across devices and UI states, adaptive toast/safe area, readable titles and labels, tablet-first layout, instant global search launcher, explicit zero-selected-source state, honest provider filter support, verified deduplication, aggregate Library without fictitious ranks, Back/Forward restoration, readable Rak Buku hierarchy and smart collection semantics, correct bulk-selection scope, chapter-rich detail and grounded Updates labeling |
| 10 | Q115–Q133 agreed | Distinguish unknown vs healthy source status, independent source visibility scopes, curated adapter updates/revocation, verified source relocation, contextual incident reports, confirmed vs inferred release schedules, read vs seen update state, verified release dedup, batch download, cache integrity and repair, honest storage estimates, effective understandable settings, domain-specific sync status, explicit logout/clear boundaries, verified Gemini Flash free-tier access and quota, nonblocking AI, evidence-based admin health, actionable report lifecycle, authorized and auditable privileged operations |
| 11 | Q134–Q147 agreed | Safe PWA update and account-scoped data continuity, recoverable local data upgrades, accurate connectivity, explicit install guidance, durable pending sync, secure external source access and archive import, minimal telemetry, reliable admin audit and risk-tiered request limits |
| 12 | Q148–Q164 agreed | Feature parity references and PWA-suitable tracker, server library, backup, local-format, personal metadata, reader controls, privacy, OCR, stats and source provenance choices |
| 13 | Q50, Q165–Q175 agreed | Verification of reusable and motion behavior, reference credits, project independence, Apache-2.0 retention, third-party rights, privacy, public docs and approval boundary |

## Revised decisions resolved with explicit qualifiers

**Q52 — Progress across devices (revised, agreed)**: The product's highest reading milestone determines Continue Reading; the most recent revisit of an earlier chapter must not regress that milestone. Per-chapter cursors and activity history remain independently available. Cross-session updates must protect against stale background tabs rather than using a naive latest-timestamp overwrite.

**Q63 — Per-chapter reading state (revised, agreed)**: Every chapter can retain its current page/position even when rereading an earlier chapter. An unfinished chapter resumes from its last actual position; a reread of a historically completed chapter can also retain a separate reread cursor without uncompleting it. Opening an arbitrary far-ahead chapter alone is not sufficient to advance the highest milestone.

## Final decision status

- **Agreed:** all Q1–Q175, including Q50 explicitly approved in Round 13. Q52/Q63 are approved **in their revised form** above.
- **Open product decisions:** none within this interview.
- **Still unverified:** real-device visual quality, implementation and feature-parity coverage, recovery/security tests, third-party material provenance, public policies and legal readiness. These are evidence gates, not unresolved answers.
- **Not authorized:** execution plan/spec, code or deployed product changes. Full UI/UX-from-zero-to-deployment discussion is reserved for a later Antigravity session with development/design skills.
- **See:** [final decision and public docs gap ledger](GRILL_FINAL_LEDGER.md), [parity reference map](YOMIRRA_FULL_PARITY_EXECUTION.md), [license and public docs review](REFERENCE_LICENSING_REVIEW.md).

## User-specified visual quality constraints (2026-10-25)

Every existing mobile/tablet screen, state, interaction, transition and copy string belongs in the UX audit. Particular reported defects: clipped toast notifications and truncated reader titles. Assess geometry, safe areas, orientation, iPad multitasking/resize, small-screen viewports, long names, input keyboard, dynamic text sizing, overlapping chrome, content legibility, notification positioning, and continuity of navigation/motion. A CSS breakpoint or reusable component by itself does not establish that any screen is visually correct. No pixel-perfect or runtime validation has been performed yet.

## Evidence notes (current main, inspected 2026-10-25)

- `src/shared/store/history-store.ts`: per-chapter history IDs; `getLatestForManga()` currently orders by `readAt`; `markChapterProgress()` may set 100% above a 90% threshold.
- `src/components/reader/reader-view.tsx`: opening a chapter writes `lastReadChapterId`, potentially changing the default resume.
- `src/components/reader/continuous-vertical-reader.tsx` and `paged-reader.tsx`: per-chapter cursor restoration is partly implemented.
- `src/shared/hooks/use-reader-scroll.ts`: coalesced/visibility flush; durable lifecycle guarantee not yet verified.
- `src/shared/lib/chapter-parser.ts`: EXACT, PROBABLE, AMBIGUOUS, and UNMAPPED mapping categories.
- `src/shared/store/reader-store.ts`: currently one global persisted reader preferences object; no per-title override contract in the inspected store.
- `src/shared/lib/chapter-continuity.ts`: currently uses an effective completion threshold rather than solely explicit completion.
- `src/components/reader/reader-image.tsx`: pinch and double-tap zoom, plus a global `is-pinching` class; gesture lifecycle needs review.
- `src/components/ui/sonner.tsx`: toast positioning by breakpoint/orientation but no proof that displayed notifications are fully visible on all devices.
- `src/components/reader/reader-shell.tsx`: reader title rendered in a truncated constrained single-line region.
- `src/shared/hooks/use-search-catalog.ts`: the no-source selection path currently resolves back to all eligible sources, requiring explicit UX semantics.
- `src/components/komik/manga-detail-view.tsx`: Continue Reading currently anchors to `getLatestForManga()` and a threshold-based continuation helper, not necessarily the agreed highest milestone.
- `src/components/source/source-card.tsx`: `unknown` source status currently maps to the healthy-looking label `Normal`.
- `src/components/updates/updates-list.tsx`: fallback inferred release day may use detection/updated/added timestamps; marks all updates seen on page unmount.
- `src/components/ui/sonner.tsx`: four concurrent visible toasts are allowed; real safe-area and keyboard geometry need validation.
- `src/app/(web)/account/page.tsx`: sync success toast says `Semua data bacaanmu berhasil disinkronkan`, while some sync substeps are best-effort.
- `src/app/(web)/downloads/page.tsx`: `navigator.storage.estimate` usage/quota is shown as device storage, potentially overstating precision of downloadable storage.
- `src/components/admin/admin-layout.tsx`: Overview, Sources, Search, Reports, Site, Telemetry administrative surfaces require operational truth and independent authorization verification.
- `src/app/sw.ts`: uses `skipWaiting: true` and excludes session-sensitive paths from SW caches, but update handover still requires lifecycle review.
- `src/shared/hooks/use-pwa-install.ts`: `beforeinstallprompt`-based hook; native Safari Add to Home Screen guidance is a separate platform flow.
- `src/server/lib/admin/audit-service.ts`: audit records retained only up to 100 entries; Redis persistence failure falls back to transient in-memory storage.
- `src/components/providers/offline-provider.tsx`: relies on `navigator.onLine` for offline state, which is not an end-to-end check of source/backend reachability.

This register stores decisions only; implementation, test, migration and rollout design are deliberately excluded.
