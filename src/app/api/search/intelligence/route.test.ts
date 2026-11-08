import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const rank = vi.hoisted(() => vi.fn().mockResolvedValue({
  semanticAvailable: false, scores: {}, catalogMatches: [],
}));
vi.mock("@/server/lib/search/search-intelligence-service", () => ({ rankSearchIntelligence: rank }));
vi.mock("@/server/lib/sources/content-access", () => ({ getRequestReadOptions: () => ({ hideNsfw: true }) }));
vi.mock("@/server/lib/security/rate-limit", () => ({
  checkRateLimitPolicy: async () => ({ success: true }),
  applyRateLimitHeaders: (response: Response) => response,
}));

import { POST } from "./route";

describe("Search Intelligence payload", () => {
  it("rejects oversized bytes without Content-Length before ranking", async () => {
    const response = await POST(new NextRequest("http://localhost/api/search/intelligence", {
      method: "POST",
      body: JSON.stringify({ ignored: "x".repeat(4 * 1024 * 1024) }),
    }));
    expect(response.status).toBe(413);
    expect(rank).not.toHaveBeenCalled();
  });

  it("preserves the result envelope for supported payloads", async () => {
    const response = await POST(new NextRequest("http://localhost/api/search/intelligence", {
      method: "POST",
      body: JSON.stringify({ query: "petualangan" }),
    }));
    expect(response.status).toBe(200);
    expect(rank).toHaveBeenCalledWith({ query: "petualangan", tags: [], candidates: [], hideNsfw: true });
    expect(await response.json()).toEqual({ data: { semanticAvailable: false, scores: {}, catalogMatches: [] } });
  });
});
