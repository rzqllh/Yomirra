import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  formatHealthDigest,
  formatCriticalAlert,
  formatRecoveryAlert,
  sendTelegramMessage,
} from "../telegram-notifier";
import { AlertSeverity } from "../severity";
import { getAlertState, saveAlertState, clearAlertState } from "../alert-state";
import type { SourceHealthSnapshot } from "@/server/lib/sources/health/types";

// In-memory mock for redis
const memoryStore = new Map<string, string>();
vi.mock("@/server/lib/cache/redis", () => ({
  redis: {
    get: vi.fn(async (key: string) => memoryStore.get(key) || null),
    set: vi.fn(async (key: string, val: string) => {
      memoryStore.set(key, val);
      return "OK";
    }),
    del: vi.fn(async (key: string) => {
      memoryStore.delete(key);
      return 1;
    }),
    incr: vi.fn(async (key: string) => {
      const cur = parseInt(memoryStore.get(key) || "0", 10) + 1;
      memoryStore.set(key, cur.toString());
      return cur;
    }),
    expire: vi.fn(async () => 1),
    ping: vi.fn(async () => "PONG"),
  },
}));

vi.mock("@/shared/logger", () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock("@/server/lib/sources/health/probe", () => ({
  probeSourceHealth: vi.fn(async (sourceId: string) => ({
    sourceId,
    status: "HEALTHY",
    latencyMs: 150,
    resolvedHost: "test.domain",
    lastCheckedAt: new Date().toISOString(),
    lastSuccessAt: new Date().toISOString(),
    lastFailureAt: null,
    consecutiveFailures: 0,
  })),
  probeAllSourcesHealth: vi.fn(async () => ({})),
}));

// Mock env
vi.mock("@/env", () => ({
  env: {
    TELEGRAM_BOT_TOKEN: "mock-bot-token",
    TELEGRAM_CHAT_ID: "123456",
    TELEGRAM_ALLOWED_CHAT_IDS: "123456,654321",
    TELEGRAM_WEBHOOK_SECRET: "mock-webhook-secret",
    OPS_CRON_SECRET: "mock-cron-secret",
    NODE_ENV: "test",
    NEXT_PUBLIC_APP_URL: "https://yomirra.vercel.app",
  },
}));

import { POST as handleWebhook } from "@/app/api/ops/telegram/webhook/route";
import { POST as handleHealthDigestCron } from "@/app/api/ops/cron/health-digest/route";
import { POST as handleDailyDigestCron } from "@/app/api/ops/cron/daily-digest/route";

describe("Phase 4 — Telegram Ops Runtime V1 Unit Tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    memoryStore.clear();
  });

  describe("Message Formatters & Privacy Boundary", () => {
    it("formatHealthDigest produces compact format with latency and status", () => {
      const snapshots: Record<string, SourceHealthSnapshot> = {
        shinigami: {
          sourceId: "shinigami",
          status: "HEALTHY",
          latencyMs: 402,
          resolvedHost: "shngm.io",
          lastCheckedAt: "2026-09-19T10:00:00Z",
          lastSuccessAt: "2026-09-19T10:00:00Z",
          lastFailureAt: null,
          consecutiveFailures: 0,
        },
        komikindo: {
          sourceId: "komikindo",
          status: "BROKEN",
          latencyMs: 911,
          resolvedHost: "komikindo.ch",
          lastCheckedAt: "2026-09-19T10:00:00Z",
          lastSuccessAt: "2026-09-19T09:00:00Z",
          lastFailureAt: "2026-09-19T10:00:00Z",
          consecutiveFailures: 3,
          lastFailureCode: "ROUTE_CHANGED",
        },
      };

      const text = formatHealthDigest(snapshots, new Date("2026-09-19T05:17:00Z"));

      expect(text).toContain("Yomirra Health — 12:17 WIB");
      expect(text).toContain("shinigami");
      expect(text).toContain("✅ HEALTHY   402ms");
      expect(text).toContain("komikindo");
      expect(text).toContain("❌ BROKEN    `ROUTE_CHANGED` (911ms)");

      // Privacy check: no user queries or user emails
      expect(text).not.toContain("query");
      expect(text).not.toContain("user");
      expect(text).not.toContain("email");
    });

    it("formatCriticalAlert produces structured diagnostic output without user data", () => {
      const snap: SourceHealthSnapshot = {
        sourceId: "komikindo",
        status: "BROKEN",
        stage: "search",
        latencyMs: 911,
        resolvedHost: "komikindo.ch",
        lastCheckedAt: "2026-09-19T10:00:00Z",
        lastSuccessAt: "2026-09-19T09:00:00Z",
        lastFailureAt: "2026-09-19T10:00:00Z",
        consecutiveFailures: 3,
        lastFailureCode: "ROUTE_CHANGED",
        errorMessage: "Search route returned 404",
      };

      const text = formatCriticalAlert(snap);

      expect(text).toContain("Yomirra Source Alert");
      expect(text).toContain("`komikindo`");
      expect(text).toContain("`BROKEN`");
      expect(text).toContain("`ROUTE_CHANGED`");
      expect(text).toContain("Failures:*    3");
      expect(text).toContain("`komikindo.ch`");
    });

    it("formatRecoveryAlert formats clean recovery notice", () => {
      const snap: SourceHealthSnapshot = {
        sourceId: "komikindo",
        status: "HEALTHY",
        latencyMs: 340,
        resolvedHost: "komikindo.ch",
        lastCheckedAt: "2026-09-19T10:15:00Z",
        lastSuccessAt: "2026-09-19T10:15:00Z",
        lastFailureAt: "2026-09-19T10:00:00Z",
        consecutiveFailures: 0,
      };

      const text = formatRecoveryAlert(snap, "15m");

      expect(text).toContain("komikindo recovered");
      expect(text).toContain("DEGRADED/BROKEN → HEALTHY");
      expect(text).toContain("15m");
      expect(text).toContain("340ms");
    });
  });

  describe("Outbound Sender & Deduplication Thresholds", () => {
    it("sendTelegramMessage calls Telegram API with Markdown parse_mode", async () => {
      const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), { status: 200 })
      );

      const result = await sendTelegramMessage("Test Message", {
        severity: AlertSeverity.INFO,
      });

      expect(result).toBe(true);
      expect(fetchSpy).toHaveBeenCalledWith(
        "https://api.telegram.org/botmock-bot-token/sendMessage",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: expect.stringContaining("Test Message"),
        })
      );
    });

    it("missing Telegram config returns false safely without throwing (no-op)", async () => {
      const { env } = await import("@/env");
      const origToken = env.TELEGRAM_BOT_TOKEN;
      (env as any).TELEGRAM_BOT_TOKEN = undefined;

      const result = await sendTelegramMessage("Unconfigured test", {
        severity: AlertSeverity.WARNING,
      });

      expect(result).toBe(false);
      (env as any).TELEGRAM_BOT_TOKEN = origToken;
    });

    it("consecutive failure threshold: 1st and 2nd transient failures are suppressed, 3rd alerts", async () => {
      const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue(
        new Response(JSON.stringify({ ok: true }), { status: 200 })
      );

      const fingerprint = "test:source:transient-down";

      // 1st failure -> suppressed
      const res1 = await sendTelegramMessage("Timeout 1", {
        severity: AlertSeverity.WARNING,
        fingerprint,
        event: "UPSTREAM_TIMEOUT",
      });
      expect(res1).toBe(false);
      expect(fetchSpy).not.toHaveBeenCalled();

      // 2nd failure -> suppressed
      const res2 = await sendTelegramMessage("Timeout 2", {
        severity: AlertSeverity.WARNING,
        fingerprint,
        event: "UPSTREAM_TIMEOUT",
      });
      expect(res2).toBe(false);
      expect(fetchSpy).not.toHaveBeenCalled();

      // 3rd failure -> alerts
      const res3 = await sendTelegramMessage("Timeout 3", {
        severity: AlertSeverity.WARNING,
        fingerprint,
        event: "UPSTREAM_TIMEOUT",
      });
      expect(res3).toBe(true);
      expect(fetchSpy).toHaveBeenCalledTimes(1);

      // 4th failure within cooldown -> suppressed
      const res4 = await sendTelegramMessage("Timeout 4", {
        severity: AlertSeverity.WARNING,
        fingerprint,
        event: "UPSTREAM_TIMEOUT",
      });
      expect(res4).toBe(false);
      expect(fetchSpy).toHaveBeenCalledTimes(1); // No new call
    });

    it("fast-path escalation: deterministic errors (ROUTE_CHANGED, PARSER_BROKEN) alert on 1st occurrence", async () => {
      const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue(
        new Response(JSON.stringify({ ok: true }), { status: 200 })
      );

      const fingerprint = "test:source:route-changed";

      const res = await sendTelegramMessage("Route changed detected", {
        severity: AlertSeverity.CRITICAL,
        fingerprint,
        event: "ROUTE_CHANGED",
      });

      // Escalated immediately without waiting for 3 failures
      expect(res).toBe(true);
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it("recovery alert emits once if source previously alerted, and does not emit if never alerted", async () => {
      const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue(
        new Response(JSON.stringify({ ok: true }), { status: 200 })
      );

      const unalertedFingerprint = "test:source:never-alerted";

      // Recovery on a source that never alerted -> suppressed
      const rec1 = await sendTelegramMessage("Recovered", {
        severity: AlertSeverity.RECOVERY,
        fingerprint: unalertedFingerprint,
      });
      expect(rec1).toBe(false);
      expect(fetchSpy).not.toHaveBeenCalled();

      // Now simulate a source that alerted
      const alertedFingerprint = "test:source:alerted";
      await sendTelegramMessage("Parser broken", {
        severity: AlertSeverity.CRITICAL,
        fingerprint: alertedFingerprint,
        event: "PARSER_BROKEN",
      });
      expect(fetchSpy).toHaveBeenCalledTimes(1);

      // Recovery 1st time -> emits
      const rec2 = await sendTelegramMessage("Recovered", {
        severity: AlertSeverity.RECOVERY,
        fingerprint: alertedFingerprint,
      });
      expect(rec2).toBe(true);
      expect(fetchSpy).toHaveBeenCalledTimes(2);

      // Recovery 2nd time -> suppressed (emits once only)
      const rec3 = await sendTelegramMessage("Recovered again", {
        severity: AlertSeverity.RECOVERY,
        fingerprint: alertedFingerprint,
      });
      expect(rec3).toBe(false);
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });

    it("falls back to plain-text message if Telegram returns 400 with entity parse error", async () => {
      const fetchSpy = vi.spyOn(global, "fetch")
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({ ok: false, error_code: 400, description: "Bad Request: can't parse entities" }),
            { status: 400 }
          )
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ ok: true }), { status: 200 })
        );

      const result = await sendTelegramMessage("Unescaped text _with_ issues", {
        severity: AlertSeverity.INFO,
      });

      expect(result).toBe(true);
      expect(fetchSpy).toHaveBeenCalledTimes(2);
      // Second call does NOT have parse_mode: "Markdown"
      expect(fetchSpy).toHaveBeenLastCalledWith(
        expect.stringContaining("sendMessage"),
        expect.objectContaining({
          body: expect.not.stringContaining('"parse_mode":"Markdown"'),
        })
      );
    });
  });

  describe("Telegram Webhook Route (/api/ops/telegram/webhook)", () => {
    it("rejects unauthorized webhook secret with 401", async () => {
      const req = new Request("http://localhost/api/ops/telegram/webhook", {
        method: "POST",
        headers: {
          "x-telegram-bot-api-secret-token": "wrong-secret",
        },
        body: JSON.stringify({ message: { chat: { id: 123456 }, text: "/status" } }),
      });

      const res = await handleWebhook(req);
      expect(res.status).toBe(401);
    });

    it("rejects unauthorized chat ID silently (returns 200 so Telegram does not retry)", async () => {
      const req = new Request("http://localhost/api/ops/telegram/webhook", {
        method: "POST",
        headers: {
          "x-telegram-bot-api-secret-token": "mock-webhook-secret",
        },
        body: JSON.stringify({ message: { chat: { id: 999999 }, text: "/status" } }),
      });

      const res = await handleWebhook(req);
      expect(res.status).toBe(200);
    });

    it("routes /version command and responds with version info", async () => {
      const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue(
        new Response(JSON.stringify({ ok: true }), { status: 200 })
      );

      const req = new Request("http://localhost/api/ops/telegram/webhook", {
        method: "POST",
        headers: {
          "x-telegram-bot-api-secret-token": "mock-webhook-secret",
        },
        body: JSON.stringify({ message: { chat: { id: 123456 }, text: "/version" } }),
      });

      const res = await handleWebhook(req);
      expect(res.status).toBe(200);
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining("sendMessage"),
        expect.objectContaining({
          body: expect.stringContaining("Yomirra Ops Runtime"),
        })
      );
    });

    it("routes /source <unknown> and reports not found", async () => {
      const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue(
        new Response(JSON.stringify({ ok: true }), { status: 200 })
      );

      const req = new Request("http://localhost/api/ops/telegram/webhook", {
        method: "POST",
        headers: {
          "x-telegram-bot-api-secret-token": "mock-webhook-secret",
        },
        body: JSON.stringify({ message: { chat: { id: 123456 }, text: "/source non_existent_source" } }),
      });

      const res = await handleWebhook(req);
      expect(res.status).toBe(200);
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining("sendMessage"),
        expect.objectContaining({
          body: expect.stringContaining("not found in registry"),
        })
      );
    });
  });

  describe("Scheduled Ops Endpoints Authentication", () => {
    it("rejects health-digest cron call without valid Bearer secret", async () => {
      const req = new Request("http://localhost/api/ops/cron/health-digest", {
        method: "POST",
        headers: {
          authorization: "Bearer wrong-secret",
        },
      });

      const res = await handleHealthDigestCron(req);
      expect(res.status).toBe(401);
    });

    it("rejects daily-digest cron call without valid Bearer secret", async () => {
      const req = new Request("http://localhost/api/ops/cron/daily-digest", {
        method: "POST",
        headers: {
          authorization: "Bearer wrong-secret",
        },
      });

      const res = await handleDailyDigestCron(req);
      expect(res.status).toBe(401);
    });
  });
});
