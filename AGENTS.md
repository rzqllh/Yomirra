# Yomirra (Manga Reader App)

> Aplikasi pembaca manga web modern dengan fokus pada UI premium, performa tinggi, dan pengalaman membaca tanpa hambatan (seamless).

**URL:** `http://localhost:3000` (Dev) | https://yomirra.vercel.app/ (Prod)
**Status:** `WIP`
**Goal:** Membangun platform baca manga yang responsif, punya fitur library & history dengan sinkronisasi Firebase, serta pengalaman transisi halaman yang native-like.
**Target Audience:** Pembaca manga berbahasa Indonesia (menggunakan sumber Shinigami, dan akan diupdate sumber agar user bisa memilih sumber manga atau explore jika sumber tertentu tidak bisa diakses atau tidak memiliki manga yang dicari).

---

## Read Map

> Sebelum mulai task apapun, cek tabel ini — baca extend file yang relevan dulu.

| Jenis Task                                     | Baca                      |
| ---------------------------------------------- | ------------------------- |
| Commit, branch, PR                             | `docs/GIT-RULES.md`       |
| Komponen, styling, TypeScript, state           | `docs/UI-GUIDELINES.md`   |
| Flow, interaksi, responsive, empty/error state | `docs/UX-GUIDELINES.md`   |
| Warna, tipografi, spacing, animasi, token      | `docs/DESIGN-SYSTEM.md`   |
| Estetika baru, visual identity, tone           | `docs/DESIGN-LANGUAGE.md` |
| Endpoint, fetch, route handler, service        | `docs/API-CONTRACTS.md`   |
| Query, migration, schema, relasi tabel         | `docs/DB-SCHEMA.md`       |
| UX patterns, gestures, reader architecture     | `docs/ux-architecture.md`, `docs/ux-gesture.md`, `docs/ux-pipeline.md` |

---

## Tech Stack

### Frontend & Core

| Tool            | Version / Notes                               |
| --------------- | --------------------------------------------- |
| Next.js         | 16.2.5 (App Router, Turbopack, `viewTransition: true`) |
| React           | 19.2.4                                        |
| TypeScript      | 5.x (Strict mode)                             |
| Tailwind CSS    | v4 (PostCSS, `@import "tailwindcss"`)         |
| Framer Motion   | 12.40.0 (`motion/react`)                      |
| Zustand         | 5.0.13 (dengan persist middleware)            |
| Phosphor Icons  | 2.1.10 (`@phosphor-icons/react`)              |
| Radix UI        | Dialog, DropdownMenu, ScrollArea, Tabs, Tooltip, Slot, Separator |
| cmdk            | 1.0.0 (Command palette)                       |
| sonner          | ^2.0.7 (Toast)                                |
| next-themes     | ^0.4.6 (Theme toggle)                         |
| date-fns        | ^4.4.0                                        |
| zod             | ^4.4.3 (Env validation, schema)               |
| class-variance-authority | ^0.7.1 (CVA for component variants) |
| clsx + tailwind-merge | via `cn()` helper                     |
| Package Manager | **pnpm** (jangan npm atau yarn)               |

### Backend, Cache & Infra

| Tool            | Version / Notes                                                      |
| --------------- | -------------------------------------------------------------------- |
| Firebase        | 12.14.0 (Auth Google + Firestore untuk sync lokal ke cloud)         |
| Redis (Upstash) | `ioredis` 5.10.1 (Caching layer — SWR pattern di API endpoints)     |
| Service Worker  | Serwist 9.5.11 (PWA & Offline Support, disabled in development)      |
| TanStack Query  | ^5.100.9 (Client-side data fetching / caching — sudah installed)     |
| TanStack Virtual| ^3.14.2 (Virtualized list rendering untuk chapter list panjang)      |
| @use-gesture/react | ^10.3.1 (Swipe gestures di reader / carousel)                   |
| JSZip           | ^3.10.1 (Chapter ZIP download)                                       |
| file-saver      | ^2.0.5 (Browser file save)                                          |
| react-intersection-observer | ^10.0.3 (Lazy loading & scroll detection)          |

---

### Commands

| Command          | Description                            |
| ---------------- | -------------------------------------- |
| `pnpm install`   | Install dependencies                   |
| `pnpm dev`       | Start dev server (Next.js + Turbopack) |
| `pnpm build`     | Production build                       |
| `pnpm start`     | Serve production build                 |
| `pnpm lint`      | Run ESLint                             |
| `pnpm typecheck` | Run TypeScript compiler (noEmit)       |
| `pnpm test`      | Run Vitest                             |

---

## Project Structure

```
[root]/
├── src/
│   ├── app/           # Next.js App Router
│   │   ├── (web)/     # Route group — semua halaman utama + layout + globals.css
│   │   │   ├── layout.tsx        # Root layout (font, providers, app-shell)
│   │   │   ├── globals.css       # Design tokens, theme variables, view transitions
│   │   │   ├── page.tsx          # Home (/)
│   │   │   ├── library/          # /library
│   │   │   ├── manga/            # /manga/:sourceId/:mangaId + /read/:chapterId
│   │   │   ├── search/           # /search
│   │   │   ├── sources/          # /sources
│   │   │   ├── settings/         # /settings
│   │   │   ├── history/          # /history (route under sources)
│   │   │   ├── bookmark/         # /bookmark
│   │   │   ├── updates/          # /updates
│   │   │   ├── popular/          # /popular
│   │   │   └── design-demo/      # /design-demo (internal reference)
│   │   ├── api/
│   │   │   ├── sources/          # GET /api/sources + /:sourceId/popular|latest|search|manga|chapters|pages|filters
│   │   │   └── proxy/image/      # GET /api/proxy/image (HMAC-signed image proxy)
│   │   ├── manifest.ts           # PWA manifest
│   │   └── sw.ts                 # Serwist service worker
│   ├── components/
│   │   ├── app/       # App-level shell components (TopNav, BottomDock, AppShell, HomeView, etc.)
│   │   ├── manga/     # Manga-specific components (MangaCard, MangaDetailView, ChapterRow, ChapterDownloadButton)
│   │   ├── reader/    # Reader-specific components (ReaderShell, ReaderView, ContinuousVerticalReader, etc.)
│   │   ├── history/   # History page components (HistoryMangaGroup, HistoryChapterRow)
│   │   ├── source/    # Source-scoped components
│   │   ├── motion/    # Shared motion/animation wrappers
│   │   ├── skeletons/ # Skeleton loaders
│   │   ├── states/    # Empty state components
│   │   ├── providers/ # React context providers (ThemeProvider, QueryProvider, OfflineProvider)
│   │   ├── providers.tsx  # Root Providers wrapper
│   │   └── ui/        # Base design system components (Button, Dialog, Tabs, Input, etc.)
│   ├── server/
│   │   └── lib/
│   │       ├── cache/     # Redis SWR cache (redis.ts, strategies.ts)
│   │       ├── image.ts   # HMAC signImageUrl / verifyImageUrl
│   │       ├── security/  # rate-limit.ts
│   │       ├── sources/   # Source adapter implementations + source-manager.ts
│   │       └── validation/
│   └── shared/        # Shared code (client + server safe)
│       ├── api-client.ts  # ApiClient class (semua fetch ke /api/sources/*)
│       ├── logger.ts      # Shared logger
│       ├── env.ts         # Zod env validation (di src/, bukan di shared/)
│       ├── hooks/         # use-auth, use-sync, use-debounce, use-mounted, use-safe-motion, use-click-outside
│       ├── lib/           # firebase.ts, routes.ts, sync-utils.ts, motion/
│       ├── sources/       # source-types.ts, source-registry.ts, source-capabilities.ts
│       ├── store/         # Zustand stores: history, library, reader, reader-progress, download, settings
│       ├── types/         # manga.ts (ReaderPreferences), source.ts
│       └── utils/         # cn.ts, normalize.ts, download-helpers.ts, zip-downloader.ts
├── docs/              # Semua guideline docs (extend files)
├── public/            # Static assets (icons, manifest, sw.js)
├── scripts/
├── .env               # Secret (JANGAN di-commit)
├── .env.example       # Template env (WAJIB di-update kalau ada var baru)
├── firestore.rules    # Firebase Security Rules
├── next.config.ts     # Serwist PWA + Image proxy + Security headers
├── tsconfig.json
└── vitest.config.ts
```

**Architecture pattern:** `Feature-based` dengan pemisahan tegas antara `server/` (server-only) dan `shared/` (dapat digunakan di client + server).

---

## Environment Variables

> Jangan expose `_SECRET` atau URL Redis ke client.

| Variable                            | Client-safe | Required | Description                                   |
| ----------------------------------- | :---------: | :------: | --------------------------------------------- |
| `NEXT_PUBLIC_APP_URL`               |     ✅      |    ✅    | Base URL aplikasi                             |
| `NEXT_PUBLIC_SITE_URL`              |     ✅      |    ⚠️    | Dipakai di `metadataBase` (layout.tsx)        |
| `REDIS_URL`                         |     ❌      |    ✅    | Connection string Upstash Redis               |
| `IMAGE_PROXY_SECRET`                |     ❌      |    ✅    | Secret (min 32 chars) untuk HMAC sign gambar  |
| `NEXT_PUBLIC_FIREBASE_API_KEY`      |     ✅      |    ⚠️    | Firebase App API Key                          |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`  |     ✅      |    ⚠️    | Firebase Auth Domain                          |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID`   |     ✅      |    ⚠️    | Firebase Project ID                           |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`|    ✅      |    ⚠️    | Firebase Storage Bucket                       |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`|✅    |    ⚠️    | Firebase Messaging Sender ID                  |
| `NEXT_PUBLIC_FIREBASE_APP_ID`       |     ✅      |    ⚠️    | Firebase App ID                               |

**Env validation:** `src/env.ts` — divalidasi via Zod saat runtime. Build time menggunakan stub/default jika variabel hilang (expected behavior di Vercel).

---

## External Services

| Service           | Purpose                                                               | Auth / Security              |
| ----------------- | --------------------------------------------------------------------- | ---------------------------- |
| **Shinigami API** | Sumber data manga (search, popular, latest, detail, pages)            | HMAC Proxy bypass referer    |
| **Upstash Redis** | Cache layer untuk endpoint API                                        | Redis URL                    |
| **Firebase Auth** | Google Sign-In (guest-first PWA approach)                             | API Keys + Firestore Rules   |
| **Firestore**     | Sync Library & History antar perangkat                                | Security Rules (`firestore.rules`) |
| **Vercel**        | Hosting + Edge deployment                                             | —                            |

---

## Build

```bash
pnpm build
```

**Pre-deploy checklist:**
- [ ] Zero TypeScript errors (`pnpm typecheck`)
- [ ] Linter pass (`pnpm lint`)
- [ ] `.env.example` updated dengan variable baru
- [ ] Environment variables terkonfigurasi di Vercel dashboard

---

## Testing

**Framework:** Vitest (`vitest.config.ts`)

```bash
pnpm test
```

**Test location:** `src/**/  __tests__/` (co-located dengan source)

---

## Deployment

**Platform Target:** Vercel
**CI/CD:** Dapat dikonfigurasi melalui Vercel GitHub integration.

---

## Agent Pipeline

> Instruksi per-role. Baca section role kamu sebelum mulai apapun.

---

### 🗂 Planner

**Tugas:** Terima brief dari user → baca konteks → breakdown jadi execution plan → output ke Executor.

**Sebelum mulai:**
- Baca AGENT.md penuh
- Baca extend files yang relevan (lihat Read Map di atas)
- Jangan asumsikan hal yang tidak tertulis di dokumen ini — tanya dulu

**Output format wajib:**
```
## Plan: [Nama Task]

### Scope
[Apa yang dikerjakan, dibatasi pada apa]

### Files to Modify
- `path/to/file.tsx` — [alasan]

### Files to Create
- `path/to/file.tsx` — [alasan]

### Dependencies to Add
- [nama-package] — [alasan] / none

### Steps
1.
2.
3.

### Ambiguities / Assumptions
- [kalau ada] / none
```

**Rules:**
- Output plan saja — jangan execute
- Kalau ada ambiguitas, list di section Ambiguities — jangan tebak sendiri
- Kalau scope melibatkan >5 file, pecah jadi multiple plans
- Jangan include task yang tidak diminta user

---

### ⚙️ Executor

**Tugas:** Terima plan dari Planner → execute persis sesuai plan → output hasil ke Reviewer.

**Sebelum mulai:**
- Baca plan dari Planner
- Baca extend files yang relevan dengan task
- Konfirmasi scope — jangan kerjakan di luar yang ada di plan

**Output format wajib:**
```
## Execution Report: [Nama Task]

### Changes Made
- `path/to/file.tsx` — [apa yang diubah]

### New Files
- `path/to/file.tsx` — [tujuannya]

### Dependencies Added
- [nama-package] / none

### What to Verify
- [ ]
- [ ]

### Blockers / Issues
- [kalau ada] / none
```

**Rules:**
- Kerjakan HANYA yang ada di plan — zero scope creep
- Kalau ada blocker, tulis `BLOCKED: [alasan]` dan stop — jangan tebak
- Jangan refactor kode di luar scope task
- Jangan rename variable, file, atau folder yang tidak diminta
- Jangan tambah `console.log` kecuali diminta eksplisit
- Jangan tambah dependency tanpa mention di output

---

### 🔍 Reviewer

**Tugas:** Review hasil Executor → flag issues dengan severity → approve atau request changes.

**Checklist review:**
- [ ] Kode sesuai `UI-GUIDELINES.md`
- [ ] Tidak ada violation dari DO NOT list
- [ ] Zero `any` type di TypeScript (kecuali ada justifikasi + eslint-disable comment)
- [ ] Zero secret/key exposed ke client
- [ ] Zero kode di luar scope plan
- [ ] Zero `console.log` tertinggal (kecuali yang intentional dan di-comment)
- [ ] TypeScript strict — no errors
- [ ] Performa: tidak ada re-render atau fetch yang tidak perlu

**Severity levels:**

| Level         | Arti                                  | Action          |
| ------------- | ------------------------------------- | --------------- |
| 🔴 BLOCKER    | Harus difix sebelum lanjut            | Request changes |
| 🟡 WARNING    | Perlu diperhatikan, potensi tech debt | Flag + catat    |
| 🟢 SUGGESTION | Nice to have, opsional                | Mention saja    |

**Output format wajib:**
```
## Review: [Nama Task]

### Verdict: ✅ APPROVED / ❌ REQUEST CHANGES

### Issues
🔴 BLOCKER — `path/to/file.tsx:baris` — [masalah] → [solusi]
🟡 WARNING — `path/to/file.tsx` — [deskripsi]
🟢 SUGGESTION — [deskripsi]

### Notes
[Konteks tambahan kalau ada]
```

---

## ⛔ DO NOT

> Aturan mutlak. Agent harus tanya dulu kalau ada task yang akan melanggar salah satu dari ini.

### 🎯 Scope Discipline
- **Kalau user ngeluh atau mention masalah A, kerjakan HANYA masalah A.** Jangan refactor hal lain, jangan rename file lain, jangan "sekalian bersihin" kode sekitarnya tanpa diminta eksplisit.
- Kalau ada yang "perlu dibenerin juga" di luar scope — catat sebagai 🟡 WARNING di output report, jangan langsung dikerjain.
- Jangan ubah file yang tidak ada di plan.

### 🔒 Security
- Jangan expose server-side secret (`IMAGE_PROXY_SECRET`, `REDIS_URL`, dst.) ke client bundle
- Jangan commit `.env`, `.env.local`, atau file apapun yang berisi real secret
- Jangan trust user input tanpa validasi / sanitasi
- Jangan bypass auth middleware "sementara untuk testing"

### 💻 Code
- Jangan gunakan `npm` atau `yarn` — selalu pakai **pnpm**
- Jangan gunakan `any` di TypeScript — strict mode enforced (kecuali WakeLock API + Framer Motion `PanInfo` yang butuh deklarasi global; wajib ada comment justifikasi)
- Jangan hardcode warna arbitrary (`bg-[#1a1a1a]`) — pakai CSS variable atau token Tailwind yang sudah di-map di `globals.css`
- Jangan buat komponen lebih dari **200 baris** tanpa decompose
- Jangan pakai `useEffect` untuk derived state — compute langsung atau `useMemo`
- Jangan tinggalkan `console.log` di production code (kecuali `[Sync]` log yang intentional dengan prefix)
- Jangan tambah dependency baru tanpa mention di execution report
- Jangan gunakan `alert()` atau `confirm()` — pakai Dialog dari `@/components/ui/dialog`
- Jangan gunakan `<img>` untuk cover manga dari sumber eksternal — pakai proxy via `signImageUrl` atau `next/image` dengan remote pattern

### 🔀 Git
- Jangan push langsung ke `main` — selalu pakai feature branch
- Lihat `GIT-RULES.md` untuk aturan lengkap

### 🤖 Agent Behavior
- Kalau instruksi ambigu, **tanya dulu sebelum mulai**
- Jangan asumsikan hal yang tidak tertulis di AGENT.md atau extend files
- Jangan mulai task baru sebelum task sebelumnya di-review dan di-approve

---

## Current Sprint

> Living section. Update setiap session baru dimulai.

**Sprint goal:**
**Active task:**
**Blocked by:**
**Next up:**

## **Done this sprint:**

---

## Resolved Issues Log

> Catat setiap bug yang sudah difix. Tujuan: agent tidak re-introduce masalah yang sama.

| Date       | Issue                                           | Root Cause                                                | Fix Applied                                                  | Files Touched |
| ---------- | ----------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------ | ------------- |
| 2026-06-10 | `alert()`/`confirm()` di download & history     | Native browser prompts memutus immersive experience       | Diganti Dialog dari Radix (`@/components/ui/dialog`)         | `chapter-download-button.tsx`, `history-manga-group.tsx`, `settings/page.tsx` |
| 2026-06-10 | Hover scale bug (`scale-1025`)                  | Tailwind v4 parse `scale-1025` as 1025%                  | Diganti ke `scale-[1.025]`                                   | `manga-card.tsx` |
| 2026-06-10 | `new Image()` collision dengan `next/image`     | Import clash                                              | Diganti ke `new window.Image()`                              | `paged-reader.tsx` |
| 2026-06-10 | Library page blank saat hydration               | Zustand persist belum selesai saat pertama render         | Menambahkan `useMounted` guard                               | `library/page.tsx` |

---

*Last updated: 2026-06-17*
