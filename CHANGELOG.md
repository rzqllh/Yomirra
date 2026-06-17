# Changelog

Semua perubahan penting tercatat di sini.
Format mengikuti [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versi mengikuti [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Ditambahkan

- **System Architecture & Guidelines Documentation** — Menyusun dan menetapkan 8 standar dokumentasi inti (`AGENTS.md`, `API-CONTRACTS.md`, `DB-SCHEMA.md`, `DESIGN-LANGUAGE.md`, `DESIGN-SYSTEM.md`, `GIT-RULES.md`, `UI-GUIDELINES.md`, `UX-GUIDELINES.md`, dan `AUDIT.md`) untuk menyelaraskan agen, struktur kode, UX, dan identitas visual aplikasi.
- **Offline Chapter Downloads** — Sistem unduhan terintegrasi menggunakan browser Cache API yang memungkinkan user mengunduh chapter untuk dibaca saat offline, dikelola dengan `download-store.ts`.
- **Full-System Architectural Realignment** — Routing telah dinormalisasi. `/browse` dipensiunkan agar `/sources` menjadi *canonical source manager*. `/search` kini murni difungsikan untuk pencarian global manga.
- **Micro-Interactions & Accessibility** — Implementasi komprehensif `motion/react` dengan dukungan navigasi *keyboard* (tombol `Escape` & `m` pada reader) dan pengecekan global `motion-safe:` bagi pengguna dengan *reduced-motion*.
- **Offline sync** — Listener `online` event di `use-sync.ts`. Saat koneksi kembali setelah offline, Firestore otomatis merekonsiliasi data lokal dengan cloud.
- **Data saver & Content Filter** — Toggle kompresi gambar di Pengaturan (`next/image` WebP). Filter konten NSFW di-enforce secara langsung di lapisan arsitektur *API client*.

### Diubah

- **UI UX Reimagine Phase** — Mengaplikasikan "Midnight Indigo" (Deep Lagoon) glassmorphism identitas visual, perbaikan bottom nav PWA untuk iOS safe area, dan restrukturisasi home discovery.
- **Zustand Normalization** — Seluruh *state management* dikonsolidasi menggunakan `zustand` dengan `persist` middleware untuk Library, History, dan Download queue (dengan *partialize* untuk state rekoveri crash).
- **Destructive Actions to Radix Dialog** — Mengganti semua pemanggilan native `window.confirm()` dan `window.alert()` dengan komponen kustom yang di-extend dari `@radix-ui/react-dialog` untuk menjaga *immersive UX*.
- **Token UI & Typography Consolidation** — Mengeliminasi *arbitrary values* (`text-[13px]`, `bg-[#1a1a2e]`) dan menggantinya dengan variabel CSS `@theme` di `globals.css`.

### Diperbaiki

- **API Security Vulnerability** — Menghapus kerentanan keamanan kritis dari *catch-all dynamic routing* yang berpotensi mengekspos endpoint API backend.
- **Hover scale bug** — `MangaCard` menggunakan `scale-1025` yang diinterpretasi Tailwind v4 sebagai 1025%. Diperbaiki ke `scale-[1.025]`.
- **DOM Image collision** — `new Image()` bertabrakan dengan `next/image` import. Diganti ke `new window.Image()`.
- **Library & Store Hydration** — Menerapkan `useMounted` guard hook pada komponen `LibraryPage` untuk mencegah hidrasi *blank state* sebelum Zustand merestore data dari IndexedDB.
- **Cloud Sync Semantics** — Logika push-to-cloud saat pertama kali login tidak lagi menimpa data lokal dengan data cloud kosong, melainkan melakukan *two-way merge*.

---

## [0.1.0] — 2026-06-10

Rilis pertama. Fondasi arsitektur dan infrastruktur dasar.

### Ditambahkan

- **Routing** — Scaffolding halaman `/library`, `/history`, `/readlist`, `/search`, `/sources`, `/settings`.
- **Source adapter** — Arsitektur adapter dengan Shinigami sebagai implementasi pertama. Normalizer, type definitions, HTTP client.
- **Reader** — Continuous vertical dan paged mode. Panel samping desktop, overlay mobile.
- **State management** — Zustand stores untuk reader settings, library, history. Persist middleware untuk data lokal.
- **Icon system** — `@phosphor-icons/react` sebagai satu-satunya sumber ikon.
- **CI scripts** — `typecheck`, `test`, `lint` di package.json.
- **Security headers** — `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection` di next.config.
- **Image proxy** — HMAC-signed proxy route untuk bypass hotlink protection sumber manga.

### Diubah

- **Arsitektur folder** — Migrasi dari struktur monolith ke domain-based.
- **Path alias** — `@/components`, `@/shared`, `@/server` di tsconfig.
- **TypeScript** — 51 warning `any` dieliminasi. Strict typing di semua API route catch block.

### Dihapus

- **lucide-react** — Diganti sepenuhnya oleh Phosphor. Satu icon library, satu bahasa visual.
- **glass-panel.tsx** — Komponen generik yang tidak sesuai design system. Diganti CSS variable tokens.
