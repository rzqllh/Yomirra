import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "../route";
import { sourceManager } from "@/server/lib/sources/source-manager";

vi.mock("@/server/lib/cache/redis", () => ({
  redis: null,
}));

vi.mock("@/server/lib/security/rate-limit", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ success: true, headers: {} }),
}));

describe("Global Search Failure Isolation", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns 200 with partial results and failure metadata when 1 source fails and others succeed", async () => {
    const successSourceA: any = {
      id: "shinigami",
      capabilities: { search: true },
      search: vi.fn().mockResolvedValue({
        mangas: [{ id: "manga-1", title: "Manga 1", coverUrl: "https://img.com/1.jpg" }],
        hasNextPage: false,
      }),
    };

    const successSourceB: any = {
      id: "mangadex",
      capabilities: { search: true },
      search: vi.fn().mockResolvedValue({
        mangas: [{ id: "manga-2", title: "Manga 2", coverUrl: "https://img.com/2.jpg" }],
        hasNextPage: true,
      }),
    };

    const failedSource: any = {
      id: "komikindo",
      capabilities: { search: true },
      search: vi.fn().mockRejectedValue(new Error("Request timed out after 10000ms")),
    };

    vi.spyOn(sourceManager, "getSource").mockImplementation(async (id: string) => {
      if (id === "shinigami") return successSourceA;
      if (id === "mangadex") return successSourceB;
      if (id === "komikindo") return failedSource;
      throw new Error(`Source ${id} not found`);
    });

    const req = new NextRequest("http://localhost:3000/api/sources/search?q=solo&sources=shinigami,mangadex,komikindo&page=1");
    const res = await GET(req);

    expect(res.status).toBe(200);

    const json = await res.json();
    const results = json.data.resultsBySource;

    // Successful sources return results
    expect(results.shinigami.results).toHaveLength(1);
    expect(results.shinigami.results[0].title).toBe("Manga 1");
    expect(results.shinigami.error).toBeUndefined();

    expect(results.mangadex.results).toHaveLength(1);
    expect(results.mangadex.results[0].title).toBe("Manga 2");
    expect(results.mangadex.error).toBeUndefined();

    // Failed source returns isolated error metadata without breaking the request
    expect(results.komikindo.results).toHaveLength(0);
    expect(results.komikindo.error).toBeDefined();
    expect(results.komikindo.errorCode).toBe("UPSTREAM_TIMEOUT");
  });

  it("handles non-existent source gracefully with SOURCE_DOWN error code", async () => {
    vi.spyOn(sourceManager, "getSource").mockImplementation(async (id: string) => {
      throw new Error(`Source ${id} not found`);
    });

    const req = new NextRequest("http://localhost:3000/api/sources/search?q=naruto&sources=invalid-source&page=1");
    const res = await GET(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    const results = json.data.resultsBySource;

    expect(results["invalid-source"].results).toHaveLength(0);
    expect(results["invalid-source"].error).toBe("Source not found");
    expect(results["invalid-source"].errorCode).toBe("SOURCE_DOWN");
  });
});
