# Pre-unblock Yomirra

Status **BLOCKED**. Gunakan runbook ini untuk evaluasi Draft PR #146. Owner mengendalikan firewall, unblock, dan rollback production.

## Jalur yang perlu diawasi

| Jalur | Batas yang ada pada kandidat | Bukti yang diperlukan di hosting |
| --- | --- | --- |
| HTML, RSC, Reader | Homepage, katalog, detail, Reader, dan pencarian berbagi 240 GET/HEAD per 60 dtk per IP per instance. Reader SSR memberi daftar chapter 250 ms sebelum melanjutkan jalur kritis. Mode halaman meminta chapter berikutnya saat navigasi. Konten mengikuti preferensi dan kebijakan NSFW. | Request dan byte origin untuk HTML dan RSC, hit/miss CDN, p95 detail dan Reader, cache isolation untuk akun dan preferensi berbeda. |
| Pencarian dan related | Kebijakan public-search 120/60 dtk dan related 12/60 dtk per identitas per instance. Related menerima hingga 128 KiB. Search Intelligence menerima hingga 4 MiB. Kuota embedding memerlukan Redis, dengan paling banyak delapan pekerjaan unik aktif per instance modul. Permintaan identik berbagi pekerjaan dan pencarian leksikal tetap tersedia saat kapasitas embedding penuh. | Pisahkan hit, miss, penolakan origin, dan penolakan edge. Catat ukuran request/response tanpa judul atau body. |
| AI dan autentikasi admin | AI membatasi delapan request aktif per instance dan body JSON 64 KiB untuk teks atau 8 MiB + 64 KiB untuk input gambar. Pertukaran sesi admin menerima 4 KiB. Kuota sensitif menulis counter dan expiry secara atomik. Deadline Redis 1,5 dtk dan socket tanpa respons ditutup pada 2 dtk. Perintah yang belum mendapat balasan tidak dikirim ulang otomatis. | Fail-closed saat Redis putus atau diam, lonjakan command, kebijakan cache, dan akses admin terotorisasi. Verifikasi keadaan sebelum mengulang mutasi yang mengalami timeout karena perintah bisa sudah diterapkan. |
| Rating batch | 30/60 dtk per identitas per instance, hingga 20 judul dan 16 KiB input. Anggaran lookup 4 dtk, empat judul paralel per batch. | Volume batch, distribusi byte, hasil parsial, cache miss, 403/429, p95, dan biaya Redis per lookup. |
| Image proxy dan cover | 600/60 dtk per identitas per instance, 16 stream aktif per instance, 15 MiB per gambar dan 15 dtk. Cache browser private. Redirect hanya untuk CDN HTTPS yang diizinkan. | Byte gambar proxy, cover fallback, tanda tangan invalid, dan angka 403/429 per provider. Pisahkan gambar Reader dari RSC. |
| Source adapters | Delapan pekerjaan per scope dan 32 global per instance. Cooldown dan negative cache berbatas. | Error per sumber, waktu cooldown, hasil recovery dan p95 Shinigami, Komikindo, KomikNesia, WestManga, Asura, MangaDex. |
| Ringkasan Redis admin | Otorisasi admin, satu INFO dan paling banyak empat SCAN per ringkasan. Inspeksi manual terpisah dapat membaca tipe dan TTL hingga 1.000 key. | Pastikan volume refresh admin sesuai anggaran. Gunakan ringkasan untuk pemantauan rutin. |
| Health dan cron | Readiness memiliki cache lokal 10 dtk. Halaman Sumber melakukan polling 60 dtk saat aktif. Workflow health opsional dapat memeriksa dua endpoint setiap 15 menit. | Liveness, readiness, volume probe dan kontribusi command Redis. |
| PWA dan CDN | Precache aset publik memuat satu ikon. Bundle Next dan cache runtime tetap mengikuti kebijakan offline dan konten. | Bandingkan cold install dengan upgrade. Pisahkan Fast Data Transfer dan Fast Origin Transfer. |

Batas per instance di atas bukan batas global. Cache atau WAF tidak boleh menyatukan respons personalized, hasil dengan kebijakan konten berbeda, atau cache admin.

## Usulan Firewall Vercel

Paket Hobby mendokumentasikan tiga custom rule per proyek, termasuk satu rate limiter, serta sepuluh blok IP. Rate limiter memakai fixed window 10 detik sampai 10 menit dengan IP atau JA4 dan menghitung per region. Kuota paket mencakup satu juta request yang lolos rule. DDoS mitigation tersedia secara default. Bot Protection mendukung Log/Challenge dan AI Bots Log/Deny. OWASP CRS memerlukan Enterprise. Status rule dan managed protection Yomirra belum terbaca. [Hobby](https://vercel.com/docs/plans/hobby) · [Rate limiting](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting) · [Managed rulesets](https://vercel.com/docs/vercel-firewall/vercel-waf/managed-rulesets)

| Kelompok | Usulan edge sebelum origin |
| --- | --- |
| HTML/RSC dan Reader | Cocokkan metode GET/HEAD dan path dinamis berbiaya tinggi yang terukur, misalnya navigasi pencarian, detail dan chapter. Jangan bergantung pada header RSC sebagai syarat. Di Preview, mulai dengan satu bucket per IP, 60 request/60 dtk, aksi Log. Uji burst IP bersama, prefetch, back/forward, dan Reader sebelum menguji 429. |
| API publik, Search dan metadata | Pantau related, Search Intelligence, rating-batch, dan source API per path dan metode. Pertahankan limiter per route. Perluas rule edge hanya setelah ada bukti kontribusi ke biaya dan kapasitas untuk klien sah. Jangan memasukkan seluruh /api. |
| Gambar, CDN dan PWA | Keluarkan proxy gambar, Next Image, aset statis dan service worker dari bucket halaman. Pertahankan validasi tanda tangan dan batas stream proxy. Pisahkan metrik gambar dari navigasi Reader. |
| AI, admin, auth dan integrasi | Pertahankan otorisasi dan kuota sensitif fail-closed serta validasi integrasi bertanda tangan. Jangan memberi Challenge pada JSON API, worker atau webhook. Keluarkan health dari bucket halaman dan gunakan probe berfrekuensi rendah. |

Uji hanya pada proyek Preview terpisah yang berwenang, dengan Vercel Authentication, kondisi `Environment=Preview`, Redis/Firebase uji, tanpa alias production, kredensial production atau cron/integrasi production. Setelah aksi Log membuktikan cakupan, uji aksi 429 di sana dan cocokkan keputusan edge dengan log origin untuk membuktikan request yang ditolak tidak memicu fungsi. Dari IP yang sama, uji bahwa aset yang dikecualikan tetap lolos dan halaman dinamis pulih setelah window reset. Kemampuan menerbitkan Firewall dan menjalankan Preview di tim yang sedang ditahan belum diketahui. Minta konfirmasi Vercel sebelum menjadwalkan uji. [Kondisi WAF](https://vercel.com/docs/vercel-firewall/vercel-waf/rule-configuration) · [Deployment Protection](https://vercel.com/docs/deployment-protection)

Dengan persetujuan owner, jalur publikasi adalah **Firewall → Configure → + New Rule → Save Rule → Review Changes → Publish**. Publikasi memengaruhi traffic dalam cakupan rule. Risiko utamanya 429 pada pembaca di jaringan bersama. Simpan versi terakhir yang diketahui aman. Bila rule menyebabkan false positive, owner dapat memakai **Firewall → ⋯ → View Audit Log → Restore → Restore Configuration**. Pemulihan konfigurasi bisa mengganti rule lain yang terbit setelah versi tersebut. [Publikasi](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting#get-started) · [Rollback Firewall](https://vercel.com/docs/vercel-firewall/vercel-waf#instant-rollback)

## Verifikasi edge dan anggaran sebelum unblock

1. Verifikasi kuota yang berlaku dan periode reset dari dashboard Vercel serta Upstash. Ambil interval waktu yang sama dalam WIB. Pisahkan lingkungan dan arah transfer, kemudian catat jumlah request, byte keluar origin, status, p95, hit/miss, dan perintah Redis. Kelompokkan path dinamis sebagai template. Hindari payload mentah, query, IP, atau header berisi token dalam handoff.
2. Verifikasi satu rule rate-limit sebelum origin di lingkungan Preview terisolasi jika jatah Hobby memungkinkan. Mulai dari rute dinamis berisiko yang terukur. Uji usulan awal 60 request per 60 dtk per IP dengan klien normal, NAT, navigasi berulang, dan klien yang melampaui batas. Pisahkan gambar Reader dari batas gabungan halaman/pencarian. Konfirmasi request yang ditolak tidak mencapai origin, dan audit efek pada pengguna berbagi IP. Tangani trafik tersebar melalui anggaran proyek, karena satu rule per IP tidak membatasi agregat proyek.
3. Verifikasi alur alert kepada owner dan emergency stop sebelum melayani pengguna. Gunakan kontrol dashboard yang tersedia. Hobby tidak menyediakan Spend Management sebagai batas pengeluaran otomatis. Dokumentasikan bagaimana owner memperoleh sinyal dan menghentikan trafik bila kontrol otomatis belum tersedia.
4. Jalankan mandatory CI dan Preview pada SHA kandidat yang persis sama. Periksa cache isolation, auth fail-closed, Firebase rules yang dideploy, source recovery, dan smoke Reader/PWA. Kandidat tetap BLOCKED bila salah satu pemeriksaan edge, budget, atau security belum lulus.

| Metrik | Peringatan usulan | Hentikan dan evaluasi |
| --- | --- | --- |
| Fast Origin Transfer | 60% kuota periode atau 3% kuota periode dalam 24 jam | 80% kuota periode atau 5% dalam 24 jam |
| Fast Data Transfer | 60% kuota periode atau 3% kuota periode dalam 24 jam | 80% kuota periode atau 5% dalam 24 jam |
| Redis command | 60% kuota bulanan atau 3% kuota bulanan dalam satu hari | 80% bulanan atau 5% kuota bulanan dalam satu hari |
| Kesehatan | Usulan awal p95 ≥1,5× baseline atau 5xx ≥1% selama 15 menit dengan minimal 100 request pada volume sebanding. Pantau 429 menurut path dan keputusan edge. | HTTP 402, 5xx berulang yang belum dijelaskan, indikasi masalah keamanan/data, atau p95 ≥2× baseline atau 5xx ≥2% selama 15 menit dengan sampel sebanding. |

Contoh pada kuota Fast Origin Transfer 10 GB ialah peringatan 6 GB per periode atau 0,3 GB dalam 24 jam. Ambang stop ialah 8 GB per periode atau 0,5 GB dalam 24 jam. Untuk contoh kuota Fast Data Transfer 100 GB, peringatan ialah 60 GB per periode atau 3 GB dalam 24 jam, dan stop ialah 80 GB per periode atau 5 GB dalam 24 jam. Cocokkan dulu dengan kuota aktual. Workflow Redis di repositori memeriksa ambang stop. Peringatan awal, agregat transfer, dan prosedur stop tetap memerlukan bukti operasional.

Referensi Hobby ialah 10 GB Fast Origin Transfer dan 100 GB Fast Data Transfer. Hobby tidak memiliki siklus billing bulanan dan Vercel menyebut 30 hari sebagai waktu tunggu yang lazim setelah melampaui batas. Konfirmasi jendela dan tanggal pemulihan tim di dashboard atau melalui Vercel. Alert penggunaan bawaan berbeda dari ambang operasi di atas. Ambang kustom dan Spend Management tidak tersedia di Hobby. Pastikan alert bawaan diterima owner, lalu pantau ambang operasi secara terpisah. Staf Vercel menyebut opsi boost satu kali untuk hold karena batas penggunaan Hobby yang dapat membuka kembali proyek. Konfirmasi apakah ada pengali 3×, kuota yang tercakup, kelayakan, dan status penggunaan tanpa meminta aktivasi. [Hobby](https://vercel.com/docs/plans/hobby#hobby-billing-cycle) · [Usage alerts](https://vercel.com/docs/pricing/manage-and-optimize-usage) · [Penjelasan staf Vercel](https://community.vercel.com/t/what-to-do-when-your-team-is-paused-or-blocked/45069)

Referensi provider [WAF rate limiting](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting), [Hobby](https://vercel.com/docs/plans/hobby), [limits](https://vercel.com/docs/limits), dan [CDN usage](https://vercel.com/docs/manage-cdn-usage).

## Persiapan eksekusi 7 November 2026 WIB

Instruksi owner ialah menyelesaikan persiapan, dengan **unblock akun Vercel sebagai langkah terakhir yang memerlukan approval eksplisit owner**. Pemulihan izin baca dashboard tidak memberi izin publish Firewall, deploy, boost, perubahan billing, atau unblock. Penolakan akses privat sebelumnya tetap berlaku sampai izin benar-benar pulih; jangan mencoba konektor/API/CLI atau browser alternatif untuk melewatinya. Paket harness v3 dipakai sebagai panduan; tidak ada instalasi runtime, hook, atau konfigurasi harness root dalam pekerjaan ini.

### Checkpoint lanjutan pada 220f1b44

Pada 7 November, owner mengonfirmasi perubahan izin Vercel. Controller menemukan tab Overview yang tepat melalui runtime resmi pada profil Chrome yang sama, tetapi retry claim/read tetap ditolak untuk `OBSERVE PAGE CONTENT` oleh izin tersimpan atau kebijakan browser terkelola. Settings full access tidak membuktikan izin origin sudah berlaku, dan penolakan tidak membuktikan owner sendiri memblokir domain. Tidak ada pembacaan dashboard privat atau bypass; WAF, kuota/reset, alert, boost, dan hak staging tetap **Unknown**.

Perbaikan terpisah oleh Mayu menghapus satu field concurrency kanonis yang berduplikasi dengan alias dalam konfigurasi global, mempertahankan concurrency 3 dan backup privat di luar repo. Rinne memberi **PASS_WITH_LIMITATIONS**; pembacaan parser stdio lokal berikutnya menunjukkan concurrency 3, depth 1, dan nol warning duplikasi, tanpa agent turn/akses eksternal. Drift runtime Node REPL yang muncul kemudian dipertahankan; tidak ada perubahan semantik approval/sandbox. Hilangnya banner Settings belum diamati dan perbaikan ini tidak membuktikan izin browser pulih.

Pemeriksaan P0-01..04 oleh Kanade pada kandidat `220f1b44` melaporkan tujuh file/82 tes lulus; Rinne menginspeksi tanpa rerun dan memberi **PASS_WITH_LIMITATIONS**. Tidak ada perubahan aplikasi dalam pemeriksaan ini; kontrak auto-completion di akhir Reader masih belum didefinisikan dan coverage continuous scroll memakai mock. Hasil lokal ini tidak menutup gate hosted/perangkat fisik atau approval keamanan, tidak mengaktifkan Q138, dan tidak memperluas scope ke 40 temuan historis yang baru dicatat di `origin/main` (`9ce81878`, dokumentasi saja). Status GitHub terbaru menunjukkan Draft #146 masih OPEN/draft/unmerged dan `mergeable:true`; ini bukan bukti deployment atau CI kandidat.

**NO-GO tetap berlaku.** Pulihkan akses baca efektif melalui kontrol berwenang sebelum audit hosted. Jangan mengulang pembacaan yang ditolak atau memakai jalur alternatif untuk melewati kebijakan. Unblock/boost tetap langkah terakhir dengan approval eksplisit owner setelah gate terpenuhi. Rincian dan batas bukti ada pada [checkpoint handoff](../handoff/pre-unblock.md#checkpoint-lanjutan-7-november-2026-wib-pada-220f1b44).

### Batas usulan untuk drill hosted

Ini **PROPOSAL**, belum dieksekusi. Sebelum mulai, operator dan owner mencatat project/team ID uji, environment, deployment ID/SHA, status proteksi, baseline kuota, waktu WIB, penerima alert, serta kontrol penghentian yang telah diizinkan. Pastikan Redis/Firebase dan identitas pengguna sintetis terpisah dari production, tidak ada alias Yomirra, cron, webhook, atau provider berbayar production. Kemampuan membuat proyek uji saat hold harus dikonfirmasi dengan Vercel; jangan memakai proyek/akun lain untuk menghindari pembatasan paket.

Preflight wajib merekam resource ID nonrahasia, environment, verifier, waktu verifikasi, dan referensi bukti untuk setiap baris berikut. Jangan salin nilai secret ke handoff. Data yang belum terisi membuat drill **BLOCKED_EXTERNAL**.

| Target | Pemeriksaan sebelum traffic |
| --- | --- |
| Firebase | Project ID client/server uji harus sama; catat revision rules terpasang. Gunakan dua UID uji dan guest. |
| Redis | Endpoint/database dan kredensial uji terpisah; prefix key saja tidak mengisolasi resource atau hak akses. |
| Auth dan proxy | Admin allowlist uji, session dan proxy-signing secret uji; integrasi production tidak terhubung. Persetujuan kebijakan email admin terverifikasi dicatat terpisah dari status verifikasi akun admin. |
| Hosting | Team/project/environment, proteksi akses, SHA/deployment immutable, alias, aturan edge dan target rollback terverifikasi. Tidak ada cron/integrasi production. |

Security smoke hosted harus mencakup owner/cross-UID/guest, auth valid/expired/invalid, A → logout → B, offline/relaunch, dua perangkat, delayed UID writes, serta preferensi/NSFW pada storage, RSC/CDN, dan Redis yang relevan. Jangan menyimpulkan semua skenario lulus dari smoke 20 request; bagi menjadi sesi beranggaran terpisah bila perlu, tanpa melanjutkan otomatis. CSP masih Report-Only; enforcement memerlukan gate terpisah.

| Tahap | Batas dan bukti yang dicatat |
| --- | --- |
| Isolation/smoke | Maksimal 20 request aplikasi terencana, konkurensi 1. Dua UID sintetis dan preferensi berbeda harus mempertahankan pemisahan hasil/cache. Catat status dan header cache tersanitasi. Jangan lanjut jika identitas atau datastore lingkungan salah. |
| Edge Log lalu 429 | Maksimal 68 request per fase, konkurensi 1, maksimum 2 request/dtk, tanpa retry otomatis. Setiap fase memakai window baru dan IP yang sama. Sisihkan request untuk aset pengecualian dan satu recovery setelah reset. Korelasikan waktu dan ID request dengan log edge/origin; 429 saja belum membuktikan origin tidak berjalan. |
| Alert dan stop | Sisihkan maksimal empat request konfirmasi aplikasi. Gunakan sinyal sintetis melalui mekanisme uji yang tersedia, tanpa menghabiskan kuota sungguhan. Catat penerimaan oleh owner dan waktunya. Pada proyek uji, buktikan kontrol stop terpisah untuk Preview dan deployment berlabel Production, beserta request konfirmasi yang masuk dalam cap total. |

Cap seluruh sesi ialah **160 request aplikasi, 15 menit, atau 25 MiB body respons**, mana yang lebih dulu. Probe, konfirmasi, dan recovery dihitung; request kontrol dashboard/provider dicatat terpisah. Gunakan klien tanpa auto-prefetch, auto-retry, atau pengunduhan gambar/aset tambahan. Byte body lokal bukan total transfer yang ditagih provider; pantau meter provider secara terpisah. Stop segera bila cap tercapai, quota baseline tidak diketahui, HTTP 402, akses data/identitas salah, provider production tersentuh, error tak terjelaskan, alert gagal diterima, atau request ditolak edge masih mencapai origin. Jangan menambah volume demi memenuhi ukuran sampel p95; jika bukti belum cukup, catat **NOT_TESTED/BLOCKED_EXTERNAL**. Operator menghentikan generator lebih dulu, lalu menjalankan kontrol stop yang disetujui. Hasil wajib menyebut jumlah request aktual, byte, waktu, stop reason, SHA, target, dan gate yang masih gagal.

### Drill budget offline yang sudah dijalankan

Pada 7 November, delapan skenario sintetis terhadap isi aktual `scripts/check-release-health.mjs` lulus: di bawah ambang, tepat 80% bulanan, tepat 5% harian, konfigurasi hilang, budget invalid, count hilang, stats HTTP 401, dan health HTTP 503. Ada 22 pemanggilan fetch tiruan, **nol fetch jaringan**, tanpa kredensial nyata. Bukti ini memverifikasi keputusan exit lokal, belum membuktikan pengiriman alert atau pause provider. Script tersebut memiliki URL health production tetap; jangan jalankan `node scripts/check-release-health.mjs` langsung untuk smoke lokal/Preview.

Reproduksi dari root kandidat dengan PowerShell; semua fetch diinjeksi dan tidak memiliki fallback jaringan pada script aktual yang sudah diinspeksi ini. Evaluator bukan sandbox umum: inspeksi ulang seluruh `scripts/check-release-health.mjs` bila script berubah sebelum menjalankan reproduksi, karena injeksi fetch/process tidak membatasi semua kemampuan Node.js.

```powershell
@'
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const source = readFileSync('scripts/check-release-health.mjs', 'utf8');
const run = new (Object.getPrototypeOf(async function () {}).constructor)('fetch', 'process', 'AbortSignal', 'performance', 'console', source);
const cases = [
  { name: 'below-stop', monthly: 799, daily: 49, fail: false },
  { name: 'monthly-stop', monthly: 800, daily: 0, fail: true },
  { name: 'daily-stop', monthly: 0, daily: 50, fail: true },
  { name: 'missing-config', missing: true, fail: true },
  { name: 'invalid-budget', limit: '0', fail: true },
  { name: 'missing-count', monthly: 0, fail: true },
  { name: 'stats-denied', statsStatus: 401, fail: true },
  { name: 'health-failure', monthly: 0, daily: 0, liveStatus: 503, fail: true },
];
for (const fixture of cases) {
  const proc = { env: fixture.missing ? {} : { UPSTASH_STATS_BASIC: 'synthetic', UPSTASH_STATS_DATABASE_ID: 'synthetic', UPSTASH_MONTHLY_COMMAND_LIMIT: fixture.limit ?? '1000' } };
  const calls = [];
  const fakeFetch = async (input, options) => {
    const url = String(input);
    assert.ok(options.signal);
    assert.equal(options.redirect, 'error');
    calls.push(url);
    if (url === 'https://www.yomirra.web.id/api/health/live') return new Response('{}', { status: fixture.liveStatus ?? 200 });
    if (url === 'https://www.yomirra.web.id/api/health') return new Response('{}');
    assert.equal(url, 'https://api.upstash.com/v2/redis/stats/synthetic');
    return new Response(JSON.stringify({ total_monthly_requests: fixture.monthly, daily_net_commands: fixture.daily }), { status: fixture.statsStatus ?? 200 });
  };
  const errors = [];
  await run(fakeFetch, proc, AbortSignal, { now: () => 0 }, { log() {}, error: (message) => errors.push(message) });
  assert.equal(proc.exitCode === 1, fixture.fail, fixture.name);
  assert.equal(calls.length, fixture.missing || fixture.limit ? 2 : 3);
  console.log(`${fixture.name}: PASS (${calls.length} mocked calls, ${errors.length} failures detected)`);
}
console.log('8 synthetic scenarios passed; zero real fetch calls.');
'@ | node --input-type=module
```

## Controlled unblock dan rollback

- Setelah seluruh gate lulus, catat SHA, deployment, persetujuan owner, baseline terbaru, dan identitas deployment rollback yang kompatibel. Owner menjadwalkan jendela pemulihan. Mulai dengan kohor terbatas atau Preview terlindung dengan Redis dan Firebase terisolasi. Perluas akses sesudah origin rejection, cache isolation, alert budget, dan stop drill terbukti.
- Setelah unblock oleh owner, cocokkan SHA deployment dengan kandidat. Jalankan smoke read-only volume rendah pada liveness, readiness, pencarian, detail, Reader, dan shell PWA. Periksa grafik transfer, Redis, error dan p95 pada +15 menit, +1 jam, dan +24 jam.
- Saat ambang stop tercapai, hentikan rollout dan traffic sintetis. Catat waktu WIB, metrik pemicu, SHA, dan deployment ID. Owner memakai **Settings → General → Pause Project**, memasukkan nama proyek, lalu menekan **Pause Project**. Alternatifnya, gunakan Vercel REST API `POST /v1/projects/<project-id>/pause?teamId=<team-id>` dengan akses tim yang sudah dimiliki, lalu memeriksa status proyek dan satu respons production `503 DEPLOYMENT_PAUSED`. Pause manual menghentikan akses production dan berbeda dari hold akun. Hentikan terpisah kohor Preview dan pemeriksaan yang masih menghasilkan trafik. Sebelum unblock, uji langkah ini pada deployment berlabel Production milik proyek uji terisolasi. Lindungi URL dengan Vercel Authentication untuk semua deployment, tanpa domain Yomirra, alias publik tak terlindung, kredensial, atau integrasi produksi Yomirra. Preview hanya untuk uji WAF dan memerlukan jalur penghentian tersendiri. [Project pause](https://vercel.com/docs/projects/managing-projects#pause-a-project-from-the-dashboard) · [Deployment Protection](https://vercel.com/docs/deployment-protection)
- Owner memilih rollback jika deployment sebelumnya lulus pemeriksaan kompatibilitas, data, dan resource. Hobby menyediakan Instant Rollback ke deployment production tepat sebelumnya. Konfirmasi ID deployment, alias, environment dan jadwal cron target sebelum digunakan. Jika belum ada target yang aman, pertahankan pause. Owner melanjutkan service dari Settings setelah gate yang gagal lulus, lalu ulangi smoke volume rendah. Untuk membatalkan perubahan lokal, gunakan revert di branch kerja dan validasi kembali sebelum publikasi. [Vercel Instant Rollback](https://vercel.com/docs/instant-rollback)
