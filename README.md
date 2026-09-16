<div align="center">

# Yomirra

**A mobile-first manga, manhwa, and webtoon reader.**  
Built for reading first: clean navigation, multi-source discovery, personal library, offline support, and a reader that works especially well on phones.

**Reader manga, manhwa, dan webtoon yang mobile-first.**  
Fokusnya sederhana: cari, simpan, lanjut baca, dan baca dengan nyaman tanpa UI yang mengganggu.

[Open Yomirra](https://yomirra.vercel.app/) · [Documentation](docs/README.md) · [Changelog](CHANGELOG.md)

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-149eca)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6)](https://www.typescriptlang.org/)

</div>

> [!TIP]
> **Yomirra is designed mobile-first and is recommended on mobile.** Desktop is supported, but the main navigation, touch targets, reader controls, and responsive layout are designed around phone use.
>
> **Yomirra dibuat mobile-first dan paling direkomendasikan dipakai di HP.** Desktop tetap didukung, tetapi pengalaman baca utamanya memang dirancang untuk layar sentuh dan viewport mobile.

## Try it / Coba langsung

No installation is required.

**https://yomirra.vercel.app/**

Open it in your browser and start reading. On supported browsers, you can also add Yomirra to your home screen for a more app-like experience.

Buka link di atas lewat browser. Kalau browser/device mendukung, Yomirra juga bisa ditambahkan ke home screen supaya terasa lebih seperti aplikasi.

## What Yomirra does / Yang tersedia

- **Multi-source discovery and search** — browse and search across multiple manga sources, with source-specific filtering and graceful partial-failure handling.
- **Personal library** — save titles, manage collections and reading statuses, sort, filter, and continue where you left off.
- **Reading history and updates** — track progress, revisit recent reads, and see title updates without rebuilding your library manually.
- **Mobile-focused reader** — vertical and paged reading modes, responsive controls, keyboard support on desktop, and retained reader state.
- **Offline reading** — download chapters and read cached content when available.
- **Backup and restore** — export and restore supported local data.
- **Account sync** — Firebase-backed authentication and synchronization for supported stores.
- **Source resilience** — source health handling, normalized errors, stale-cache fallback where supported, and independent source failure handling.

Singkatnya: Yomirra bukan sekadar halaman baca. Library, history, collections, update tracking, source selection, download, dan reader settings dibuat sebagai satu alur yang nyambung.

## Built-in sources / Sumber bawaan

| Source | Type | Notes |
| --- | --- | --- |
| MangaDex | API | International source with bounded rate-limit handling |
| Shinigami | Web source | Indonesian manga/manhwa/webtoon source |
| Komiku | Web source | Indonesian manga/manhwa/webtoon source |
| Komikindo | Web source | Indonesian manga source with stale-cache fallback where available |

Source availability is external to Yomirra. A source can become slow, change its structure, or go offline independently of the app.

Ketersediaan source berada di luar kontrol Yomirra. Kalau satu source sedang bermasalah, source lain tetap bisa digunakan selama tersedia.

## Reader experience

Yomirra is intentionally optimized around actual reading instead of dashboard-style UI.

- Mobile-first navigation and touch targets
- Responsive manga grids and detail pages
- Vertical and paged reader modes
- Chapter and settings panels designed for small screens
- Reading progress retention
- Image retry and failure handling
- Offline chapter support
- Desktop keyboard navigation where applicable

If you only want to use Yomirra, you can stop here and open the live app:

**https://yomirra.vercel.app/**

---

## For developers / Untuk developer

Yomirra is a Next.js application with a source-adapter architecture. Public repository documentation covers the stable implementation contracts; temporary planning files, AI-agent artifacts, audits, and local design references are intentionally kept out of version control.

### Stack

| Area | Stack |
| --- | --- |
| Framework | Next.js 16 App Router |
| UI | React 19, Tailwind CSS 4, Radix UI, Vaul, Motion |
| Data fetching | TanStack Query |
| Client state | Zustand |
| Validation | Zod |
| Authentication and sync | Firebase |
| Server cache | Redis / ioredis |
| PWA / service worker | Serwist |
| Testing | Vitest, Testing Library |
| Package manager | pnpm |

### Local development

Requirements:

- A currently supported Node.js LTS release
- pnpm
- Redis for server caching
- A Firebase project for authentication and cloud synchronization

```bash
git clone https://github.com/rzqllh/Yomirra.git
cd Yomirra
pnpm install
```

Create the local environment file:

```bash
cp .env.example .env
```

PowerShell:

```powershell
Copy-Item .env.example .env
```

Fill the required values from `.env.example`, then run:

```bash
pnpm dev
```

Open `http://localhost:3000`.

### Useful commands

```bash
pnpm dev
pnpm build
pnpm start
pnpm typecheck
pnpm lint
pnpm test --run
```

### Public documentation

- [Documentation index](docs/README.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Component conventions](docs/COMPONENTS.md)
- [Design system](docs/DESIGN.md)
- [Technology stack](docs/STACK.md)
- [Testing conventions](docs/TESTING.md)
- [Adding a source](docs/ADDING_A_SOURCE.md)
- [Schema notes](docs/SCHEMA.md)
- [Contributing](CONTRIBUTING.md)
- [Security](SECURITY.md)
- [Changelog](CHANGELOG.md)

## Content and source policy

Yomirra is an independent reader client. It does **not** host manga, chapters, or source images. Content is requested from third-party sources, and those sources may change availability or terms without notice.

Use Yomirra responsibly and follow applicable laws and the terms of the sources you use.

## Contributing

Keep changes focused. Reuse existing components and feature boundaries instead of creating parallel implementations for the same behavior. See [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.

## Security

Do not report vulnerabilities in a public issue. Follow [SECURITY.md](SECURITY.md).

## License

Licensed under the [Apache License 2.0](LICENSE).
