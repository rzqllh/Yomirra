# Changelog

Semua perubahan penting tercatat di sini.
Format mengikuti [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versi mengikuti [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Ditambahkan

- **Motion system** — `motion/react` terintegrasi di seluruh aplikasi. Layout animation untuk search chip, spring physics untuk modal overlay, scale-tap di card. Bukan dekorasi — ini feedback taktil yang membuat UI terasa responsif.
- **Offline sync** — Listener `online` event di `use-sync.ts`. Saat koneksi kembali setelah offline, Firestore otomatis merekonsiliasi data lokal dengan cloud. Seperti sistem kasir yang tetap mencatat transaksi walau jaringan putus.
- **Settings store** — `settings-store.ts` via Zustand `persist`. Preferensi user tersimpan di localStorage, bertahan antar sesi.
- **Data saver** — Toggle di Pengaturan. Aktif: gambar reader dikompresi via `next/image` (WebP, quality 60%). Mati: resolusi penuh tanpa optimasi.
- **NSFW filter** — Genre exclusion (`-adult`, `-mature`, `-smut`, `-nsfw`, `-ecchi`) diinjeksi langsung di `api-client.ts`. Filter ada di lapisan data, bukan di UI — tidak bisa di-bypass dari client.
- **Skeleton loading** — `MangaCardSkeleton`, `MangaDetailSkeleton`, `ChapterListSkeleton`, `SourceListSkeleton`. Menggantikan spinner generik. Mencegah layout shift saat data dimuat.

### Diubah

- **Firebase types** — Konfigurasi Firebase di-harden untuk menangani `Firestore | null` dengan benar. Closure aman, implicit `any` dihilangkan.
- **Reader animation** — Durasi transisi overlay dikalibrasi dari 300ms ke 200ms. Terasa lebih tajam.

### Diperbaiki

- **Hover scale bug** — `MangaCard` menggunakan `scale-1025` yang diinterpretasi Tailwind v4 sebagai 1025%, bukan 1.025. Kartu zoom 10x saat hover. Diperbaiki ke `scale-[1.025]`.
- **DOM Image collision** — `new Image()` di `paged-reader.tsx` bertabrakan dengan `next/image` import. Diganti ke `new window.Image()`.
- **Prisma build** — pnpm v10 memblokir postinstall script Prisma secara default. Ditambahkan `onlyBuiltDependencies` config dan explicit `prisma generate` di build script.

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
