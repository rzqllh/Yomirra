import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { mdFetch, parseRetryAfter } from "../index";

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
  });
});
