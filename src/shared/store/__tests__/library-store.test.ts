import { describe, it, expect, beforeEach, vi } from "vitest";
import { useLibraryStore } from "../library-store";
import { deleteLibraryItem } from "@/shared/lib/sync-utils";

vi.mock("@/shared/lib/sync-utils", () => ({
  pushLibraryItem: vi.fn().mockResolvedValue(undefined),
  deleteLibraryItem: vi.fn().mockResolvedValue(undefined),
}));

describe("library-store Phase 1 Identity & Relinking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useLibraryStore.setState({ items: {} });
  });

  it("deletes the cloud document using the saved title ID", () => {
    useLibraryStore.setState({ items: {
      "saved-uuid": {
        id: "saved-uuid", sourceId: "mangadex", mangaId: "manga-1",
        title: "Test", addedAt: "2026-01-01", updatedAt: "2026-01-01",
      },
    } });

    useLibraryStore.getState().removeFromLibrary("mangadex", "manga-1");

    expect(deleteLibraryItem).toHaveBeenCalledWith("mangadex", "manga-1", "saved-uuid");
    expect(useLibraryStore.getState().items).toEqual({});
  });

  it("assigns SavedTitleId and initializes Phase 1 identity fields on new items", () => {
    useLibraryStore.getState().addToLibrary({
      sourceId: "mangadex",
      mangaId: "uuid-123",
      title: "Frieren",
      addedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const items = Object.values(useLibraryStore.getState().items);
    expect(items.length).toBe(1);

    const item = items[0];
    expect(item.id).toBeDefined();
    expect(item.schemaVersion).toBe(2);
    expect(item.primarySourceId).toBe("mangadex");
    expect(item.primaryMangaId).toBe("uuid-123");
    expect(item.linkedSources).toEqual([]);
  });

  it("checks presence and resolves items via resolveBySourceRef", () => {
    useLibraryStore.getState().addToLibrary({
      sourceId: "mangadex",
      mangaId: "uuid-123",
      title: "Frieren",
      addedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    expect(useLibraryStore.getState().isInLibrary("mangadex", "uuid-123")).toBe(true);
    expect(useLibraryStore.getState().isInLibrary("komiku", "frieren")).toBe(false);

    const resolved = useLibraryStore.getState().resolveBySourceRef("mangadex", "uuid-123");
    expect(resolved).toBeDefined();
    expect(resolved?.title).toBe("Frieren");
  });

  it("relinks title to a new primary source and preserves old source as CONFIRMED in linkedSources", () => {
    useLibraryStore.getState().addToLibrary({
      sourceId: "mangadex",
      mangaId: "uuid-123",
      title: "Frieren",
      addedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const originalItem = Object.values(useLibraryStore.getState().items)[0];
    const savedTitleId = originalItem.id!;

    // Relink to komiku
    useLibraryStore.getState().relinkTitle(savedTitleId, "komiku", "frieren-indo", {
      title: "Sousou no Frieren",
      coverUrl: "https://example.com/cover.jpg",
    });

    const updatedItem = useLibraryStore.getState().getLibraryItemById(savedTitleId);
    expect(updatedItem).toBeDefined();
    // SavedTitleId is immutable across relinks
    expect(updatedItem?.id).toBe(savedTitleId);
    expect(updatedItem?.primarySourceId).toBe("komiku");
    expect(updatedItem?.primaryMangaId).toBe("frieren-indo");
    expect(updatedItem?.title).toBe("Sousou no Frieren");
    expect(updatedItem?.coverUrl).toBe("https://example.com/cover.jpg");

    // Old source is preserved as CONFIRMED in linkedSources
    expect(updatedItem?.linkedSources?.length).toBe(1);
    expect(updatedItem?.linkedSources?.[0].sourceId).toBe("mangadex");
    expect(updatedItem?.linkedSources?.[0].mangaId).toBe("uuid-123");
    expect(updatedItem?.linkedSources?.[0].matchConfidence).toBe("CONFIRMED");

    // Can resolve item by old source ref as well
    const resolvedFromOld = useLibraryStore.getState().resolveBySourceRef("mangadex", "uuid-123");
    expect(resolvedFromOld?.id).toBe(savedTitleId);

    // Can resolve by new primary source ref
    const resolvedFromNew = useLibraryStore.getState().resolveBySourceRef("komiku", "frieren-indo");
    expect(resolvedFromNew?.id).toBe(savedTitleId);
  });
});
