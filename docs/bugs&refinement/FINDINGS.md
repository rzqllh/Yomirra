# Yomirra — Bugs & Refinement Register

**Updated:** 2026-11-07 (Asia/Jakarta). **Default baseline:** `main@1a889db70d6cc09e8ccf28b607e5b24130b9f843`. Historical code audit **2026-10-30** inspected `main@d27d1e1`; user UI reports **2026-11-01**. Neither historical observation is assumed to reproduce on current main without rerun.

**Status vocabulary:** HISTORICAL_SOURCE_RECHECK=source issue in older snapshot; HISTORICAL_HYPOTHESIS_RECHECK=plausible, needs test; REPORTED_UNVERIFIED=user experience, reproduction missing; PATCH_DRAFT=fix on unmerged branch; CI_VERIFIED=exact named pipeline only; PARTIAL=some implementation/evidence; ACCEPTANCE_OPEN/BLOCKED=independent runtime/vendor proof missing; PROPOSED_REFINEMENT=not a confirmed bug. Owner-approved contract outweighs dated drafts.

**Scope:** actual bugs and gaps; a P0 entry can be a serious potential impact requiring confirmation, not proof of a presently exploited production issue. See [release #66](https://github.com/rzqllh/Yomirra/issues/66), [durability #68](https://github.com/rzqllh/Yomirra/issues/68), [content policy #101](https://github.com/rzqllh/Yomirra/issues/101). No change to app code, auth, data or deployment from this register.

## P0 — Urgent

### YOM-P0-01 — R-01 / Q52-Q63: membuka chapter jauh di depan bisa menaikkan verified milestone tanpa membaca

- **Status:** HISTORICAL_SOURCE_RECHECK.
- **Temuan/batas bukti:** Audit 30 Okt atas `reader-view.tsx` dan `history-store.ts`: visited/current chapter dan highest **verified** milestone tercampur. Belum direproduksi ulang pada main terbaru.
- **Rujukan:** `src/components/reader/reader-view.tsx`, `src/shared/store/history-store.ts`; issue [#66](https://github.com/rzqllh/Yomirra/issues/66).
- **DoD:** Red-first test chapter 5 complete→buka 30→close dan first-open chapter 100, lalu perbaiki tanpa menurunkan cursor/reread/mapped-source history.

### YOM-P0-02 — R-10: paged reader mengirim totalPages sebagai pageOffset

- **Status:** HISTORICAL_SOURCE_RECHECK.
- **Temuan/batas bukti:** Audit source 30 Okt menunjukkan `saveProgress(..., currentPageIndex, totalPages)` sementara argumen kelima didefinisikan `pageOffset` piksel. Keduanya number sehingga TypeScript tak menangkap semantik.
- **Rujukan:** `src/components/reader/paged-reader.tsx`, `src/shared/store/history-store.ts`.
- **DoD:** Pisahkan page count vs scroll offset, tambah regresi paged→reload→vertical, lalu real mobile restore.

### YOM-P0-03 — R-11/R-13/R-14: navigasi next chapter, failed-page dan progress completion tidak satu kontrak

- **Status:** HISTORICAL_SOURCE_RECHECK.
- **Temuan/batas bukti:** Paged/vertical navigation di audit dapat berpindah meski page gagal; `progressPercent` UI transient bukan `HistoryItem` completed. Jangan klaim user pasti membaca seluruh halaman.
- **Rujukan:** `src/components/reader/paged-reader.tsx`, `src/components/reader/continuous-vertical-reader.tsx`, `src/shared/store/history-store.ts`.
- **DoD:** Buat event completion eksplisit/idempotent, block false completion saat failed images, RT-01..RT-07 + offline/force-close; preserve visited/cursor.

### YOM-P0-04 — R-15 / Q80: klaim history IndexedDB tidak sesuai wiring audit

- **Status:** HISTORICAL_SOURCE_RECHECK.
- **Temuan/batas bukti:** Audit 30 Okt menemukan Zustand history `persist` tanpa `storage: idbStorage`, sedangkan `download-store` eksplisit memakai IDB. Durabilitas saat force-close perlu diverifikasi lagi setelah PR baru.
- **Rujukan:** `src/shared/store/history-store.ts`, `src/shared/lib/idb-storage.ts`, issue [#68](https://github.com/rzqllh/Yomirra/issues/68).
- **DoD:** Trace actual persistence per version, history restart/force-close migration, pastikan localStorage/IDB semantics dan jangan mengganti storage tanpa backup/compatibility.

### YOM-P0-05 — P0 content policy UNKNOWN vs NSFW warning; legacy Library/History patcher auto-write

- **Status:** OPEN_DECISION / SOURCE_OBSERVED.
- **Temuan/batas bukti:** Issue #101: `isContentVisible` menyaring unknown saat hideNsfw, sedangkan missing rating lolos; `useNsfwPatcher` menulis legacy `isNsfw`. User meminta aturan explicit `isNsfw=true` dan safe fallback, tetapi keputusan global vs MAL white-only dan migrasi perlu direkonsiliasi agar konten sensitif/data tak bocor/hilang.
- **Rujukan:** [issue #101](https://github.com/rzqllh/Yomirra/issues/101), `src/shared/sources/content-policy.ts`, `src/shared/hooks/use-nsfw-patcher.ts`.
- **DoD:** Owner menetapkan global/MAL-specific rule, read-only classification terlebih dahulu, backup reversible, 2-profile test, direct/search/library/reader/cache/physical Safari.

### YOM-P0-06 — Q138: implicit restore dan reuse idempotency key pada offline delete/upsert

- **Status:** PATCH_DRAFT / CI_VERIFIED.
- **Temuan/batas bukti:** Patch memaksa explicit restore dan mengubah operation ID pada perubahan semantik. Hanya draft [#147](https://github.com/rzqllh/Yomirra/pull/147) berbasis preview [#143](https://github.com/rzqllh/Yomirra/pull/143), bukan main; outbox runtime OFF.
- **Rujukan:** [draft #147](https://github.com/rzqllh/Yomirra/pull/147), [CI success](https://github.com/rzqllh/Yomirra/actions/runs/42319479388).
- **DoD:** Integrate/resolve PR hierarchy secara review, real Firebase Emulator two-UID/restart/cancel test, jangan aktifkan outbox atau tulis data asli sebelum seluruh gate.

### YOM-P0-07 — Q138 guest/UID isolation, replay, tombstone expiry dan backup 512-item compaction

- **Status:** ACCEPTANCE_OPEN.
- **Temuan/batas bukti:** Issue #66 merekam acceptance dua akun dan jalur guest merge/restore. Vitest/IDB mock dan CI hijau **bukan** bukti Firebase/physical browser valid.
- **Rujukan:** [release epic #66](https://github.com/rzqllh/Yomirra/issues/66), [durability #68](https://github.com/rzqllh/Yomirra/issues/68).
- **DoD:** Emulator + dua akun/dua device: old UID writes must never apply to new UID; force-close/retry/lease/compaction/conflict and backup restore idempotence.

### YOM-P0-08 — Klaim enterprise-ready dan public release belum didukung acceptance end-to-end

- **Status:** RELEASE_BLOCKED.
- **Temuan/batas bukti:** Issue #66 masih open; real provider/service rights, live auth, iOS PWA fisik, CSP, backup, rollback, Vercel exact SHA belum lengkap. CI per SHA tidak menyatakan release-ready.
- **Rujukan:** [issue #66](https://github.com/rzqllh/Yomirra/issues/66).
- **DoD:** Tentukan go/no-go berbasis bukti, zero unresolved P0/P1, security/privacy/legal signoff, exact deployed SHA dan rollback teruji.

## P1 — High

### YOM-P1-01 — R-05: admin audit log fallback Redis→process memory tidak durable

- **Status:** HISTORICAL_SOURCE_RECHECK.
- **Temuan/batas bukti:** Audit 30 Okt: saat Redis gagal, hanya 100 entri memory, bisa hilang pada restart/serverless; bukan bukti insiden penghapusan audit benar-benar terjadi.
- **Rujukan:** `src/server/lib/admin/audit-service.ts`, [issue #66](https://github.com/rzqllh/Yomirra/issues/66).
- **DoD:** Tetapkan aksi wajib audit/fail-closed, simpan durable & verifikasi Redis failure, cold start, retention, redaction.

### YOM-P1-02 — R-12: work-level highest milestone berpotensi hilang saat multi-source relink

- **Status:** HISTORICAL_HYPOTHESIS_RECHECK.
- **Temuan/batas bukti:** `history-store` memprioritaskan source+manga ID dan fallback `savedTitleId` hanya bila kosong; dua source dengan chapter terpetakan bisa tidak konsisten.
- **Rujukan:** `src/shared/store/history-store.ts`.
- **DoD:** Uji dua source dengan mapping chapter diverifikasi dan beda level; jangan infer chapter equivalence otomatis.

### YOM-P1-03 — R-07 / Q97: reader preferences cross-device belum terbukti

- **Status:** PARTIAL / ACCEPTANCE_OPEN.
- **Temuan/batas bukti:** ReaderStore lokal dan sync call-path lama belum cukup; update terbaru perlu direview. Jangan mark VERIFIED dari parity tracker historis.
- **Rujukan:** [issue #68](https://github.com/rzqllh/Yomirra/issues/68), `src/shared/store/reader-store.ts`, `src/shared/hooks/use-sync.ts`.
- **DoD:** Bukti satu akun dua browser, account switch, konflik per judul, per-device permissions, offline restore.

### YOM-P1-04 — R-07 / Q146: bounded retry/backoff cloud sync belum diuji dengan kegagalan riil

- **Status:** PARTIAL / ACCEPTANCE_OPEN.
- **Temuan/batas bukti:** Implementasi retry diklaim pada draft terdahulu; real network transitions, jitter, duplicate writes dan UID scope belum diterima.
- **Rujukan:** [issue #68](https://github.com/rzqllh/Yomirra/issues/68), [#143](https://github.com/rzqllh/Yomirra/pull/143).
- **DoD:** Test injected failures, offline/online oscillation, 429/backpressure, timers, abort, login/logout and recovery without amplification.

### YOM-P1-05 — R-07 / Q147: strict Content-Security-Policy masih release gate

- **Status:** REPORT_ONLY / OPEN_GATE.
- **Temuan/batas bukti:** Historical `next.config.ts` memakai CSP Report-Only. Enforce tanpa browser asset/Next.js/theme/Serwist/Firebase inventory dapat merusak app.
- **Rujukan:** [issue #68](https://github.com/rzqllh/Yomirra/issues/68), `next.config.ts`, `docs/TESTING.md`.
- **DoD:** Kumpulkan violation reports, Chromium/WebKit dan PWA offline/auth smoke; keputusan enforcement hanya pada PR tersendiri.

### YOM-P1-06 — R-06 / Q150: Self-hosted personal server library parity tidak tertelusur

- **Status:** HISTORICAL_UNPROVEN.
- **Temuan/batas bukti:** Audit menemukan klaim VERIFIED di tracker tanpa adapter/auth runtime/test yang spesifik di path yang diperiksa. Tidak menyatakan integrasi pasti tidak ada.
- **Rujukan:** `src/shared/sources/`, `docs/YOMIRRA_FULL_PARITY_EXECUTION.md`.
- **DoD:** Cari call path auth & UI berfungsi; koreksi parity PARTIAL bila belum terbukti; jangan tambah dependency/adapter kedua tanpa owner.

### YOM-P1-07 — Komik/halaman tidak termuat pada alur pengguna

- **Status:** REPORTED_UNVERIFIED.
- **Temuan/batas bukti:** Dilaporkan 1 Nov; tidak ada reproduksi pada exact current main dalam dokumentasi ini. Bisa sumber, image hotlink, reader fallback atau cache.
- **Rujukan:** `src/components/reader/`, `src/server/lib/sources/`.
- **DoD:** Repro URL/source/episode/chapter, respon HTTP, CORS/referrer, reconnect dan desktop/iOS. Jangan blanket no-referrer/proxy sebelum provider compatibility.

### YOM-P1-08 — Search source errors, kegagalan sumber parsial dan fallback yang jujur

- **Status:** REPORTED_UNVERIFIED.
- **Temuan/batas bukti:** Owner melaporkan error Search/source; belum dipetakan pada callstack terbaru. Partial providers tidak boleh menjadikan seluruh search blank atau mengklaim semua sumber sehat.
- **Rujukan:** `src/server/lib/sources/`, `src/components/`.
- **DoD:** Source-by-source matrix untuk 200/403/404/429/captcha/timeout, error toast/empty partial; uji recovery tanpa spam retry.

### YOM-P1-09 — Splash/onboarding dapat terlewati dalam user flow tertentu

- **Status:** REPORTED_UNVERIFIED.
- **Temuan/batas bukti:** Owner melaporkan bypass 1 Nov; bisa pengaruh persisted flag, session atau navigation, belum ada exact-head repro.
- **Rujukan:** `src/components/chrome/`, `src/shared/store/`.
- **DoD:** Repro fresh install/returning user/auth guest/deep link/PWA; tetapkan intended bypass contract sebelum ubah logic.

### YOM-P1-10 — Redis quota/readiness, circuit guard hotfix dan data-loss boundary

- **Status:** ACCEPTANCE_OPEN.
- **Temuan/batas bukti:** Ada pekerjaan Redis circuit guard/half-open probe yang lebih baru dari audit 30 Okt, tetapi live command usage, reconnect and fail-closed behavior perlu diuji; jangan mengulang hotfix tanpa melihat implementasi terakhir.
- **Rujukan:** `src/server/lib/cache/`, `docs/TESTING.md`.
- **DoD:** Exact-SHA smoke circuit-open/half-open, race/pipeline/reconnect, Redis GET cost, 2500ms deadline, fail-open vs fail-closed, logging sans secret.

### YOM-P1-11 — Vercel HTTP 402/rate-limit dan produksi mungkin tidak cocok SHA terbaru

- **Status:** RELEASE_BLOCKED.
- **Temuan/batas bukti:** Issue #66 dan integrasi #143/#146 memiliki provenance berbeda; GitHub CI bukan bukti Vercel menerima deploy. 402 tidak boleh dicurangi dengan retry massal.
- **Rujukan:** [issue #66](https://github.com/rzqllh/Yomirra/issues/66), [PR #143](https://github.com/rzqllh/Yomirra/pull/143), [PR #146](https://github.com/rzqllh/Yomirra/pull/146).
- **DoD:** Cek official quota, deployed immutable SHA/alias, health status dan rollback setelah owner approve.

### YOM-P1-12 — iOS/iPadOS PWA fisik dan backup/cache eviction

- **Status:** ACCEPTANCE_OPEN.
- **Temuan/batas bukti:** Playwright WebKit engine bukan iPhone terpasang; force-close, safe-area, share targets, storage eviction, VoiceOver dan landscape belum ditutup oleh CI.
- **Rujukan:** [release #66](https://github.com/rzqllh/Yomirra/issues/66), `docs/TESTING.md`.
- **DoD:** Physical iPhone/iPad test matrix with build/SHA, before-after screenshots, offline/force-close and verified storage persistence.

### YOM-P1-13 — R-08: ZIP export bukan CBZ/PDF offline local-reader

- **Status:** PARTIAL / FEATURE_GATE.
- **Temuan/batas bukti:** Utility ZIP-downloader tidak membuktikan import/read CBZ/PDF, file integrity atau mobile full archive. Q58/Q153 terpisah dari Q13.
- **Rujukan:** `src/shared/utils/zip-downloader.ts`, parity tracker.
- **DoD:** Uji zip export actual file; untuk import archives butuh keputusan scope dan threat model zip-bomb/path traversal terlebih dulu.

### YOM-P1-14 — Fallback konten unknown rating setelah owner request baru

- **Status:** REPORTED_UNVERIFIED / OPEN_DECISION.
- **Temuan/batas bukti:** Instruksi UX 1 Nov ingin hanya explicit `isNsfw=true` tersembunyi dan rating MAL/AniList tidak hilang. Namun #101 mencatat MAL white-only dan warning policy sebelumnya.
- **Rujukan:** [issue #101](https://github.com/rzqllh/Yomirra/issues/101).
- **DoD:** Reconcile owner approved policy per source dan global toggle; uji caching/preview/search/reader tanpa mengorbankan safety.

## P2 — Medium

### YOM-P2-01 — R-02 / Q136: navigator.onLine bukan backend reachable

- **Status:** HISTORICAL_SOURCE_RECHECK.
- **Temuan/batas bukti:** Offline provider memakai browser online events; koneksi internet tidak menjamin Firebase/komik provider responsif.
- **Rujukan:** `src/components/providers/offline-provider.tsx`.
- **DoD:** Pisahkan browser connectivity vs provider health dan cloud sync reachability; tes captive portal/source down.

### YOM-P2-02 — R-03 / Q125: storage quota dilabel sebagai total device space

- **Status:** HISTORICAL_SOURCE_RECHECK.
- **Temuan/batas bukti:** `navigator.storage.estimate()` mengembalikan quota/usage browser estimate, bukan ruang disk perangkat atau media download secara eksak.
- **Rujukan:** `src/app/(web)/downloads/page.tsx`.
- **DoD:** Label lebih presisi, pisahkan cached media bytes dari global browser storage, handle unavailable estimate.

### YOM-P2-03 — R-04 / Q141: Speed Insights vs klaim no external analytics

- **Status:** HISTORICAL_SOURCE_RECHECK.
- **Temuan/batas bukti:** Mount `@vercel/speed-insights/next` ditemukan pada audit lama; efek data collection aktual belum diverifikasi. Jangan salah label sebagai ad tracker.
- **Rujukan:** `src/app/(web)/layout.tsx`, parity tracker Q141.
- **DoD:** Audit network/vendor config dan privacy text, konsisten dengan owner analytics/telemetry policy.

### YOM-P2-04 — R-17 / Q98: toggle Reader portrait/landscape belum terbukti

- **Status:** HISTORICAL_UNVERIFIED.
- **Temuan/batas bukti:** Manifest `orientation: portrait` bukan kontrol orientasi reader; state/drawer audit lama tidak memuat override.
- **Rujukan:** `src/shared/types/manga.ts`, `src/components/reader/reader-settings-drawer.tsx`.
- **DoD:** Koreksi parity atau rancang kontrol sesuai browser/PWA capabilities dengan device acceptance.

### YOM-P2-05 — R-18 / Q50 reduced-motion, 44px controls, multi-device verification tercampur dalam tracker

- **Status:** ACCEPTANCE_OPEN.
- **Temuan/batas bukti:** A11y reusable components tidak membuktikan full real-device verification; Q21 fisik pernah tercatat BLOCKED.
- **Rujukan:** `docs/YOMIRRA_FULL_PARITY_EXECUTION.md`, `docs/TESTING.md`.
- **DoD:** Pisahkan PASS unit UI/contrast dengan iOS/VoiceOver/safe-area physical tests.

### YOM-P2-06 — Hero, Popular dan kartu editorial perlu audit UX berdasar desain yang benar

- **Status:** REPORTED_UNVERIFIED.
- **Temuan/batas bukti:** Owner melaporkan hero/Popular yang tidak sesuai, rounded radii tak konsisten, label/source hierarchy; jangan ganti seluruh visual system atau menghilangkan Spotlight tanpa keputusan.
- **Rujukan:** `src/components/home/`, `docs/DESIGN.md`.
- **DoD:** Audit screenshot current build, visual tokens, breakpoint 320/360/iPad, preserve approved discovery architecture.

### YOM-P2-07 — Animasi filters, source chips dan interaksi error/empty states

- **Status:** REPORTED_UNVERIFIED.
- **Temuan/batas bukti:** Owner melaporkan filter animation dan rancu Cross-source/Popular; root cause belum terverifikasi.
- **Rujukan:** `src/components/`, search and discovery routes.
- **DoD:** Repro filter Apply/Reset, state URL, motion reduced, cancel/dismiss semantics; hindari perubahan copy yang mengubah product contract diam-diam.

### YOM-P2-08 — Toast alignment, durasi dan overflow terhadap keyboard/dock

- **Status:** REPORTED_UNVERIFIED.
- **Temuan/batas bukti:** Laporan 1 Nov, belum di-repro setelah PR terkini.
- **Rujukan:** `src/components/chrome/`, overlay components.
- **DoD:** Uji long copy, stacked toast, safe area, focus/VoiceOver, keyboard mobile, reduced-motion.

### YOM-P2-09 — R-09: desain/doc roadmap lama bertentangan dengan approval visual baru

- **Status:** HISTORICAL_SOURCE_RECHECK.
- **Temuan/batas bukti:** Audit 30 Okt menemukan `docs/plan.md`, `docs/task.md` menyebut PR #65 draft padahal merged; foundation editorial cream lama superseded. File tersebut mungkin sudah dipindahkan.
- **Rujukan:** `docs/DESIGN.md`, prior roadmap files.
- **DoD:** Reconcile status pada dokumen aktif saja; arsip historis jangan dipalsukan dan jangan memaksakan aesthetic lama.

### YOM-P2-10 — Security boundaries admin/CSRF/rate-limit/SSRF dan log redaction

- **Status:** ACCEPTANCE_OPEN.
- **Temuan/batas bukti:** Review otomatis and unit test bukan bukti server production anti-SSRF, CSP, privilege dan safe logging.
- **Rujukan:** [issue #66](https://github.com/rzqllh/Yomirra/issues/66), `docs/TESTING.md`.
- **DoD:** Adversarial tests with signed URL tamper, rate-limit error, stale auth token, audit log and no secret exposure.

### YOM-P2-11 — Canonical source identity dan relink/recovery perlu end-to-end checks

- **Status:** ACCEPTANCE_OPEN.
- **Temuan/batas bukti:** Library/Rak Buku/Search share distinct identity; provider outage/relink and same-title from two sources must not merge incorrectly.
- **Rujukan:** `docs/READING_DATA.md`, [issue #66](https://github.com/rzqllh/Yomirra/issues/66).
- **DoD:** Manual+browser source matrix including ambiguous nonverified chapter mapping and tombstone conflicts.

## P3 — Light

### YOM-P3-01 — R-16 / Q84: debounce disebut 250 ms tetapi source/test 300 ms

- **Status:** HISTORICAL_SOURCE_RECHECK.
- **Temuan/batas bukti:** Mismatch kontrak vs timer, bukan bukti 300 ms salah.
- **Rujukan:** `src/shared/hooks/use-reader-scroll.ts`, corresponding tests.
- **DoD:** Owner pilih angka acceptance final; update test dan tracker konsisten.

### YOM-P3-02 — R-19: manifest shortcut memakai tab query tidak dikenal

- **Status:** HISTORICAL_SOURCE_RECHECK.
- **Temuan/batas bukti:** Shortcut Lanjut Baca `/bookmark?tab=history` tetapi Bookmark page menerima `reading|collection` sehingga fallback ke reading.
- **Rujukan:** `src/app/manifest.ts`, `src/components/bookmark/bookmark-page-view.tsx`.
- **DoD:** Gunakan canonical route dan tambah PWA shortcut deep-link test.

### YOM-P3-03 — Dokumentasikan provider image hotlink/referrer compatibility

- **Status:** PROPOSED_REFINEMENT.
- **Temuan/batas bukti:** `referrerPolicy=no-referrer` bukan patch universal 403; Worker cache tidak otomatis menghapus Workers request quota.
- **Rujukan:** `src/server/lib/sources/`, image adapters.
- **DoD:** Sediakan per-provider matrix kebutuhan Referer, permitted domains dan caching sebelum opt-in proxy. Tidak perlu migrasi hosting.

### YOM-P3-04 — Perjelas istilah Library (discovery), Rak Buku (saved), Cari (global)

- **Status:** PROPOSED_REFINEMENT.
- **Temuan/batas bukti:** Alias dan label yang tampak mirip berisiko menyembunyikan fitur berbeda; ini perbaikan informasi, bukan arsitektur baru.
- **Rujukan:** `docs/DESIGN.md`, `docs/READING_DATA.md`.
- **DoD:** Audit informasi dan CTA termasuk source-switch/mobile dock.

### YOM-P3-05 — Traceability Q1–Q175 dan tanggal status acceptance

- **Status:** PROPOSED_REFINEMENT.
- **Temuan/batas bukti:** Historis 167 VERIFIED/7 PARTIAL/1 BLOCKED adalah metadata tracker lama, bukan hasil re-execution pada head baru.
- **Rujukan:** `docs/YOMIRRA_FULL_PARITY_EXECUTION.md`, issue [#68](https://github.com/rzqllh/Yomirra/issues/68).
- **DoD:** Relabel per scope: source, unit, WebKit browser, Firebase live dan physical Safari.

### YOM-P3-06 — Quality/performance: lint warning & responsive image/caching metrics

- **Status:** PROPOSED_REFINEMENT.
- **Temuan/batas bukti:** Laporan 1 Nov menyebut ratusan lint warning pada baseline saat itu; jangan tetapkan jumlah sebagai kondisi sekarang tanpa CI terbaru.
- **Rujukan:** `package.json`, latest GitHub workflows.
- **DoD:** Catat warning count per SHA, hindari lint suppression global, ukur LCP/CLS/reader image failures.

### YOM-P3-07 — Source/UX docs dipisah dari live provider guarantees

- **Status:** PROPOSED_REFINEMENT.
- **Temuan/batas bukti:** Manga import/recovery/download entrypoints harus menjelaskan verified vs unsupported; smoke tidak boleh mengklaim availability universal.
- **Rujukan:** `docs/TESTING.md`, `docs/ADDING_A_SOURCE.md`.
- **DoD:** Perbaiki status messaging, tooltips dan error copy berdasarkan provider data.

## Current integration boundaries

- [Q138 draft #147](https://github.com/rzqllh/Yomirra/pull/147) targets **preview**, not main; [CI exact head](https://github.com/rzqllh/Yomirra/actions/runs/42319479388) SUCCESS but no Firebase staging/device acceptance and outbox remains OFF.
- [PR #143](https://github.com/rzqllh/Yomirra/pull/143) and [#146](https://github.com/rzqllh/Yomirra/pull/146) must be reconciled without declaring previous incidents solved. Check full branch context before future implementation.
- **Release remains BLOCKED** for physical Safari/PWA, legal source rights, data integrity, Redis health/observability, backup/restore and exact production SHA. Source evidence and product acceptance are separate.
- Never write real user data for test fixtures; use disposable identities and owner-approved staging only.

## Docs-only validation checkpoint (2026-11-07)

- Source of this register: 30 Oct read-only repository audit, 1 Nov user reports and 7 Nov PR/CI checks. Historical observations remain clearly labeled, not automatically active bugs.
- Count and identity: **40 unique finding IDs**, severity counts **P0 8 / P1 14 / P2 11 / P3 7**.
- GitHub workflow `.github/workflows/ci.yml` excludes Markdown/docs-only changes using `paths-ignore`. Therefore **no GitHub Actions run on the documentation PR** is expected; do not mark this a CI PASS.
- GitHub commit combined status on the docs SHA returned **Vercel FAILURE: “Account is blocked”**. Release gate remains open and fixing deployment/account limits is outside this docs-only scope.
- Integration source remains on draft PRs #143, #146, #147, with their own source/evidence boundaries; no checkout or write to production.
