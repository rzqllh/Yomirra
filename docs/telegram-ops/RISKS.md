# Telegram Ops — Risk Register

---

## R-T01: Alert Spam / Notification Flood

**Risk:** A cascading failure (multiple sources down simultaneously, or a flapping source) causes hundreds of Telegram messages in minutes.

**Probability:** Medium — source instability is expected for Indonesian manga sites.

**Impact:** High — Telegram rate-limits bots (30 messages/second globally, 1 message/second per chat). Bot gets temporarily blocked; critical alerts may be silently dropped.

**Mitigation:**
- Alert dedup with fingerprint + `consecutiveFailures` gate (see TD-005)
- Cooldown period after sending: suppress same fingerprint for 30 minutes
- Batch multiple source failures into a single digest message if they occur within the same cron window
- Recovery alert sent once only

**Residual risk:** If dedup Redis key expires mid-incident, a second alert may fire for the same event.

---

## R-T02: Telegram API Outage

**Risk:** Telegram Bot API is unavailable when Yomirra tries to send an alert.

**Probability:** Low — Telegram is generally highly available.

**Impact:** Medium — critical alerts are silently dropped during the outage window.

**Mitigation:**
- Log all failed Telegram sends to server-side logs (Vercel function logs)
- Include alert data in structured log even on failure
- Next cron cycle will re-attempt if alert state still matches CRITICAL threshold

**Residual risk:** If outage lasts longer than the dedup cooldown, a second notification may fire on recovery.

---

## R-T03: Bot Token Leak

**Risk:** `TELEGRAM_BOT_TOKEN` is exposed in client-side code, logs, error messages, or version control.

**Probability:** Low — if engineering discipline is followed.

**Impact:** Critical — an attacker can impersonate the bot, send messages to any chat, and read any bot-accessible message history.

**Mitigation:**
- Token must only exist in server-side env vars (never `NEXT_PUBLIC_*`)
- Never log the token, even partially
- Token must not appear in any error response body
- Rotate token immediately if leak suspected
- Separate token for development/staging vs production

**Evidence:** Existing `observability/alert/route.ts` uses `process.env.TELEGRAM_BOT_TOKEN` server-side. Pattern is correct. `VERIFIED_FROM_REPO`.

---

## R-T04: Unauthorized Command Access

**Risk:** An attacker sends commands to the Telegram bot from an unauthorized chat or user ID.

**Probability:** Medium — Telegram bots are publicly discoverable by username.

**Impact:** Medium — attacker can query source health data (not user data). With V1 read-only constraints, direct damage is limited but information leakage is a concern.

**Mitigation:**
- Validate `X-Telegram-Bot-Api-Secret-Token` on all webhook requests
- Validate `chat.id` against `TELEGRAM_ALLOWED_CHAT_IDS` allowlist
- Return 403 without revealing any information on unauthorized access
- Rate limit commands: max 10 per 60 seconds per chat ID

---

## R-T05: Vercel Cron Duplication / Missed Triggers

**Risk:** Vercel Cron triggers the health digest endpoint more than once simultaneously (cold start overlap), or misses a scheduled trigger entirely.

**Probability:** Low-Medium — Vercel Cron is generally reliable but has documented edge cases with cold starts.

**Impact:** Low — duplicate digest sends are noisy but not harmful. Missed triggers mean a gap in the 6-hour report.

**Mitigation:**
- Protect cron route with `CRON_SECRET` header check
- Use Redis-based idempotency key: `yomirra:ops:cron:health-digest:{hour}` — expire after 5 hours
- If duplicate trigger arrives within 5-hour window, skip execution and return 200

**Note:** Vercel free-tier cron minimum interval must be verified. If 6-hour interval is unavailable, fall back to daily or use GitHub Actions scheduled workflow.

---

## R-T06: Monitoring Itself Failing Silently

**Risk:** The cron route fails repeatedly (throws, times out, or returns 5xx) without anyone noticing, creating a false sense of operational visibility.

**Probability:** Medium — serverless cold starts and upstream latency spikes can cause health probe timeouts.

**Impact:** High — source failures go unreported, defeating the purpose of the system.

**Mitigation:**
- Log all cron execution attempts and outcomes to Vercel function logs
- Consider a "watchdog" pattern: if the daily digest is missed for 2+ consecutive days, send a fallback alert (requires external trigger, e.g. UptimeRobot free tier pinging the digest endpoint)
- Keep cron probe lightweight — read from Redis health cache rather than re-probing all sources

---

## R-T07: Sensitive Data Leakage

**Risk:** Error messages, stack traces, or upstream API responses containing sensitive content are forwarded to Telegram.

**Probability:** Low — if sanitization is implemented.

**Impact:** High — could expose API keys, user tokens, internal infrastructure details, or raw database errors.

**Mitigation:**
- Sanitize all error messages before Telegram send: strip URLs with credentials, trim raw error bodies
- Never forward raw upstream response bodies
- Never include authorization headers in any message
- Use allowlisted error codes (`SOURCE_DOWN`, `DECRYPT_FAILURE`, etc.) rather than raw exception messages
- Test all message formatters against injection scenarios

---

## R-T08: False Positive Source Alarms

**Risk:** A transient network blip or Vercel cold start causes a source to appear "down" for one probe cycle, triggering a CRITICAL alert incorrectly.

**Probability:** High — Indonesian CDN and source instability is known.

**Impact:** Medium — alert fatigue; legitimate alerts start being ignored.

**Mitigation:**
- Only send CRITICAL after 3 consecutive failures (TD-005)
- Single failure → WARNING only in daily digest, no immediate Telegram
- SLOW threshold requires 3 consecutive checks above threshold

---

## R-T09: Vercel Invocation Limits

**Risk:** Health probes on cron schedule exhaust Vercel free-tier function invocation limits.

**Probability:** Low-Medium — depends on probe frequency and source count (currently 7 sources).

**Impact:** Medium — function invocations blocked for remainder of billing period; alerts stop.

**Mitigation:**
- Digest cron reads from Redis health cache, not re-probing sources directly
- Avoid high-frequency cron intervals (6 hours is conservative)
- Monitor invocation count via Vercel dashboard

---

## R-T10: Source Engine / Telegram Ops Coupling

**Risk:** Telegram Ops implementation modifies Source Engine internals to expose health state, creating tight coupling and regression risk.

**Probability:** Medium — without architectural discipline.

**Impact:** High — regression in source adapters due to monitoring code.

**Mitigation:**
- Telegram Ops reads from existing API endpoints only (`/api/health`, `/api/sources/health`)
- Never import Source Engine adapter internals directly into Ops modules
- Source Engine health state stored in Redis — Ops reads from Redis, not from adapter instances
