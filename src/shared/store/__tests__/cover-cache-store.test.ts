import { describe, it, expect, beforeEach, vi } from "vitest";
import { useCoverCacheStore, resolveMangaCover } from "../cover-cache-store";
import { useLibraryStore } from "../library-store";
import { useHistoryStore } from "../history-store";

describe("coverCacheStore and resolveMangaCover", () => {
  beforeEach(() => {
    useCoverCacheStore.setState({ resolutions: {} });
    vi.restoreAllMocks();
  });

  it("stores and retrieves a resolved cover from local cache", () => {
    const store = useCoverCacheStore.getState();
    expect(store.getResolvedCover("shinigami", "manga-1")).toBeNull();

    store.setResolvedCover("shinigami", "manga-1", "https://cdn.example.com/cover1.jpg", "upstream");
    expect(store.getResolvedCover("shinigami", "manga-1")).toBe("https://cdn.example.com/cover1.jpg");
  });

  it("enforces cooldown when failure count >= 2", () => {
    const store = useCoverCacheStore.getState();
    expect(store.isFailedCooldown("shinigami", "manga-fail")).toBe(false);

    store.markFailed("shinigami", "manga-fail");
    expect(store.isFailedCooldown("shinigami", "manga-fail")).toBe(false);

    store.markFailed("shinigami", "manga-fail");
    expect(store.isFailedCooldown("shinigami", "manga-fail")).toBe(true);
  });

  it("resolves from Tier 1 local cache without making any fetch request", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    useCoverCacheStore.getState().setResolvedCover("shinigami", "manga-tier1", "https://cdn.example.com/tier1.jpg");

    const resolved = await resolveMangaCover("shinigami", "manga-tier1", "https://old.example.com/dead.jpg");
    expect(resolved).toBe("https://cdn.example.com/tier1.jpg");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("resolves from Tier 2 libraryStore when present", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    vi.spyOn(useLibraryStore, "getState").mockReturnValue({
      getLibraryItem: (sourceId: string, mangaId: string) => {
        if (sourceId === "shinigami" && mangaId === "manga-lib") {
          return { coverUrl: "https://lib.example.com/fresh.jpg" } as any;
        }
        return null;
      },
    } as any);

    const resolved = await resolveMangaCover("shinigami", "manga-lib", "https://old.example.com/stale.jpg");
    expect(resolved).toBe("https://lib.example.com/fresh.jpg");
    expect(fetchSpy).not.toHaveBeenCalled();

    // Verify it was cached in Tier 1
    expect(useCoverCacheStore.getState().getResolvedCover("shinigami", "manga-lib")).toBe(
      "https://lib.example.com/fresh.jpg"
    );
  });

  it("INVARIANT: Zero writes to historyStore or Firestore during cover resolution", async () => {
    const upsertSpy = vi.spyOn(useHistoryStore.getState(), "upsertHistory");
    const setItemLocalSpy = vi.spyOn(useHistoryStore.getState(), "_setItemLocal");

    // Mock successful fetch
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { coverUrl: "https://cdn.example.com/healed.jpg" } }),
    } as any);

    const resolved = await resolveMangaCover("shinigami", "manga-heal", "https://dead.example.com/broken.jpg");
    expect(resolved).toBe("https://cdn.example.com/healed.jpg");

    // History store MUST NEVER be called
    expect(upsertSpy).not.toHaveBeenCalled();
    expect(setItemLocalSpy).not.toHaveBeenCalled();
  });

  it("prunes expired failed resolutions when clearExpired is invoked", () => {
    const store = useCoverCacheStore.getState();
    const keyExpired = "shinigami::expired";
    const keyRecent = "shinigami::recent";

    useCoverCacheStore.setState({
      resolutions: {
        [keyExpired]: {
          coverUrl: "",
          status: "FAILED",
          source: "initial",
          retryCount: 2,
          lastAttemptAt: Date.now() - 25 * 60 * 60 * 1000, // 25 hours ago
        },
        [keyRecent]: {
          coverUrl: "",
          status: "FAILED",
          source: "initial",
          retryCount: 2,
          lastAttemptAt: Date.now() - 1000, // 1 second ago
        },
      },
    });

    store.clearExpired();
    const remaining = useCoverCacheStore.getState().resolutions;
    expect(remaining[keyExpired]).toBeUndefined();
    expect(remaining[keyRecent]).toBeDefined();
  });
});
