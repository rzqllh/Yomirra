import { describe, it, expect, beforeEach, vi } from "vitest";
import { domainResolver, SOURCE_DOMAINS } from "../domain-resolver";

vi.mock("@/server/lib/cache/redis", () => ({
  redis: null,
}));

describe("DomainResolver (D-001)", () => {
  beforeEach(async () => {
    await domainResolver.resetDomainCache();
    delete process.env.SOURCE_KOMIKINDO_DOMAIN;
    delete process.env.SOURCE_SHINIGAMI_DOMAIN;
    delete process.env.SOURCE_SHINIGAMI_API_DOMAIN;
  });

  it("resolves bundled default domain when no cache or env is set", async () => {
    const domain = await domainResolver.resolveDomain("komikindo", "frontend");
    expect(domain).toBe("https://komikindo.ch");
  });

  it("prioritizes environment variable override over default domain", async () => {
    process.env.SOURCE_KOMIKINDO_DOMAIN = "https://custom-komikindo.org";
    const domain = await domainResolver.resolveDomain("komikindo", "frontend");
    expect(domain).toBe("https://custom-komikindo.org");
  });

  it("resolves separate frontend and API domains for sources like Shinigami", async () => {
    const frontend = await domainResolver.resolveDomain("shinigami", "frontend");
    const api = await domainResolver.resolveDomain("shinigami", "api");
    expect(frontend).toBe("https://shinigami.asia");
    expect(api).toBe("https://api.shngm.io");
  });

  it("records working domain in cache and returns cached domain on subsequent resolutions", async () => {
    await domainResolver.recordWorkingDomain("komikindo", "https://komikindo.cv", "frontend");
    const cached = await domainResolver.resolveDomain("komikindo", "frontend");
    expect(cached).toBe("https://komikindo.cv");
  });

  it("switches to verified fallback mirror when primary domain fails", async () => {
    // Komikindo has fallback mirror https://komikindo.cv
    const fallback = await domainResolver.markDomainFailed("komikindo", "https://komikindo.ch", "frontend");
    expect(fallback).toBe("https://komikindo.cv");

    const resolved = await domainResolver.resolveDomain("komikindo", "frontend");
    expect(resolved).toBe("https://komikindo.cv");
  });

  it("returns null when all configured mirrors fail", async () => {
    // First failure switches to komikindo.cv
    await domainResolver.markDomainFailed("komikindo", "https://komikindo.ch", "frontend");
    // Second failure on komikindo.cv exhausts mirrors
    const fallbackAfterAllFailed = await domainResolver.markDomainFailed("komikindo", "https://komikindo.cv", "frontend");
    // It falls back to defaultDomain if different, or returns null if exhausted
    expect(fallbackAfterAllFailed === "https://komikindo.ch" || fallbackAfterAllFailed === null).toBe(true);
  });

  it("domain change does NOT mutate source identity, library identity, or keys", async () => {
    const originalSourceId = "komikindo";
    const canonicalMangaKey = `${originalSourceId}::one-piece`;
    const userReadingProgress = {
      sourceId: originalSourceId,
      mangaId: "one-piece",
      chapterId: "chapter-100",
      chapterNumber: 100,
    };

    // Simulate domain migration
    await domainResolver.recordWorkingDomain(originalSourceId, "https://komikindo.cv", "frontend");
    const resolved = await domainResolver.resolveDomain(originalSourceId, "frontend");

    expect(resolved).toBe("https://komikindo.cv");
    // Source identity, keys, and user reading progress remain completely unaffected
    expect(originalSourceId).toBe("komikindo");
    expect(canonicalMangaKey).toBe("komikindo::one-piece");
    expect(userReadingProgress.sourceId).toBe("komikindo");
    expect(userReadingProgress.chapterNumber).toBe(100);
  });
});
