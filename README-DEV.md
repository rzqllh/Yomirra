# Yomirra — Developer Guide

This document is for contributors and maintainers. For the public-facing project overview, see [README.md](README.md) or [README-EN.md](README-EN.md).

## Stack

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

The repository currently reports version `0.1.0` in `package.json`.

## Local setup

Requirements:

- A currently supported Node.js LTS release
- pnpm
- Redis for server-side caching
- A Firebase project for authentication and cloud synchronization

Clone and install:

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

Fill in the required values from `.env.example`, then run:

```bash
pnpm dev
```

Open `http://localhost:3000`.

## Environment variables

The public `.env.example` intentionally contains placeholders only.

Current variables include:

- `NEXT_PUBLIC_APP_URL`
- `IMAGE_PROXY_SECRET`
- Firebase public configuration values
- `REDIS_URL`

Never commit populated `.env` files, secrets, credentials, cookies, or private source material.

## Useful commands

```bash
pnpm dev
pnpm build
pnpm start
pnpm typecheck
pnpm lint
pnpm test --run
```

For release-sensitive or broad changes, also run:

```bash
git diff --check
```

## Architecture notes

Yomirra uses a source-adapter architecture. Shared product state and remote request state are intentionally separated: Zustand owns established client/persistent state, while TanStack Query handles remote request state.

Important boundaries:

- Source-specific responses should be normalized before reaching shared/client code.
- Client components must not import server adapters directly.
- Reader infrastructure is intentionally separate from general-purpose filter/drawer infrastructure.
- Canonical UI primitives should be reused instead of reimplemented per route.
- Dynamic-source and proxy changes must preserve outbound request and SSRF protections.

## Public documentation

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

## Contribution workflow

Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request. Keep changes focused, avoid unrelated cleanup, update documentation when public behavior changes, and include browser/device verification for UI, PWA, or offline behavior when relevant.

## Security

Do not report vulnerabilities in public issues. Follow [SECURITY.md](SECURITY.md).

## License

Licensed under the [Apache License 2.0](LICENSE).
