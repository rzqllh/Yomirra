import { NextRequest } from "next/server";
import { expect, it, vi } from "vitest";
import { GET } from "../route";
import { safeFetch } from "@/server/lib/security/outbound-policy";

vi.mock("@/server/lib/sign-proxy-url", () => ({ verifyImageUrl: () => true }));
vi.mock("@/server/lib/security/outbound-policy", () => ({ safeFetch: vi.fn() }));
vi.mock("@/server/lib/security/rate-limit", () => ({
  checkRateLimitPolicy: async () => ({ success: true, headers: {} }),
  applyRateLimitHeaders: (response: Response) => response,
}));

it("bounds concurrent image streams and frees slots when a client cancels", async () => {
  const cancel = vi.fn();
  vi.mocked(safeFetch).mockImplementation(async () => new Response(
    new ReadableStream({ cancel }),
    { headers: { "Content-Type": "image/jpeg" } },
  ));
  const request = () => new NextRequest("https://yomirra.test/api/proxy/image?v=2&url=https://example.test/page.jpg&sig=valid");
  const streams = await Promise.all(Array.from({ length: 16 }, () => GET(request())));
  try {
    expect(streams.every((response) => response.ok)).toBe(true);
    const busy = await GET(request());
    expect(busy.status).toBe(503);
    expect(busy.headers.get("Retry-After")).toBe("2");
    expect(safeFetch).toHaveBeenCalledTimes(16);

    await streams[0].body!.cancel();
    await vi.waitFor(() => expect(cancel).toHaveBeenCalledTimes(1));
    const next = await GET(request());
    expect(next.status).toBe(200);
    await next.body!.cancel();
  } finally {
    await Promise.all(streams.map((stream) => stream.body?.cancel()));
  }
});

it.each(["v=2", "sig=second", "url=https://example.test/other.jpg", "ref=a&ref=b", "retry=4", "alias=1"])(
  "rejects ambiguous cache-key query %s before fetching upstream",
  async (suffix) => {
    vi.mocked(safeFetch).mockClear();
    const request = new NextRequest(`https://yomirra.test/api/proxy/image?v=2&url=https://example.test/page.jpg&sig=valid&${suffix}`);
    expect((await GET(request)).status).toBe(400);
    expect(safeFetch).not.toHaveBeenCalled();
  }
);

it("rejects URLs from the retired signature format before fetching", async () => {
  const request = new NextRequest("https://yomirra.test/api/proxy/image?url=https://example.test/page.jpg&sig=legacy");
  expect((await GET(request)).status).toBe(403);
  expect(safeFetch).not.toHaveBeenCalled();
});

it("preserves supported retry URLs", async () => {
  vi.mocked(safeFetch).mockResolvedValueOnce(new Response("image", { headers: { "Content-Type": "image/jpeg" } }));
  const response = await GET(new NextRequest("https://yomirra.test/api/proxy/image?v=2&url=https://example.test/page.jpg&sig=valid&retry=3"));
  expect(response.status).toBe(200);
  await response.text();
});

it.each(["image/svg+xml", "text/html", "application/octet-stream", ""])(
  "rejects active, missing and unsupported image type %j",
  async (contentType) => {
    const headers = contentType ? { "Content-Type": contentType } : undefined;
    vi.mocked(safeFetch).mockResolvedValueOnce(new Response(new Uint8Array([1, 2]), { headers }));
    const request = new NextRequest("https://yomirra.test/api/proxy/image?v=2&url=https://example.test/page.jpg&sig=valid");
    expect((await GET(request)).status).toBe(400);
  }
);

it("isolates accepted raster images if opened as documents", async () => {
  vi.mocked(safeFetch).mockResolvedValueOnce(new Response("image", { headers: { "Content-Type": "image/webp" } }));
  const response = await GET(new NextRequest("https://yomirra.test/api/proxy/image?v=2&url=https://example.test/page.webp&sig=valid"));
  expect(response.status).toBe(200);
  expect(response.headers.get("Content-Security-Policy")).toContain("sandbox");
  expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
  expect(response.headers.get("Cache-Control")).toContain("private");
  await response.text();
});
