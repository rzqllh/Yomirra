<div align="center">

# Yomirra

A mobile-first manga and webtoon reader built as a Progressive Web App.

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-149eca)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6)](https://www.typescriptlang.org/)

</div>

> [!IMPORTANT]
> Yomirra is an independent reader client. It does not host manga, chapters, or images. Content is fetched from third-party sources, whose availability and terms may change without notice. Use the project responsibly and comply with applicable laws and each source's terms.

## Overview

Yomirra combines discovery, multi-source search, library management, chapter downloads, and a configurable reader in one responsive web application. The project is mobile-first while keeping desktop layouts and keyboard interaction practical.

The project is under active development. Browser-specific PWA and offline behavior can vary with storage limits, service worker support, and source availability.

## Highlights

- Multi-source search with source-aware filters and partial-failure handling.
- Built-in adapters plus optional installable sources through a JSON manifest.
- Local Library with custom Collections, reading statuses, search, sorting, and filtering.
- Bookmark workspace with reading-history and saved-collection views.
- Manga detail, chapter list, and configurable reader flows.
- Reading history, bookmarks, per-manga mute preferences, and update tracking.
- Chapter downloads backed by browser Cache Storage and offline-reading workflows.
- Local Backup & Restore with schema V2 and backward compatibility.
- Firebase authentication and cloud synchronization for supported stores.
- Redis-backed server caching with stale-data fallback where supported.
- Source health diagnostics and normalized public errors.
- Canonical responsive UI primitives for headers, filters, manga grids, covers, progress, and reader panels.
- GitHub Actions CI workflow and Vitest/Testing Library coverage.

## Built-in Sources

| Source | ID | Type | Notes |
| --- | --- | --- | --- |
| MangaDex | `mangadex` | API adapter | International API source with bounded HTTP 429 `Retry-After` handling |
| Shinigami | `shinigami` | Web scraper | Indonesian webtoon and manhwa source |
| Komiku | `komiku` | Web scraper | Indonesian webtoon and manga source with signed image proxying where required |
| Komikindo | `komikindo` | Web scraper | Indonesian manga source with stale Redis cache fallback where available |

A source can become slow or unavailable independently of Yomirra. Search and source-facing screens are designed to degrade gracefully when one source fails.

## Technology

| Area | Stack |
| --- | --- |
| Framework | Next.js 16 App Router |
| UI | React 19, Tailwind CSS 4, Radix UI, Vaul, Motion |
| Data fetching | TanStack Query |
| Client state | Zustand |
| Validation | Zod |
| Authentication and sync | Firebase |
| Server cache | Redis through ioredis |
| PWA and service worker | Serwist |
| Testing | Vitest and Testing Library |
| Package manager | pnpm |

See [Stack](docs/STACK.md) for the package-level source of truth used by the project documentation.

## Quick Start

### Requirements

- A currently supported Node.js LTS release
- pnpm
- Redis for server caching
- A Firebase project for authentication and cloud synchronization

### Installation

```bash
git clone https://github.com/rzqllh/Yomirra.git
cd Yomirra
pnpm install
```

Copy the environment template:

```bash
cp .env.example .env
```

PowerShell:

```powershell
Copy-Item .env.example .env
```

Fill in the required values, then start development:

```bash
pnpm dev
```

Open `http://localhost:3000`.

### Environment Variables

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_APP_URL` | Public application origin |
| `IMAGE_PROXY_SECRET` | Secret used by signed image-proxy URLs |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase browser API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase authentication domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase application ID |
| `REDIS_URL` | Redis connection URL |

Never commit `.env`, `.env.local`, credentials, service-account files, or private source tokens.

## Commands

```bash
pnpm dev            # Start the development server
pnpm build          # Create a production build
pnpm start          # Run the production build
pnpm typecheck      # Run TypeScript checks
pnpm lint           # Run ESLint
pnpm test --run     # Run the test suite once
```

## Project Structure

```text
src/
├── app/
│   ├── (web)/                    # User-facing App Router routes and loading states
│   └── api/                      # Server API routes and image proxy
├── components/
│   ├── app/                      # App shell and canonical PageHeader
│   ├── ui/                       # Reusable primitives (filters, inputs, progress, dialogs)
│   ├── manga/                    # MangaCover, MangaGrid, card archetypes, detail UI
│   ├── library/                  # Library feature view, rails, toolbar, results
│   ├── bookmark/                 # Reading/collection tabs and selection UI
│   ├── search/                   # Search feature view, source rail, results, filters
│   ├── reader/                   # Reader UI and ReaderPanelShell
│   └── skeletons/                # Loading-state components
├── server/
│   └── lib/sources/              # Source manager and built-in adapters
└── shared/
    ├── hooks/                    # Feature/controller hooks and shared hooks
    ├── lib/                      # Backup engine, update checker, motion, routes, etc.
    ├── sources/                  # Source contracts and dynamic registry
    ├── store/                    # Zustand stores
    ├── types/                    # Shared schemas and domain types
    └── utils/                    # Pure utilities
```

Complex client routes generally follow a thin route entrypoint → feature view → controller hook pattern. See [Architecture](docs/ARCHITECTURE.md) for the current boundaries.

## Adding a Source

Yomirra supports two source models:

1. **Built-in adapter** for full control over remote APIs, HTML parsing, normalization, headers, and filters.
2. **Dynamic manifest** for an API that already returns Yomirra's normalized response shapes.

Read [Adding a Source](docs/ADDING_A_SOURCE.md) before implementing one.

## Documentation

- [Documentation index](docs/README.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Component conventions](docs/COMPONENTS.md)
- [Design system](docs/DESIGN.md)
- [Technology stack](docs/STACK.md)
- [Testing conventions](docs/TESTING.md)
- [Adding a source](docs/ADDING_A_SOURCE.md)
- [Schema notes](docs/SCHEMA.md)
- [Contributing](CONTRIBUTING.md)
- [Changelog](CHANGELOG.md)
- [Security policy](SECURITY.md)

Public documentation describes verified repository behavior. When documentation and implementation disagree, current code and configuration are the source of truth and the documentation should be corrected in the same change.

## Contributing

Small, focused pull requests are preferred. Reuse canonical components and preserve established feature boundaries instead of introducing parallel UI implementations. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Security

Do not report vulnerabilities in a public issue. Follow [SECURITY.md](SECURITY.md).

## License

Licensed under the [Apache License 2.0](LICENSE).
