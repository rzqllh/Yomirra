# Final stabilization

## Release status

**BLOCKED** on 6 November 2026. Baseline `main` is `1a889db70d6cc09e8ccf28b607e5b24130b9f843`. PR #145 is merged. Vercel links that SHA to production deployment `dpl_9sVxqcKGx7sqprbQZeu6tF4buent`. The apex, canonical domain and immutable deployment hosts returned HTTP 402 `DEPLOYMENT_DISABLED` despite the deployment reporting Ready.

Authenticated Vercel team metadata reported Hobby fair-use soft block `FAIR_USE_LIMITS_EXCEEDED` on `fastOriginTransfer`. It began 5 November at 23:56:17 WIB. Vercel lists 5 December at 23:56:17 WIB as the scheduled unpause, which still requires verification. Both custom domains are verified. Route and team usage breakdowns were unavailable at the current observability tier. The traffic responsible for the overage remains unknown. [Vercel transfer documentation](https://vercel.com/docs/manage-cdn-usage)

The previous production smoke recorded a separate Redis 503 and successful related-search and rating-batch samples. Current Redis, Firebase and source health cannot be inferred from the hosting response. Production stops here pending provider recovery. The owner can inspect the team Usage breakdown and ask Vercel about restoration on the existing plan. Billing changes, manual redeploy and manual rollback require separate approval.

## Kandidat dan integrasi

- Draft [PR #146](https://github.com/rzqllh/Yomirra/pull/146) memakai `codex/final-stabilization`. CI awal pada `751060ea` lulus typecheck, lint, unit/integration, dan build. Vercel menolak deployment PR dengan “Account is blocked.” [CI awal](https://github.com/rzqllh/Yomirra/actions/runs/42144028354)
- Draft #143 tetap terpisah. YOM-01/02/03 dari `6ce3c1c7`, `617d7aa1`, dan `601659ec` masuk sebagai `a96ed83b`, `3bf61581`, dan `8db975c2`. Resolusi mempertahankan dock dari main. `b8e7116` memulihkan gaya menu yang berubah. Q138 `65186e00` tetap dikecualikan. Audit menemukan bahwa mekanisme tersebut belum menjamin atomisitas optimistic write, isolasi key fallback antar UID, replay startup, dan kecocokan operation ID dengan ACK.
- `beb8789a`–`1439375a` memisahkan liveness dan kesiapan Redis. `91235521` dan `f34176cf` mengikat halaman Reader pada judul, chapter dan akses yang valid. `81fe0a70` mengisolasi manifest kustom dan membatasi waktu, ukuran serta konkurensi. `a523e3b7` membatasi satu batch rating dan menggabungkan pembacaan override yang bersamaan.
- Audit independen `751060ea` berstatus FAIL. Sae menemukan cache SVG legacy dan antrean URL bertanda tangan lama yang macet. Rinne menemukan shell Unduhan bergantung cookie dan cache gambar privat yang menghilangkan reuse CDN antarpembaca. Perbaikan offline dan format URL ada di branch. Pengukuran edge serta review pada SHA terakhir tetap menjadi gate.
- Pemeriksaan Firebase meliputi aturan UID di repo dan guard akun aktif sebelum write. Aturan yang terpasang di production dan sinkronisasi dua perangkat belum diverifikasi. Override admin dapat kosong pada instance dingin saat Redis putus. CSP tetap Report-Only.

## Bukti dan batas pengujian

- Redis lokal 7.0.15. Uji 96 GET readiness pada konkurensi 8 mencapai p95 65 ms dengan PING 3 → 3. Saat Redis dihentikan, readiness menjadi 503, liveness tetap 200, dan readiness kembali 200 setelah Redis pulih.
- Simulasi pembacaan lokal menggunakan 96 GET `/api/sources` pada konkurensi 8 ditambah satu pemanasan. Semua sampel 200, p95 27 ms, Redis menambah 14 GET, satu MGET, dan nol PING. Sampel satu instance tidak mewakili distribusi serverless maupun insiden Upstash.
- Dua sampel Shinigami latest pada build lokal dan Redis terisolasi 200 sekitar 215–217 ms. Detail, chapter, performa Reader, recovery tiap adapter, dan traffic production masih memerlukan pengukuran tersendiri.
- `pnpm audit --prod` turun dari 3 critical, 24 high, 28 moderate, dan 8 low menjadi 0 critical, 0 high, 7 moderate, dan 1 low. Advisory tersisa mengenai @babel/core, baseline-browser-mapping, glob, minimatch, protobufjs, dan uuid. Audit masih keluar nonzero.
- Tidak tersedia Preview Vercel aktif dengan Redis terisolasi. Belum ada ukuran transfer gambar cold dari beberapa klien, CDN hit ratio, atau kuota Redis antarinstance. Header privat memisahkan informasi limiter per klien, tetapi menambah origin request ketika cache klien dingin. Rilis memerlukan pengujian edge terkontrol sebelum mengubah kebijakan cache.
- Cache HTTP immutable yang sudah berada di browser lama berada di luar kontrol worker baru. Cache dokumen kandidat memerlukan kunjungan online sebelum offline. Cold-start Reader untuk chapter yang belum pernah dibuka belum diverifikasi.

## Pemantauan dan recovery

- `release-health.yml` tersedia dalam keadaan opt-in. Setelah akses pulih dan owner menyediakan konfigurasi monitor, jalankan dua GET health dan satu statistik Upstash setiap 15 menit. Threshold awal 1 s liveness, 2 s readiness, 80% anggaran Redis bulanan atau 5% pemakaian harian terhadap anggaran bulanan. Workflow hanya mengukur sampel health dan kuota Redis. Gunakan Vercel Usage untuk Fast Origin Transfer serta Observability untuk error dan latency. [Upstash stats](https://upstash.com/docs/devops/developer-api/redis/get_database_stats) · [Vercel Observability](https://vercel.com/docs/observability)
- Pulihkan akses provider, verifikasi canonical domain dan deployment yang melayani SHA main, kemudian jalankan kembali smoke read-only berjumlah kecil. Bandingkan error dan latency, status Redis/Firebase/source, dan angka transfer sebelum promosi kandidat. [Kegagalan health terjadwal](https://github.com/rzqllh/Yomirra/actions/runs/42099020836)
- Baseline rollback kode adalah `1a889db70d6cc09e8ccf28b607e5b24130b9f843`. Deployment baseline ikut terkena HTTP 402. Setelah hosting pulih, uji bahwa artifact rollback dapat dilayani dan tinjau kompatibilitas worker/cache sebelum menggunakannya. Rollback manual tetap memerlukan approval. Jangan merge jika ada gate gagal atau blocker P0/P1 yang terdampak.
