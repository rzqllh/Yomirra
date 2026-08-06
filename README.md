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

Yomirra combines discovery, multi-source search, library management, chapter downloads, and a configurable reader in one responsive web application. It is designed for mobile use first, while remaining practical on desktop.

The project is under active development. Some browser-specific PWA and offline behavior may vary depending on storage limits, service worker support, and source availability.

## Highlights

- Multi-source search with source-aware filters.
- Built-in adapters and customizable source extensions.
- Optional installable sources through a JSON manifest.
- Local Library with custom Collections and reading statuses.
- Library filters based on collections and statuses.
- Manga detail, chapter list, and image reader flows.
- Reading history, bookmarks, and per-manga mute preferences.
- Update checker, Updates Page, unread badge, and automatic update-check preferences.
- Chapter downloads backed by browser Cache Storage and offline reading.
- PWA installation and offline-reading workflows.
- Local Backup & Restore with schema V2 and backward compatibility.
- Firebase authentication and cloud synchronization.
- Redis-backed server caching with stale-data fallback.
- Source health diagnostics.
- GitHub Actions CI workflow.
- Responsive layouts, keyboard-accessible controls, and theme support.

## Built-in Sources

| Source | ID | Type | Notes |
| --- | --- | --- | --- |
| MangaDex | `mangadex` | API adapter | International open API source |
| Sample Source | `sample-source` | API adapter | Generic source adapter blueprint |

A source can become slow or unavailable independently of Yomirra. The application should degrade gracefully when one source fails.

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
| `IMAGE_PROXY_SECRET` | Secret used by the signed image proxy |
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
│   ├── (web)/                    # User-facing pages
│   └── api/sources/              # Source API routes
├── components/                   # Shared and feature UI
│   └── updates/                  # Updates page components
├── server/
│   └── lib/sources/
│       └── adapters/             # Built-in source adapters
└── shared/
    ├── lib/                      # Backup engine, update checker, etc.
    ├── sources/                  # Source contracts and dynamic registry
    ├── store/                    # Zustand stores (Collection, Update, etc.)
    ├── types/                    # Collection types, Update schema, Backup schema
    └── hooks/                    # Shared React hooks
```

## Adding a Source

Yomirra supports two source models:

1. **Built-in adapter** for full control over remote APIs, HTML parsing, normalization, headers, and filters.
2. **Dynamic manifest** for an API that already returns Yomirra's normalized response shapes.

Read [Adding a Source](docs/ADDING_A_SOURCE.md) before implementing one.

## Documentation

- [Documentation index](docs/README.md)
- [Architecture overview](docs/ARCHITECTURE.md)
- [Adding a source](docs/ADDING_A_SOURCE.md)
- [Contributing](CONTRIBUTING.md)
- [Changelog](CHANGELOG.md)
- [Security policy](SECURITY.md)
- [Code of conduct](CODE_OF_CONDUCT.md)

The repository may also contain deeper implementation notes under `docs/`. Public documentation should describe verified behavior; experimental or unresolved behavior should be labeled clearly.

## Contributing

Small, focused pull requests are preferred. Do not combine source adapters, UI redesigns, state migrations, and unrelated fixes in one change. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Security

Do not report vulnerabilities in a public issue. Follow [SECURITY.md](SECURITY.md).

## License

Licensed under the [Apache License 2.0](LICENSE).
