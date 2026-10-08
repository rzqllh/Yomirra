import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSync } from "../use-sync";
import { initFirebase } from "@/shared/lib/firebase";
import { useLibraryStore } from "@/shared/store/library-store";
import { useHistoryStore } from "@/shared/store/history-store";

const mocks = vi.hoisted(() => ({
  user: { uid: "user-a" } as { uid: string } | null,
  snapshots: new Map<string, unknown>(),
  listeners: new Map<string, (snapshot: { docChanges: () => Array<{ type: string; doc: { id: string; data: () => unknown } }> }) => void>(),
  writes: [] as Array<{ path: string; data: unknown }>,
  getDocs: vi.fn(),
  deleteLibraryItem: vi.fn(),
  deleteHistoryItem: vi.fn(),
  firestore: {
    collection: vi.fn((_db, path: string) => ({ path })),
    doc: vi.fn((_db, path: string, id?: string) => ({ path: id ? `${path}/${id}` : path })),
    getDocs: vi.fn(),
    onSnapshot: vi.fn((reference, onNext) => {
      mocks.listeners.set(reference.path, onNext);
      return vi.fn();
    }),
    setDoc: vi.fn(),
    writeBatch: vi.fn(() => ({
      set: (reference: { path: string }, data: unknown) => mocks.writes.push({ path: reference.path, data }),
      commit: vi.fn(async () => undefined),
    })),
  },
}));

vi.mock("@/shared/hooks/use-auth", () => ({
  useAuth: () => ({ user: mocks.user }),
}));

vi.mock("@/shared/lib/firebase", () => ({
  initFirebase: vi.fn(async () => ({ db: { name: "db" } })),
}));

vi.mock("@/shared/lib/sync-utils", () => ({
  pullSourcePreferences: vi.fn(async () => null),
  pullLegacyLibraryData: vi.fn(async () => []),
  pullCustomCollections: vi.fn(async () => null),
  pushLibraryItem: vi.fn(async () => undefined),
  deleteLibraryItem: mocks.deleteLibraryItem,
  pushHistoryItem: vi.fn(async () => undefined),
  deleteHistoryItem: mocks.deleteHistoryItem,
  deleteMangaHistory: vi.fn(async () => undefined),
}));

vi.mock("@/shared/lib/firestore-runtime", () => ({
  loadFirestore: vi.fn(async () => mocks.firestore),
}));

const snapshot = (entries: Array<[string, Record<string, unknown>]>) => ({
  empty: entries.length === 0,
  forEach: (callback: (doc: { id: string; data: () => Record<string, unknown> }) => void) => {
    entries.forEach(([id, data]) => callback({ id, data: () => data }));
  },
});

const libraryItem = (updatedAt = "2026-10-07T00:00:00.000Z") => ({
  id: "saved-title",
  sourceId: "source",
  mangaId: "manga",
  title: "Title",
  addedAt: updatedAt,
  updatedAt,
});

const historyItem = (readAt = 1000) => ({
  sourceId: "source",
  mangaId: "manga",
  chapterId: "chapter",
  mangaTitle: "Title",
  readAt,
});

describe("useSync cloud correctness", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.user = { uid: "user-a" };
    mocks.snapshots.clear();
    mocks.listeners.clear();
    mocks.writes.length = 0;
    mocks.firestore.getDocs.mockImplementation(async (reference: { path: string }) =>
      mocks.snapshots.get(reference.path) ?? snapshot([]),
    );
    vi.mocked(initFirebase).mockResolvedValue({ db: { name: "db" } } as never);
    localStorage.setItem("yomirra-libraryV2-migrated", "true");
    useLibraryStore.setState({ items: {} });
    useHistoryStore.setState({ items: {} });
  });

  it("subscribes to canonical libraryV2 and applies remote tombstone and removed changes locally", async () => {
    const { result } = renderHook(() => useSync({ autoSync: true }));

    await waitFor(() => expect(mocks.listeners.has("users/user-a/libraryV2")).toBe(true));
    expect(mocks.listeners.has("users/user-a/library")).toBe(false);

    act(() => {
      useLibraryStore.setState({ items: { "saved-title": libraryItem() } });
      mocks.listeners.get("users/user-a/libraryV2")?.({
        docChanges: () => [{
          type: "modified",
          doc: { id: "saved-title", data: () => ({ ...libraryItem(), _deleted: true, deletedAt: "2026-10-08T00:00:00.000Z" }) },
        }],
      });
    });

    expect(useLibraryStore.getState().items).toEqual({});
    expect(mocks.deleteLibraryItem).not.toHaveBeenCalled();
    expect(result.current.isSyncing).toBe(false);

    act(() => {
      useLibraryStore.setState({ items: { "saved-title": libraryItem() } });
      mocks.listeners.get("users/user-a/libraryV2")?.({
        docChanges: () => [{ type: "removed", doc: { id: "saved-title", data: () => ({}) } }],
      });
    });
    expect(useLibraryStore.getState().items).toEqual({});
  });

  it("applies history tombstone and removed changes locally without deleting back to cloud", async () => {
    renderHook(() => useSync({ autoSync: true }));
    await waitFor(() => expect(mocks.listeners.has("users/user-a/history")).toBe(true));

    act(() => {
      useHistoryStore.setState({ items: { "source::manga::chapter": historyItem() } });
      mocks.listeners.get("users/user-a/history")?.({
        docChanges: () => [{
          type: "added",
          doc: { id: "source::manga::chapter", data: () => ({ ...historyItem(), _deleted: true, deletedAt: "2026-10-08T00:00:00.000Z" }) },
        }],
      });
    });
    expect(useHistoryStore.getState().items).toEqual({});
    expect(mocks.deleteHistoryItem).not.toHaveBeenCalled();

    act(() => {
      useHistoryStore.setState({ items: { "source::manga::chapter": historyItem() } });
      mocks.listeners.get("users/user-a/history")?.({
        docChanges: () => [{ type: "removed", doc: { id: "source::manga::chapter", data: () => ({}) } }],
      });
    });
    expect(useHistoryStore.getState().items).toEqual({});
  });

  it("keeps a newer local library item when an older realtime tombstone arrives", async () => {
    renderHook(() => useSync({ autoSync: false }));
    await waitFor(() => expect(mocks.listeners.has("users/user-a/libraryV2")).toBe(true));
    const newerItem = libraryItem("2026-10-08T00:00:00.000Z");

    act(() => {
      useLibraryStore.setState({ items: { "saved-title": newerItem } });
      mocks.listeners.get("users/user-a/libraryV2")?.({
        docChanges: () => [{
          type: "modified",
          doc: { id: "saved-title", data: () => ({
            _deleted: true,
            deletedAt: "2026-10-07T00:00:00.000Z",
            id: "saved-title",
            sourceId: "source",
            mangaId: "manga",
          }) },
        }],
      });
    });

    expect(useLibraryStore.getState().items["saved-title"]).toEqual(newerItem);
  });

  it("keeps a newer re-add with a different saved title ID when a stale tombstone arrives", async () => {
    renderHook(() => useSync({ autoSync: false }));
    await waitFor(() => expect(mocks.listeners.has("users/user-a/libraryV2")).toBe(true));
    const readdedItem = { ...libraryItem("2026-10-08T00:00:00.000Z"), id: "new-saved-title" };

    act(() => {
      useLibraryStore.setState({ items: { "new-saved-title": readdedItem } });
      mocks.listeners.get("users/user-a/libraryV2")?.({
        docChanges: () => [{
          type: "modified",
          doc: { id: "old-saved-title", data: () => ({
            _deleted: true,
            deletedAt: "2026-10-07T00:00:00.000Z",
            id: "old-saved-title",
            sourceId: "source",
            mangaId: "manga",
          }) },
        }],
      });
    });

    expect(useLibraryStore.getState().items["new-saved-title"]).toEqual(readdedItem);
  });

  it("keeps newer local history progress when an older realtime tombstone arrives", async () => {
    renderHook(() => useSync({ autoSync: false }));
    await waitFor(() => expect(mocks.listeners.has("users/user-a/history")).toBe(true));
    const newerItem = historyItem(2000);

    act(() => {
      useHistoryStore.setState({ items: { "source::manga::chapter": newerItem } });
      mocks.listeners.get("users/user-a/history")?.({
        docChanges: () => [{
          type: "modified",
          doc: { id: "source::manga::chapter", data: () => ({
            _deleted: true,
            deletedAt: 1000,
            sourceId: "source",
            mangaId: "manga",
            chapterId: "chapter",
          }) },
        }],
      });
    });

    expect(useHistoryStore.getState().items["source::manga::chapter"]).toEqual(newerItem);
  });

  it("lets a newer or equal remote tombstone remove stale local data instead of re-uploading it", async () => {
    mocks.snapshots.set("users/user-a/libraryV2", snapshot([[
      "saved-title", { ...libraryItem("2026-10-01T00:00:00.000Z"), _deleted: true, deletedAt: "2026-10-07T00:00:00.000Z" },
    ]]));
    useLibraryStore.setState({ items: { "saved-title": libraryItem("2026-10-07T00:00:00.000Z") } });
    const { result } = renderHook(() => useSync({ autoSync: false }));

    await act(async () => { await result.current.runFullSync(); });

    expect(useLibraryStore.getState().items).toEqual({});
    expect(mocks.writes).not.toContainEqual(expect.objectContaining({ path: "users/user-a/libraryV2/saved-title" }));
  });

  it("allows a newer local re-add and an offline-created item to overwrite or create canonical documents", async () => {
    mocks.snapshots.set("users/user-a/libraryV2", snapshot([[
      "saved-title", { ...libraryItem("2026-10-01T00:00:00.000Z"), _deleted: true, deletedAt: "2026-10-02T00:00:00.000Z" },
    ]]));
    useLibraryStore.setState({
      items: {
        "saved-title": libraryItem("2026-10-03T00:00:00.000Z"),
        "offline-title": { ...libraryItem("2026-10-03T00:00:00.000Z"), id: "offline-title", mangaId: "offline" },
      },
    });
    const { result } = renderHook(() => useSync({ autoSync: false }));

    await act(async () => { await result.current.runFullSync(); });

    expect(mocks.writes).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: "users/user-a/libraryV2/saved-title", data: expect.objectContaining({ id: "saved-title" }) }),
      expect.objectContaining({ path: "users/user-a/libraryV2/offline-title" }),
    ]));
  });

  it("does not re-import stale legacy live records over a canonical tombstone by either ID or source identity", async () => {
    mocks.snapshots.set("users/user-a/libraryV2", snapshot([[
      "deleted-title", {
        _deleted: true,
        deletedAt: "2026-10-08T00:00:00.000Z",
        id: "deleted-title",
        sourceId: "source",
        mangaId: "manga",
      },
    ]]));
    mocks.snapshots.set("users/user-a/library", snapshot([
      ["deleted-title", { ...libraryItem("2026-10-07T00:00:00.000Z"), id: "deleted-title" }],
      ["legacy-alias", { ...libraryItem("2026-10-07T00:00:00.000Z"), id: "legacy-alias" }],
    ]));
    const { result } = renderHook(() => useSync({ autoSync: false }));

    await act(async () => { await result.current.runFullSync(); });

    expect(mocks.writes).not.toContainEqual(expect.objectContaining({ path: "users/user-a/libraryV2/deleted-title" }));
    expect(mocks.writes).not.toContainEqual(expect.objectContaining({ path: "users/user-a/libraryV2/legacy-alias" }));
  });

  it("uses the newest matching canonical tombstone when importing legacy records", async () => {
    mocks.snapshots.set("users/user-a/libraryV2", snapshot([
      ["old-tombstone", {
        _deleted: true,
        deletedAt: "2026-10-01T00:00:00.000Z",
        id: "old-tombstone",
        sourceId: "source",
        mangaId: "manga",
      }],
      ["new-tombstone", {
        _deleted: true,
        deletedAt: "2026-10-09T00:00:00.000Z",
        id: "new-tombstone",
        sourceId: "source",
        mangaId: "manga",
      }],
    ]));
    mocks.snapshots.set("users/user-a/library", snapshot([[
      "legacy-alias", { ...libraryItem("2026-10-08T00:00:00.000Z"), id: "legacy-alias" },
    ]]));
    const { result } = renderHook(() => useSync({ autoSync: false }));

    await act(async () => { await result.current.runFullSync(); });

    expect(mocks.writes).not.toContainEqual(expect.objectContaining({ path: "users/user-a/libraryV2/legacy-alias" }));
  });

  it("removes stale local history when a newer history tombstone is found during full sync", async () => {
    mocks.snapshots.set("users/user-a/history", snapshot([[
      "source::manga::chapter", {
        _deleted: true,
        deletedAt: 2000,
        sourceId: "source",
        mangaId: "manga",
        chapterId: "chapter",
      },
    ]]));
    useHistoryStore.setState({ items: { "source::manga::chapter": historyItem(1000) } });
    const { result } = renderHook(() => useSync({ autoSync: false }));

    await act(async () => { await result.current.runFullSync(); });

    expect(useHistoryStore.getState().items).toEqual({});
    expect(mocks.writes).not.toContainEqual(expect.objectContaining({ path: "users/user-a/history/source::manga::chapter" }));
  });

  it("writes newer local history progress over an older history tombstone during full sync", async () => {
    mocks.snapshots.set("users/user-a/history", snapshot([[
      "source::manga::chapter", {
        _deleted: true,
        deletedAt: 1000,
        sourceId: "source",
        mangaId: "manga",
        chapterId: "chapter",
      },
    ]]));
    useHistoryStore.setState({ items: { "source::manga::chapter": historyItem(2000) } });
    const { result } = renderHook(() => useSync({ autoSync: false }));

    await act(async () => { await result.current.runFullSync(); });

    expect(mocks.writes).toContainEqual(expect.objectContaining({
      path: "users/user-a/history/source::manga::chapter",
      data: expect.objectContaining({ readAt: 2000 }),
    }));
  });

  it("coalesces overlapping work, retries after failure, and uses state current at invocation time", async () => {
    let rejectFirst: ((error: Error) => void) | undefined;
    mocks.firestore.getDocs.mockImplementationOnce(() => new Promise((_, reject) => { rejectFirst = reject; }));
    const { result } = renderHook(() => useSync({ autoSync: false }));
    useLibraryStore.setState({ items: { "saved-title": libraryItem() } });

    let first: Promise<void>;
    let second: Promise<void>;
    act(() => {
      first = result.current.runFullSync();
      second = result.current.runFullSync();
    });
    expect(first!).toBe(second!);
    await waitFor(() => expect(rejectFirst).toBeTypeOf("function"));
    await act(async () => {
      rejectFirst!(new Error("offline"));
      await expect(first!).rejects.toThrow("offline");
    });

    await act(async () => { await result.current.runFullSync(); });
    expect(mocks.writes).toContainEqual(expect.objectContaining({ path: "users/user-a/libraryV2/saved-title" }));
  });

  it("keeps every hook caller in the syncing state while sharing one UID operation", async () => {
    let resolveLibrary: ((value: ReturnType<typeof snapshot>) => void) | undefined;
    mocks.firestore.getDocs.mockImplementation((reference: { path: string }) => {
      if (reference.path === "users/user-a/libraryV2") {
        return new Promise((resolve) => { resolveLibrary = resolve; });
      }
      return Promise.resolve(snapshot([]));
    });
    const first = renderHook(() => useSync({ autoSync: false }));
    const second = renderHook(() => useSync({ autoSync: false }));

    let firstOperation: Promise<void>;
    let secondOperation: Promise<void>;
    act(() => {
      firstOperation = first.result.current.runFullSync();
      secondOperation = second.result.current.runFullSync();
    });

    const sharedOperation = firstOperation! === secondOperation!;
    const firstWasSyncing = first.result.current.isSyncing;
    const secondWasSyncing = second.result.current.isSyncing;

    await waitFor(() => expect(resolveLibrary).toBeTypeOf("function"));
    await act(async () => { resolveLibrary!(snapshot([])); await firstOperation!; });
    expect(sharedOperation).toBe(true);
    expect(firstWasSyncing).toBe(true);
    expect(secondWasSyncing).toBe(true);
    expect(first.result.current.isSyncing).toBe(false);
    expect(second.result.current.isSyncing).toBe(false);
  });

  it("reads the current store state for an online retry", async () => {
    const { result } = renderHook(() => useSync({ autoSync: true }));
    await waitFor(() => expect(mocks.firestore.getDocs).toHaveBeenCalledWith(
      expect.objectContaining({ path: "users/user-a/libraryV2" }),
    ));
    await waitFor(() => expect(result.current.isSyncing).toBe(false));
    mocks.writes.length = 0;
    useLibraryStore.setState({ items: { "saved-title": libraryItem() } });

    act(() => { window.dispatchEvent(new Event("online")); });

    await waitFor(() => expect(mocks.writes).toContainEqual(expect.objectContaining({
      path: "users/user-a/libraryV2/saved-title",
    })));
  });

  it("starts an initial sync for a directly changed UID without applying the prior user's result", async () => {
    let resolveFirstLibrary: ((value: ReturnType<typeof snapshot>) => void) | undefined;
    mocks.firestore.getDocs.mockImplementation((reference: { path: string }) => {
      if (reference.path === "users/user-a/libraryV2") {
        return new Promise((resolve) => { resolveFirstLibrary = resolve; });
      }
      return Promise.resolve(snapshot([]));
    });
    const { rerender } = renderHook(() => useSync({ autoSync: true }));
    await waitFor(() => expect(resolveFirstLibrary).toBeTypeOf("function"));

    mocks.user = { uid: "user-b" };
    rerender();
    await waitFor(() => expect(mocks.firestore.getDocs).toHaveBeenCalledWith(expect.objectContaining({ path: "users/user-b/libraryV2" })));
    act(() => resolveFirstLibrary!(snapshot([["saved-title", libraryItem("2026-10-08T00:00:00.000Z")]])));

    await waitFor(() => expect(useLibraryStore.getState().items).toEqual({}));
  });

  it("does not clear a new UID's syncing state when the prior UID operation finishes", async () => {
    let resolveUserA: ((value: ReturnType<typeof snapshot>) => void) | undefined;
    let resolveUserB: ((value: ReturnType<typeof snapshot>) => void) | undefined;
    mocks.firestore.getDocs.mockImplementation((reference: { path: string }) => {
      if (reference.path === "users/user-a/libraryV2") {
        return new Promise((resolve) => { resolveUserA = resolve; });
      }
      if (reference.path === "users/user-b/libraryV2") {
        return new Promise((resolve) => { resolveUserB = resolve; });
      }
      return Promise.resolve(snapshot([]));
    });
    const { result, rerender } = renderHook(() => useSync({ autoSync: true }));
    await waitFor(() => expect(resolveUserA).toBeTypeOf("function"));

    mocks.user = { uid: "user-b" };
    rerender();
    await waitFor(() => expect(resolveUserB).toBeTypeOf("function"));
    expect(result.current.isSyncing).toBe(true);

    await act(async () => { resolveUserA!(snapshot([])); });
    expect(result.current.isSyncing).toBe(true);

    await act(async () => { resolveUserB!(snapshot([])); });
    await waitFor(() => expect(result.current.isSyncing).toBe(false));
  });

  it("rejects manual sync when its Firestore batch commit fails", async () => {
    mocks.firestore.writeBatch.mockImplementationOnce(() => ({
      set: (reference: { path: string }, data: unknown) => mocks.writes.push({ path: reference.path, data }),
      commit: vi.fn(async () => { throw new Error("write failed"); }),
    }));
    useLibraryStore.setState({ items: { "saved-title": libraryItem() } });
    const { result } = renderHook(() => useSync({ autoSync: false }));

    await act(async () => {
      await expect(result.current.runFullSync()).rejects.toThrow("write failed");
    });
  });

  it("rejects manual sync when Firebase is unavailable", async () => {
    vi.mocked(initFirebase).mockResolvedValue({ db: null } as never);
    const { result } = renderHook(() => useSync({ autoSync: false }));

    await act(async () => {
      await expect(result.current.runFullSync()).rejects.toThrow(/Firebase/i);
    });
  });
});
