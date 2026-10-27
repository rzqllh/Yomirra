import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  commitMergedDataToFirestore,
  PartialBatchCommitError,
} from "../firestore-merge-committer";
import type { LibraryItem } from "@/shared/store/library-store";
import type { HistoryItem } from "@/shared/store/history-store";

const mockCommit = vi.fn().mockResolvedValue(undefined);
const mockSet = vi.fn();
const mockBatch = {
  set: mockSet,
  commit: mockCommit,
};

vi.mock("@/shared/lib/firebase", () => ({
  initFirebase: vi.fn(async () => ({
    auth: null,
    app: null,
    db: { id: "mock-db" },
  })),
}));

vi.mock("@/shared/lib/firestore-runtime", () => ({
  loadFirestore: vi.fn(async () => ({
    doc: vi.fn((_, p) => ({ path: p })),
    writeBatch: vi.fn(() => mockBatch),
  })),
}));

describe("FirestoreMergeCommitter (Q64/Q127 Sequential Batch Safety)", () => {
  beforeEach(() => {
    localStorage.clear();
    mockCommit.mockReset().mockResolvedValue(undefined);
    mockSet.mockReset();
  });

  it("successfully commits library and history items sequentially with accurate write metrics", async () => {
    const library: Record<string, LibraryItem> = {
      m1: { id: "m1", title: "Manga 1" } as LibraryItem,
      m2: { id: "m2", title: "Manga 2" } as LibraryItem,
    };
    const history: Record<string, HistoryItem> = {
      h1: { mangaId: "m1", chapterId: "c1", readAt: 1000 } as HistoryItem,
    };

    const res = await commitMergedDataToFirestore({
      uid: "user-test-1",
      library,
      history,
    });

    expect(res.libraryWrites).toBe(2);
    expect(res.historyWrites).toBe(1);
    expect(res.totalWrites).toBe(3);
    expect(mockCommit).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem("yomirra_merge_recovery_user-test-1")).toBeNull();
  });

  it("saves recovery journal in localStorage and throws PartialBatchCommitError when batch fails after retries", async () => {
    mockCommit.mockRejectedValue(new Error("Firestore write quota exceeded"));

    const library: Record<string, LibraryItem> = {
      m1: { id: "m1", title: "Manga Fail" } as LibraryItem,
    };

    await expect(
      commitMergedDataToFirestore({
        uid: "user-fail",
        library,
        history: {},
      })
    ).rejects.toThrow(PartialBatchCommitError);

    // Verify recovery journal was stored in localStorage
    const rawJournal = localStorage.getItem("yomirra_merge_recovery_user-fail");
    expect(rawJournal).not.toBeNull();
    const journal = JSON.parse(rawJournal!);
    expect(journal.status).toBe("failed");
    expect(journal.uid).toBe("user-fail");
    expect(journal.completedBatches).toBe(0);
  });
});
