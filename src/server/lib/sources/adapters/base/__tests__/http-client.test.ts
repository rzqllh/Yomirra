import { describe, it, expect, vi, beforeEach } from "vitest";
import { HttpClient } from "../http-client";
import { safeFetch } from "../../../../security/outbound-policy";
import { pendingSourceRegistry, getPendingSourceMetadata, sourceRegistry } from "@/shared/sources/source-registry";

vi.mock("../../../../security/outbound-policy", () => ({
  safeFetch: vi.fn(),
}));

describe("HttpClient Infrastructure", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Constructor and Configuration", () => {
    it("supports legacy constructor signature (baseUrl, defaultHeaders)", () => {
      const client = new HttpClient("https://api.example.com", { "X-Custom": "val" });
      expect(client.getBaseUrl()).toBe("https://api.example.com");
      expect(client.getConfig().baseUrl).toBe("https://api.example.com");
      expect(client.getConfig().defaultHeaders).toEqual({ "X-Custom": "val" });
      expect(client.getConfig().timeoutMs).toBe(10000);
    });

    it("supports modern HttpClientConfig object signature", () => {
      const client = new HttpClient({
        baseUrl: "https://api.example.com",
        defaultHeaders: { Authorization: "Bearer token" },
        timeoutMs: 5000,
        allowedHosts: ["api.example.com"],
        maxRedirects: 3,
        maxResponseSize: 1024 * 1024,
      });

      expect(client.getBaseUrl()).toBe("https://api.example.com");
      const config = client.getConfig();
      expect(config.baseUrl).toBe("https://api.example.com");
      expect(config.defaultHeaders).toEqual({ Authorization: "Bearer token" });
      expect(config.timeoutMs).toBe(5000);
      expect(config.allowedHosts).toEqual(["api.example.com"]);
      expect(config.maxRedirects).toBe(3);
      expect(config.maxResponseSize).toBe(1048576);
    });

    it("allows updating baseUrl via setBaseUrl", () => {
      const client = new HttpClient("https://old.example.com");
      client.setBaseUrl("https://new.example.com");
      expect(client.getBaseUrl()).toBe("https://new.example.com");
    });
  });

  describe("Host validation (allowedHosts)", () => {
    it("permits requests when hostname matches allowedHosts exactly", async () => {
      const client = new HttpClient({
        baseUrl: "https://api.example.com",
        allowedHosts: ["api.example.com"],
      });

      vi.mocked(safeFetch).mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), { status: 200 })
      );

      const res = await client.get("/v1/test");
      expect(res).toEqual({ ok: true });
      expect(safeFetch).toHaveBeenCalledWith(
        "https://api.example.com/v1/test",
        expect.any(Object)
      );
    });

    it("permits requests to subdomains of allowedHosts", async () => {
      const client = new HttpClient({
        baseUrl: "https://sub.domain.example.com",
        allowedHosts: ["example.com"],
      });

      vi.mocked(safeFetch).mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), { status: 200 })
      );

      const res = await client.get("/ping");
      expect(res).toEqual({ ok: true });
    });

    it("rejects requests to hosts not in allowedHosts list with SECURITY_REJECTED", async () => {
      const client = new HttpClient({
        baseUrl: "https://api.example.com",
        allowedHosts: ["trusted.example.com"],
      });

      await expect(client.get("/test")).rejects.toThrowError(
        'SECURITY_REJECTED: Host "api.example.com" is not in allowedHosts list'
      );
      expect(safeFetch).not.toHaveBeenCalled();
    });
  });

  describe("HTTP Methods", () => {
    it("get() handles query params and parses JSON response", async () => {
      const client = new HttpClient("https://api.example.com");
      vi.mocked(safeFetch).mockResolvedValueOnce(
        new Response(JSON.stringify({ items: [1, 2, 3] }), { status: 200 })
      );

      const res = await client.get<{ items: number[] }>("/items", {
        page: 2,
        tags: ["action", "manga"],
      });

      expect(res).toEqual({ items: [1, 2, 3] });
      expect(safeFetch).toHaveBeenCalledWith(
        "https://api.example.com/items?page=2&tags=action&tags=manga",
        expect.objectContaining({
          headers: expect.objectContaining({ Accept: "application/json" }),
        })
      );
    });

    it("getHtml() returns text content", async () => {
      const client = new HttpClient("https://komik.example.com");
      vi.mocked(safeFetch).mockResolvedValueOnce(
        new Response("<html><body>Content</body></html>", { status: 200 })
      );

      const html = await client.getHtml("/chapter/1");
      expect(html).toBe("<html><body>Content</body></html>");
      expect(safeFetch).toHaveBeenCalledWith(
        "https://komik.example.com/chapter/1",
        expect.objectContaining({
          headers: expect.objectContaining({
            Accept: "text/html,application/xhtml+xml,application/xml",
          }),
        })
      );
    });

    it("getText() fetches arbitrary text payload (e.g. encrypted payloads)", async () => {
      const client = new HttpClient("https://api.example.com");
      vi.mocked(safeFetch).mockResolvedValueOnce(
        new Response("ENCRYPTED_PAYLOAD_STRING", { status: 200 })
      );

      const text = await client.getText("/encrypted-endpoint");
      expect(text).toBe("ENCRYPTED_PAYLOAD_STRING");
    });

    it("post() formats JSON body and parses response", async () => {
      const client = new HttpClient("https://api.example.com");
      vi.mocked(safeFetch).mockResolvedValueOnce(
        new Response(JSON.stringify({ status: "created" }), { status: 200 })
      );

      const res = await client.post<{ status: string }>("/create", { name: "test" });
      expect(res).toEqual({ status: "created" });
      expect(safeFetch).toHaveBeenCalledWith(
        "https://api.example.com/create",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ name: "test" }),
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
        })
      );
    });

    it("post() passes string body as-is without re-stringifying", async () => {
      const client = new HttpClient("https://api.example.com");
      vi.mocked(safeFetch).mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true }), { status: 200 })
      );

      await client.post("/raw", "raw-data-string");
      expect(safeFetch).toHaveBeenCalledWith(
        "https://api.example.com/raw",
        expect.objectContaining({
          body: "raw-data-string",
        })
      );
    });

    it("throws clear error on non-ok HTTP status", async () => {
      const client = new HttpClient("https://api.example.com");
      vi.mocked(safeFetch).mockResolvedValueOnce(
        new Response("Not Found", { status: 404, statusText: "Not Found" })
      );

      await expect(client.get("/missing")).rejects.toThrowError("HTTP Error 404: Not Found");
    });
  });
});

describe("Source Registry Phase 1, 2A, 2B, 2C State", () => {
  it("pendingSourceRegistry is empty — all Phase 2 sources are now active", () => {
    expect(pendingSourceRegistry).toHaveLength(0);
  });

  it("getPendingSourceMetadata returns undefined for promoted sources", () => {
    const komiknesia = getPendingSourceMetadata("komiknesia");
    expect(komiknesia).toBeUndefined(); // Promoted to active registry

    const asura = getPendingSourceMetadata("asurascans");
    expect(asura).toBeUndefined(); // Already promoted in Phase 2B
  });

  it("verifies all Phase 2 sources are in active sourceRegistry", () => {
    const activeIds = sourceRegistry.map((s) => s.id);
    expect(activeIds).toContain("komiku-ii");
    expect(activeIds).toContain("asurascans");
    expect(activeIds).toContain("komiknesia"); // Promoted in Phase 2C
  });
});

