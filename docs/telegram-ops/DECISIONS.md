# Telegram Ops — Architecture Decision Records

---

## TD-001: Telegram as Lightweight Ops Console

**Decision:** Use Telegram as the primary operational notification channel for Yomirra.

**Reason:** No admin dashboard exists. Telegram is free, serverless-compatible (outbound HTTP only), and supports Markdown formatting for structured alerts. No persistent connection required from server side.

**Alternatives considered:**
- Discord webhooks — more complex embed format, less mobile-friendly for quick ops checks.
- Email alerts — high latency, poor for real-time critical alerts.
- Custom dashboard — requires VPS or paid hosting, violates D-005.

**Evidence:** Existing `src/app/api/observability/alert/route.ts` already uses `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` pattern. `VERIFIED_FROM_REPO`.

**Status:** ACTIVE

---

## TD-002: Read-Only V1

**Decision:** V1 bot commands are strictly informational. No destructive commands in V1.

**Reason:** Write commands (disable source, purge cache, rollback) require strict authorization, audit logging, and blast-radius control. These are separate security design concerns that must not be rushed into V1.

**Blocked commands (V1):**
- `/disable-source`
- `/purge-cache`
- `/rollback`
- `/delete`

**Status:** ACTIVE

---

## TD-003: No User-Private Telemetry

**Decision:** All Telegram messages must never include user reading history, search queries, email/user identity, or raw personal telemetry.

**Reason:** Operational monitoring does not require user-specific data. Including it would violate user privacy and create unnecessary data exposure.

**Allowed in messages:**
- Source health status
- Error codes and types
- Latency measurements
- Aggregate counts (source requests, failures)
- Domain changes
- Deployment metadata

**Explicitly prohibited:**
- Manga titles being read by specific users
- Reading progress/history
- Search query content
- User email or account ID
- Raw authorization headers or tokens

**Status:** ACTIVE

---

## TD-004: Server-Only Secrets

**Decision:** `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` must remain server-side environment variables only.

**Evidence:** Already defined as server-only in existing `observability/alert/route.ts`. Pattern: `process.env.TELEGRAM_BOT_TOKEN` — never in `NEXT_PUBLIC_*`. `VERIFIED_FROM_REPO`.

**Status:** ACTIVE

---

## TD-005: Alert Deduplication Mandatory

**Decision:** The alerting system must implement deduplication to prevent Telegram from becoming a log stream.

**Fingerprint key format:** `yomirra:ops:alert:{sourceId}:{errorType}`

**Required dedup fields:**
- `fingerprint` — stable key for this alert type
- `firstSeen` — ISO timestamp of first occurrence
- `lastSeen` — ISO timestamp of most recent occurrence
- `consecutiveFailures` — integer counter
- `alertedAt` — when last Telegram message was sent
- `recoveredAt` — when source recovered (nullable)
- `cooldownUntil` — suppress re-alert until this time

**Suppression rules (proposed thresholds — subject to tuning):**
- Single transient failure → no Telegram message
- 3 consecutive failures → WARNING or CRITICAL alert
- Same failure persisting → suppress duplicate, update `lastSeen`
- Recovery → send RECOVERY once, then clear state

**Storage:** Redis via Upstash (already available). Keys with TTL ~7 days.

**Status:** ACTIVE

---

## TD-006: Consume Phase 3 Source Engine Health State

**Decision:** Telegram monitoring must consume the Phase 3 Source Engine health engine (`probeAllSourcesHealth`, `sourceHealthStore`), not build a second parallel monitoring system.

**Evidence:**
- Phase 3 provides layered functional health probes (`probe.ts`), runtime domain resolution (`domain-resolver.ts`), and machine-readable `SourceErrorCode`.
- `probeAllSourcesHealth({ deep: false })` executes bounded lightweight probes for scheduled digests.
- `probeSourceHealth(sourceId, { deep: true })` executes targeted diagnostic probes for `/recheck <id>`.
- Snapshots and transition history are stored in `sourceHealthStore`.

**Status:** ACTIVE

---

## TD-007: GitHub Actions for Scheduled Reports (Vercel Cron Rejected)

**Decision:** Use GitHub Actions scheduled workflows (`.github/workflows/yomirra-ops.yml`) for the 6-hour health digest (`17 */6 * * *`) and daily digest (`37 0 * * *`), with manual `workflow_dispatch` trigger. Vercel Cron is rejected for sub-daily scheduling due to Vercel Hobby plan limitations.

**Reason:** Vercel Hobby tier does not support sub-daily cron intervals (`*/10 * * * *` or `0 */6 * * *`). GitHub Actions provides free, reliable cron scheduling with non-zero minute offsets to prevent high-load delays.

**Endpoints:**
- `POST /api/ops/cron/health-digest` — protected by `OPS_CRON_SECRET`
- `POST /api/ops/cron/daily-digest` — protected by `OPS_CRON_SECRET`

**Status:** ACTIVE

---

## TD-008: Incoming Webhook Authorization

**Decision:** Any Telegram webhook endpoint (for bot commands) must verify the incoming request is from Telegram via secret token validation.

**Method:** Telegram supports `secret_token` field in `setWebhook`. Validate `X-Telegram-Bot-Api-Secret-Token` header on webhook route.

**Additional guards:**
- Validate `chat_id` is in `TELEGRAM_ALLOWED_CHAT_IDS` allowlist
- Command rate limiting (max 10 commands per minute per chat)
- Input length validation on command parameters
- No arbitrary URL or path traversal in command parameters

**Status:** ACTIVE

---

## TD-009: Severity Model

**Decision:** Use 4 severity levels for routing decisions.

| Level | Description | Telegram action |
|-------|-------------|-----------------|
| `INFO` | Non-urgent context | Digest only |
| `WARNING` | Persistent degradation (3+ failures) | Telegram alert |
| `CRITICAL` | Source down, security event, data integrity | Immediate Telegram |
| `RECOVERY` | Source recovered after alert | Immediate Telegram (once) |

**Status:** ACTIVE
