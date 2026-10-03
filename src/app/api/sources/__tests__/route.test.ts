import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/server/lib/security/rate-limit", () => ({
  checkRateLimit: vi.fn(),
}));

vi.mock("@/server/lib/sources/runtime-sources", () => ({
  getRuntimeSources: vi.fn(),
}));

import { GET } from "../route";
import { checkRateLimit } from "@/server/lib/security/rate-limit";
import { getRuntimeSources } from "@/server/lib/sources/runtime-sources";

describe("GET /api/sources", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 with data array from getRuntimeSources", async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({ success: true, headers: {} });
    vi.mocked(getRuntimeSources).mockResolvedValue([
      {
        id: "komiku",
        name: "Komiku",
        isEnabled: true,
        isInstalled: true,
        status: "online",
        baseUrl: "https://komiku.example",
        version: "1.0.0",
        language: "id",
        description: "Komiku source",
        isNsfw: false,
        capabilities: { popular: true, latest: true, search: true, detail: true, chapters: true, pages: true, filters: false },
        isDynamic: false,
      },
      {
        id: "shinigami",
        name: "Shinigami",
        isEnabled: false,
        isInstalled: true,
        status: "online",
        baseUrl: "https://shinigami.example",
        version: "1.0.0",
        language: "id",
        description: "Shinigami source",
        isNsfw: false,
        capabilities: { popular: true, latest: true, search: true, detail: true, chapters: true, pages: true, filters: false },
        isDynamic: false,
      },
    ]);

    const req = new NextRequest("https://yomirra.example/api/sources");
    const res = await GET(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(Array.isArray(json.data)).toBe(true);
    expect(json.data.length).toBe(2);

    const shinigami = json.data.find((s: any) => s.id === "shinigami");
    expect(shinigami?.isEnabled).toBe(false);

    // Verify no secret leakage
    const bodyStr = JSON.stringify(json);
    expect(bodyStr).not.toContain("ADMIN_KEY");
    expect(bodyStr).not.toContain("ADMIN_SECRET");
    expect(bodyStr).not.toContain("redis");
  });

  it("returns 429 when rate limited", async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({
      success: false,
      headers: { "Retry-After": "60" },
    });

    const req = new NextRequest("https://yomirra.example/api/sources");
    const res = await GET(req);

    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("60");
  });
});
