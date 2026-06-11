# Changelog

Semua perubahan penting tercatat di sini.
Format mengikuti [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versi mengikuti [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Ditambahkan

- **Full-System Architectural Realignment** — Routing telah dinormalisasi. `/browse` dipensiunkan agar `/sources` menjadi *canonical source manager*. `/search` kini murni difungsikan untuk pencarian *manga title* secara global.
- **Micro-Interactions & Accessibility** — `motion/react` kini diimplementasikan secara komprehensif. Menambahkan dukungan navigasi *keyboard* (tombol `Escape` & `m` pada reader) dan menerapkan pengecekan global terhadap *reduced-motion* (`motion-safe:`) bagi pengguna OS yang mematikan animasi. Aksesibilitas diperkuat dengan perbaikan hierarki `<h1>` di semua *entry page*.
- **Token UI & Typography Consolidation** — Resolusi kelas *arbitrary* Tailwind (`text-[13px]`, `text-[15px]`, `rounded-[4px]`) di seluruh komponen. Digantikan oleh utilitas responsif *first-class* (`text-sm`, `text-base`) dan variabel kustom (`--text-2xs`) untuk memastikan skala informasi yang konsisten.
- **Offline sync** — Listener `online` event di `use-sync.ts`. Saat koneksi kembali setelah offline, Firestore otomatis merekonsiliasi data lokal dengan cloud.
- **Data saver & Content Filter** — Toggle kompresi gambar di Pengaturan (`next/image` WebP). Filter konten NSFW di-enforce secara langsung di lapisan arsitektur *API client*, memastikan tidak bisa di-*bypass*.

### Diubah

- **Zustand Normalization** — Seluruh *state management* dikonsolidasi menggunakan `zustand` *stores* (Reader, Library, History). State *Reader* kini dikelola secara *client-side* untuk mencegah *excessive re-rendering* komponen tanpa memicu re-render UI induk.
- **Firebase Initialization Hardening** — Inisialisasi SDK Firebase (`app`, `auth`, `db`) kini dijamin hanya berjalan secara aman dan terisolasi pada sisi klien (*lazy loading*), menambal lubang keamanan tereksposnya konfigurasi *server*.
- **Reader UI Animation** — Durasi transisi *overlay* reader dikalibrasi lebih tajam (300ms → 200ms).

### Diperbaiki

- **API Security Vulnerability** — Menghapus kerentanan keamanan kritis dari *catch-all dynamic routing* (`[...paths]`) yang berpotensi mengekspos endpoint API backend.
- **Component Redundancy** — Menghapus duplikasi komponen visual (*glass panel*) yang tidak memiliki desain spesifik, menyatukan desain melalui *Tailwind tokens* yang bersih.
- **Hover scale bug** — `MangaCard` menggunakan `scale-1025` yang diinterpretasi Tailwind v4 sebagai 1025%, bukan 1.025. Kartu zoom 10x saat hover. Diperbaiki ke `scale-[1.025]`.
- **DOM Image collision** — `new Image()` di `paged-reader.tsx` bertabrakan dengan `next/image` import. Diganti ke `new window.Image()`.
- **Prisma build** — pnpm v10 memblokir postinstall script Prisma secara default. Ditambahkan `onlyBuiltDependencies` config dan explicit `prisma generate` di build script.
- **Library & Store Hydration** — Mengatasi masalah komponen `LibraryPage` yang *blank* saat data belum terhidrasi dari IndexedDB, dan memperbaiki spam render di `BottomNav`.
- **Cloud Sync Semantics** — Logika push-to-cloud saat pertama kali login: data *library* dan *history* lokal (offline) kini dipertahankan dan diunggah ke Firestore, bukan ditimpa (*overwritten*) oleh *cloud state* kosong.
- **React Import** — Memperbaiki error `ReferenceError: React is not defined` pada halaman `/history`.

---

## [0.1.0] — 2026-06-10

Rilis pertama. Fondasi arsitektur dan infrastruktur dasar.

### Ditambahkan

- **Routing** — Scaffolding halaman `/library`, `/history`, `/readlist`, `/search`, `/sources`, `/settings`.
- **Source adapter** — Arsitektur adapter dengan Shinigami sebagai implementasi pertama. Normalizer, type definitions, HTTP client.
- **Reader** — Continuous vertical dan paged mode. Panel samping desktop, overlay mobile.
- **State management** — Zustand stores untuk reader settings, library, history. Persist middleware untuk data lokal.
- **Icon system** — `@phosphor-icons/react` sebagai satu-satunya sumber ikon. Konsisten di seluruh aplikasi.
- **CI scripts** — `typecheck`, `test`, `lint` di package.json.
- **Security headers** — `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection` di next.config.
- **Image proxy** — HMAC-signed proxy route untuk bypass hotlink protection sumber manga.

### Diubah

- **Arsitektur folder** — Migrasi dari struktur monolith ke domain-based:
  - `src/web/components` → `src/components`
  - `src/server/lib/store` → `src/shared/store`
  - `src/server/types` → `src/shared/types`
- **Path alias** — `@/components`, `@/shared`, `@/server` di tsconfig.
- **TypeScript** — 51 warning `any` dieliminasi. Strict typing di semua API route catch block.

### Dihapus

- **lucide-react** — Diganti sepenuhnya oleh Phosphor. Satu icon library, satu bahasa visual.
- **glass-panel.tsx** — Komponen generik yang tidak sesuai design system. Diganti CSS variable tokens.
