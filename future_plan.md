# Yomirra — Strategic Engineering & UX Roadmap (`future_plan.md`)

Dokumen ini memetakan rencana perbaikan arsitektur, ketahanan sistem, keamanan, performa, dan penyempurnaan UI/UX mobile-first untuk Yomirra. Dibuat dengan prinsip **Xyeena Core (Evidence → Cut → Craft → Commit → Verify)** dan standar **Anti-Slop**.

---

## 1. Storage & Persistence (Reliability & Security)

### [HIGH] 1.1 Migrasi `download-store` ke IndexedDB (`idb-keyval`)
* **Masalah:** Saat ini [`src/shared/store/download-store.ts`](file:///c:/Users/Hafizh%20Rizqullah/Documents/Code/_active/Yomirra/src/shared/store/download-store.ts) menggunakan default Zustand `persist` (`localStorage`). Setiap chapter menyimpan array `pages: DownloadPage[]` lengkap (URL, status, ukuran). Di Mobile Safari (iOS), `localStorage` memiliki kuota ketat 5MB per origin. Jika user men-download 20–30 chapter komik panjang (tiap chapter 50–80 halaman), serialisasi JSON akan melampaui 5MB dan melempar `QuotaExceededError`. Ini menyebabkan semua store lokal (`history`, `library`, `settings`) gagal menulis data baru.
* **Solusi Rencana:**
  - Pindahkan serialisasi metadata chapter offline ke **IndexedDB** menggunakan custom async storage engine (misal `idb-keyval`).
  - Atau lakukan pemangkasan `partialize`: simpan hanya metadata level chapter (title, progress, status, totalPages) di `localStorage`, sedangkan detail array `pages` disimpan secara terpisah di IndexedDB atau Cache Storage API (`CACHE_NAME = "yomirra-chapter-cache-v1"`).

### [HIGH] 1.2 Bypass `next/image` Remote Whitelist pada `dataSaver`
* **Masalah:** Di [`reader-image.tsx`](file:///c:/Users/Hafizh%20Rizqullah/Documents/Code/_active/Yomirra/src/components/reader/reader-image.tsx), properti `unoptimized` disetel `!dataSaver || ...`. Jika Data Saver aktif (`unoptimized: false`), Next.js Image Optimizer mencoba mengompres URL remote secara langsung melalui serverless optimizer (`/_next/image`). Namun, sumber komik (Shinigami, Komikindo, AsuraScans, dll.) sering mengganti domain CDN yang tidak terdaftar di `images.remotePatterns` [`next.config.ts`](file:///c:/Users/Hafizh%20Rizqullah/Documents/Code/_active/Yomirra/next.config.ts). Hasilnya: Next.js mengembalikan HTTP 400 (`Invalid src prop ... hostname not configured`) dan gambar gagal dimuat total.
* **Solusi Rencana:**
  - Jika `dataSaver` aktif, jangan arahkan langsung ke optimizer default Next.js. Alihkan request melalui internal proxy [`/api/proxy/image`](file:///c:/Users/Hafizh%20Rizqullah/Documents/Code/_active/Yomirra/src/app/api/proxy/image/route.ts) yang sudah ada di `localPatterns`.
  - Atau lakukan transcode on-the-fly di internal proxy image (mengonversi format berat PNG/JPEG dari scraper menjadi WebP/AVIF hemat bandwidth sebelum dikirim ke client).

### [MEDIUM] 1.3 Lazy & Graceful Redis Connection pada Serverless
* **Masalah:** Di [`src/server/lib/cache/redis.ts`](file:///c:/Users/Hafizh%20Rizqullah/Documents/Code/_active/Yomirra/src/server/lib/cache/redis.ts), `new Redis(env.REDIS_URL, ...)` dieksekusi secara eager saat modul di-import. Di environment yang tidak memiliki server Redis (misal staging, deploy Vercel tanpa Upstash, atau testing), ioredis terus melakukan loop retry TCP dan mencetak error log `ECONNREFUSED`. Hal ini menambah latensi 100–300ms pada serverless cold starts.
* **Solusi Rencana:**
  - Jadikan koneksi Redis conditional / lazy: jika `process.env.REDIS_URL` tidak diisi atau bernilai dummy, inisialisasi *No-Op Cache client* (memory Map sederhana dengan TTL atau passthrough langsung ke fetcher) tanpa memicu error retry.

### [HIGH] 1.4 Hardening SSRF: DNS Rebinding Protection pada `safeFetch`
* **Masalah:** [`safeFetch`](file:///c:/Users/Hafizh%20Rizqullah/Documents/Code/_active/Yomirra/src/server/lib/security/outbound-policy.ts) saat ini memvalidasi hostname/protokol URL sebelum fetch. Namun, penyerang dapat menggunakan domain DNS dinamis (DNS rebinding) yang lolos validasi awal tetapi me-resolve ke IP privat internal (`127.0.0.1`, `10.0.0.0/8`, `169.254.169.254` AWS metadata) saat koneksi HTTP dibuat.
* **Solusi Rencana:**
  - Lakukan DNS resolution (`dns.lookup`) secara eksplisit di level Node.js sebelum melakukan fetch, validasi bahwa IP yang di-resolve tidak berada di blok CIDR RFC 1918 (Private Network) maupun link-local cloud metadata.

---

## 2. Mobile UX & Gesture Craft (Anti-Slop & Impeccable UI)

### [HIGH] 2.1 Pencegahan WebKit Jetsam Crash pada Long Webtoon Chapters
* **Masalah:** Beberapa webtoon Korea/Manhwa memiliki chapter dengan 100–200 irisan gambar panjang beresolusi tinggi. Meskipun sudah ada `useWindowVirtualizer`, jika gambar yang sudah lewat tidak dibersihkan dari memori GPU browser, Mobile Safari di iPhone akan memicu Jetsam Crash (layar putih mendadak / "A problem repeatedly occurred on this webpage").
* **Solusi Rencana:**
  - Batasi jumlah gambar aktif yang ter-mount di DOM. Irisan gambar yang berjarak lebih dari 4–5 viewport dari posisi scroll saat ini harus di-unmount atau diganti dengan placeholder berukuran tetap (aspect-ratio box) untuk membebaskan memory texture GPU iOS secara agresif.
  - Revoke blob URL / object URL segera setelah gambar selesai di-render atau keluar dari virtual buffer window.

### [MEDIUM] 2.2 Isolasi Gesture Edge-Swipe iOS vs Lateral Page Swipe
* **Masalah:** Pada mode baca `paged` (Horizontal LTR / RTL), gesture swipe kiri/kanan di tepi layar sering bertabrakan dengan navigasi native iOS Safari ("Swipe from edge to go back").
* **Solusi Rencana:**
  - Tambahkan deadzone 24px di sisi kiri dan kanan layar untuk gesture drag paged reader: jika sentuhan pertama (`touch.clientX < 24 || touch.clientX > window.innerWidth - 24`), serahkan event ke browser agar user tetap bisa swipe back secara natural tanpa memicu pergantian halaman komik yang tidak sengaja.

### [MEDIUM] 2.3 OLED Pure Black Mode & Ambient Color Glow
* **Masalah:** Saat membaca di tempat gelap, tema `black` di beberapa overlay masih menggunakan surface tinted dark (`rgba(17, 17, 34)` atau zinc-950).
* **Solusi Rencana:**
  - Sediakan opsi **Pure OLED Mode** (`#000000` absolut) di Reader Preferences tanpa border putih kontras tinggi, mematikan pixel layar OLED secara penuh untuk menghemat baterai saat membaca maraton malam hari.
  - Tambahkan opsi subtle ambient glow di reader background yang mengambil warna dominan dari halaman komik yang sedang aktif (efek ambilight bioskop) dengan blur 80px di desktop/tablet.

### [LOW] 2.4 Navigasi Tombol Fisik Volume / Keyboard Remap
* **Masalah:** Pembaca webtoon di mobile sering ingin membalik halaman dengan satu tangan tanpa menyentuh layar.
* **Solusi Rencana:**
  - Implementasikan media session dummy / Web Audio API silent tick untuk mendengarkan event volume hardware (Volume Up = Previous, Volume Down = Next) saat reader aktif di browser mobile.

---

## 3. Scraper Resilience & Discovery Engine

### [HIGH] 3.1 Silent Failure Detection & Scraper Automated Alerting
* **Masalah:** Sumber komik sering memperbarui class HTML atau mengubah selector DOM tanpa memicu error HTTP (server mengembalikan HTTP 200 dengan HTML kosong atau Cloudflare challenge). Yomirra saat ini bisa mengembalikan array chapter kosong `[]` secara senyap tanpa melempar exception.
* **Solusi Rencana:**
  - Validasi bahwa payload hasil parsing manga detail selalu memiliki `chapters.length > 0`. Jika 0 padahal sebelumnya ada, tandai source sebagai `degraded` dan kirim notifikasi otomatis ke bot Telegram admin dengan cuplikan raw HTML untuk investigasi cepat.
  - Simpan snapshot DOM terakhir dari scraper yang gagal di temporary storage untuk mempermudah debugging selektor CSS tanpa harus inspect manual dari browser lokal.

### [HIGH] 3.2 Seamless Cross-Source Fallback (Pindah Sumber Otomatis saat Chapter Rusak)
* **Masalah:** Ketika pembaca sedang asyik membaca komik di Sumber A, lalu Sumber A down atau chapter 45 tidak bisa dimuat, user harus keluar ke search, mencari judul yang sama di Sumber B, dan mencari chapter 45 manual.
* **Solusi Rencana:**
  - Manfaatkan modul canonical clustering (`src/shared/lib/canonical-search.ts`) yang sudah ada: buat tombol *"Baca di Sumber Lain"* di banner error chapter (`page-image-error.tsx`). 
  - Sistem otomatis mencocokkan judul manga & nomor chapter di sumber alternatif yang online, lalu melakukan redirect langsung ke chapter yang sama tanpa kehilangan progres baca.

### [MEDIUM] 3.3 Dynamic Filter Multi-Exclusion
* **Masalah:** Filter pencarian katalog saat ini hanya mendukung inklusi genre (OR/AND). Pengguna sering ingin mencari komik dengan kriteria: *Include: "Action, Fantasy"* tapi *Exclude: "Harem, Romance, Ecchi"*.
* **Solusi Rencana:**
  - Tingkatkan UI `search-filter-drawer.tsx` dengan segmented status 3-state pada genre chips: `Netral` (default) -> `Centang/Include` (accent) -> `Silang/Exclude` (merah).
  - Terjemahkan excluded genres ke parameter query scraper (`genres_exclude[]`) untuk sumber yang mendukung, atau lakukan filter post-processing di backend sebelum hasil dikembalikan ke frontend.

---

## 4. Performance & Offline Engine

### [MEDIUM] 4.1 Predictive Background Chapter Preload
* **Masalah:** Saat membaca komik strip panjang (Webtoon), ketika pembaca mencapai 85% dari chapter saat ini, ada jeda loading beberapa detik saat menekan tombol "Chapter Berikutnya".
* **Solusi Rencana:**
  - Tambahkan background preloader di [`use-reader-scroll.ts`](file:///c:/Users/Hafizh%20Rizqullah/Documents/Code/_active/Yomirra/src/shared/hooks/use-reader-scroll.ts): ketika scroll progress melewati 80%, panggil API chapter list berikutnya dan lakukan prefetch 3 halaman pertama chapter berikutnya ke Cache Storage (`priority="low"` / `requestIdleCallback`) agar transisi antar chapter instan 0ms.

### [MEDIUM] 4.2 Auto-Eviction LRU pada Service Worker Reading Buffer
* **Masalah:** Cache `yomirra-reading-buffer-v1` di [`sw.ts`](file:///c:/Users/Hafizh%20Rizqullah/Documents/Code/_active/Yomirra/src/app/sw.ts) menyimpan gambar proxy secara agresif. Pada perangkat dengan sisa storage sedikit, ini bisa memicu browser membatalkan storage quota secara mendadak.
* **Solusi Rencana:**
  - Terapkan `ExpirationPlugin` dengan `maxEntries: 400` dan batas ukuran total (~150MB) dengan strategi LRU (Least Recently Used) dan flag `purgeOnQuotaError: true` pada semua cache manga image.

---

## 5. Prioritas Eksekusi & Status Implementasi

| No | Inisiatif | Kategori | Tingkat Urgensi | Status Eksekusi |
| :--- | :--- | :--- | :--- | :--- |
| **1** | **Migrasi `download-store` ke IndexedDB** | Storage / Stability | **P0 (Critical)** | **✅ Selesai & Teruji** (`idb-storage.ts`) |
| **2** | **Bypass `next/image` Remote Whitelist pada `dataSaver`** | Reliability / UX | **P0 (Critical)** | **✅ Selesai & Teruji** (`reader-image.tsx`) |
| **3** | **WebKit Jetsam Memory Management di Long Webtoons** | Performance / iOS | **P1 (High)** | **✅ Selesai** (virtualizer overscan + direct cache fetch) |
| **4** | **Cross-Source Chapter Fallback Button** | Core UX / Discovery | **P1 (High)** | **✅ Selesai** (`page-image-error.tsx`) |
| **5** | **Lazy / No-Op Redis Connection di Serverless** | Infrastructure | **P2 (Medium)** | **✅ Selesai & Teruji** (`redis.ts`) |
| **6** | **DNS Rebinding & IP Literal Guard di `safeFetch`** | Security | **P2 (Medium)** | **✅ Selesai & Teruji** (`outbound-policy.ts`) |
| **7** | **Predictive Background Preload Chapter Berikutnya** | UX Polish | **P2 (Medium)** | **✅ Selesai** (`paged-reader.tsx` & `use-reader-scroll.ts`) |
| **8** | **Edge-Swipe Deadzone di Paged Reader** | iOS Gesture | **P3 (Low)** | **✅ Selesai** (`paged-reader.tsx`) |

