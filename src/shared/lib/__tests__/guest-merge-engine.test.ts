import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  computeMergeDiff,
  resolveMergedState,
  executeGuestMerge,
  GuestSnapshot,
  CloudSnapshot,
} from "../guest-merge-engine";
import { useLibraryStore, LibraryItem } from "@/shared/store/library-store";
import { useHistoryStore, HistoryItem } from "@/shared/store/history-store";
import { getLocalDataOwnerUid, clearLocalDataOwnerUid } from "@/shared/lib/local-data-owner";

describe("GuestMergeEngine (Q64 Engine)", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    clearLocalDataOwnerUid();
    useLibraryStore.setState({ items: {} });
    useHistoryStore.setState({ items: {} });
  });

  describe("computeMergeDiff", () => {
    it("accurately detects additions, deletions, and conflicts with Q52 resolution details", () => {
      const guest: GuestSnapshot = {
        library: {
          "manga-1": {
            id: "manga-1",
            title: "Solo Leveling",
            sourceId: "mangadex",
            mangaId: "sl-1",
            highestMilestoneIndex: 120,
            highestMilestoneChapterTitle: "Ch. 120",
            lastReadChapterTitle: "Ch. 120",
            updatedAt: "2026-10-20T10:00:00Z",
          } as LibraryItem,
          "manga-guest-only": {
            id: "manga-guest-only",
            title: "Guest Exclusive Manga",
            sourceId: "mangadex",
            mangaId: "gem-1",
            updatedAt: "2026-10-21T10:00:00Z",
          } as LibraryItem,
        },
        history: {
          "manga-1::ch-10": {
            sourceId: "mangadex",
            mangaId: "sl-1",
            mangaTitle: "Solo Leveling",
            chapterId: "ch-10",
            readAt: 1000,
          } as HistoryItem,
        },
      };

      const cloud: CloudSnapshot = {
        library: {
          "manga-1": {
            id: "manga-1",
            title: "Solo Leveling",
            sourceId: "mangadex",
            mangaId: "sl-1",
            highestMilestoneIndex: 80,
            highestMilestoneChapterTitle: "Ch. 80",
            lastReadChapterTitle: "Ch. 80",
            updatedAt: "2026-10-18T10:00:00Z",
          } as LibraryItem,
          "manga-cloud-only": {
            id: "manga-cloud-only",
            title: "Cloud Exclusive Manga",
            sourceId: "mangadex",
            mangaId: "cem-1",
            updatedAt: "2026-10-19T10:00:00Z",
          } as LibraryItem,
        },
        history: {},
      };

      const diff = computeMergeDiff(guest, cloud);

      expect(diff.hasGuestData).toBe(true);
      expect(diff.hasCloudData).toBe(true);
      expect(diff.guestOnlyLibrary).toHaveLength(1);
      expect(diff.guestOnlyLibrary[0].id).toBe("manga-guest-only");
      expect(diff.cloudOnlyLibrary).toHaveLength(1);
      expect(diff.cloudOnlyLibrary[0].id).toBe("manga-cloud-only");

      expect(diff.conflictingLibrary).toHaveLength(1);
      const conflict = diff.conflictingLibrary[0];
      expect(conflict.id).toBe("manga-1");
      expect(conflict.guestMilestoneIndex).toBe(120);
      expect(conflict.cloudMilestoneIndex).toBe(80);
      expect(conflict.resolvedMilestoneChapter).toBe("Ch. 120");
      expect(conflict.resolutionReason).toContain("Q52 dipertahankan");
    });
  });

  describe("resolveMergedState (Q52 & Q63 Contracts)", () => {
    it("preserves highest verified milestone index and chapter (Q52)", () => {
      const guest: GuestSnapshot = {
        library: {
          "manga-1": {
            id: "manga-1",
            title: "One Piece",
            sourceId: "mangadex",
            mangaId: "op-1",
            highestMilestoneIndex: 1100,
            highestMilestoneChapterId: "ch-1100",
            highestMilestoneChapterTitle: "Chapter 1100",
            lastReadChapterId: "ch-1100",
            lastReadAt: "2026-10-25T10:00:00Z",
            updatedAt: "2026-10-25T10:00:00Z",
          } as LibraryItem,
        },
        history: {},
      };

      const cloud: CloudSnapshot = {
        library: {
          "manga-1": {
            id: "manga-1",
            title: "One Piece",
            sourceId: "mangadex",
            mangaId: "op-1",
            highestMilestoneIndex: 1105,
            highestMilestoneChapterId: "ch-1105",
            highestMilestoneChapterTitle: "Chapter 1105",
            lastReadChapterId: "ch-1105",
            lastReadAt: "2026-10-26T10:00:00Z",
            updatedAt: "2026-10-26T10:00:00Z",
          } as LibraryItem,
        },
        history: {},
      };

      const resolved = resolveMergedState(guest, cloud);
      const item = resolved.library["manga-1"];

      expect(item.highestMilestoneIndex).toBe(1105);
      expect(item.highestMilestoneChapterTitle).toBe("Chapter 1105");
    });

    it("preserves independent chapter cursors for Reading History (Q63)", () => {
      const guest: GuestSnapshot = {
        library: {},
        history: {
          "src::manga::ch-1": {
            sourceId: "src",
            mangaId: "manga",
            mangaTitle: "Test Manga",
            chapterId: "ch-1",
            readAt: 1000,
            progressPercent: 100,
          } as HistoryItem,
          "src::manga::ch-2": {
            sourceId: "src",
            mangaId: "manga",
            mangaTitle: "Test Manga",
            chapterId: "ch-2",
            readAt: 2000,
            progressPercent: 50,
          } as HistoryItem,
        },
      };

      const cloud: CloudSnapshot = {
        library: {},
        history: {
          "src::manga::ch-2": {
            sourceId: "src",
            mangaId: "manga",
            mangaTitle: "Test Manga",
            chapterId: "ch-2",
            readAt: 1500, // older than guest
            progressPercent: 20,
          } as HistoryItem,
          "src::manga::ch-3": {
            sourceId: "src",
            mangaId: "manga",
            mangaTitle: "Test Manga",
            chapterId: "ch-3",
            readAt: 3000,
            progressPercent: 100,
          } as HistoryItem,
        },
      };

      const resolved = resolveMergedState(guest, cloud);

      // All 3 independent chapter cursors must exist!
      expect(Object.keys(resolved.history)).toHaveLength(3);
      expect(resolved.history["src::manga::ch-1"]).toBeDefined();
      expect(resolved.history["src::manga::ch-3"]).toBeDefined();

      // For ch-2, guest was read at 2000 vs cloud 1500, so guest progress (50%) wins
      expect(resolved.history["src::manga::ch-2"].readAt).toBe(2000);
      expect(resolved.history["src::manga::ch-2"].progressPercent).toBe(50);
    });

    it("respects cloud tombstones and prevents resurrection of deleted items", () => {
      const guest: GuestSnapshot = {
        library: {
          "manga-deleted": {
            id: "manga-deleted",
            title: "Deleted Manga",
            updatedAt: "2026-10-10T00:00:00Z",
          } as LibraryItem,
        },
        history: {},
      };

      const cloud: CloudSnapshot = {
        library: {},
        history: {},
        libraryTombstones: {
          "manga-deleted": {
            deletedAt: "2026-10-15T00:00:00Z", // deleted AFTER guest updatedAt
            _deleted: true,
          },
        },
      };

      const resolved = resolveMergedState(guest, cloud);
      expect(resolved.library["manga-deleted"]).toBeUndefined();
    });
  });

  describe("executeGuestMerge Execution & Rollback", () => {
    it("successfully applies Strategy Merge, updates local stores, and switches owner UID", async () => {
      const guest: GuestSnapshot = {
        library: {
          "m1": { id: "m1", title: "Manga 1", highestMilestoneIndex: 10 } as LibraryItem,
        },
        history: {},
      };
      const cloud: CloudSnapshot = {
        library: {
          "m2": { id: "m2", title: "Manga 2", highestMilestoneIndex: 5 } as LibraryItem,
        },
        history: {},
      };

      useLibraryStore.setState({ items: guest.library });

      const commitMock = vi.fn(async () => undefined);

      const result = await executeGuestMerge({
        uid: "user-123",
        strategy: "merge",
        guestSnapshot: guest,
        cloudSnapshot: cloud,
        commitToFirestore: commitMock,
      });

      expect(result.success).toBe(true);
      expect(result.strategy).toBe("merge");
      expect(commitMock).toHaveBeenCalledTimes(1);
      expect(getLocalDataOwnerUid()).toBe("user-123");

      const finalItems = useLibraryStore.getState().items;
      expect(finalItems["m1"]).toBeDefined();
      expect(finalItems["m2"]).toBeDefined();
    });

    it("successfully applies Strategy Cloud-Replace, discarding guest-only items", async () => {
      const guest: GuestSnapshot = {
        library: {
          "guest-only": { id: "guest-only", title: "Guest Manga" } as LibraryItem,
        },
        history: {},
      };
      const cloud: CloudSnapshot = {
        library: {
          "cloud-only": { id: "cloud-only", title: "Cloud Manga" } as LibraryItem,
        },
        history: {},
      };

      useLibraryStore.setState({ items: guest.library });

      const result = await executeGuestMerge({
        uid: "user-456",
        strategy: "cloud-replace",
        guestSnapshot: guest,
        cloudSnapshot: cloud,
      });

      expect(result.success).toBe(true);
      expect(getLocalDataOwnerUid()).toBe("user-456");

      const finalItems = useLibraryStore.getState().items;
      expect(finalItems["guest-only"]).toBeUndefined();
      expect(finalItems["cloud-only"]).toBeDefined();
    });

    it("rolls back local store to pre-merge state when Firestore commit fails", async () => {
      const initialGuestLib = {
        "guest-manga": { id: "guest-manga", title: "Original Guest" } as LibraryItem,
      };
      const cloud: CloudSnapshot = {
        library: {
          "cloud-manga": { id: "cloud-manga", title: "Cloud Manga" } as LibraryItem,
        },
        history: {},
      };

      useLibraryStore.setState({ items: initialGuestLib });

      const failingCommit = vi.fn(async () => {
        throw new Error("Network timeout during Firestore writeBatch commit");
      });

      await expect(
        executeGuestMerge({
          uid: "user-789",
          strategy: "merge",
          guestSnapshot: { library: initialGuestLib, history: {} },
          cloudSnapshot: cloud,
          commitToFirestore: failingCommit,
        })
      ).rejects.toThrow("Network timeout");

      // Verify rollback!
      expect(useLibraryStore.getState().items).toEqual(initialGuestLib);
      // Owner UID must NOT be transitioned on failure!
      expect(getLocalDataOwnerUid()).toBeNull();
    });
    it("aborts Cloud-Replace and throws error when local backup cannot be verified (fail-closed)", async () => {
      const initialGuestLib = {
        "precious-local": { id: "precious-local", title: "Cannot Be Lost" } as LibraryItem,
      };
      const cloud: CloudSnapshot = {
        library: {
          "cloud-item": { id: "cloud-item", title: "Cloud Item" } as LibraryItem,
        },
        history: {},
      };

      useLibraryStore.setState({ items: initialGuestLib });

      vi.spyOn(Storage.prototype, "setItem").mockImplementation((key) => {
        if (typeof key === "string" && key.startsWith("yomirra_guest_backup_")) {
          throw new Error("QuotaExceededError: storage full");
        }
      });

      await expect(
        executeGuestMerge({
          uid: "user-backup-fail",
          strategy: "cloud-replace",
          guestSnapshot: { library: initialGuestLib, history: {} },
          cloudSnapshot: cloud,
        })
      ).rejects.toThrow("Gagal membuat atau memverifikasi backup lokal sebelum Cloud Replace");

      expect(useLibraryStore.getState().items).toEqual(initialGuestLib);
      expect(getLocalDataOwnerUid()).toBeNull();
    });
  });
});
