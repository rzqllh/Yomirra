import { describe, it, expect, beforeEach, vi } from "vitest";
import { useLibraryStore } from "../library-store";
import { deleteLibraryItem, pushLibraryItem } from "@/shared/lib/sync-utils";

vi.mock("@/shared/lib/sync-utils", () => ({
  pushLibraryItem: vi.fn().mockResolvedValue(undefined),
  deleteLibraryItem: vi.fn().mockResolvedValue(undefined),
}));

describe("library-store Phase 1 Identity & Relinking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useLibraryStore.setState({ items: {} });
  });

  it("deletes the cloud document using the saved title ID", async () => {
    useLibraryStore.setState({ items: {
      "saved-uuid": {
        id: "saved-uuid", sourceId: "mangadex", mangaId: "manga-1",
        title: "Test", addedAt: "2026-01-01", updatedAt: "2026-01-01",
      },
    } });

    useLibraryStore.getState().removeFromLibrary("mangadex", "manga-1");

    await vi.waitFor(() => expect(deleteLibraryItem).toHaveBeenCalledWith("mangadex", "manga-1", "saved-uuid"));
    expect(useLibraryStore.getState().items).toEqual({});
  });

  it("restores local state when cloud deletion rejects", async () => {
    const item = {
      id: "saved-uuid", sourceId: "mangadex", mangaId: "manga-1",
      title: "Test", addedAt: "2026-01-01", updatedAt: "2026-01-01",
    };
    vi.mocked(deleteLibraryItem).mockRejectedValueOnce(new Error("Firebase is unavailable for deletion."));
    useLibraryStore.setState({ items: { "saved-uuid": item } });

    useLibraryStore.getState().removeFromLibrary("mangadex", "manga-1");
    await vi.waitFor(() => expect(useLibraryStore.getState().items["saved-uuid"]).toEqual(item));
  });

  it("never evicts or remotely deletes saved titles when Rak Buku exceeds 1,000 records", async () => {
    const items = Object.fromEntries(Array.from({ length: 1000 }, (_, index) => [
      `saved-${index}`,
      { id: `saved-${index}`, sourceId: "source", mangaId: `manga-${index}`, title: "Title", addedAt: "2026-01-01", updatedAt: "2026-01-01" },
    ]));
    useLibraryStore.setState({ items });

    useLibraryStore.getState().addToLibrary({
      id: "saved-new", sourceId: "source", mangaId: "manga-new", title: "New", addedAt: "2026-01-02", updatedAt: "2026-01-02",
    });

    expect(Object.keys(useLibraryStore.getState().items)).toHaveLength(1001);
    expect(useLibraryStore.getState().items["saved-0"]).toBeDefined();
    expect(deleteLibraryItem).not.toHaveBeenCalled();
    await vi.waitFor(() => expect(pushLibraryItem).toHaveBeenCalled());
  });

  it("rolls back only the failed title and preserves concurrently saved unrelated titles", async () => {
    let failFirst: (error: Error) => void = () => { throw new Error("Deferred not initialized"); };
    vi.mocked(pushLibraryItem).mockImplementationOnce(() =>
      new Promise<void>((_, reject) => { failFirst = reject; })
    );
    useLibraryStore.getState().addToLibrary({
      id: "one", sourceId: "source", mangaId: "one", title: "One", addedAt: "2026-01-01", updatedAt: "2026-01-01",
    });
    await vi.waitFor(() => expect(pushLibraryItem).toHaveBeenCalledTimes(1));

    useLibraryStore.getState().addToLibrary({
      id: "two", sourceId: "source", mangaId: "two", title: "Two", addedAt: "2026-01-02", updatedAt: "2026-01-02",
    });
    failFirst(new Error("network down"));

    await vi.waitFor(() => {
      expect(useLibraryStore.getState().items.one).toBeUndefined();
      expect(useLibraryStore.getState().items.two?.title).toBe("Two");
    });
  });

  it("does not resurrect a removed title when the user saves it again before the failed delete settles", async () => {
    let failDelete: (error: Error) => void = () => { throw new Error("Deferred not initialized"); };
    vi.mocked(deleteLibraryItem).mockImplementationOnce(() =>
      new Promise<void>((_, reject) => { failDelete = reject; })
    );
    useLibraryStore.setState({ items: {
      saved: { id: "saved", sourceId: "source", mangaId: "manga", title: "Old", addedAt: "2026-01-01", updatedAt: "2026-01-01" },
    } });
    useLibraryStore.getState().removeFromLibrary("source", "manga");
    await vi.waitFor(() => expect(deleteLibraryItem).toHaveBeenCalledTimes(1));

    useLibraryStore.getState().addToLibrary({
      id: "saved", sourceId: "source", mangaId: "manga", title: "New", addedAt: "2026-01-02", updatedAt: "2026-01-02",
    });
    // The second write is queued behind the first for this saved-title identity.
    expect(pushLibraryItem).not.toHaveBeenCalled();
    failDelete(new Error("temporary failure"));
    await vi.waitFor(() => expect(pushLibraryItem).toHaveBeenCalledTimes(1));
    expect(useLibraryStore.getState().items.saved?.title).toBe("New");
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
  it("treats linked providers as the same saved title", () => {
    useLibraryStore.getState().addToLibrary({
      id: "saved-frieren",
      sourceId: "mangadex",
      mangaId: "frieren-md",
      primarySourceId: "mangadex",
      primaryMangaId: "frieren-md",
      title: "Frieren",
      linkedSources: [
        {
          sourceId: "komiku",
          mangaId: "frieren-id",
          addedAt: Date.now(),
          matchConfidence: "CONFIRMED",
        },
      ],
      addedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    expect(useLibraryStore.getState().isInLibrary("komiku", "frieren-id")).toBe(true);
    expect(useLibraryStore.getState().getLibraryItem("komiku", "frieren-id")?.id).toBe("saved-frieren");

    useLibraryStore.getState().toggleLibrary({
      sourceId: "komiku",
      mangaId: "frieren-id",
      title: "Sousou no Frieren",
      addedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    expect(Object.keys(useLibraryStore.getState().items)).toHaveLength(0);
  });

  it("keeps only alternate providers in linkedSources after relink", () => {
    useLibraryStore.getState().addToLibrary({
      id: "saved-relink",
      sourceId: "mangadex",
      mangaId: "frieren-md",
      primarySourceId: "mangadex",
      primaryMangaId: "frieren-md",
      title: "Frieren",
      linkedSources: [
        {
          sourceId: "komiku",
          mangaId: "frieren-id",
          addedAt: Date.now(),
          matchConfidence: "CONFIRMED",
        },
      ],
      addedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    useLibraryStore.getState().relinkTitle("saved-relink", "komiku", "frieren-id");

    const item = useLibraryStore.getState().getLibraryItemById("saved-relink");
    expect(item?.primarySourceId).toBe("komiku");
    expect(item?.linkedSources).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ sourceId: "mangadex", mangaId: "frieren-md" }),
      ])
    );
    expect(item?.linkedSources?.some((source) => source.sourceId === "komiku" && source.mangaId === "frieren-id")).toBe(false);
  });

});
