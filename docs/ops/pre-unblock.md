# Pre-unblock Yomirra

Status **BLOCKED**. Gunakan runbook ini untuk evaluasi Draft PR #146. Owner mengendalikan firewall, unblock, dan rollback production.

## Jalur yang perlu diawasi

| Jalur | Batas yang ada pada kandidat | Bukti yang diperlukan di hosting |
| --- | --- | --- |
| HTML, RSC, Reader | Reader SSR memberi daftar chapter 250 ms sebelum melanjutkan jalur kritis. Mode halaman meminta chapter berikutnya saat navigasi. Konten mengikuti preferensi dan kebijakan NSFW. | Request dan byte origin untuk HTML dan RSC, hit/miss CDN, p95 detail dan Reader, cache isolation untuk akun dan preferensi berbeda. |
| Pencarian dan related | Kebijakan public-search 120/60 dtk dan related 12/60 dtk per identitas per instance. Related menerima hingga 128 KiB. Kuota embedding memerlukan Redis. | Pisahkan hit, miss, penolakan origin, dan penolakan edge. Catat ukuran request/response tanpa judul atau body. |
| Rating batch | 30/60 dtk per identitas per instance, hingga 20 judul dan 16 KiB input. Anggaran lookup 4 dtk, empat judul paralel per batch. | Volume batch, distribusi byte, hasil parsial, cache miss, 403/429, p95, dan biaya Redis per lookup. |
| Image proxy dan cover | 600/60 dtk per identitas per instance, 16 stream aktif per instance, 15 MiB per gambar dan 15 dtk. Cache browser private. Redirect hanya untuk CDN HTTPS yang diizinkan. | Byte gambar proxy, cover fallback, tanda tangan invalid, dan angka 403/429 per provider. Pisahkan gambar Reader dari RSC. |
| Source adapters | Delapan pekerjaan per scope dan 32 global per instance. Cooldown dan negative cache berbatas. | Error per sumber, waktu cooldown, hasil recovery dan p95 Shinigami, Komikindo, KomikNesia, WestManga, Asura, MangaDex. |
| Ringkasan Redis admin | Otorisasi admin, satu INFO dan paling banyak empat SCAN per ringkasan. Inspeksi manual terpisah dapat membaca tipe dan TTL hingga 1.000 key. | Pastikan volume refresh admin sesuai anggaran. Gunakan ringkasan untuk pemantauan rutin. |
| Health dan cron | Readiness memiliki cache lokal 10 dtk. Halaman Sumber melakukan polling 60 dtk saat aktif. Workflow health opsional dapat memeriksa dua endpoint setiap 15 menit. | Liveness, readiness, volume probe dan kontribusi command Redis. |
| PWA dan CDN | Precache aset publik memuat satu ikon. Bundle Next dan cache runtime tetap mengikuti kebijakan offline dan konten. | Bandingkan cold install dengan upgrade. Pisahkan Fast Data Transfer dan Fast Origin Transfer. |

Batas per instance di atas bukan batas global. Cache atau WAF tidak boleh menyatukan respons personalized, hasil dengan kebijakan konten berbeda, atau cache admin.

## Verifikasi edge dan anggaran sebelum unblock

1. Verifikasi kuota yang berlaku dan periode reset dari dashboard Vercel serta Upstash. Ambil interval waktu yang sama dalam WIB. Pisahkan lingkungan dan arah transfer, kemudian catat jumlah request, byte keluar origin, status, p95, hit/miss, dan perintah Redis. Kelompokkan path dinamis sebagai template. Hindari payload mentah, query, IP, atau header berisi token dalam handoff.
2. Verifikasi satu rule rate-limit sebelum origin di lingkungan Preview terisolasi jika jatah Hobby memungkinkan. Mulai dari rute dinamis berisiko yang terukur. Uji usulan awal 60 request per 60 dtk per IP dengan klien normal, NAT, navigasi berulang, dan klien yang melampaui batas. Pisahkan gambar Reader dari batas gabungan halaman/pencarian. Konfirmasi request yang ditolak tidak mencapai origin, dan audit efek pada pengguna berbagi IP. Tangani trafik tersebar melalui anggaran proyek, karena satu rule per IP tidak membatasi agregat proyek.
3. Verifikasi alur alert kepada owner dan emergency stop sebelum melayani pengguna. Gunakan kontrol dashboard yang tersedia. Hobby tidak menyediakan Spend Management sebagai batas pengeluaran otomatis. Dokumentasikan bagaimana owner memperoleh sinyal dan menghentikan trafik bila kontrol otomatis belum tersedia.
4. Jalankan mandatory CI dan Preview pada SHA kandidat yang persis sama. Periksa cache isolation, auth fail-closed, Firebase rules yang dideploy, source recovery, dan smoke Reader/PWA. Kandidat tetap BLOCKED bila salah satu pemeriksaan edge, budget, atau security belum lulus.

| Metrik | Peringatan usulan | Hentikan dan evaluasi |
| --- | --- | --- |
| Fast Origin Transfer | 60% kuota periode atau 3% kuota periode dalam 24 jam | 80% kuota periode atau 5% dalam 24 jam |
| Redis command | 60% kuota bulanan atau 3% kuota bulanan dalam satu hari | 80% bulanan atau 5% kuota bulanan dalam satu hari |
| Kesehatan | Usulan awal p95 ≥1,5× baseline atau 5xx ≥1% selama 15 menit dengan minimal 100 request pada volume sebanding. Pantau 429 menurut path dan keputusan edge. | HTTP 402, 5xx berulang yang belum dijelaskan, indikasi masalah keamanan/data, atau p95 ≥2× baseline atau 5xx ≥2% selama 15 menit dengan sampel sebanding. |

Contoh pada kuota Fast Origin Transfer 10 GB ialah peringatan 6 GB per periode atau 0,3 GB dalam 24 jam. Ambang stop ialah 8 GB per periode atau 0,5 GB dalam 24 jam. Cocokkan dulu dengan kuota aktual. Workflow Redis di repositori memeriksa ambang stop. Peringatan awal, agregat transfer, dan prosedur stop tetap memerlukan bukti operasional.

Referensi provider [WAF rate limiting](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting), [Hobby](https://vercel.com/docs/plans/hobby), [limits](https://vercel.com/docs/limits), dan [CDN usage](https://vercel.com/docs/manage-cdn-usage).

## Controlled unblock dan rollback

- Setelah seluruh gate lulus, catat SHA, deployment, persetujuan owner, baseline terbaru, dan identitas deployment rollback yang kompatibel. Owner menjadwalkan jendela pemulihan.
- Setelah unblock oleh owner, cocokkan SHA deployment dengan kandidat. Jalankan smoke read-only volume rendah pada liveness, readiness, pencarian, detail, Reader, dan shell PWA. Periksa grafik transfer, Redis, error dan p95 pada +15 menit, +1 jam, dan +24 jam.
- Pada stop condition, hentikan rollout atau pemeriksaan tambahan, rekam waktu dan metrik yang memicu, dan beri owner bukti minimum. Owner menentukan pause atau rollback ke deployment immutable yang sudah diperiksa. Jika rollback juga membawa risiko lonjakan atau isolasi data, pertahankan pause dan siapkan kandidat pengganti. Gunakan revert pada branch kerja untuk membatalkan kode lokal; validasi lagi sebelum publikasi.
