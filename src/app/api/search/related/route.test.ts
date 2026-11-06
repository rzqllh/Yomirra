import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const getRecent = vi.hoisted(() => vi.fn().mockResolvedValue([]));
vi.mock("@/server/lib/cache/redis", () => ({ isRedisConfigured: false }));
vi.mock("@/server/lib/search/semantic-catalog", () => ({
  getRecentSearchCatalogRecords: getRecent,
}));
vi.mock("@/server/lib/sources/content-access", () => ({
  getRequestReadOptions: () => ({ hideNsfw: true }),
}));
vi.mock("@/server/lib/sources/runtime-sources", () => ({ getRuntimeSources: vi.fn() }));
vi.mock("@/server/lib/site/site-config-service", () => ({ getSiteConfig: vi.fn() }));
vi.mock("@/server/lib/search/gemini-embeddings", () => ({ embedSearchText: vi.fn() }));

import { POST } from "./route";

describe("related titles during Redis outage", () => {
  it("rejects an oversized body without relying on Content-Length", async () => {
    getRecent.mockClear();
    const response = await POST(new NextRequest("http://localhost/api/search/related", {
      method: "POST",
      body: JSON.stringify({ ignored: "x".repeat(128 * 1024) }),
    }));

    expect(response.status).toBe(413);
    expect(getRecent).not.toHaveBeenCalled();
  });
  it("returns an empty successful result when the catalog is unavailable", async () => {
    const response = await POST(new NextRequest("http://localhost/api/search/related", {
      method: "POST",
      body: JSON.stringify({
        target: { canonicalKey: "shinigami:test", sourceId: "shinigami", mangaId: "test", title: "Manga" },
      }),
    }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: [] });
  });
});
