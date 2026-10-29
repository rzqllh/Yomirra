import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as React from "react";
import { GuestMergeDialog } from "../guest-merge-dialog";
import { useGuestMergeStore } from "@/shared/store/guest-merge-store";
import { useLibraryStore, LibraryItem } from "@/shared/store/library-store";
import { useHistoryStore, HistoryItem } from "@/shared/store/history-store";
import { useSyncDiagnosticsStore } from "@/shared/store/sync-diagnostics-store";
import { getLocalDataOwnerUid, clearLocalDataOwnerUid } from "@/shared/lib/local-data-owner";
import { restoreGuestBackup } from "@/shared/lib/guest-merge-engine";
import { toast } from "sonner";

const mockLogout = vi.fn();
vi.mock("@/shared/hooks/use-auth", () => ({
  useAuth: () => ({
    logout: mockLogout,
    user: null,
    loading: false,
    loginWithGoogle: vi.fn(),
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

const mockBatchCommit = vi.fn();
const mockBatchSet = vi.fn();

vi.mock("@/shared/lib/firebase", () => ({
  initFirebase: vi.fn(async () => ({
    db: { _isMockDb: true },
    auth: null,
    app: null,
  })),
}));

vi.mock("@/shared/lib/firestore-runtime", () => ({
  loadFirestore: vi.fn(async () => ({
    doc: vi.fn((_db, path, id) => ({ path, id })),
    writeBatch: vi.fn(() => ({
      set: mockBatchSet,
      commit: mockBatchCommit,
    })),
  })),
}));

describe("GuestMergeDialog Production Regression Suite (Q64 & Q127)", () => {
  const sampleUser = {
    uid: "test-uid-100",
    displayName: "Hafizh",
    email: "hafizh@yomirra.test",
  };

  const sampleGuestLib: Record<string, LibraryItem> = {
    "local-manga-1": {
      id: "local-manga-1",
      sourceId: "mangadex",
      mangaId: "m1",
      title: "Solo Leveling (Local)",
      addedAt: "2026-10-20T00:00:00Z",
      updatedAt: "2026-10-20T00:00:00Z",
    },
  };

  const sampleGuestHist: Record<string, HistoryItem> = {
    "mangadex::m1::ch-1": {
      sourceId: "mangadex",
      mangaId: "m1",
      chapterId: "ch-1",
      mangaTitle: "Solo Leveling (Local)",
      readAt: 1700000000,
      progressPercent: 100,
    },
  };

  const sampleCloudLib: Record<string, LibraryItem> = {
    "cloud-manga-2": {
      id: "cloud-manga-2",
      sourceId: "mangadex",
      mangaId: "m2",
      title: "Omniscient Reader (Cloud)",
      addedAt: "2026-10-22T00:00:00Z",
      updatedAt: "2026-10-22T00:00:00Z",
    },
  };

  const sampleCloudHist: Record<string, HistoryItem> = {
    "mangadex::m2::ch-5": {
      sourceId: "mangadex",
      mangaId: "m2",
      chapterId: "ch-5",
      mangaTitle: "Omniscient Reader (Cloud)",
      readAt: 1700500000,
      progressPercent: 50,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    clearLocalDataOwnerUid();
    useLibraryStore.setState({ items: { ...sampleGuestLib } });
    useHistoryStore.setState({ items: { ...sampleGuestHist } });
    useSyncDiagnosticsStore.getState().resetDiagnostics();
    useGuestMergeStore.getState().cancelMergeReview();

    mockBatchCommit.mockReset();
    mockBatchSet.mockReset();
    mockBatchCommit.mockResolvedValue(undefined);
  });

  it("does NOT claim success when Firestore commit fails, rolls back local state, and retains guest ownership", async () => {
    // 1. Arrange failing Firestore commit
    mockBatchCommit.mockRejectedValue(new Error("Firestore UNAVAILABLE: connection refused"));

    useGuestMergeStore.getState().startMergeReview({
      user: sampleUser,
      guestSnapshot: { library: sampleGuestLib, history: sampleGuestHist },
      cloudSnapshot: { library: sampleCloudLib, history: sampleCloudHist },
      diff: {
        hasGuestData: true,
        hasCloudData: true,
        guestOnlyLibrary: [sampleGuestLib["local-manga-1"]],
        cloudOnlyLibrary: [sampleCloudLib["cloud-manga-2"]],
        conflictingLibrary: [],
        guestOnlyHistoryCount: 1,
        cloudOnlyHistoryCount: 1,
        conflictingHistoryCount: 0,
        totalMergedLibraryCount: 2,
        totalMergedHistoryCount: 2,
      },
    });

    render(<GuestMergeDialog />);

    // 2. Action: Click Apply
    const submitBtn = screen.getByRole("button", { name: /Terapkan & Lanjutkan/i });
    fireEvent.click(submitBtn);

    // 3. Assertions:
    await waitFor(() => {
      // Must NOT record successful commit
      expect(useSyncDiagnosticsStore.getState().lifecycleState).not.toBe("successful commit");
      // Toast error must be called
      expect(toast.error).toHaveBeenCalledWith(
        "Penyelarasan Gagal",
        expect.objectContaining({
          description: expect.stringContaining("Firestore UNAVAILABLE"),
        })
      );
    });

    // Local stores must be rolled back to pre-merge guest state!
    expect(useLibraryStore.getState().items["local-manga-1"]).toBeDefined();
    expect(useLibraryStore.getState().items["cloud-manga-2"]).toBeUndefined();

    // Owner UID must NOT be stolen/set to user-100!
    expect(getLocalDataOwnerUid()).toBeNull();
  });

  it("commits merged data to Firestore and records honest success only after write succeeds", async () => {
    mockBatchCommit.mockResolvedValue(undefined);

    useGuestMergeStore.getState().startMergeReview({
      user: sampleUser,
      guestSnapshot: { library: sampleGuestLib, history: sampleGuestHist },
      cloudSnapshot: { library: sampleCloudLib, history: sampleCloudHist },
      diff: {
        hasGuestData: true,
        hasCloudData: true,
        guestOnlyLibrary: [sampleGuestLib["local-manga-1"]],
        cloudOnlyLibrary: [sampleCloudLib["cloud-manga-2"]],
        conflictingLibrary: [],
        guestOnlyHistoryCount: 1,
        cloudOnlyHistoryCount: 1,
        conflictingHistoryCount: 0,
        totalMergedLibraryCount: 2,
        totalMergedHistoryCount: 2,
      },
    });

    render(<GuestMergeDialog />);

    const submitBtn = screen.getByRole("button", { name: /Terapkan & Lanjutkan/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockBatchCommit).toHaveBeenCalledTimes(1);
      expect(toast.success).toHaveBeenCalledWith(
        "Data Berhasil Digabungkan & Tersinkron!",
        expect.anything()
      );
    });

    // Owner UID must now be set to user
    expect(getLocalDataOwnerUid()).toBe(sampleUser.uid);

    // Diagnostics must record honest successfulWriteCount and verifiedReadCount
    const diagState = useSyncDiagnosticsStore.getState();
    expect(diagState.lifecycleState).toBe("successful commit");
    expect(diagState.domainRecords["library"].successfulWriteCount).toBe(2);
    expect(diagState.domainRecords["library"].verifiedReadCount).toBe(1);

    // Local state must contain both merged items
    const mergedLib = useLibraryStore.getState().items;
    expect(mergedLib["local-manga-1"]).toBeDefined();
    expect(mergedLib["cloud-manga-2"]).toBeDefined();
  });

  it("blocks repeat merge after a partial cloud commit until a fresh cloud snapshot is read", async () => {
    const largeGuest = Object.fromEntries(Array.from({ length: 402 }, (_, index) => [
      `chapter-${index}`,
      {
        id: `chapter-${index}`,
        sourceId: "test",
        mangaId: `manga-${index}`,
        title: `Title ${index}`,
        addedAt: "2026-10-20T00:00:00Z",
        updatedAt: "2026-10-20T00:00:00Z",
      } as LibraryItem,
    ]));
    mockBatchCommit.mockResolvedValueOnce(undefined).mockRejectedValue(new Error("quota"));
    useGuestMergeStore.getState().startMergeReview({
      user: sampleUser,
      guestSnapshot: { library: largeGuest, history: {} },
      cloudSnapshot: { library: {}, history: {} },
      diff: {
        hasGuestData: true,
        hasCloudData: false,
        guestOnlyLibrary: Object.values(largeGuest),
        cloudOnlyLibrary: [],
        conflictingLibrary: [],
        guestOnlyHistoryCount: 0,
        cloudOnlyHistoryCount: 0,
        conflictingHistoryCount: 0,
        totalMergedLibraryCount: 402,
        totalMergedHistoryCount: 0,
      },
    });
    render(<GuestMergeDialog />);
    const apply = screen.getByRole("button", { name: /Terapkan & Lanjutkan/i });
    fireEvent.click(apply);
    await waitFor(() => {
      expect(screen.getByText(/Sebagian perubahan mungkin sudah masuk ke cloud/i)).toBeTruthy();
      expect(screen.getByRole("button", { name: /Periksa Ulang Data Cloud/i })).toBeTruthy();
      expect(apply.hasAttribute("disabled")).toBe(true);
    });
    expect(mockBatchCommit).toHaveBeenCalledTimes(4); // 1 success + 3 failed retries
    expect(getLocalDataOwnerUid()).toBeNull();
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("enforces fail-closed protection when snapshot fails and allows cancel to return to guest", async () => {
    useGuestMergeStore.getState().setMergeError({
      user: sampleUser,
      errorMessage: "Firestore quota exceeded",
    });

    render(<GuestMergeDialog />);

    expect(screen.getByText(/Gagal Membaca Data Cloud/i)).toBeTruthy();
    expect(screen.getByText(/Firestore quota exceeded/i)).toBeTruthy();

    // Local data owner UID remains null (guest)
    expect(getLocalDataOwnerUid()).toBeNull();

    // Click "Batalkan Masuk Akun"
    const cancelBtn = screen.getByRole("button", { name: /Batalkan Masuk Akun/i });
    fireEvent.click(cancelBtn);

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalledTimes(1);
      expect(useGuestMergeStore.getState().isMergePending).toBe(false);
      expect(useGuestMergeStore.getState().mergeError).toBeNull();
    });

    // Local data remains unchanged
    expect(useLibraryStore.getState().items["local-manga-1"]).toBeDefined();
    expect(getLocalDataOwnerUid()).toBeNull();
  });

  it("safeguards Cloud-Replace with destructive confirmation and creates local backup before replacing", async () => {
    useGuestMergeStore.getState().startMergeReview({
      user: sampleUser,
      guestSnapshot: { library: sampleGuestLib, history: sampleGuestHist },
      cloudSnapshot: { library: sampleCloudLib, history: sampleCloudHist },
      diff: {
        hasGuestData: true,
        hasCloudData: true,
        guestOnlyLibrary: [sampleGuestLib["local-manga-1"]],
        cloudOnlyLibrary: [sampleCloudLib["cloud-manga-2"]],
        conflictingLibrary: [],
        guestOnlyHistoryCount: 1,
        cloudOnlyHistoryCount: 1,
        conflictingHistoryCount: 0,
        totalMergedLibraryCount: 2,
        totalMergedHistoryCount: 2,
      },
    });

    render(<GuestMergeDialog />);

    // Select Cloud-Replace option
    const cloudReplaceBtn = screen.getByText(/2\. Gunakan Data Cloud/i);
    fireEvent.click(cloudReplaceBtn);

    const submitBtn = screen.getByRole("button", { name: /Terapkan & Lanjutkan/i });

    // Submit button is disabled before checking destructive confirmation!
    expect(submitBtn.hasAttribute("disabled")).toBe(true);
    expect(getLocalDataOwnerUid()).toBeNull();

    // Check confirmation checkbox
    const confirmCheckbox = screen.getByRole("checkbox");
    fireEvent.click(confirmCheckbox);

    // Button is now enabled
    expect(submitBtn.hasAttribute("disabled")).toBe(false);

    // Apply with confirmation
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        "Data Cloud Berhasil Diterapkan",
        expect.anything()
      );
    });

    // Verify backup can be restored!
    const restored = restoreGuestBackup();
    expect(restored).not.toBeNull();
    expect(restored?.library["local-manga-1"]).toBeDefined();

    // Final local store has cloud items only
    expect(useLibraryStore.getState().items["cloud-manga-2"]).toBeDefined();
    expect(useLibraryStore.getState().items["local-manga-1"]).toBeUndefined();
    expect(getLocalDataOwnerUid()).toBe(sampleUser.uid);
  });
});
