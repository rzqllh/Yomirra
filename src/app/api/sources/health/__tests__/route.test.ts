import { describe, it, expect, vi, beforeEach } from "vitest";

const mockRedis = {
  get: vi.fn(),
  setex: vi.fn(),
};

vi.mock("@/server/lib/cache/redis", () => ({
  get redis() {
    return mockRedis;
  },
}));

vi.mock("@/shared/logger", () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

import { GET } from "../route";
import { sourceRegistry } from "@/shared/sources/source-registry";

describe("GET /api/sources/health", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockRedis.get.mockReset();
    mockRedis.setex.mockReset();
  });

  it("includes healthCheckUrl for MangaDex in registry", () => {
    const md = sourceRegistry.find((s) => s.id === "mangadex");
    expect(md?.healthCheckUrl).toBe("https://api.mangadex.org/manga?limit=1");
  });

  it("returns health check data for registered sources", async () => {
    mockRedis.get.mockResolvedValue(null);
    mockRedis.setex.mockResolvedValue("OK");

    vi.spyOn(global, "fetch").mockImplementation(async (url: any) => {
      const urlStr = String(url);
      if (urlStr.includes("shngm.io")) {
        return new Response(JSON.stringify({ status: "ok" }), { status: 200 });
      }
      if (urlStr.includes("komikindo.ch")) {
        return new Response("OK", { status: 200 });
      }
      if (urlStr.includes("api.mangadex.org")) {
        return new Response(JSON.stringify({ result: "ok" }), { status: 200 });
      }
      return new Response("Not Found", { status: 404 });
    });

    const res = await GET();
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.data).toBeDefined();
    expect(json.data.mangadex.status).toBe("online");
    expect(json.data.shinigami.status).toBe("online");
    expect(json.data.komikindo.status).toBe("online");
  });

  it("normalizes SSL errors into safe public messages", async () => {
    mockRedis.get.mockResolvedValue(null);

    const sslErr = new TypeError("fetch failed");
    (sslErr as any).code = "ERR_TLS_CERT_ALTNAME_INVALID";

    vi.spyOn(global, "fetch").mockRejectedValue(sslErr);

    const res = await GET();
    const json = await res.json();

    expect(json.data.mangadex.status).toBe("unavailable");
    expect(json.data.mangadex.message).toBe("Sertifikat SSL/TLS server tidak valid atau kadaluarsa.");
    // Does not leak raw internal error object
    expect(json.data.mangadex.cause).toBeUndefined();
  });

  it("survives Redis stream errors without failing the health check", async () => {
    mockRedis.get.mockRejectedValue(new Error("Stream isn't writeable and enableOfflineQueue options is false"));
    mockRedis.setex.mockRejectedValue(new Error("Stream isn't writeable and enableOfflineQueue options is false"));

    vi.spyOn(global, "fetch").mockResolvedValue(new Response("OK", { status: 200 }));

    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toBeDefined();
    expect(json.data.mangadex.status).toBe("online");
  });
});
