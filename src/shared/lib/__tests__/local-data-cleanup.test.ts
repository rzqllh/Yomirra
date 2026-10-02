import { beforeEach, describe, expect, it, vi } from "vitest";
import { setLocalDataOwnerUid } from "../local-data-owner";
import { useCollectionStore } from "@/shared/store/collection-store";
import { useDownloadStore } from "@/shared/store/download-store";
import { useHistoryStore } from "@/shared/store/history-store";
import { useLibraryStore } from "@/shared/store/library-store";
import { useSettingsStore } from "@/shared/store/settings-store";
import { useSourcePreferencesStore } from "@/shared/store/source-preferences-store";
import { useStatsStore } from "@/shared/store/stats-store";
import { useUpdateStore } from "@/shared/store/update-store";

const firebaseMocks = vi.hoisted(() => ({
  terminate: vi.fn(async () => undefined),
  clearIndexedDbPersistence: vi.fn(async () => undefined),
}));

vi.mock("@/shared/lib/firebase", () => ({
  initFirebase: vi.fn(async () => ({ auth: null, app: null, db: { id: "db" } })),
}));

vi.mock("firebase/firestore", () => ({
  terminate: firebaseMocks.terminate,
  clearIndexedDbPersistence: firebaseMocks.clearIndexedDbPersistence,
}));

import { clearSharedDeviceData } from "../local-data-cleanup";

describe("shared-device cleanup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();

    useHistoryStore.setState({ items: { history: {} as never } });
    useLibraryStore.setState({ items: { library: {} as never } });
    useCollectionStore.setState({
      collections: [{ id: "c1", name: "Private" } as never],
      membershipsByManga: { manga: ["c1"] },
      readingStatusByManga: { manga: "reading" as never },
    });
    useUpdateStore.setState({ items: { update: {} as never } });
    useStatsStore.setState({ totalReadingTimeMs: 12345 });
    useSourcePreferencesStore.setState({
      disabledSources: ["source-a"],
      hiddenFromHomeSources: ["source-b"],
    });
    useSettingsStore.setState({
      lastSyncedAt: "2026-10-02T00:00:00.000Z",
      mutedMangaKeys: ["manga"],
      perTitleSourcePreferences: { manga: "source-a" },
      guestBannerSnoozedUntil: 123,
      guestBannerDismissCount: 2,
    });
    useDownloadStore.setState({
      downloads: {
        download: {
          id: "download",
          sourceId: "source-a",
          mangaId: "manga",
          mangaTitle: "Manga",
          chapterId: "chapter",
          chapterTitle: "Chapter",
          status: "downloaded",
          progress: 100,
          totalPages: 1,
          downloadedPages: 1,
          pages: [],
          createdAt: 1,
          updatedAt: 1,
        },
      },
      queue: [],
      activeDownloads: [],
    });

    setLocalDataOwnerUid("uid-a");
    sessionStorage.setItem("yomirra-virtualizer-cache-source-manga-chapter", "[]");
    sessionStorage.setItem("unrelated-key", "keep");
  });

  it("clears local reading data, downloads, reader session traces, ownership, and Firestore persistence", async () => {
    await clearSharedDeviceData();

    expect(useHistoryStore.getState().items).toEqual({});
    expect(useLibraryStore.getState().items).toEqual({});
    expect(useCollectionStore.getState().collections).toEqual([]);
    expect(useUpdateStore.getState().items).toEqual({});
    expect(useStatsStore.getState().totalReadingTimeMs).toBe(0);
    expect(useSourcePreferencesStore.getState().disabledSources).toEqual([]);
    expect(useDownloadStore.getState().downloads).toEqual({});

    expect(useSettingsStore.getState().lastSyncedAt).toBeNull();
    expect(useSettingsStore.getState().mutedMangaKeys).toEqual([]);
    expect(useSettingsStore.getState().perTitleSourcePreferences).toEqual({});

    expect(localStorage.getItem("yomirra-local-data-owner-uid")).toBeNull();
    expect(
      sessionStorage.getItem("yomirra-virtualizer-cache-source-manga-chapter")
    ).toBeNull();
    expect(sessionStorage.getItem("unrelated-key")).toBe("keep");

    expect(firebaseMocks.terminate).toHaveBeenCalledTimes(1);
    expect(firebaseMocks.clearIndexedDbPersistence).toHaveBeenCalledTimes(1);
  });
});
