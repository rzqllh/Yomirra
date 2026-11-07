import { describe, expect, it } from "vitest";
import { isSafeSourceMetadataRequest, isNetworkOnlyApiPath } from "@/shared/lib/pwa-cache-policy";

const site = "https://yomirra.example";

describe("Service worker API cache policy", () => {
  it.each([
    "/api/sources/shinigami/manga",
    "/api/sources/shinigami/chapters",
    "/api/sources/shinigami/manga/title",
    "/api/sources/shinigami/manga/title/chapters",
    "/api/sources/mangadex/popular",
    "/api/sources/mangadex/latest",
  ])("only caches an explicit safe scope for %s", (path) => {
    expect(isSafeSourceMetadataRequest(new URL(path + "?hideNsfw=true", site))).toBe(true);
    expect(isSafeSourceMetadataRequest(new URL(path + "?hideNsfw=false", site))).toBe(false);
    expect(isSafeSourceMetadataRequest(new URL(path, site))).toBe(false);
    expect(isSafeSourceMetadataRequest(new URL(path + "?hideNsfw=false&hideNsfw=true", site))).toBe(false);
    expect(isSafeSourceMetadataRequest(new URL(path + "?hideNsfw=true&manifestUrl=https%3A%2F%2Fexample.org", site))).toBe(false);
  });

  it.each([
    "/api/health",
    "/api/health/live",
    "/api/sources/shinigami/search",
    "/api/sources/shinigami/manga/title/chapters/1/pages",
    "/api/sources/health",
    "/api/sources/nsfw-ids",
    "/api/search/related",
  ])("keeps %s out of Serwist's generic API cache", (path) => {
    expect(isSafeSourceMetadataRequest(new URL(path + "?hideNsfw=true", site))).toBe(false);
    expect(isNetworkOnlyApiPath(path)).toBe(true);
  });
});
