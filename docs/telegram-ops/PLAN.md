# Telegram Ops — Implementation Plan

## Background

Yomirra has no admin dashboard. The Source Engine (7 active sources as of Phase 2C) needs operational visibility. A Telegram bot provides a lightweight, free-tier-compatible, serverless-compatible ops console.

Existing infrastructure already built:
- `GET /api/health` — live source health probe
- `GET /api/sources/health` — cached source health (Redis, 10-min TTL)
- `POST /api/observability/alert` — Telegram `sendMessage` (already wired to env vars)
- Redis / Upstash — available for alert state storage

This plan layers on top of existing infrastructure. It does NOT rebuild it.

---

## Resolved Product Decisions

See [DECISIONS.md](./DECISIONS.md) for full ADRs. Summary:

- Telegram as lightweight ops console (TD-001)
- Read-only V1 — no destructive commands (TD-002)
- No user-private telemetry ever (TD-003)
- Server-only secrets (TD-004)
- Alert deduplication mandatory (TD-005)
- Reuse Source Engine health state (TD-006)
- Vercel Cron for scheduled reports (TD-007)
- Webhook authorization required (TD-008)
- 4-level severity model: INFO / WARNING / CRITICAL / RECOVERY (TD-009)

---

## Implementation Phases

### T0 — Audit Existing Observability

**Status:** DONE (this document is the output)

Audited:
- `GET /api/health` — pings all sources + Redis, returns structured JSON. Suitable as cron trigger target.
- `GET /api/sources/health` — Redis-cached, 10-min TTL. Suitable for status display.
- `POST /api/observability/alert` — posts to Telegram. Already functional but has no dedup, no severity model, no auth guard on inbound commands.
- `.env.example` — `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` env vars documented. `CRON_SECRET` not yet present.

**Gaps identified:**
- No alert dedup state in Redis
- No severity routing
- No scheduled health digest
- No bot command handling (webhook)
- No inbound request authorization
- No rate limiting on outbound alerts

---

### T1 — Telegram Outbound Notifier (Foundation)

**Status:** DONE

**Objective:** Create a typed, centralized notifier module that all alert types will call.

**Proposed files:**
```
src/server/lib/ops/
  telegram-notifier.ts   — sendMessage wrapper with severity formatting
  alert-state.ts         — Redis-backed dedup state (fingerprint, consecutiveFailures, cooldownUntil)
  severity.ts            — Severity enum and routing rules
```

**Key behaviors:**
- `sendTelegramMessage(text, options)` — wraps Telegram Bot API, handles token/chatId from env
- Dedup check before every send: if `fingerprint` has `consecutiveFailures < 3` → skip
- If `consecutiveFailures >= 3` and `cooldownUntil` not active → send and record `alertedAt`
- Recovery: clear dedup state and send RECOVERY message

**Dependencies:** Redis (already available), `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`

**New env vars needed:**
```
TELEGRAM_ALLOWED_CHAT_IDS   — comma-separated list for inbound authorization
CRON_SECRET                  — for cron endpoint protection
```

---

### T2 — Health Event Integration

**Status:** DONE

**Objective:** Connect Source Engine health probe to the notifier.

**Proposed approach:**
- Create `POST /api/ops/cron/health-check` — a lightweight cron-triggered route that:
  1. Calls `GET /api/health` internally (or duplicates the probe logic)
  2. For each source, compares current status to last known status (Redis)
  3. Determines if transition warrants an alert (DOWN, RECOVERED, SLOW_SPIKE)
  4. Calls `sendTelegramMessage` with appropriate severity

**Alert conditions to implement:**
```
SOURCE_DOWN          → after 3 consecutive fails → CRITICAL
SOURCE_RECOVERED     → after prior CRITICAL → RECOVERY
SOURCE_SLOW          → latency > 3000ms for 3 checks → WARNING
REDIS_DOWN           → CRITICAL (affects all caching)
DECRYPT_FAILURE      → KomikNesia-specific, after 3 failures → CRITICAL
```

**Previous status storage:** `yomirra:ops:source-status:{sourceId}` → `{status, consecutiveFailures, lastChecked}`

---

### T3 — 6-Hour Health Digest

**Status:** DONE

**Objective:** Send a scheduled health summary every 6 hours.

**Proposed cron route:** `POST /api/ops/cron/health-digest`

**`vercel.json` cron entry (proposed):**
```json
{
  "crons": [
    {
      "path": "/api/ops/cron/health-digest",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

> **Note:** Vercel free tier cron availability — verify against active plan. If restricted, consider GitHub Actions `workflow_dispatch` with `schedule` trigger as fallback.

**Message format (example):**
```
🟢 Yomirra Source Health
2026-09-19 09:00 UTC

Shinigami     ✅ HEALTHY     280ms
Komiku II     ✅ HEALTHY     420ms
Asura Scans   ✅ HEALTHY     310ms
KomikNesia    ❌ DEGRADED   decrypt probe failed (3x)
Komiku        ✅ HEALTHY     390ms
Komikindo     ⚠️ SLOW        1840ms
MangaDex      ✅ HEALTHY     210ms

Redis         ✅ OK          45ms
```

**Implementation note:** The digest reads from Redis health cache to minimize source load. Does NOT re-probe all sources on each cron trigger (avoids upstream IP ban risk on 6-hour cycle). Instead it uses the most recent cached probe results.

---

### T4 — Critical / Recovery Alerts

**Status:** DONE

**Objective:** Immediate Telegram notification for critical state transitions.

**Alert message formats:**

**CRITICAL (source down):**
```
🚨 CRITICAL — Source Alert

Source:  komiknesia
Event:   SOURCE_DOWN
Stage:   decrypt_failure
Fails:   3 consecutive
Since:   2026-09-19T09:00:00Z
```

**RECOVERY:**
```
✅ RECOVERY — Source Restored

Source:   komiknesia
Event:    SOURCE_RECOVERED
Downtime: ~12m
Resolved: 2026-09-19T09:12:00Z
```

**Dedup behavior:** After CRITICAL sent, suppress same fingerprint for 30 minutes unless status changes.

---

### T5 — Read-Only Bot Commands

**Status:** DONE

**Objective:** Implement Telegram webhook to handle informational commands.

**Webhook route:** `POST /api/ops/telegram/webhook`

**Authorization:**
- Validate `X-Telegram-Bot-Api-Secret-Token` header matches `TELEGRAM_WEBHOOK_SECRET`
- Validate `chat.id` in `TELEGRAM_ALLOWED_CHAT_IDS`
- Rate limit: max 10 commands per 60 seconds per chat ID (Redis counter with TTL)

**Planned V1 commands:**

| Command | Response |
|---------|----------|
| `/status` | Overall health summary (Redis cached) |
| `/sources` | List all sources with status |
| `/source <id>` | Detail for one source: status, latency, last error |
| `/errors` | Last 10 errors across all sources (from Redis) |
| `/version` | App version, source engine version, adapter counts |
| `/recheck <id>` | Trigger a fresh health probe for one source |

**`/recheck` implementation note:** Triggers `getPopular(1)` on that adapter. Not a bypass of dedup — it updates the probe state and can trigger a new alert cycle if needed. Rate-limited separately (max 2 rechecks per 60s).

**Input validation:**
- Source ID must match `^[a-z0-9-]+$`
- Max command length: 64 chars
- No URL parameters accepted in commands

---

### T6 — Deploy / Security / Backend Events

**Status:** DONE

**Objective:** Surface deployment and security events through existing hooks.

**Deploy smoke test (optional):**
- Trigger from Vercel Deploy Hook → `POST /api/ops/notify/deploy`
- Sends commit hash, environment, basic source contract version check
- Requires `VERCEL_DEPLOY_SECRET` for auth

**Security alert integration:**
- When `outbound-policy.ts` rejects a request (`SECURITY_REJECTED`) → increment Redis counter
- If spike (>10 rejections in 5 min) → CRITICAL alert

**Backend operational events:**
- Redis connection failure → CRITICAL (already logged, add alert hook)
- Function timeout (via structured error catch in API routes) → WARNING after 3 in 5 min

**Sensitive data safety:**
- Never log full request URLs in Telegram
- Never include authorization headers or raw response bodies
- Sanitize all error messages before sending

---

### T7 — Daily Digest

**Status:** DONE

**Objective:** Daily aggregate operational summary.

**Proposed cron schedule:** `0 8 * * *` (08:00 UTC daily)

**Message fields:**
```
📊 Yomirra Daily Digest
2026-09-19

Sources healthy:     6 / 7
Total source errors: 14  (3 user-impacting)
Recovered errors:    11
Slowest source:      komikindo (avg 1840ms)
Security rejects:    2
Cron health:         6 runs, 0 missed
Domain changes:      0
Deployments:         1
```

**Privacy guarantee:** No manga titles, reading history, search queries, or user identity in digest.

---

## Proposed File Structure

```
src/
  server/
    lib/
      ops/
        telegram-notifier.ts     — core sendMessage + dedup
        alert-state.ts           — Redis state: fingerprint, consecutiveFailures
        severity.ts              — Severity levels and routing rules
        health-digest.ts         — 6-hour digest message formatter
        daily-digest.ts          — daily aggregate formatter
  app/
    api/
      ops/
        cron/
          health-check/
            route.ts             — cron trigger for health probe → alerts
          health-digest/
            route.ts             — cron trigger for 6-hour digest
          daily-digest/
            route.ts             — cron trigger for daily digest (T7)
        telegram/
          webhook/
            route.ts             — inbound bot commands (T5)
        notify/
          deploy/
            route.ts             — deployment notification (T6)
```

---

## New Environment Variables

```bash
# Required for T1+
TELEGRAM_ALLOWED_CHAT_IDS="123456789,987654321"
CRON_SECRET="<strong-random-secret>"

# Required for T5 (webhook)
TELEGRAM_WEBHOOK_SECRET="<strong-random-secret>"

# Optional for T6
VERCEL_DEPLOY_SECRET="<strong-random-secret>"
```

---

## Blockers / Open Questions

| # | Item | Status |
|---|------|--------|
| 1 | Verify Vercel free-tier cron interval limits | UNKNOWN — must check before T3 |
| 2 | Decide on single `TELEGRAM_CHAT_ID` vs multi-chat routing | OPEN — likely single chat for V1 |
| 3 | `/recheck` command: should it bypass Redis health cache TTL? | OPEN — yes, it should force fresh probe |
| 4 | Alert dedup cooldown duration — 30 min proposed, may need tuning | PROPOSED |
| 5 | Deploy smoke test: manual webhook trigger or automatic Vercel Deploy Hook? | OPEN |
