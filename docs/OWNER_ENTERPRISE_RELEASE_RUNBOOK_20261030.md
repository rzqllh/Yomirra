# Yomirra — Owner Enterprise Release Acceptance Runbook

Status: **NOT CLEARED**. Prepared 30 October 2026. This document is instructions and an evidence template, **not proof** that checks have been run. Coordinator: [enterprise release issue #66](https://github.com/rzqllh/Yomirra/issues/66); integration [PR #73](https://github.com/rzqllh/Yomirra/pull/73).

## Before starting — protect real user data

1. Use **synthetic test data**, not actual user accounts or real library/history exports. Never upload a credential, recovery code, email address, Firebase service-account JSON, signed proxy URL, or personal information into GitHub issues/chat.
2. Leave production Firebase rules, collections, user data, auth users, and Vercel production alias unchanged until staging results and explicit release authorization.
3. If a test requires deleting history/library or simulating failed writes, run it **only in staging** or an isolated Firebase emulator project. Export a synthetic backup first and verify you can import it.
4. Record the exact app commit SHA, UTC/WIB timestamp, environment, device/browser version, test account aliases (`A`, `B`), and link to sanitized artifacts. Never write PASS for a test not executed.

## A. GitHub: inspect CI and enforce release gates (owner/admin)

1. Open [integration PR #73](https://github.com/rzqllh/Yomirra/pull/73). Confirm `Files changed` are limited to the intended browser CI, docs, history storage, realtime account guard, retry code and tests.
2. Open its **Checks** tab and verify the **latest HEAD SHA**, not an older successful run. Require `Verify & Build` (typecheck, lint, full Vitest, Next build) and `Browser Smoke (Chromium and WebKit)` (user-flow E2E + WebKit Safari layout suite). If any fail, save the run link; do not bypass or green-label the run.
3. Open [repository Settings → Rules → Rulesets](https://github.com/rzqllh/Yomirra/settings/rules) (if your UI uses Branches instead, open Settings → Branches). Create a branch ruleset targeting **`main`**. Select **Active** only after checking that expected check names actually appear in real PR runs.
4. Enable **Require a pull request before merging**, **Require status checks to pass** (exact names `Verify & Build` and `Browser Smoke (Chromium and WebKit)` after CI change merges), **Require conversation resolution**, and appropriate review approvals. Enable up-to-date branches when the checks and merge model are compatible. Disable force pushes and branch deletions; choose a narrow owner/admin emergency policy deliberately.
5. Do not configure a mandatory check that does not yet exist on `main` without planning the transition: doing so can block all merges. Confirm ruleset status and share a sanitized screenshot of the active rules. Treat GitHub plan-level rule enforcement limitations as an explicit blocker.
6. Do not merge the integration PR simply to get the checks. It is a **validation** PR, not a release authorization. Merge to production only after all release gates are cleared and a rollback plan is approved.

**Evidence:** final SHA and run URLs; ruleset name/status; required check names; code reviewers. **PASS requires** check enforcement at the branch and final exact-head CI + review evidence.

## B. Vercel: inspect deployment, quota and rollback (owner)

1. Sign in to [Vercel dashboard](https://vercel.com/dashboard) with the account owning Yomirra. Navigate to the Yomirra project → **Deployments**. Select **Production** and identify its commit SHA, creation time, status, domain aliases and whether it really serves the current intended `main`.
2. Inspect any `build-rate-limit` failure or `Failed` deployment in **Build Logs**; identify whether it is a quota/rate-limiting issue rather than an application build failure. Capture the deployment URL/ID, timestamp and a sanitized screenshot. **Do not assume buying a higher plan is necessary**: check usage, limits and cooling period first.
3. Under project **Logs**, filter recent production requests (especially 5xx/errors), check representative `/`, `/search`, `/bookmark`, a valid detail page, a valid reader page, `/sources`, and `/settings`. Do not publish raw access tokens, signed image URLs or personal user IDs.
4. For staging browser/device QA, provision a **separate, explicitly isolated staging environment** with a different Firebase project and nonproduction secrets. A disabled Vercel preview on the integration branch is intentional to avoid quota usage; do not assume a preview is available. Request a one-off isolated staging deployment or use a separate staging Vercel project if available.
5. Before release, verify the previous working deployment can be restored, application/data migrations are reversible where promised, and no one-way compaction destroys information without adequate backup. Document who can trigger rollback and what monitoring signals trigger it.
6. Verify production **after** an authorized release with the deployed SHA, correct canonical domain, working critical routes and runtime logs. A successful build alone is **not** service acceptance.

**Evidence:** Vercel project/deployment identifiers (not secrets), SHA, status, preview/staging URL, sanitized logs, rollback procedure. **PASS requires** healthy deployment on intended SHA, monitored critical flows and a validated recovery path.

## C. Firebase: create isolated staging and two-account evidence (owner)

1. In [Firebase Console](https://console.firebase.google.com/), select **Add project** or a pre-existing **staging-only** project. Keep this separate from production and check its GCP project ID before continuing.
2. Enable the app's supported sign-in provider under **Authentication → Sign-in method**. Create two independent test users `A` and `B` using nonpersonal test identities. Register the staging domain in **Authentication → Settings → Authorized domains**, if required.
3. Create a Firestore database in staging. Inspect the deployed **Rules**; compare with the repository's `firestore.rules`, and configure deny-by-default and per-UID ownership. Only publish rules changes to **staging**. Use **Rules Playground** and ideally the local emulator to test: anonymous reads denied; A can read/write `users/A` data; A cannot read/write `users/B`; B cannot write A.
4. Connect the staging deployment to the staging Firebase project's **public browser config**. Server-only keys/privileged credentials stay in the provider's secret manager/environment. Never reuse production privileged service credentials for synthetic test accounts.
5. Open the staging URL on **device/profile 1** and **device/profile 2**. Log A into both. Keep a third isolated browser profile for B. Verify both read and write without exposing either account's data to the other.
6. Execute the following numbered scenarios; for each record **expected / actual / PASS-FAIL / evidence** (see `docs/TESTING.md` for full acceptance contract):
   - **A1 Guest merge:** save a title/progress as guest, sign into A; confirm explicit merge preview and no silent overwrite.
   - **A2 Delayed A write → B:** delay A history write using staging network controls, switch to B; A mutation must never land in B's cloud or local view.
   - **A3 Per-UID migration:** migrate different legacy entries as A and B in separate sessions; independent markers and no skipped legacy-only entries.
   - **A4 Failed migration:** block a synthetic Firestore commit in staging, retry after restoring permission; no success marker before all intended commits, no loss or duplicate.
   - **A5 Retention >512:** create 513+ chapter details across sample titles, use different last-read and highest milestones, reload/sync; max 512 detailed entries plus valid per-title summary, correct `_compacted` behavior.
   - **A6 Reread:** read chapter 45 then reread chapter 12 from another device; last resume and highest milestone must not be accidentally replaced by reread.
   - **A7 Concurrent edits:** modify same title from two devices, sync; conflict handling deterministic, no unrelated deletion or resurrection.
   - **A8 Tombstone/re-add:** delete a title, sync old device snapshot, then intentionally re-add newer version; stale data must remain deleted, explicit newer add must work.
   - **A9 >450 writes + partial delete:** force first and later Firestore batches to fail separately; committed batches stay committed, later batches stop, status is not falsely success.
   - **A10 Offline restart:** change reading position offline, close/reopen browser/PWA and reconnect; local position survives and cloud status remains pending until actually acknowledged.
   - **A11 Domain failure:** make source preference or collection read fail separately; diagnostic UI distinguishes partial domain failure from full success.
   - **A12 Logout retention:** test both offered local-data retention options; A's local data must never become visible to B.
   - **A13 Overlapping intent:** delay delete, then re-add/progress, then delete again, resolve out of order; older failed action must not restore an entry deliberately deleted later.
7. Run a repeatable backup/restore check: export schema 3 synthetic library with source linking, progress and collections, import twice (no duplicates), then import library containing >1000 synthetic titles within file size limit. Verify title IDs and milestone relationships.
8. Record whether reader settings actually sync across accounts/devices. Currently **Q97 has an unresolved implementation gap**. Record whether offline mutations survive force-close as a replayable queue (**Q138 unresolved**). Do not turn these into PASS because a local-state fallback works.
9. Compare security rules to staging Firestore audit logs before marking identity isolation. **Never** test destructive deletion against production data.

**Evidence:** staging project alias/ID, rule version/hash, test account aliases, device/browser, screenshot/screen recording sanitized, results A1–A13, backup fixture checksum. **PASS requires** every relevant case demonstrated, not just mock tests.

## D. Physical Safari + installed PWA (owner/actual devices)

1. Use at least one **physical iPhone** and one **physical iPad** with their actual iOS/iPadOS versions recorded. Desktop Playwright WebKit is supplementary only.
2. In Safari, open the isolated staging URL and verify HTTPS, first-visit/splash/onboarding and source/search UI. On iPhone use **Page Menu → Share** (or Share directly, depending on Safari layout) → **Add to Home Screen**, enable **Open as Web App**, then Add. On iPad use the equivalent Safari Share action. Launch the **Home Screen icon**, not just a Safari tab.
3. Record device model, OS, browser build, viewport/orientation and `standalone` status. Test portrait, landscape, large/small text, notches/safe areas, fixed bottom dock and reader/drawer overlays with no horizontal clipping.
4. Search a valid title, open detail, start a chapter, change reading mode, page/scroll, save a resume point, navigate Back/Forward, and reopen. Verify resume vs highest milestone, long title display, toast positioning, gesture/pinch and any next-chapter navigation.
5. Use **airplane mode** with predownloaded synthetic/allowed test chapter images: cached pages remain readable and missing cache assets must not be labeled complete. Force-close the PWA, relaunch offline, then reconnect and verify eventual progress sync; never assume local state is remotely saved.
6. Repeat with an intentionally evicted cache or limited site storage; verify recovery messaging. Test reader errors, source downtime, slow network, denied storage and partial image failures.
7. Turn on **Reduce Motion** in device accessibility settings; repeat navigation/drawers and verify readable nonanimated fallbacks. Turn on **VoiceOver**; verify controls are labeled, focus order is logical, and focus returns after dismissing overlays. Test on-screen keyboard and iPad Split View when supported.
8. Collect sanitized screenshots/video and mark every subcase PASS/FAIL. Do not replace physical hardware evidence with browser emulation results.

**Evidence:** two physical device models/OS, installed-app and Safari conditions, failures/reproductions, screenshots/videos. **PASS requires** critical reader, offline, accessibility and recovery flows on actual hardware.

## E. Legal/content rights, privacy and security approvals (human reviewer)

1. Identify the real **human publication owner** and **rights/privacy reviewer**. Their acceptance may be internal business/legal approval; the AI cannot self-certify it.
2. Review each third-party content source's actual terms, permission/license model and takedown mechanism. A code repository license does **not** grant rights to display publisher manga pages or artwork.
3. Inspect all non-original assets, font/image/animation libraries and dependency licenses; document provenance, attribution and restrictions. Confirm only appropriately licensed sources and media are included.
4. Verify published privacy notice/terms against actual data flows: Firebase sign-in and Firestore, Redis, server logs, Google/Gemini search metadata, Vercel analytics, browser Cache Storage, account deletion and retention. Fix discrepancies before publishing.
5. Validate the public content-rights report form and process: a responsible reviewer, inbox or ticket routing, response/escalation procedures and minimal safe intake data.
6. Record an explicit approval **name/role/date/document** for release. Do not publish personal identity details publicly if sensitive. If source authorization or personal-data handling remains unclear, release is BLOCKED.

## F. Decide the three-month inactivity rule (owner policy decision)

Current code intentionally **does not auto-delete progress based on three-month inactivity**. Choose one of the following explicitly:

- **Option 1 (safer until reviewed):** no automatic inactivity deletion; keep per-title compact resume/milestones until explicit user deletion, subject to lawful retention obligations.
- **Option 2:** account inactivity of 90 days starts a retention workflow, but only after precise notices, deletion scope, recovery and consent/legal assessment are documented.
- **Option 3:** inactivity per title of 90 days; state exact fields deleted and preserve resume/milestone unless there is a documented reason not to.

Write down the chosen definition, UTC time anchor, affected data, exemptions (offline, anonymous, user-requested deletion), advance notice, recovery behavior and legal approval. **Do not implement or turn on deletion based on an ambiguous shorthand.**

## G. Release sign-off and safe deployment

1. Record a requirement-level Q1–Q175 audit mapping each accepted behavior to its implementation, test and actual running evidence. Treat `PARTIAL`, `BLOCKED`, and uncovered `VERIFIED` rows as open until independently proven. Decide CBZ/ZIP, trackers, OCR and AI reader feature scope explicitly; do not silently call deferred features DONE.
2. Resolve security issues privately, including Firestore rules, admin auth/CSRF, SSRF/image proxy, logger redaction and CSP report-only violations. **Enforce CSP only after Firebase, assets, Service Worker and iOS/PWA compatibility evidence**.
3. Confirm no P0/P1 defects remain; integrate and review proposed changes; require up-to-date check results on exact final SHA.
4. Obtain sign-offs for QA (A1–A13, iPhone+iPad), engineering/security, and legal/privacy. Verify current Vercel quota/state and agree rollback owner and triggers.
5. Authorize a release commit/version/tag only once all gates are met. Deploy via the existing controlled release mechanism, verify SHA and routes, check errors and rollback functionality. Report the release result and post-release follow-up.

## Evidence submission template

```text
YOMIRRA QA EVIDENCE
Environment: STAGING / PRODUCTION (read-only)
Build SHA:
URL (no token):
Date/time with timezone:
Tester role (not personal secrets):
Device / OS / browser / mode:
Firebase project alias:
Case ID (A1-A13, iOS-1.., SEC-.., Q...):
Steps executed:
Expected:
Actual:
Result: PASS / FAIL / BLOCKED / NOT RUN
Sanitized artifact URL:
Issue/PR linked:
```

**Final gate:** enterprise READY can only be reported after all essential production, functionality, data safety, security, accessibility, hardware and legal approvals are complete. Until then, use **BLOCKED** or **PARTIAL**, never READY.


## H. Langkah 7 — Grill-Me Interactive Bulk (owner decisions; BELUM DIJAWAB)

**Purpose:** Use this as a supervised decision interview, not an automatic authorization. The owner can answer in one batch (`R1=B, R2=A, F1=C, L1=?`). A question mark means intentionally undecided; do not infer acceptance. After the first batch, the assistant should challenge ambiguity, contradictory requirements, worst-case failure modes, business impact, and tests in a **second targeted round**. The final round produces a decision register with owners, acceptance criteria, and explicit owner approval. This interview is **not a legal sign-off**.

### H1. R — Retensi, hapus, backup, dan kepemilikan data

**R1. Arti "3 bulan tidak aktif"**: A tidak ada auto-delete (default konservatif); B 90 hari tidak membuka app; C 90 hari tidak membaca setiap judul; D definisi khusus.
**R2. Data yang boleh dibersihkan**: A hanya cache dan unduhan yang dapat dipulihkan; B chapter-history detail lama tetapi resume/milestone per judul wajib utuh; C library+history milik akun (memerlukan peringatan dan review legal); D lainnya.
**R3. Hitung waktu**: A dari aktivitas berhasil tersinkron terbaru; B dari aktivitas lokal juga (perlu strategi cross-device); C per-judul; D lainnya.
**R4. Sebelum penghapusan**: A tidak ada otomatis sampai kebijakan disetujui; B peringatan 30/7/1 hari + pilihan ekspor; C reminder tunggal; D lainnya.
**R5. Backup dan recovery**: A backup manual + ekspor sebelum tindakan irreversibel; B backup terenkripsi terjadwal + masa pemulihan; C tidak perlu ekspor (tidak direkomendasikan untuk data bernilai).
**R6. Logout/perpindahan akun**: A isolasi akun mutlak, pilihan "hapus dari perangkat"/"pertahankan offline" yang tidak bocor ke akun lain; B selalu hapus data lokal; C lainnya.
**R7. Prioritas konflik perangkat**: A lebih baru berdasarkan revisi dan intent, tombstone tidak bisa dibangkitkan oleh aksi lama; B prefer cloud saat konflik; C minta user resolve manual; D lainnya.
**R8. Jika kapasitas storage habis/offline >30 hari**: A tampilkan status gagal menyimpan dan jangan klaim sync sukses; B batasi fitur saat tidak bisa persist; C lainnya.

### H2. F — Scope fitur dan acceptance release

**F1. Target release**: A fondasi stabil sekarang lalu fitur lanjutan menjadi milestone berikutnya; B semua Q1–Q175 wajib sesuai kontrak sebelum rilis; C release terbatas/beta dengan daftar fitur jelas.
**F2. Reader CBZ/ZIP/PDF**: A wajib untuk release; B CBZ/ZIP saja; C boleh milestone berikutnya; D tidak masuk scope (ubah kontrak eksplisit).
**F3. AniList/MyAnimeList**: A kedua integrasi penuh; B satu provider dulu; C deferred; D out-of-scope.
**F4. OCR/dictionary**: A wajib offline; B online-only dengan consent dan fallback; C deferred; D out-of-scope.
**F5. AI toolbar**: A wajib untuk release; B optional feature flag (OFF by default, privacy review); C deferred; D out-of-scope.
**F6. Reader settings lintas perangkat (Q97)**: A global + per-title sync ke akun; B global-only; C local-only tetapi Q97 turun/diubah secara eksplisit.
**F7. Durable offline mutation queue (Q138)**: A wajib replay idempoten setelah force-close/restart + rekonsiliasi tombstone; B hanya local-state with manual sync (ubah kontrak/acceptance); C deferred (release tetap BLOCKED bila Q138 mandatory).
**F8. CSP (Q147)**: A enforce setelah laporan violation benar-benar bersih pada staging & iOS; B report-only sementara sebagai documented exception dengan owner security approval (bukan strict-enforced PASS).
**F9. UI/UX acceptance**: A audit WCAG, device breakpoints, reduced-motion, focus/keyboard, visual consistency dan regressions tanpa mengubah fungsi; B baseline terbatas dengan tiket P2; C lainnya.
**F10. Definisi P0/P1**: A tidak ada P0 atau P1 terbuka pada critical user paths; B P1 boleh dengan mitigasi dan tanggal perbaikan disetujui; C lainnya.
**F11. Pilihan platform release**: A web+installed iOS/iPad PWA; B web desktop/mobile responsive saja sekarang; C lainnya.

### H3. L — Legal, privasi, pengelolaan konten, approval

**L1. Hak terhadap konten pihak ketiga**: A hanya source dengan izin/lisensi/otorisasi terverifikasi; B agregasi eksternal sesuai persyaratan sumber yang sudah diaudit; C belum diketahui (BLOCKED sampai review).
**L2. Model distribusi**: A official/public launch; B closed private beta dengan akun terbatas; C internal/testing only tanpa klaim publik.
**L3. Siapa penanggung jawab keputusan rights & privacy**: A reviewer internal yang berwenang; B penasihat hukum eksternal; C belum ditunjuk (BLOCKED untuk public release).
**L4. Data pribadi yang benar-benar dibutuhkan**: A minimisasi (UID, library/progress, preferences) + penghapusan akun; B tambah analytics diagnostik opt-in; C lainnya.
**L5. Pemakaian data untuk AI/rekomendasi**: A explicit opt-in, transparan provider, redaction, no raw private history by default; B tidak kirim data personal ke AI; C lainnya.
**L6. Hak penghapusan dan ekspor akun**: A user dapat ekspor/hapus dengan prosedur dan audit minimal; B hanya melalui support sementara dengan SLA tercatat (butuh legal approval); C belum ditentukan (BLOCKED).
**L7. Takedown/report rights**: A channel resmi + pemilik inbox/ticket + prosedur dan waktu respons; B laporan manual khusus closed beta; C belum siap (BLOCKED untuk public release).
**L8. Licenses/assets**: A inventaris dep/asset/font + atribusi/izin; B audit hanya asset high-risk sekarang dengan exception terdokumentasi; C lainnya.
**L9. Kewenangan final go/no-go**: A owner + engineering QA + security + legal/privacy signoffs; B owner saja untuk internal beta (tetap tidak menggantikan kebutuhan compliance); C aturan khusus.
**L10. Bukti keputusan**: A simpan decision log (tanpa data rahasia), penanggung jawab, tanggal, acceptance dan alasan; B dokumen persetujuan terpisah yang dilink ke release issue; C keduanya.

### Interactive process and answer contract

- **Round 1 — bulk answers:** owner replies in one message with codes; `?` is acceptable. Example: `R1=A, R2=B, R3=?, F1=B, F2=C, F6=A, L1=C, L2=C, L3=?`. Unanswered items remain **PENDING**, never silently defaulted.
- **Round 2 — conflict grill:** assistant asks only the minimal high-impact follow-ups, such as: "If Q138 is deferred, can the release honestly claim all 175 enterprise requirements?" or "How can public launch proceed if content rights have not been proven?" or "If deletion triggers while offline and an older device returns, what stops resurrection?" Highlight consequences and decision reversibility.
- **Round 3 — final lock:** create a decision record with **VERIFIED POLICY / PROPOSED / UNDECIDED / BLOCKED** per area, named accountable role (not secret), evidence source, tests and release impact. Explicitly ask the owner to approve the proposed decisions; absence of an answer is not consent.
- **All rounds:** no new production deletes, data migration, license assumption, Firebase config changes or deployment authorized by merely selecting interview answers. Live permissions and review gates still apply.
