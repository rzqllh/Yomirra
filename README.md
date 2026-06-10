<![CDATA[<div align="center">

```
██╗   ██╗ ██████╗ ███╗   ███╗██╗██████╗ ██████╗  █████╗
╚██╗ ██╔╝██╔═══██╗████╗ ████║██║██╔══██╗██╔══██╗██╔══██╗
 ╚████╔╝ ██║   ██║██╔████╔██║██║██████╔╝██████╔╝███████║
  ╚██╔╝  ██║   ██║██║╚██╔╝██║██║██╔══██╗██╔══██╗██╔══██║
   ██║   ╚██████╔╝██║ ╚═╝ ██║██║██║  ██║██║  ██║██║  ██║
   ╚═╝    ╚═════╝ ╚═╝     ╚═╝╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝
```

**Manga reader yang kamu inginkan. Tanpa kompromi.**

*The manga reader you actually want. No compromises.*

[![Next.js](https://img.shields.io/badge/Next.js_16-black?logo=next.js&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Tailwind](https://img.shields.io/badge/Tailwind_v4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

[Demo](#demo) · [Instalasi](#-mulai) · [Arsitektur](#-arsitektur) · [Kontribusi](#-kontribusi)

</div>

---

## Apa ini?

Yomirra adalah manga reader open-source yang dibangun dari nol dengan Next.js 16. Bukan fork. Bukan template. Bukan wrapper tipis di atas API orang lain.

Arsitekturnya menggunakan **source adapter** — satu antarmuka yang konsisten untuk berbagai sumber manga. Tambah sumber baru? Tulis satu adapter, sisanya sudah diurus.

> **EN** — Yomirra is an open-source manga reader built from scratch on Next.js 16. Not a fork, not a template. It uses a source adapter architecture: one consistent interface across multiple manga sources. Adding a new source means writing one adapter — everything else is handled.

---

## Kenapa ada ini?

Manga reader yang sudah ada punya dua masalah:

1. **Reader mobile** — bagus di tangan, tapi buka di laptop dan kamu dapat UX yang menyedihkan.
2. **Reader web** — biasanya cuma search box di atas list chapter tanpa jiwa.

Yomirra mengejar yang ketiga: reader yang terasa natural di layar 5 inci dan 27 inci sekaligus. Sidebar untuk desktop, bottom nav untuk mobile, reader yang menyesuaikan diri.

> **EN** — Existing readers are either mobile-only (painful on desktop) or web-only (soulless). Yomirra targets the third option: a reader that feels natural on both 5-inch and 27-inch screens.

---

## Fitur Utama

| Fitur | Deskripsi |
|---|---|
| **Source Adapter** | Arsitektur plug-and-play. Setiap sumber manga adalah modul independen dengan normalizer sendiri. |
| **Reader** | Continuous vertical, paged, dan webtoon. Arah baca LTR/RTL. Panel samping di desktop, overlay di mobile. |
| **Readlist & Riwayat** | Simpan manga ke koleksi. Riwayat baca otomatis terekam setiap buka chapter. |
| **Offline Sync** | Firebase Firestore + IndexedDB. Baca offline, data otomatis tersinkronisasi saat koneksi kembali. |
| **Data Saver** | Toggle satu klik. Aktif: gambar dikompresi via Next.js Image (WebP, quality 60%). Mati: resolusi penuh. |
| **Content Filter** | Filter NSFW global. Diinjeksi langsung di lapisan API, bukan di UI — jadi tidak bisa di-bypass dari client. |
| **Motion** | Micro-interaction via `motion/react`. Spring physics, layout animation, scale-tap. Bukan hiasan — feedback taktil. |
| **Dark Mode** | Default gelap. Palet warna dirancang untuk membaca komik, bukan untuk dashboard SaaS. |
| **PWA** | Service worker via Serwist. Installable di mobile, cache strategy untuk asset statik. |

---

## Demo

> 🚧 Deployment pertama sedang berjalan di Vercel. Link akan diperbarui setelah build selesai.

---

## Stack

```
Next.js 16 ─── App Router, Server Components, API Routes
TypeScript ─── End-to-end type safety
Tailwind v4 ── CSS-first configuration, design tokens
Radix UI ───── Accessible primitives (Dialog, Tabs, Tooltip, etc.)
Zustand ────── Client state (reader settings, library, history)
React Query ── Server state (search results, manga detail, chapters)
Firebase ───── Auth + Firestore (offline persistence, multi-tab sync)
Prisma ─────── Database ORM (Supabase PostgreSQL)
Redis ──────── API response caching (Upstash)
motion/react ─ Physics-based animation
Serwist ────── Service worker / PWA
Phosphor ───── Icon system (satu keluarga, konsisten)
```

---

## 🚀 Mulai

### Prasyarat

- **Node.js** ≥ 20
- **pnpm** (direkomendasikan) — `npm install -g pnpm`
- Akun [Supabase](https://supabase.com) (database)
- Akun [Firebase](https://console.firebase.google.com) (auth & sync)
- Akun [Upstash](https://upstash.com) (redis — opsional untuk development)

### Setup

```bash
# Clone
git clone https://github.com/rzqllh/Yomirra.git
cd Yomirra

# Install dependencies
pnpm install

# Setup environment
cp .env.example .env
# Isi semua nilai di .env — lihat komentar di file tersebut

# Generate Prisma client
pnpm prisma generate

# Jalankan
pnpm dev
```

Buka `http://localhost:3000`. Selesai.

> **EN** — Clone, install, copy `.env.example` to `.env`, fill in your keys, run `pnpm dev`. Open `localhost:3000`.

---

## 📐 Arsitektur

```
src/
├── app/                    # Next.js App Router
│   ├── (web)/              # Halaman publik (Home, Search, Library, dll.)
│   │   ├── manga/[sourceId]/[mangaId]/          # Detail manga
│   │   └── manga/[sourceId]/[mangaId]/read/     # Reader
│   └── api/                # API Routes (proxy, search, sources)
├── components/
│   ├── app/                # Shell, navigation (SideNav, TopNav, BottomNav)
│   ├── manga/              # MangaCard, MangaActions, ChapterList
│   ├── reader/             # ReaderShell, ContinuousVertical, Paged
│   ├── motion/             # MotionProvider, Pressable
│   ├── skeletons/          # Loading states per komponen
│   ├── states/             # EmptyState, ErrorState
│   └── ui/                 # Primitif (Button, Dialog, Input, dll.)
├── hooks/                  # use-auth, use-sync
├── server/
│   └── lib/
│       ├── sources/        # Source adapter system
│       │   └── adapters/   # Shinigami, (tambah adapter baru di sini)
│       ├── cache/          # Redis caching strategies
│       └── db/             # Prisma client
└── shared/
    ├── store/              # Zustand stores (reader, library, history, settings)
    ├── lib/                # Firebase init, motion tokens, route helpers
    └── utils/              # cn(), image proxy, normalization
```

### Source Adapter

Setiap adapter mengimplementasikan interface yang sama:

```typescript
// Kemampuan yang harus dideklarasikan setiap adapter
type SourceCapabilities = {
  popular: boolean;
  latest: boolean;
  search: boolean;
  detail: boolean;
  chapters: boolean;
  pages: boolean;
};

// Tambah sumber baru:
// 1. Buat folder di src/server/lib/sources/adapters/<nama>/
// 2. Implementasi index.ts (fetcher), normalizer.ts, types.ts
// 3. Daftarkan di adapters/index.ts
```

---

## Environment Variables

Lihat [`.env.example`](.env.example) untuk daftar lengkap. Ringkasan:

| Variable | Diperlukan | Keterangan |
|---|---|---|
| `DATABASE_URL` | Ya | Supabase PostgreSQL connection string (pooled) |
| `DIRECT_URL` | Opsional | Non-pooled connection untuk migrasi Prisma |
| `REDIS_URL` | Ya | Upstash Redis URL |
| `IMAGE_PROXY_SECRET` | Ya | HMAC secret untuk image proxy (min 32 karakter) |
| `NEXT_PUBLIC_APP_URL` | Ya | URL aplikasi (`http://localhost:3000` untuk dev) |
| `NEXT_PUBLIC_FIREBASE_*` | Ya | Firebase project config (6 variabel) |
| `NEXT_PUBLIC_SUPABASE_URL` | Ya | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Ya | Supabase anon key |
| `CLOUDINARY_*` | Ya | Cloudinary credentials (3 variabel) |

> Variabel `NEXT_PUBLIC_*` terekspos ke browser — ini by design. Keamanan dijaga oleh Firebase Security Rules dan Supabase RLS, bukan oleh kerahasiaan key.

---

## Scripts

```bash
pnpm dev          # Development server (Turbopack)
pnpm build        # Production build (prisma generate + next build)
pnpm start        # Start production server
pnpm typecheck    # TypeScript strict check
pnpm lint         # ESLint
pnpm test         # Vitest
```

---

## Deploy

### Vercel (Direkomendasikan)

Yomirra dibangun di atas Next.js — Vercel adalah rumahnya.

1. Push kode ke GitHub
2. Import project di [vercel.com/new](https://vercel.com/new)
3. Tambahkan semua environment variables dari `.env`
4. Deploy

Atau via CLI:

```bash
vercel --prod
```

### Self-Host

```bash
pnpm build
pnpm start
# Dengarkan di port 3000
```

> Pastikan environment variables sudah diset, Redis sudah jalan, dan database sudah di-migrate (`pnpm prisma db push`).

---

## 🤝 Kontribusi

Kontribusi terbuka. Beberapa aturan:

1. **Satu PR, satu concern.** Jangan campur refactor dengan fitur baru.
2. **TypeScript strict.** Tidak ada `any` yang lolos review.
3. **Phosphor Icons saja.** Jangan tambah icon library lain.
4. **Test sebelum push.** Minimal `pnpm typecheck && pnpm lint`.
5. **Tulis commit yang jelas.** Ikuti [Conventional Commits](https://www.conventionalcommits.org/).

```bash
# Format commit
feat(reader): add RTL reading direction
fix(search): handle empty query gracefully
refactor(store): split history store from library store
```

---

## Roadmap

- [ ] Multi-source search aggregation
- [ ] Chapter download untuk offline reading
- [ ] Custom source creation (adapter builder)
- [ ] Reading statistics & progress tracking
- [ ] Notifikasi update chapter baru

---

## Lisensi

[MIT](LICENSE) — Hafizh Rizqullah Prasetya, 2026.

Pakai, modifikasi, distribusi. Tanpa batasan.

---

<div align="center">

**Dibuat untuk orang yang lebih suka baca daripada scroll feed.**

*Built for people who'd rather read than scroll feeds.*

</div>
]]>
