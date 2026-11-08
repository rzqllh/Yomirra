import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const redisGet = vi.hoisted(() => vi.fn());
vi.mock("@/server/lib/cache/redis", () => ({
  isRedisConfigured: true,
  isRedisCommandAllowed: () => false,
  redis: { get: redisGet },
}));

import { POST } from "./route";

describe("rating batch during Redis outage", () => {
  afterEach(() => vi.restoreAllMocks());

  it("serves available scores and omits failed lookups without Redis", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (url, options) => {
      if (String(url).includes("mangadex.org")) return new Response(null, { status: 503 });
      const title = JSON.parse(String(options?.body)).variables.search;
      return title === "Available Manga"
        ? Response.json({ data: { Media: { averageScore: 84, title: { english: title } } } })
        : new Response(null, { status: 503 });
    });
    const response = await POST(new NextRequest("http://localhost/api/metadata/rating-batch", {
      method: "POST",
      body: JSON.stringify({ titles: ["Available Manga", "Unavailable Manga"] }),
    }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: { "Available Manga": 8.4 } });
    expect(redisGet).not.toHaveBeenCalled();
  });

  it("shares one deadline across successive batches", async () => {
    const signals = new Set<AbortSignal>();
    vi.spyOn(globalThis, "fetch").mockImplementation(async (_url, options) => {
      if (options?.signal) signals.add(options.signal);
      return new Response(null, { status: 503 });
    });

    const response = await POST(new NextRequest("http://localhost/api/metadata/rating-batch", {
      method: "POST",
      body: JSON.stringify({ titles: Array.from({ length: 5 }, (_, i) => `Budget title ${i}`) }),
    }));

    expect(response.status).toBe(200);
    expect(signals.size).toBe(1);
    expect(fetch).toHaveBeenCalledTimes(10);
  });

  it("rejects an oversized Content-Length before contacting upstream services", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const response = await POST(new NextRequest("http://localhost/api/metadata/rating-batch", {
      method: "POST",
      headers: { "content-length": String(16 * 1024 + 1) },
      body: JSON.stringify({ titles: ["Valid title"] }),
    }));

    expect(response.status).toBe(413);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("honors MangaDex backoff across distinct titles and serves AniList results", async () => {
    const mangaDex = vi.fn(async () => new Response(null, { status: 429, headers: { "retry-after": "120" } }));
    vi.spyOn(globalThis, "fetch").mockImplementation(async (url, options) => {
      if (String(url).includes("mangadex.org")) return mangaDex();
      const title = JSON.parse(String(options?.body)).variables.search;
      return Response.json({ data: { Media: { averageScore: 84, title: { english: title } } } });
    });

    for (const title of ["Backoff first title", "Backoff second title"]) {
      const response = await POST(new NextRequest("http://localhost/api/metadata/rating-batch", {
        method: "POST",
        body: JSON.stringify({ titles: [title] }),
      }));
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ data: { [title]: 8.4 } });
    }
    expect(mangaDex).toHaveBeenCalledOnce();
  });

  it("rejects oversized batches before contacting upstream services", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const request = new NextRequest("http://localhost/api/metadata/rating-batch", {
      method: "POST",
      body: JSON.stringify({ titles: Array.from({ length: 21 }, (_, i) => `Title ${i}`) }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});
