import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { createMdFetch, mdFetch, parseRetryAfter } from "../index";
import { createMangaDexTransport } from "../transport";

describe("MangaDex Retry Hardening & Retry-After Parser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("parseRetryAfter", () => {
    it("should parse integer seconds correctly", () => {
      expect(parseRetryAfter("2")).toBe(2000);
      expect(parseRetryAfter("5")).toBe(5000);
    });

    it("should cap large Retry-After values to 5000ms", () => {
      expect(parseRetryAfter("60")).toBe(5000);
      expect(parseRetryAfter("100")).toBe(5000);
    });

    it("should use fallback 1000ms for missing or invalid values", () => {
      expect(parseRetryAfter(null)).toBe(1000);
      expect(parseRetryAfter("")).toBe(1000);
      expect(parseRetryAfter("invalid-string")).toBe(1000);
    });

    it("should parse HTTP-date in the future and calculate relative delay", () => {
      vi.useFakeTimers();
      const now = 1700000000000;
      vi.setSystemTime(now);
      const futureDate = new Date(now + 3000).toUTCString();
      const delay = parseRetryAfter(futureDate);
      expect(delay).toBe(3000);
      vi.useRealTimers();
    });

    it("should cap future HTTP-date beyond max cap to 5000ms", () => {
      vi.useFakeTimers();
      const now = 1700000000000;
      vi.setSystemTime(now);
      const futureDate = new Date(now + 60000).toUTCString();
      expect(parseRetryAfter(futureDate)).toBe(5000);
      vi.useRealTimers();
    });

    it("should return 0ms for expired or past HTTP-date", () => {
      vi.useFakeTimers();
      const now = 1700000000000;
      vi.setSystemTime(now);
      const pastDate = new Date(now - 5000).toUTCString();
      expect(parseRetryAfter(pastDate)).toBe(0);
      vi.useRealTimers();
    });
  });

  describe("mdFetch 429 Retry Behavior", () => {
    it("reserves 6500ms of the total deadline for secure fallback", async () => {
      vi.useFakeTimers();
      const caller = new AbortController();
      let requestSignal: AbortSignal | undefined;

      vi.spyOn(AbortSignal, "timeout").mockImplementation((delay) => {
        const timeout = new AbortController();
        setTimeout(() => timeout.abort(new DOMException("Timed out", "TimeoutError")), delay);
        return timeout.signal;
      });

      vi.spyOn(globalThis, "fetch").mockImplementation(async (_url, init) => {
        requestSignal ??= init?.signal ?? undefined;
        return new Promise<Response>((_resolve, reject) => {
          requestSignal?.addEventListener(
            "abort",
            () => reject(requestSignal?.reason ?? new DOMException("Aborted", "AbortError")),
            { once: true }
          );
        });
      });

      const request = mdFetch("/manga", undefined, { signal: caller.signal });
      const settled = request.catch(() => undefined);
      await vi.advanceTimersByTimeAsync(0);
      await vi.advanceTimersByTimeAsync(8500);

      expect(requestSignal?.aborted).toBe(true);

      caller.abort();
      await settled;
      vi.useRealTimers();
    });

    it("requires two-provider DoH consensus after ENOTFOUND", async () => {
      const calls: string[] = [];
      vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
        const url = String(input);
        calls.push(url);

        if (url.startsWith("https://api.mangadex.org")) {
          const error = new TypeError("fetch failed", {
            cause: Object.assign(new Error("lookup failed"), { code: "ENOTFOUND" }),
          });
          throw error;
        }

        const address = url.startsWith("https://cloudflare-dns.com")
          ? "104.17.161.14"
          : "104.17.160.14";
        return Response.json({
          Status: 0,
          TC: false,
          AD: true,
          Question: [{ name: "api.mangadex.org.", type: 1 }],
          Answer: [{ name: "api.mangadex.org.", type: 1, TTL: 60, data: address }],
        });
      });

      await expect(mdFetch("/manga")).rejects.toThrow();

      expect(calls.filter((url) => url.includes("dns-query") || url.includes("dns.google"))).toHaveLength(2);
    });

    it("Scenario 1: HTTP 200 should make exactly one fetch with no retry delay", async () => {
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async () =>
        new Response(JSON.stringify({ result: "ok" }), { status: 200 })
      );

      const result = await mdFetch<{ result: string }>("/manga");
      expect(result).toEqual({ result: "ok" });
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it("Scenario 2: First 429 with Retry-After seconds, second 200 should retry once and succeed", async () => {
      const headers = new Headers({ "retry-after": "1" });
      let callCount = 0;
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          return new Response("Too Many Requests", { status: 429, headers });
        }
        return new Response(JSON.stringify({ result: "ok" }), { status: 200 });
      });

      const result = await mdFetch<{ result: string }>("/manga");
      expect(result).toEqual({ result: "ok" });
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });

    it("Scenario 3: First 429 without Retry-After header should use fallback delay and retry once", async () => {
      let callCount = 0;
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          return new Response("Rate limited", { status: 429 });
        }
        return new Response(JSON.stringify({ result: "ok" }), { status: 200 });
      });

      const result = await mdFetch<{ result: string }>("/manga");
      expect(result).toEqual({ result: "ok" });
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });

    it("Scenario 4: First 429 with excessively large Retry-After should cap sleep to 5000ms and succeed", async () => {
      const headers = new Headers({ "retry-after": "120" });
      let callCount = 0;
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          return new Response("Rate limited", { status: 429, headers });
        }
        return new Response(JSON.stringify({ result: "ok" }), { status: 200 });
      });

      const result = await mdFetch<{ result: string }>("/manga");
      expect(result).toEqual({ result: "ok" });
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    }, 15000);

    it("Scenario 5: Second request still 429 should stop after 2 attempts and throw", async () => {
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async () => {
        return new Response("Rate limited", { status: 429, statusText: "Too Many Requests" });
      });

      await expect(mdFetch("/manga")).rejects.toThrow("MangaDex API error 429: Too Many Requests");
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });

    it("Scenario 6: HTTP 403 should not retry and throw immediately", async () => {
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async () => {
        return new Response("Forbidden", { status: 403, statusText: "Forbidden" });
      });

      await expect(mdFetch("/manga")).rejects.toThrow("MangaDex API error 403: Forbidden");
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it("Scenario 7: Network / TLS / Abort failure should not retry", async () => {
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async () => {
        throw new Error("fetch failed");
      });

      await expect(mdFetch("/manga")).rejects.toThrow("fetch failed");
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it("Scenario 8: Caller signal propagation in mdFetch", async () => {
      const controller = new AbortController();
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async (_url, init) => {
        const signal = init?.signal as AbortSignal;
        expect(signal).toBeDefined();
        return new Response(JSON.stringify({ result: "ok" }), { status: 200 });
      });

      const result = await mdFetch<{ result: string }>("/manga", undefined, { signal: controller.signal });
      expect(result).toEqual({ result: "ok" });
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it("Scenario 9: Pre-aborted caller signal throws immediately", async () => {
      const controller = new AbortController();
      controller.abort();

      const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async (_url, init) => {
        const signal = init?.signal as AbortSignal;
        if (signal?.aborted) {
          throw new DOMException("The operation was aborted.", "AbortError");
        }
        return new Response(JSON.stringify({ result: "ok" }), { status: 200 });
      });

      await expect(mdFetch("/manga", undefined, { signal: controller.signal })).rejects.toThrow();
    });

    it("Scenario 10: Abort during 429 retry prevents second fetch attempt", async () => {
      const controller = new AbortController();

      const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async () => {
        // Abort controller when 429 is received
        controller.abort();
        return new Response("Too Many Requests", {
          status: 429,
          statusText: "Too Many Requests",
          headers: { "retry-after": "1" },
        });
      });

      await expect(mdFetch("/manga", undefined, { signal: controller.signal })).rejects.toThrow();
      // Should stop after 1st attempt because controller was aborted
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it("reuses the validated pinned route for the single 429 retry", async () => {
      let dohCalls = 0;
      let pinnedCalls = 0;
      const transport = createMangaDexTransport({
        normalFetch: async () => {
          throw new TypeError("fetch failed", {
            cause: Object.assign(new Error("lookup failed"), { code: "ENOTFOUND" }),
          });
        },
        dohFetch: async () => {
          dohCalls += 1;
          return Response.json({
            Status: 0,
            TC: false,
            AD: true,
            Question: [{ name: "api.mangadex.org.", type: 1 }],
            Answer: [{
              name: "api.mangadex.org.",
              type: 1,
              TTL: 60,
              data: "104.17.161.14",
            }],
          });
        },
        pinnedRequest: async () => {
          pinnedCalls += 1;
          return pinnedCalls === 1
            ? new Response("rate limited", { status: 429, headers: { "retry-after": "0" } })
            : Response.json({ result: "ok" });
        },
        now: () => 0,
      });
      const fetchMangaDex = createMdFetch({ transport, acquire: async () => undefined });

      await expect(fetchMangaDex<{ result: string }>("/manga")).resolves.toEqual({ result: "ok" });
      expect(dohCalls).toBe(2);
      expect(pinnedCalls).toBe(2);
    });
  });
});
