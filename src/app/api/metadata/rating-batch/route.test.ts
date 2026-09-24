import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/server/lib/security/rate-limit", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ success: true, headers: {} }),
}));
vi.mock("@/server/lib/cache/redis-cache", () => ({
  withCache: vi.fn(),
}));

import { POST } from "./route";

describe("rating batch input limits", () => {
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
