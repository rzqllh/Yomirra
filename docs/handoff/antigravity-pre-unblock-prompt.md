# Prompt handoff untuk Antigravity CLI — Yomirra

Salin prompt ini ke sesi Antigravity CLI yang memiliki akses resmi ke repository. Ikuti controller Ritsuka dan specialist/QA independen sesuai `AGENTS.md`; owner meminta laporan akhir disintesis oleh Quinella AGY untuk ditempel kembali ke chat Codex asal. Konfirmasikan peran Quinella pada runtime tanpa mengganti controller yang diwajibkan repo. Tujuan owner: selesaikan seluruh BLOCKED/NO-GO dan 18 masalah awal sampai ada bukti penutupan, atau laporkan blocker eksternal yang benar-benar memerlukan tindakan owner/provider. Jangan berhenti pada rencana jika pekerjaan yang diizinkan masih dapat dikerjakan.

Verifikasi mapping persona dan kemampuan dispatch runtime Antigravity yang nyata; jangan mengarang profile Quinella, telemetry specialist, atau QA. Ikuti maker-checker dan batas concurrency/depth repo. Jika mapping runtime bertentangan dengan kontrak controller atau tidak dapat memenuhi governance, laporkan konflik itu tanpa mengganti kontrak secara diam-diam. Selesainya pembuatan handoff ini tidak berarti tujuan production sudah selesai: status terakhir tetap BLOCKED.

Catat profile/session dan dispatch telemetry yang benar-benar tersedia. Jika profile Quinella AGY atau eksekusi specialist tidak dapat diverifikasi, beri label `NOT_VERIFIED`; jangan mengganti nama agent lain, melakukan simulasi persona, atau mengklaim native dispatch tanpa jejak runtime.

## 1. Mulai dari keadaan aktual

Working directory kandidat:

```text
C:/Users/Hafizh Rizqullah/Documents/Code/_active/_yomirra-worktrees/final-stabilization
```

Jalankan pemeriksaan lokal read-only ini sebelum mengedit:

```powershell
Get-Location
git status --short
git branch --show-current
git rev-parse HEAD
git worktree list
git log -5 --oneline
```

Baca root/scoped `AGENTS.md`, skill yang relevan, `docs/ops/pre-unblock.md`, `docs/handoff/pre-unblock.md`, `docs/handoff/final-stabilization.md`, `docs/TESTING.md`, serta source terkait. Sebelum menulis kode Next.js, baca panduan versi terpasang di `node_modules/next/dist/docs/`. Pertahankan perubahan agent lain. Jangan membaca atau mencetak nilai secret atau menyalin `.env.local` production ke harness.

Instruksi owner historis berikut sudah dibaca saat handoff dibuat; baca kembali jika tersedia dan rekonsiliasi dengan instruksi owner terbaru. Larangan production tetap berlaku sampai approval spesifik; permintaan terbaru memakai agents tidak menjadikan instruksi lama “kerjakan sendiri” sebagai alasan mensimulasikan specialist. Jangan memperluas audit UI menjadi redesign atau fitur baru.

```text
C:/Users/Hafizh Rizqullah/.codex/attachments/a786a846-146f-4a76-9b0e-65928cfba9fe/Pasted text.txt
C:/Users/Hafizh Rizqullah/.codex/attachments/a568a823-e2fb-4eed-ae5b-4dd7422f2480/Pasted text.txt
C:/Users/Hafizh Rizqullah/.codex/attachments/2fd223dc-8b76-4103-a69b-86feecc0c3c3/Pasted text.txt
```

Snapshot terakhir yang diamati pada 8 November 2026 WIB:

- Kandidat: branch `codex/final-stabilization`, HEAD dokumentasi `d797dbea1604a18a2f998dd61464f3bfbe1af362`; kode terakhir `11c152049c01bcca49f71c8a00c87e7d4dd208f2`, tree kode `dfd77b815ce0351056300cdd619c0a9b60380b6c`. Worktree bersih sebelum prompt ini ditambahkan. Periksa ulang drift.
- Main di worktree `C:/Users/Hafizh Rizqullah/Documents/Code/_active/Yomirra`: `1a889db70d6cc09e8ccf28b607e5b24130b9f843`. Ini baseline tercatat, bukan konfirmasi SHA yang sedang dilayani production sekarang.
- Local ref `origin/main` terakhir `9ce818786885e894eb56295ba2a128ceaf92292e`; local ref kandidat remote `11783306a89f9903af7d02b706a1614e6b511973`. Ref lokal bukan pembacaan remote live. Ada enam worktree lain dengan head berbeda; inventaris branch/PR closed serta pekerjaan unik diperlukan sebelum cleanup.
- Draft PR #146: head remote terakhir yang diketahui `11783306a89f9903af7d02b706a1614e6b511973`. CI hijau historis remote tidak memverifikasi kode lokal terbaru; deployment Vercel sebelumnya ditolak karena akun blocked. Baca status dan SHA terkini melalui akses resmi sebelum mengambil keputusan.
- PR #143 dan #147 harus diperiksa terpisah; jangan merge atau memasukkan seluruh diff-nya tanpa review scope. Q138 tetap OFF; jangan cherry-pick implementasi outbox `65186e00` atau mengaktifkannya sebagai jalan pintas.
- Push ke branch draft dapat memicu integrasi Vercel. Jangan melakukan push/merge dengan asumsi itu hanya operasi Git lokal. Siapkan jalur publikasi yang telah diotorisasi tanpa autodeploy tak disengaja.

## 2. Bukti lokal yang tersedia dan batasnya

Gate kode `11c15204` memakai snapshot TEMP exact commit, 806 file tracked, arsip/tree/lockfile dicocokkan oleh QA. `.env.local` asli dikecualikan dan tidak diubah; dependency junction memakai instalasi yang sudah ada. Paket bukti lokal, bila masih tersedia:

```text
%TEMP%/yomirra-local-gates-20261107/source-manifest.json
%TEMP%/yomirra-local-gates-20261107/gate-summary.md
```

Hasil: typecheck exit 0; lint exit 0, 0 error/503 warning; full Vitest 257 file/1.848 tes PASS; production build exit 0, 27 halaman statis, BUILD_ID `9QL5t_XztrxRQGKdaxy9k`; browser Chromium/WebKit 78 PASS, nol unexpected/flaky. Dua gate BrowserStack cloud SKIP karena kredensial tidak tersedia; perangkat fisik tetap NOT_TESTED. Dokumentasi sesudahnya tidak mengubah source aplikasi.

Percobaan sebelumnya tetap dicatat: guard env berhenti sebelum typecheck; Vitest path pendek Windows gagal collection `/vitest.setup.ts` dan dihentikan, lalu path kanonis memberi diagnostik 19 PASS dan full PASS; quoting konfigurasi browser gagal sebelum tes, diperbaiki satu baris dan di-QA sebelum smoke PASS. Enam error transport proxy belum diketahui penyebabnya. Server lokal 3000/18080 sudah berhenti pada penutupan run.

Ini bukti lokal Windows Node 24.22.1/pnpm 10.20.0, berbeda dari CI Node 22/pnpm 9. Environment allowlist, fixture Node fetch, dan proxy browser loopback bukan sandbox jaringan seluruh OS; escape redirect loopback awal tercatat sebagai batas harness. Redis loopback sengaja tidak tersedia dan source memakai fixture: hasil ini tidak membuktikan Redis sehat, provider live, CDN edge, deployment hosted, Firebase dua perangkat, atau iOS/iPadOS nyata. Jalankan ulang gate yang relevan pada SHA final; jika source berubah, jangan mewariskan status PASS lama ke source baru.

Audit produksi sebelumnya nol advisory yang diketahui, tetapi audit penuh masih menyisakan advisory moderat minimatch 10.2.5 pada rantai ESLint; versi/perbaikan terkini perlu diperiksa. Sebanyak 503 warning lint juga tetap residual, bukan bukti semua masalah keamanan sudah bersih. Owner pernah melaporkan konfigurasi malformed/duplikat `max_concurrent_threads_per_session`; handoff lama mencatat koreksi parser lokal. Verifikasi parser dan governance runtime yang sedang dipakai jika gejala masih ada, tanpa menganggap potongan konfigurasi otomatis valid atau mengubah approval/sandbox.

Perbaikan backup terbaru menyelesaikan ID kanonis sebelum alias dalam tiap dataset, lalu status perangkat menang atas cadangan. Engine menangani own-key khusus; parser record Zod terpasang membuang `__proto__` sebelum restore, sehingga tes engine bukan jaminan impor JSON untuk key itu. Jangan mengubah schema/storage/migrasi/auth/NSFW untuk memperluas klaim ini.

## 3. Otoritas, akses, dan persetujuan

Prioritas pertama: inventaris read-only dan pekerjaan lokal yang reversible. Owner mengizinkan pembacaan dashboard melalui akses resmi sekarang. Sesi Codex sebelumnya ditolak saat mengamati origin Vercel meski tab ditemukan di Chrome/Opera; tidak ada isi privat WAF yang berhasil dibaca. Antigravity wajib memeriksa authority runtime/konektor resminya sendiri. Jangan menganggap penolakan lama sebagai larangan permanen untuk runtime yang kini berwenang, dan jangan memakai browser/API/CDP/akun lain untuk melewati penolakan yang benar-benar berlaku. Bila ditolak, hentikan tindakan yang ditolak, catat alasan persis, lalu gunakan remediasi kontrol berwenang atau owner/provider.

Read-only tidak memberi izin publish Firewall, mengubah security policy/CSP/auth, secret, billing, infra, rules atau data production, manual rollback, deploy, maupun unblock/boost. Siapkan perubahan konkret dan bukti terlebih dahulu, lalu minta approval eksplisit untuk tindakan tersebut. Jangan mengaktifkan boost sekadar untuk melihat apakah berhasil. Unblock akun adalah langkah terakhir setelah gate siap dan approval eksplisit owner tercatat. Jika pause menghalangi semua uji yang diperlukan, minta provider mengonfirmasi jalur uji yang diizinkan; laporkan BLOCKED alih-alih unblock lebih awal atau memakai akun/proyek lain untuk menghindari hold.

Merge bersyarat hanya setelah seluruh gate yang berlaku lulus, tidak ada P0/P1 terbuka, QA independen selesai, approval yang diperlukan tercatat, dan efek integrasi deployment sudah dipahami. Tidak ada izin implisit untuk push yang memicu production. Jangan klaim provider sudah pulih berdasarkan label Ready saja.

## 4. Bukti insiden dan screenshot baru

Riwayat mencatat HTTP 402 `DEPLOYMENT_DISABLED` dan hold Hobby `FAIR_USE_LIMITS_EXCEEDED` pada Fast Origin Transfer. Awal hold tercatat 5 November 2026 23:56:17 WIB; jadwal unpause tercatat 5 Desember 2026 23:56:17 WIB, masih perlu verifikasi aktual.

Lima screenshot baru dari owner berada di folder berikut, `image-1.png` sampai `image-5.png`:

```text
C:/Users/Hafizh Rizqullah/.codex/attachments/bf67b243-5394-46f2-82c5-2788d91b49e7/
```

Inspeksi gambar asli sebelum mengutipnya sebagai hasil observasi sendiri. Ringkasan owner: banner pause 5 November → 5 Desember karena FOT; Overview 15,15 GB FOT, 12,14 GB FDT, dan sekitar 393 ribu request CDN; tooltip 4 November menunjukkan 184,32 MB incoming dan 2,63 GB outgoing FDT; snapshot deployment production merujuk main `1a889db7`. Scope/team/project, rentang waktu Overview, satuan penuh, dan bagian yang terpotong belum diketahui. Ini snapshot, bukan pembacaan live. Upaya dokumentasi screenshot sebelumnya gagal dan tidak menghasilkan perubahan file; jangan menganggap catatan tersebut sudah tersimpan selain prompt ini.

Jangan mencampur angka screenshot baru dengan snapshot lama 365.482 request/11,51 GB FOT/8,05 GB FDT pada 3–5 November WIB atau snapshot tim 11,15 GB origin keluar. Baca filter periode, environment, resource, timezone dan arah transfer sebelum membandingkan. Jangan menyimpulkan penyebab lonjakan atau endpoint terboros dari total agregat.

Untuk investigasi historis gunakan interval **[3 November 2026 00:00 WIB, 6 November 2026 00:00 WIB)**, yaitu **[2026-11-02T17:00:00Z, 2026-11-05T17:00:00Z)**. Jika retensi dashboard tidak mencakup interval itu, minta ekspor agregat provider melalui jalur berwenang; tandai unavailable bila tidak ada. Jangan mengganti missing evidence dengan perkiraan. Pengukuran prospektif baru harus dilabeli berbeda.

## 5. Ledger penutupan 18 masalah awal

Buat ledger persisten dengan kolom ID/prioritas, kondisi aktual, SHA/file, reproduksi, perubahan, hasil tes dan artefak bertimestamp, QA, status lokal/hosted/perangkat, blocker, serta tindakan owner. Urutan P0 → P1 → P2 berikut adalah prioritas kerja; eskalasi jika bukti menunjukkan risiko lebih tinggi. Semua item dimulai **OPEN/UNVERIFIED pada sesi ini** sampai bukti source dan pengujian yang sesuai dicocokkan. Implementasi yang sudah ada tidak otomatis berarti CLOSED.

Ledger 18 ini direkonstruksi dari ringkasan percakapan yang diteruskan controller; itu bukan bukti pembacaan daftar asli lengkap. Tiga attachment instruksi di atas telah diperiksa, tetapi tidak memuat seluruh daftar 18 secara eksplisit. Inventaris attachment/riwayat yang tersedia; bila instruksi asli hilang dan perbedaannya material bagi acceptance atau scope, minta owner menyediakannya sambil melanjutkan pekerjaan independen.

| ID | Prioritas | Masalah dan bukti penutupan minimum |
| --- | --- | --- |
| 01 | P0 | Profil SSR, Redis, upstream: pisahkan route template, HTML/RSC/gambar, cold/warm, cache hit/miss, request/status/byte/p95 dan command; korelasikan periode yang sama, jelaskan scope sampel dan bottleneck tanpa klaim kausal palsu. |
| 02 | P0 | Perlindungan berlapis: origin limiter/bounded concurrency dan edge sebelum origin; buktikan NAT sah, traffic tersebar, fail-closed operasi sensitif, budget/alert/stop dan request reject tidak menjalankan origin. |
| 03 | P0 | Kesehatan source dan Maintenance: verifikasi provider yang gagal tampil jujur, tidak dipilih sebagai sehat, cooldown/recovery terukur; jangan mengarang hasil live dari fixture. |
| 04 | P0 | Related/rating 503: buktikan degradasi parsial/cache/fallback tanpa menutupi kegagalan atau membanjiri Redis/provider. |
| 05 | P0 | 403/429/timeout/slug/circuit breaker: reproduksi terkontrol, validasi identitas, batas retry/timeout/Retry-After, recovery dan isolasi source; periksa Shinigami, Komikindo, KomikNesia, WestManga, Asura, MangaDex sesuai izin. |
| 06 | P1 | Shared Reader dock: satu kontrak navigasi/kontrol desktop-mobile, safe area, keyboard, tidak bertumpuk dan tidak menutupi konten. |
| 07 | P1 | Tema terang: kontras teks/kontrol/status termasuk Settings, header dan splash; uji light/dark dan focus. |
| 08 | P2 | Glass: konsistensi chrome/radius/border/blur sesuai desain repo, legibilitas dan fallback tanpa ketergantungan efek. |
| 09 | P1 | Urutan gambar Reader dan pemuatan berbatas: urutan halaman benar, prioritas viewport, lompatan jauh/retry/error tidak macet, concurrency/memori dan offline tervalidasi. |
| 10 | P1 | Hapus custom zoom: browser pinch/zoom tetap bekerja, tidak ada gesture interception atau efek samping pada scroll/navigasi. |
| 11 | P2 | Hierarki detail: judul/metadata/aksi utama/chapter terbaca, tidak ada CTA ganda atau layout rapuh di layar sempit. |
| 12 | P2 | Banner katalog di bawah hasil: urutan benar pada loading/empty/error dan hasil normal, bukan menghalangi discovery. |
| 13 | P1 | Cover MangaDex: jalur cover/proxy/fallback aman, gambar gagal dan respons provider ditangani; pisahkan bukti fixture/live. |
| 14 | P0 | CSP/eval: verifikasi code generation Zod dan penggunaan eval yang relevan, catat pelanggaran pada sign-in/out, Reader, backup dan PWA. CSP tetap Report-Only sampai enforcement direview, diuji staging dan disetujui; jangan melonggarkan policy untuk menghilangkan error. |
| 15 | P2 | Onboarding: langkah/aksi dan exit jelas, state baru/kembali dan aksesibilitas tidak membuat dead end. |
| 16 | P2 | Horizontal pill: layout/overflow/selected/focus konsisten, teks tidak terpotong dan tetap dapat dioperasikan keyboard/touch. |
| 17 | P2 | Scrollbar tersembunyi dengan aksesibilitas: scrolling tetap dapat ditemukan dan dipakai keyboard, focus terlihat, tidak membuat konten tak terjangkau. |
| 18 | P1 | Status chapter: current/read/completed/failed berbeda dan jujur; kunjungan saja tidak menaikkan milestone, cursor tidak hilang, completion tidak terjadi ketika gambar gagal. Kontrak auto-completion saat mencapai akhir sebelumnya belum diputuskan; dapatkan keputusan yang diperlukan dan uji, jangan anggap Next Chapter membuktikan semuanya. |

Audit temuan tambahan di tracker/history yang memengaruhi gate ini, termasuk 40 temuan yang dilaporkan di `docs/bugs&refinement/FINDINGS.md` pada ref `origin/main` `9ce81878`. Itu laporan untuk ditriase, bukan bukti bug atau penutupan. Jangan memperluas ledger 18 menjadi klaim seluruh temuan tersebut sudah diselesaikan; daftarkan scope tambahan dan blocker secara eksplisit.

## 6. Jalankan penutupan gate operasional

1. **Read-only dashboard dan deployment.** Catat team/project/environment, timestamp WIB/UTC dan referensi bukti. Periksa SHA/deployment ID yang benar-benar melayani alias production; WAF rules aktif/aksi/bucket/region/pengecualian dan jatah rule; Top Paths, response payload buckets, request buckets, cache hits, origin rejection, latency/status; FOT/FDT incoming/outgoing, kuota/reset, Redis command; boost eligibility/faktor/status; alert/penerima; serta hak staging saat hold. Snapshot lama dan 404 lookup tidak membuktikan keadaan kini.
2. **Review source dan perbaikan lokal.** Reproduksi item ledger, lakukan perubahan terbatas dengan specialist yang akuntabel, QA independen setiap deliverable. Tinjau admin allowlist/email terverifikasi: kebenaran `email_verified` akun dan persetujuan kebijakan adalah dua bukti berbeda. Tinjau secrets, SSRF, cache personalized/NSFW, otorisasi, Redis fail-closed/deadline dan kemungkinan outcome mutasi timeout; jangan retry mutation secara buta.
3. **Staging terisolasi.** Siapkan rencana konkret dan approval yang diperlukan sebelum membuat/mengubah resource. Gunakan proyek uji terlindung Vercel Authentication untuk semua deployment, tanpa alias Yomirra atau cron/webhook/integrasi production. Redis harus resource/credential terpisah, bukan prefix key saja. Firebase client/server harus project uji yang sama dengan deployed rules yang dicatat, dua UID sintetis dan guest. Secret session/proxy/admin uji terpisah; tidak ada secret/data production. Konfirmasi hak testing resmi dengan provider jika hold menghalangi staging.
4. **Security dan durability hosted.** Uji owner/cross-UID/guest, token valid/expired/invalid, A → logout → B, delayed UID writes, offline/relaunch, dua perangkat, preferensi/NSFW pada storage/RSC/CDN/Redis; Redis sehat, putus dan socket diam; related/rating degradasi; source recovery. Periksa rules yang benar-benar terpasang. Bukti emulator/local saja tidak menutupnya. Jangan aktifkan Q138. BrowserStack dan iPhone/iPad installed-PWA nyata tetap gate terpisah; kredensial/hardware tidak tersedia berarti BLOCKED/NOT_TESTED, bukan PASS.
5. **CI/Preview exact SHA.** Jalankan mandatory checks pada source final dengan versi CI yang benar, audit dependency terbaru, build dan browser production smoke, lalu cocokkan artifact SHA dengan protected Preview. Bedakan warning, flaky/retry, skip dan kegagalan awal. Jangan menjalankan `scripts/check-release-health.mjs` langsung terhadap Preview: URL health-nya tetap production; gunakan harness/konfigurasi target yang direview. Tes sintetis delapan skenario/22 mocked fetch lama hanya bukti keputusan exit, bukan pengiriman alert/pause sungguhan.

## 7. Drill edge, budget, alert dan stop

Ikuti `docs/ops/pre-unblock.md`; periksa dokumentasi provider terkini sebelum memakai nama menu/API. Rule halaman **60 request/60 detik per IP, aksi Log** hanyalah proposal, bukan rule aktif atau approval. Keluarkan image proxy, Next Image, aset statis, service worker dan health dari bucket navigasi. Jangan memberi Challenge pada API JSON, worker atau webhook. Cocokkan aturan paket/region agar batas tidak diasumsikan global.

**Log tidak menolak request.** Bukti aksi Log saja tidak dapat menutup gate reject-before-origin atau dianggap sebagai perlindungan enforcement.

Sesudah approval staging, lakukan Log terlebih dahulu; enforcement 429 hanya setelah review bukti dan approval kebijakan. Uji NAT/prefetch/back-forward/Reader, aset pengecualian dan recovery window; korelasikan request ID/waktu edge-origin. Status 429 tanpa korelasi tidak membuktikan penghematan fungsi. Buktikan alert sampai kepada owner melalui sinyal sintetis dan kontrol stop untuk Preview serta deployment berlabel Production **milik proyek uji**, bukan production Yomirra. Tidak perlu menghabiskan kuota nyata untuk memicu alert.

Cap satu sesi: **160 request aplikasi ATAU 15 menit ATAU 25 MiB body respons, mana yang lebih dulu; concurrency 1, maksimal 2 request/detik, tanpa auto-retry/prefetch/gambar tambahan**. Termasuk semua probe, recovery dan konfirmasi: maksimal 20 isolation/smoke + 68 fase Log + 68 fase enforcement + 4 alert/stop. Request dashboard/provider dicatat terpisah. Body klien bukan total transfer tagihan; amati meter provider juga. Jangan menaikkan cap untuk memperoleh p95 atau menutup gate lain; rencanakan sesi terpisah dengan anggaran/approval bila diperlukan.

Stop generator segera pada cap, quota baseline tak diketahui, HTTP 402, identitas/resource salah, provider/data production tersentuh, error tak dijelaskan, alert gagal, atau reject edge masih memicu origin. Jalankan kontrol stop yang disetujui setelah generator berhenti; catat request aktual, byte, durasi, stop reason, SHA/deployment dan hasil. P0/P1 gagal atau bukti belum cukup mempertahankan NO-GO.

## 8. Keputusan release, pemulihan dan cleanup

Siapkan paket review: ledger, CI/Preview exact SHA, security QA, budget/WAF/alert/stop, rollback kompatibel, risiko tersisa dan tindakan owner. Jika semua gate terpenuhi, minta approval final eksplisit owner untuk unblock/boost dan tindakan produksi yang dijabarkan. Catat approval dan resource sebelum eksekusi. Deployment/merge hanya mengikuti otorisasi dan urutan integrasi yang sudah direview; hindari jeda production terbuka dengan kode/proteksi yang belum siap.

Sesudah pemulihan yang diizinkan, cocokkan alias, SHA dan deployment immutable aktual. Smoke read-only volume rendah lalu amati transfer/Redis/error/p95 pada +15 menit, +1 jam, +24 jam; bila belum menunggu jendela itu, laporkan pending. Ambang stop dan budget harus memakai kuota aktual, bukan contoh runbook. Manual rollback memerlukan approval; deployment baseline yang pernah Ready tetapi ikut 402 belum membuktikan target rollback dapat dilayani. Verifikasi kompatibilitas worker/cache/data dan target sebelum meminta keputusan rollback.

Cleanup hanya sesudah release stabil dan audit authoritative branch/worktree/PR selesai. Catat pekerjaan unik, status dirty/untracked, referensi remote dan dependensi PR; pertahankan yang belum terintegrasi. Hapus hanya worktree/branch closed yang terbukti aman dalam scope yang diotorisasi. Jangan force-delete atau menghapus pekerjaan unik untuk membuat daftar worktree rapi.

## 9. Laporan akhir Quinella AGY untuk ditempel kembali

Tulis laporan self-contained dengan status keseluruhan **VERIFIED / DEGRADED / BLOCKED** dan waktu WIB/UTC. Gunakan Observed/Inference/Proposal/Unknown untuk membedakan bukti. Sertakan:

- Exact SHA main/candidate/code/docs/CI/Preview/production, deployment IDs/aliases, link log/artifact dan timestamp; jelaskan drift.
- Tabel P0/P1/P2 seluruh 18 ID, kondisi before/after, reproduksi, hasil/QA, artefak dan blocker. Daftarkan gate tambahan tanpa klaim penutupan palsu.
- Check totals/exit, warning, skip/reason, flaky/retry, audit, versi runtime; batas local/fixture/hosted/perangkat nyata dan kegagalan awal yang relevan.
- WAF aktif dan verifikasi reject-before-origin; kuota/jendela/transfer/Redis/status/p95/cache, periode sebanding dan scope, serta bukti alert/stop/drill termasuk budget aktual. Missing metrics tetap Unknown.
- Security: email terverifikasi vs approval policy, deployed Firebase rules/dua perangkat, secrets/cache/NSFW/auth, Redis sehat/degradasi dan status CSP/Q138.
- Tindakan eksternal yang benar-benar dilakukan, resource, approval spesifik dan efek; tindakan yang belum diizinkan; hasil monitoring +15 menit/+1 jam/+24 jam; rollback/cleanup aktual.
- Daftar blocker tersisa dengan penyebab, bukti penolakan, siapa yang dapat membuka, langkah konkret owner/provider berikutnya, dan apakah approval final unblock masih pending. Jangan mengganti BLOCKED dengan VERIFIED karena kode lokal lulus.

Simpan laporan dan ledger di repository dalam scope docs yang disetujui, berikan path serta diff yang dapat direview. Jawaban akhir Quinella AGY harus siap ditempel oleh owner ke chat Codex asal tanpa memerlukan pembacaan riwayat sesi Antigravity. Jangan mengirim laporan ke chat, email, atau kanal eksternal secara otomatis tanpa otorisasi penerima dan kanal yang eksplisit.
