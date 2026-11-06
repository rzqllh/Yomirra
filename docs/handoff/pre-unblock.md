# Handoff pre-unblock

**BLOCKED** · 6 November 2026 WIB. Baseline main **1a889db70d6cc09e8ccf28b607e5b24130b9f843**. Head remote [Draft PR #146](https://github.com/rzqllh/Yomirra/pull/146) saat mulai **11783306a89f9903af7d02b706a1614e6b511973**. Commit lokal hardening **3be3bd1c512e3e70e7c0973ce94f9476f94cc69a** dan batas telemetri admin **66bd1c22e8fc4f021824033c98757d943324b66d**. Branch draft memicu integrasi Vercel saat push, sehingga perubahan tetap lokal selama larangan deploy berlaku.

## Bukti insiden 3–5 November

- **CONFIRMED**. Snapshot dashboard Vercel proyek mencatat 365.482 request CDN, 11,51 GB Fast Origin Transfer, dan 8,05 GB Fast Data Transfer selama 3–5 November WIB. Rata-rata tiga hari 1,41 request/detik. Pada 31 Oktober–2 November, 10.019 request, 0,039 request/detik, dan 820,67 MB Fast Origin Transfer. Snapshot tim mencatat 11,15 GB transfer origin keluar termasuk header dan body. Bandingkan proyek dengan proyek dan tim dengan tim. [Vercel Yomirra](https://vercel.com/rzqllhs-projects/yomirra)
- **CONFIRMED**. Bukti Redis sebelumnya mencatat sekitar 915 ribu GET pada 4 November 06.27 WIB, dengan laju perintah di sekitar 13–14/detik pada periode sibuk. Aktivitas mulai 3 November sekitar 05.16 WIB sebelum deployment #128 pukul 13.45 WIB. Angka Redis dan request CDN memiliki jendela dan satuan berbeda. [Audit lonjakan Redis](../ops/redis-read-spike-2026-11-03.md)
- **CONFIRMED pada kode**. Precache publik memasukkan aset onboarding, efek, dan branding. Reader paged mengirim dua jalur prefetch chapter berikutnya, satu RSC dan satu API halaman. MangaDex mencoba ulang setelah tidur maksimal lima detik walaupun provider meminta jeda lebih lama. Related dan rating membaca seluruh body sebelum validasi schema. Portal admin membaca metadata TTL dan tipe dari sampel Redis yang hanya dipakai untuk menghitung jumlah key.
- **SUSPECTED**. Install PWA dingin, prefetch Reader/RSC, cache miss lintas instance, gambar proxy, dan crawler bisa menambah volume. PWA public precache terutama dapat berdampak pada Fast Data Transfer. Kontribusi masing-masing pada Fast Origin Transfer dan Redis selama insiden belum diketahui.
- **UNVERIFIED**. Retensi Vercel Hobby menghalangi Top Paths, request rate per path, distribusi byte per respons dan status pada 3–5 November. Tidak ada bukti untuk memeringkat endpoint historis, menyamakan byte header dan body, atau mengaitkan seluruh lonjakan dengan PR tertentu. Minta ekspor agregat provider atau gunakan data periode baru untuk verifikasi prospektif.

## Hasil kode dan simulasi

| Perubahan | Bukti lokal |
| --- | --- |
| Public precache PWA | Manifest baseline memuat 19 aset publik (10.149.735 B). Build kandidat memuat 1 ikon (31.265 B). Bundle Next tetap tercakup. Byte ini mengukur ukuran file, di luar header dan rasio hit CDN. |
| Reader paged | Uji komponen melangkah ke dua halaman terakhir. Kandidat tidak memanggil prefetch RSC atau query halaman chapter berikutnya. Navigasi aktual dan lookahead gambar chapter aktif tetap teruji. |
| MangaDex retry dan rating batch | Integer atau HTTP-date Retry-After dibaca. Jeda di luar anggaran inline menghasilkan 429 bertipe dan membuka cooldown. Rating membatasi panggilan MangaDex dan AniList dengan scope terpisah serta mempertahankan hasil parsial. |
| Body related/rating | Batas input 128/16 KiB menghentikan pembacaan stream yang melampaui limit. Uji mencakup request tanpa Content-Length dan penolakan awal sebelum provider. |
| Image proxy | Jalur error hanya mencatat kategori error, sehingga URL bertanda tangan dan token query upstream tidak ikut dicetak. |
| Ringkasan Redis admin | Satu INFO dan maksimal empat SCAN untuk sampel ringkasan. Jalur lama melakukan satu INFO, hingga 200 SCAN dan hingga 2.000 TYPE/TTL pada 1.000 key. Regression test memverifikasi cap dan deduplikasi. Detail manual masih meminta TYPE dan TTL. |

MangaDex dibandingkan dengan adapter dari head draft **11783306**, menggunakan transport yang memberi HTTP 429, Retry-After 120 detik, body 21 B, kapasitas nyata delapan per scope, dan fixture terpisah untuk setiap run. Kirim 100 dan 1.000 pekerjaan Promise bersamaan, ukur status dan waktu dari masuk sampai selesai, termasuk pekerjaan yang segera ditolak.

| Pekerjaan | Upstream request | Byte body upstream | p95 admitted | p95 seluruh pekerjaan | Hasil |
| --- | --- | --- | --- | --- | --- |
| 100 | 16 → 8 | 336 → 168 | 5.039,26 → 4,79 ms | 5.038,30 → 3,41 ms | 100 respons 429 yang diharapkan, 0 command Redis |
| 1.000 | 16 → 8 | 336 → 168 | 5.036,65 → 28,39 ms | 23,51 → 25,91 ms | 1.000 respons 429 yang diharapkan, 0 command Redis |

Redis 7.0.15 lokal tanpa persistence. Ulangi dengan Promise.all yang mengakses satu key baru, loader 15 ms dengan JSON 523 B dan TTL Redis 30 dtk, kemudian ulangi pada key yang sama selama near-cache masih hangat. Ukur delta INFO commandstats sebelum dan sesudah setiap batch. Implementasi cache sama dengan head draft sebelumnya.

| Pekerjaan | Redis GET + SETEX dingin | Command/request dingin | Command hangat | p95 dingin/hangat | RSS delta dingin/hangat |
| --- | --- | --- | --- | --- | --- |
| 100 | 1 + 1 | 0,02 | 0 | 26,72/0,32 ms | 208/404 KiB |
| 1.000 | 1 + 1 | 0,002 | 0 | 27,57/2,94 ms | 1.164/288 KiB |

Kedua batch Redis selesai tanpa error. RSS adapter bervariasi antara −8.316 dan +2.376 KiB dalam proses yang sama, sehingga sampel ini tidak cukup untuk menilai pertumbuhan heap. Simulasi mencakup satu instance, satu hot key, dan penolakan upstream terkontrol. Bukti edge, distribusi cold miss, dan command harian masih diperlukan.

Ringkasan admin dibandingkan memakai Redis loopback DB 9 yang kosong, diisi 1.000 key sintetis TTL 120 dtk. MONITOR difilter ke DB 9. Baseline 3be3bd1c menjalankan 2.011 perintah (1 INFO, 10 SCAN, 1.000 TYPE dan 1.000 TTL), sampel 1.000 key dalam 673,42 ms. Kandidat 66bd1c22 menjalankan 5 perintah (1 INFO dan 4 SCAN), sampel 401 key dalam 4,47 ms. Ini satu pengukuran, sehingga waktu tersebut bukan p95.

HTTP lokal related search pada 100 request dalam burst konkurensi 10 menghasilkan 12 HTTP 400 dan 88 HTTP 429, 4.244 B total body, dan p95 261,98 ms. Body terlalu besar menghasilkan 413 dengan 55 B pada related dan 42 B pada rating. Fixture memakai input sintetis yang tidak memanggil upstream.

## Review keamanan dan risiko operasional

- Admin memvalidasi otorisasi sebelum akses data. Mutasi dengan cookie sesi memeriksa origin. Cookie admin HttpOnly dan SameSite Strict. Rate limit sensitif memakai Redis dan menolak operasi saat Redis tidak siap. Isolasi akun Firebase dan Firestore ditinjau pada implementasi repo, dengan aturan default deny dan UID yang cocok untuk subtree pengguna. Aturan terpasang dan sinkronisasi perangkat menunggu hosting.
- Proxy memeriksa tanda tangan, URL, kebijakan DNS dan redirect, tipe raster, serta ukuran stream. Cache offline mensyaratkan dokumen bertanda aman dan raster yang lolos policy. Cache browser proxy private, sehingga efektivitas CDN untuk cold image tetap perlu diukur. Scope key Redis branch digunakan di operasi admin. Inspeksi manual Redis bisa mahal karena membaca hingga 1.000 key; pengukuran rutin sebaiknya memakai ringkasan.
- CSP masih Report-Only. Inline script sidebar memakai string statis, nama CSS transisi dibuat dari karakter alfanumerik dan tanda hubung, dan Redis EVAL adalah operasi server untuk Lua. Audit CSP enforcement dan kompatibilitas hosting adalah gate terpisah.
- Cache publik menggabungkan in-flight dengan batas 1.024 key. Near-cache berusia sampai 10 dtk dengan batas 256 entri, 8 MiB total dan 128 KiB per entri. Redis lifecycle membatasi timeout koneksi dan reconnect, dengan antrean offline nonaktif. Perilaku socket half-open dan distribusi key legacy tanpa envelope belum diukur.
- Audit dependency produksi mencatat 0 critical, 0 high, 7 moderate, 1 low, exit 1 karena advisory tersisa. Tidak ada perubahan lockfile pada hardening ini. Lihat [handoff final stabilization](final-stabilization.md) untuk cakupan audit kandidat sebelumnya.

## Verifikasi lokal tambahan

- Pada commit kode 66bd1c22, typecheck dan build production lokal lulus, termasuk 27 halaman statis. Lint selesai dengan 0 error dan 504 warning. Vitest penuh lulus 1.825 tes di 255 file. JSDOM mencatat warning untuk scrollTo. Playwright Chromium/WebKit dengan dua worker selesai dengan 78 lulus dan 2 tes perangkat fisik dilewati. Cakupan regression test mencakup instalasi PWA dan prefetch Reader.

- Build production lokal dengan port Redis yang sengaja tidak melayani memberi liveness 200 (15 B), readiness 503 (133 B), related dan rating 200 dengan envelope data (masing-masing 11 B), serta search intelligence 503 (67 B). Provider eksternal mendapat fixture kegagalan. Ini menguji degradasi dan pemisahan jalur sensitif. Uji lifecycle Redis mencakup putus dan reconnect, kuota habis, dan circuit recovery.
- Axe pada Settings di Chromium dan WebKit mencakup 320, 360, dan 1440 px dengan tema light/dark. Light mobile bersih pada sampel. Tab aktif dark 3,46:1, dua label navigasi desktop light 3,98:1, dan teks sekunder desktop 4,09–4,17:1 berada di bawah target 4,5:1. Temuan berada pada komponen UI yang tidak berubah. Audit aksesibilitas global dan perangkat fisik belum dilakukan.
- Registri memiliki maintenance statis untuk Komikindo dan WestManga (HTTP 403) serta KomikNesia (format parser). Snapshot health yang lolos setelah timestamp maintenance dapat memulihkan eligibility. Asura memvalidasi slug sebelum memanggil upstream. Shinigami dan Asura memakai timeout HTTP 15 dtk. Snapshot health, latensi dan recovery aktual untuk provider tidak disimpulkan dari fixture.
- Pengujian browser memakai Redis loopback, produksi build dan fixture upstream lokal. Warning Serwist menjelaskan registrasi otomatis nonaktif. Aplikasi menjalankan registrasi sendiri dan tes PWA memeriksa worker aktif. Browser emulasi mencakup WebKit dan Chromium.

## Gate yang masih terbuka

CI GitHub pada head remote sebelumnya lulus typecheck, lint, unit dan build termasuk smoke browser. Vercel menolak deployment karena akun diblokir. CI untuk commit lokal memerlukan publikasi yang tidak memicu deploy terlarang atau persetujuan terpisah. Laporan production sebelumnya mencatat HTTP 402. Lookup read-only konfigurasi firewall aktif memakai ID proyek dan scope tim mengembalikan 404 Config not found. Kontrol edge sebelum origin, alert budget, cache CDN, dan validasi keamanan hosted belum diverifikasi. [CI head remote](https://github.com/rzqllh/Yomirra/actions/runs/42151681374)

Langkah berikutnya ialah memvalidasi jatah dan kontrol edge serta alur budget dari [runbook pre-unblock](../ops/pre-unblock.md). Setelah Preview terisolasi tersedia, verifikasi SHA, isolasi Firebase dan cache, p95 serta transfer lintas instance. Owner menilai unblock setelah semua gate lulus.
