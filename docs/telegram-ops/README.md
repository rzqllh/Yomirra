# Telegram Ops — Documentation Index

Operational monitoring and alerting system for Yomirra via Telegram bot.

## Purpose

Yomirra has no admin dashboard. This system provides a lightweight, read-only operational console via Telegram for source health monitoring, critical alerts, and deployment visibility.

## Constraints

- **Vercel serverless** — no persistent background workers, no VPS.
- **Free-tier** — no paid SaaS monitoring services.
- **Read-only V1** — bot commands are informational only. No destructive commands.
- **No user-private data** — never include reading history, search queries, user identity, or personal telemetry.

## Documents

| File | Purpose |
|------|---------|
| [README.md](./README.md) | This document — scope and index |
| [PLAN.md](./PLAN.md) | Phased implementation plan |
| [DECISIONS.md](./DECISIONS.md) | Architecture decision records |
| [RISKS.md](./RISKS.md) | Risk register |

## Existing Infrastructure (VERIFIED_FROM_REPO)

| Asset | Location | Capability |
|-------|----------|------------|
| Source health API | `src/app/api/health/route.ts` | Pings all enabled sources + Redis, returns `{status, sources, redis, timestamp}` |
| Source health with cache | `src/app/api/sources/health/route.ts` | Cached health with 10-minute Redis TTL per source |
| Observability alert endpoint | `src/app/api/observability/alert/route.ts` | POST → Telegram `sendMessage` (already wired to `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`) |
| Redis / Upstash | `src/server/lib/cache/redis.ts` | Serverless-compatible KV for state/dedup storage |
| Logger | `src/shared/logger.ts` | Structured logging |
| Source registry | `src/shared/sources/source-registry.ts` | 7 active sources + health check URLs |

## Status

**Planning phase.** No Telegram runtime code implemented yet.
