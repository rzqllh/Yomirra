<div align="center">

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

[Demo](#demo) · [Instalasi](#-mulai) · [Arsitektur](#-arsitektur)

</div>

---

## Apa ini?

Yomirra adalah manga reader open-source yang dibangun dari nol dengan **Next.js 16**. Bukan fork. Bukan template. Bukan wrapper tipis di atas API orang lain.

Arsitekturnya difokuskan pada **source adapter** — satu antarmuka yang konsisten dan terpusat untuk menghubungkan berbagai sumber manga di bawah satu payung UI/UX kelas dunia. Jika kamu butuh sumber baru, cukup tulis satu adapter dan Yomirra akan mengurus sisanya.

> **EN** — Yomirra is a world-class, open-source manga reader built from scratch on Next.js 16. It is powered by a robust source adapter architecture: providing one consistent, premium interface across multiple disjointed manga sources.

---

## Kenapa ada ini?

Manga reader yang ada saat ini punya dua dilema klasik:

1. **Reader mobile** — Memanjakan mata di layar HP, tapi buka di laptop dan kamu akan disuguhi UX/UI hasil porting paksa yang menyedihkan.
2. **Reader web** — Seringkali hanya search box hambar dengan list chapter yang kaku dan tanpa jiwa.

Yomirra mengejar ruang kosong di antara keduanya: Reader yang terasa native dan responsif di layar 5 inci, namun berekspansi menjadi pusat literatur manga yang kaya dan padat informasi di layar 27 inci. Panel sidebar untuk desktop, bottom navigation untuk mobile, serta reader experience yang melebur mulus dengan ukuran layarmu.

---

## Fitur Utama

| Fitur | Deskripsi |
|---|---|
| **Source Adapter API** | Arsitektur *plug-and-play*. Setiap sumber manga dipisahkan menjadi modul independen dengan *normalizer* mutlak. |
| **Premium Reader** | Mendukung mode baca *Continuous Vertical*, *Paged*, dan *Webtoon*. Terdapat *smart overlay* di mobile dan *side-panel* kolapsibel di desktop. |
| **Readlist & Riwayat** | Pustaka yang hidup. Manga yang disimpan masuk ke dalam *Library*, dengan riwayat yang otomatis merekam jejak bacamu secara akurat hingga per chapter. |
| **Offline Sync (Firebase)** | Terintegrasi dengan Firebase Firestore + IndexedDB. Data lokal (tanpa akun) otomatis dipertahankan dan disinkronkan ke cloud saat pengguna melakukan login pertama kali. |
| **Data Saver Mode** | Toggle kompresi 1-klik untuk Next.js Image (WebP). Cerdas dan responsif untuk membantumu menghemat kuota seluler. |
| **Strict Content Filter** | Filter NSFW global yang diinjeksi secara native di lapisan API, menutup kemungkinan *bypass* dari sisi *client*. |
| **Micro-Interactions** | Dibangun dengan `motion/react` dan *reduced-motion* yang peduli aksesibilitas. Animasi di Yomirra bukanlah hiasan kosmetik, melainkan fondasi feedback UX taktil. |

---

## Demo

> 🚧 Deployment pertama sedang berjalan di Vercel. Link akan diperbarui setelah build selesai.

---

## Stack Teknologi

```
Next.js 16 ─── App Router, Server Components, Secure API Routes
TypeScript ─── End-to-end type safety & type-check
Tailwind v4 ── Desain tersistem, Utility CSS modern
Zustand ────── Manajemen state terisolasi (Reader, Library, History)
Firebase ───── Autentikasi dan Sync (Firestore lokal & remote)
motion/react ─ Transisi fisika, layout shift handler
Phosphor ───── Bahasa ikonografi komprehensif
```

---

## 🚀 Mulai

### Prasyarat

- **Node.js** ≥ 20
- **pnpm** (direkomendasikan) — `npm install -g pnpm`
- Akun [Supabase](https://supabase.com) (Database)
- Akun [Firebase](https://console.firebase.google.com) (Autentikasi & Sync)
- Akun [Upstash](https://upstash.com) (Redis caching - opsional untuk dev lokal)

### Setup

```bash
# Clone
git clone https://github.com/rzqllh/Yomirra.git
cd Yomirra

# Install dependencies
pnpm install

# Setup environment
cp .env.example .env
# Lengkapi kunci rahasia API di dalam .env

# Generate Prisma client (jika kamu menggunakan layer DB tambahan di luar Firebase)
pnpm prisma generate

# Jalankan server
pnpm dev
```

Buka `http://localhost:3000`. Selesai.

---

## 📐 Arsitektur

```
src/
├── app/                    # Next.js App Router (16.2+)
│   ├── (web)/              # Halaman UX Utama (Home, Search, Library)
│   └── api/                # API Routes & Adapter proxies
├── components/
│   ├── app/                # Shell, Navigasi (SideNav, TopNav, BottomNav)
│   ├── manga/              # Modul manga (Card, Row, Actions)
│   ├── reader/             # Inti Pustaka: ReaderShell & kontrol render
│   ├── states/             # Standardization: ErrorState, EmptyState
│   └── ui/                 # Token tersistem
├── server/
│   └── lib/
│       ├── sources/        # Source adapter registry
│       ├── cache/          # Redis caching strategies
│       └── security/       # Rate limiting & Header validation
└── shared/
    ├── store/              # Zustand stores (reader, library, history)
    ├── lib/                # Konfigurasi utilitas (Firebase lazy-init, motion)
    └── utils/              # Pengelola proxy, classnames (cn)
```

### Source Adapter

Setiap adapter mengimplementasikan antarmuka absolut `SourceCapabilities`:

```typescript
type SourceCapabilities = {
  popular: boolean;
  latest: boolean;
  search: boolean;
  detail: boolean;
  chapters: boolean;
  pages: boolean;
};
```

Sistem proxy `mangaId` dan `sourceId` mencegah tumpang tindih data di *Library* dan menjamin isolasi setiap adapter web-scraping/API pihak ketiga.

---

## Deployment

Yomirra paling prima jika di-*deploy* melalui **Vercel**, memanfaatkan serverless functions, *image optimization*, dan arsitektur *Edge*.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2A%2Fgithub.com%2Frzqllh%2FYomirra)

Atau secara manual:
1. Tautkan repositori ini di Vercel.
2. Atur semua `Environment Variables` sesuai `.env.example`.
3. Build & Deploy.

---

## Roadmap Pengembangan

- [ ] Multi-source search aggregation
- [ ] Chapter download manager
- [ ] Visual UI Custom Source Builder
- [ ] Reading statistics & advanced trackers

---

## Lisensi

[MIT](LICENSE) — Hafizh Rizqullah Prasetya, 2026.
Bebas pakai, modifikasi, dan komersialisasi. Tanpa kompromi.

<div align="center">

**Dibuat untuk orang yang lebih suka baca komik daripada scroll timeline.**
*Built for people who'd rather read manga than doom-scroll feeds.*

</div>
