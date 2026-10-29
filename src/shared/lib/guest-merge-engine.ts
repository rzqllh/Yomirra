export { compareMilestones } from "@/shared/lib/milestone-comparator";
export type { MilestoneComparison } from "@/shared/lib/milestone-comparator";
export { commitMergedDataToFirestore, commitMergedDataSequentially, PartialBatchCommitError, getMergeRecoveryJournal, clearMergeRecoveryJournal } from "@/shared/lib/firestore-merge-committer";
export type { MergeRecoveryJournal } from "@/shared/lib/firestore-merge-committer";
import { compareMilestones } from "@/shared/lib/milestone-comparator";
import { commitMergedDataToFirestore } from "@/shared/lib/firestore-merge-committer";
import type { LibraryItem } from "@/shared/store/library-store";
import type { HistoryItem } from "@/shared/store/history-store";
import { useLibraryStore } from "@/shared/store/library-store";
import { useHistoryStore } from "@/shared/store/history-store";
import { retainHistory } from "./history-retention";
import { setLocalDataOwnerUid } from "@/shared/lib/local-data-owner";

export interface GuestSnapshot {
  library: Record<string, LibraryItem>;
  history: Record<string, HistoryItem>;
}

export interface TombstoneRecord {
  deletedAt: string | number;
  _deleted?: boolean;
}

export interface CloudSnapshot {
  library: Record<string, LibraryItem>;
  history: Record<string, HistoryItem>;
  libraryTombstones?: Record<string, TombstoneRecord>;
  historyTombstones?: Record<string, TombstoneRecord>;
}

export interface ConflictDetail {
  id: string;
  title: string;
  guestChapterTitle?: string;
  cloudChapterTitle?: string;
  guestMilestoneIndex?: number;
  cloudMilestoneIndex?: number;
  resolvedMilestoneChapter: string;
  resolutionReason: string;
}

export interface MergeDiff {
  hasGuestData: boolean;
  hasCloudData: boolean;
  guestOnlyLibrary: LibraryItem[];
  cloudOnlyLibrary: LibraryItem[];
  conflictingLibrary: ConflictDetail[];
  guestOnlyHistoryCount: number;
  cloudOnlyHistoryCount: number;
  conflictingHistoryCount: number;
  totalMergedLibraryCount: number;
  totalMergedHistoryCount: number;
}

export type MergeStrategy = "merge" | "cloud-replace";

export interface MergeExecutionResult {
  success: boolean;
  strategy: MergeStrategy;
  stats: {
    libraryCount: number;
    historyCount: number;
    actualCloudWrites: number;
    libraryWrites: number;
    historyWrites: number;
    conflictsResolved: number;
  };
  backupKey?: string;
}

function getSafeTime(val: string | number | undefined | null): number {
  if (typeof val === "number" && !Number.isNaN(val)) return val;
  if (typeof val === "string") {
    const t = new Date(val).getTime();
    return Number.isNaN(t) ? 0 : t;
  }
  return 0;
}

export function shouldPromptGuestMerge(guest: GuestSnapshot): boolean {
  const libCount = Object.keys(guest?.library || {}).length;
  const histCount = Object.keys(guest?.history || {}).length;
  return libCount > 0 || histCount > 0;
}

export async function fetchCloudSnapshot(uid: string): Promise<CloudSnapshot> {
  const { initFirebase } = await import("@/shared/lib/firebase");
  const { loadFirestore } = await import("@/shared/lib/firestore-runtime");

  const { db: firestore } = await initFirebase();
  if (!firestore) {
    throw new Error("Koneksi Firebase tidak tersedia untuk membaca data cloud.");
  }

  const { collection, getDocs } = await loadFirestore();
  const library: Record<string, LibraryItem> = {};
  const libraryTombstones: Record<string, TombstoneRecord> = {};
  const history: Record<string, HistoryItem> = {};
  const historyTombstones: Record<string, TombstoneRecord> = {};

  try {
    const libSnap = await getDocs(collection(firestore, `users/${uid}/libraryV2`));
    libSnap.forEach((docSnap) => {
      const data = docSnap.data() as Record<string, unknown>;
      if (data._deleted || data._compacted) {
        libraryTombstones[docSnap.id] = {
          deletedAt: (data.deletedAt as string | number) || Date.now(),
          _deleted: true,
        };
      } else {
        library[docSnap.id] = data as unknown as LibraryItem;
      }
    });
  } catch (error) {
    console.error("Failed to fetch cloud library snapshot", error);
    throw error;
  }

  try {
    const histSnap = await getDocs(collection(firestore, `users/${uid}/history`));
    histSnap.forEach((docSnap) => {
      const data = docSnap.data() as Record<string, unknown>;
      if (data._deleted || data._compacted) {
        historyTombstones[docSnap.id] = {
          deletedAt: (data.deletedAt as string | number) || Date.now(),
          _deleted: true,
        };
      } else {
        history[docSnap.id] = data as unknown as HistoryItem;
      }
    });
  } catch (error) {
    console.error("Failed to fetch cloud history snapshot", error);
    throw error;
  }

  return {
    library,
    history,
    libraryTombstones,
    historyTombstones,
  };
}

export function computeMergeDiff(
  guest: GuestSnapshot,
  cloud: CloudSnapshot
): MergeDiff {
  const guestLibKeys = Object.keys(guest.library || {});
  const cloudLibKeys = Object.keys(cloud.library || {});
  const guestHistKeys = Object.keys(guest.history || {});
  const cloudHistKeys = Object.keys(cloud.history || {});

  const guestOnlyLibrary: LibraryItem[] = [];
  const cloudOnlyLibrary: LibraryItem[] = [];
  const conflictingLibrary: ConflictDetail[] = [];

  const cloudLibSet = new Set(cloudLibKeys);
  const guestLibSet = new Set(guestLibKeys);

  for (const key of guestLibKeys) {
    const guestItem = guest.library[key];
    if (!cloudLibSet.has(key)) {
      guestOnlyLibrary.push(guestItem);
    } else {
      const cloudItem = cloud.library[key];
      const comparison = compareMilestones(guestItem, cloudItem);

      conflictingLibrary.push({
        id: key,
        title: guestItem.title || cloudItem.title,
        guestChapterTitle: comparison.guestChapterTitle,
        cloudChapterTitle: comparison.cloudChapterTitle,
        guestMilestoneIndex: comparison.guestMilestoneIndex,
        cloudMilestoneIndex: comparison.cloudMilestoneIndex,
        resolvedMilestoneChapter: comparison.resolvedChapter,
        resolutionReason: comparison.reason,
      });
    }
  }

  for (const key of cloudLibKeys) {
    if (!guestLibSet.has(key)) {
      cloudOnlyLibrary.push(cloud.library[key]);
    }
  }

  let conflictingHistoryCount = 0;
  for (const key of guestHistKeys) {
    if (cloud.history[key]) {
      conflictingHistoryCount += 1;
    }
  }

  const guestOnlyHistoryCount = guestHistKeys.length - conflictingHistoryCount;
  const cloudOnlyHistoryCount = cloudHistKeys.length - conflictingHistoryCount;

  const totalMergedLibraryCount = new Set([...guestLibKeys, ...cloudLibKeys]).size;
  const totalMergedHistoryCount = new Set([...guestHistKeys, ...cloudHistKeys]).size;

  return {
    hasGuestData: guestLibKeys.length > 0 || guestHistKeys.length > 0,
    hasCloudData: cloudLibKeys.length > 0 || cloudHistKeys.length > 0,
    guestOnlyLibrary,
    cloudOnlyLibrary,
    conflictingLibrary,
    guestOnlyHistoryCount,
    cloudOnlyHistoryCount,
    conflictingHistoryCount,
    totalMergedLibraryCount,
    totalMergedHistoryCount,
  };
}

export function resolveMergedState(
  guest: GuestSnapshot,
  cloud: CloudSnapshot
): { library: Record<string, LibraryItem>; history: Record<string, HistoryItem> } {
  const mergedLibrary: Record<string, LibraryItem> = { ...cloud.library };
  const libTombstones = cloud.libraryTombstones || {};

  for (const [key, guestItem] of Object.entries(guest.library || {})) {
    const tombstone = libTombstones[key];
    if (tombstone && getSafeTime(tombstone.deletedAt) >= getSafeTime(guestItem.updatedAt)) {
      // Tombstone is newer than local update; do not resurrect.
      delete mergedLibrary[key];
      continue;
    }

    const cloudItem = mergedLibrary[key];
    if (!cloudItem) {
      mergedLibrary[key] = { ...guestItem };
    } else {
      const comparison = compareMilestones(guestItem, cloudItem);
      const guestWinsMilestone = comparison.guestWins;

      // Deduplicate linked sources
      const linkedMap = new Map<string, unknown>();
      (cloudItem.linkedSources || []).forEach((ref: any) =>
        linkedMap.set(`${ref.sourceId}::${ref.mangaId}`, ref)
      );
      (guestItem.linkedSources || []).forEach((ref: any) =>
        linkedMap.set(`${ref.sourceId}::${ref.mangaId}`, ref)
      );

      // Active reading cursor (lastRead*) follows the most recent readAt timestamp
      const guestLastReadTime = getSafeTime(guestItem.lastReadAt);
      const cloudLastReadTime = getSafeTime(cloudItem.lastReadAt);
      const guestWinsActiveCursor = guestLastReadTime >= cloudLastReadTime;

      mergedLibrary[key] = {
        ...cloudItem,
        ...guestItem,
        // Q52: Milestone reflects the furthest verified progress
        highestMilestoneIndex: guestWinsMilestone
          ? guestItem.highestMilestoneIndex
          : cloudItem.highestMilestoneIndex,
        highestMilestoneChapterId: guestWinsMilestone
          ? guestItem.highestMilestoneChapterId
          : cloudItem.highestMilestoneChapterId,
        highestMilestoneChapterTitle: guestWinsMilestone
          ? guestItem.highestMilestoneChapterTitle
          : cloudItem.highestMilestoneChapterTitle,

        // Active reading cursor: preserves recent reading activity without regressing milestone
        lastReadChapterId: guestWinsActiveCursor
          ? guestItem.lastReadChapterId
          : cloudItem.lastReadChapterId,
        lastReadChapterTitle: guestWinsActiveCursor
          ? guestItem.lastReadChapterTitle
          : cloudItem.lastReadChapterTitle,
        lastReadAt: guestWinsActiveCursor
          ? guestItem.lastReadAt
          : cloudItem.lastReadAt,

        status: guestItem.status === "COMPLETED" || cloudItem.status === "COMPLETED" ? "COMPLETED" : (guestItem.status || cloudItem.status),
        linkedSources: Array.from(linkedMap.values()) as any,
        updatedAt: new Date(
          Math.max(
            getSafeTime(guestItem.updatedAt),
            getSafeTime(cloudItem.updatedAt),
            Date.now()
          )
        ).toISOString(),
      };
    }
  }

  // Q63 resolution for History: every chapter cursor is preserved independently.
  const mergedHistory: Record<string, HistoryItem> = { ...cloud.history };
  const histTombstones = cloud.historyTombstones || {};

  for (const [key, guestItem] of Object.entries(guest.history || {})) {
    const tombstone = histTombstones[key];
    if (tombstone && getSafeTime(tombstone.deletedAt) >= getSafeTime(guestItem.readAt)) {
      delete mergedHistory[key];
      continue;
    }

    const cloudItem = mergedHistory[key];
    if (!cloudItem) {
      mergedHistory[key] = { ...guestItem };
    } else {
      // Overlapping chapter: latest readAt position wins.
      const guestTime = getSafeTime(guestItem.readAt);
      const cloudTime = getSafeTime(cloudItem.readAt);
      if (guestTime >= cloudTime) {
        mergedHistory[key] = { ...cloudItem, ...guestItem };
      } else {
        mergedHistory[key] = { ...guestItem, ...cloudItem };
      }
    }
  }

  return { library: mergedLibrary, history: retainHistory(mergedHistory) };
}

/**
 * Direct Firestore committer for merged data.
 * Executes writes in atomic batches (up to 450 items per batch).
 */
export function restoreGuestBackup(): GuestSnapshot | null {
  try {
    const key = localStorage.getItem("yomirra_last_guest_backup_key");
    if (!key) return null;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && typeof parsed.library === "object" && typeof parsed.history === "object") {
      return parsed as GuestSnapshot;
    }
    return null;
  } catch (e) {
    console.error("Failed to restore guest backup", e);
    return null;
  }
}

/**
 * Safely restores the last verified guest session backup directly to active client stores.
 * Returns true if the backup was found, valid, and applied; false otherwise.
 */
export function restoreGuestBackupToStores(): boolean {
  try {
    const backup = restoreGuestBackup();
    if (!backup) return false;
    useLibraryStore.setState({ items: backup.library });
    useHistoryStore.setState({ items: retainHistory(backup.history) });
    return true;
  } catch (e) {
    console.error("Failed to restore guest backup to stores", e);
    return false;
  }
}

export interface ExecuteGuestMergeParams {
  uid: string;
  strategy: MergeStrategy;
  guestSnapshot: GuestSnapshot;
  cloudSnapshot: CloudSnapshot;
  customCommitToFirestore?: (params: {
    uid: string;
    library: Record<string, LibraryItem>;
    history: Record<string, HistoryItem>;
  }) => Promise<{ totalWrites: number }>;
  commitToFirestore?: (params: {
    library: Record<string, LibraryItem>;
    history: Record<string, HistoryItem>;
  }) => Promise<any>;
}

export async function executeGuestMerge({
  uid,
  strategy,
  guestSnapshot,
  cloudSnapshot,
  customCommitToFirestore,
  commitToFirestore,
}: ExecuteGuestMergeParams): Promise<MergeExecutionResult> {
  const previousLocalLib = useLibraryStore.getState().items;
  const previousLocalHist = useHistoryStore.getState().items;
  let backupKey: string | undefined;

  try {
    let finalLibrary: Record<string, LibraryItem>;
    let finalHistory: Record<string, HistoryItem>;
    let actualCloudWrites = 0;
    let libraryWrites = 0;
    let historyWrites = 0;

    if (strategy === "cloud-replace") {
      // 1. Create a verifiable local backup before destructive replacement
      backupKey = `yomirra_guest_backup_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      let backupVerified = false;
      try {
        const payload = JSON.stringify(guestSnapshot);
        localStorage.setItem(backupKey, payload);
        localStorage.setItem("yomirra_last_guest_backup_key", backupKey);

        const readBack = localStorage.getItem(backupKey);
        if (readBack) {
          const parsed = JSON.parse(readBack);
          if (
            parsed &&
            typeof parsed === "object" &&
            parsed.library !== undefined &&
            parsed.history !== undefined
          ) {
            backupVerified = true;
          }
        }
      } catch {
        backupVerified = false;
      }

      if (!backupVerified) {
        throw new Error(
          "Gagal membuat atau memverifikasi backup lokal sebelum Cloud Replace. Operasi dibatalkan demi keamanan data."
        );
      }

      finalLibrary = { ...cloudSnapshot.library };
      finalHistory = { ...cloudSnapshot.history };
      actualCloudWrites = 0; // Cloud is already the master; no new cloud writes
    } else {
      // Strategy === "merge"
      const merged = resolveMergedState(guestSnapshot, cloudSnapshot);
      finalLibrary = merged.library;
      finalHistory = merged.history;

      // 2. CRITICAL: Commit to Firestore MUST happen and succeed before declaring success!
      if (customCommitToFirestore) {
        const res = await customCommitToFirestore({
          uid,
          library: finalLibrary,
          history: finalHistory,
        });
        actualCloudWrites = res.totalWrites;
        libraryWrites = "libraryWrites" in res && typeof res.libraryWrites === "number" ? res.libraryWrites : 0;
        historyWrites = "historyWrites" in res && typeof res.historyWrites === "number" ? res.historyWrites : 0;
      } else if (commitToFirestore) {
        await commitToFirestore({
          library: finalLibrary,
          history: finalHistory,
        });
        // A custom committer does not return per-domain counts. Keep them
        // unknown (zero) rather than fabricating diagnostic write metrics.
        actualCloudWrites = Object.keys(finalLibrary).length + Object.keys(finalHistory).length;
      } else {
        const res = await commitMergedDataToFirestore({
          uid,
          library: finalLibrary,
          history: finalHistory,
        });
        actualCloudWrites = res.totalWrites;
        libraryWrites = res.libraryWrites;
        historyWrites = res.historyWrites;
      }
    }

    // 3. Apply to local stores ONLY after cloud write succeeds!
    useLibraryStore.setState({ items: finalLibrary });
    useHistoryStore.setState({ items: retainHistory(finalHistory) });

    // 4. Update owner UID
    setLocalDataOwnerUid(uid);

    return {
      success: true,
      strategy,
      stats: {
        libraryCount: Object.keys(finalLibrary).length,
        historyCount: Object.keys(finalHistory).length,
        actualCloudWrites,
        libraryWrites,
        historyWrites,
        conflictsResolved: Object.keys(guestSnapshot.library).filter(
          (k) => cloudSnapshot.library[k]
        ).length,
      },
      backupKey,
    };
  } catch (error) {
    // Transactional rollback of local stores on failure
    useLibraryStore.setState({ items: previousLocalLib });
    useHistoryStore.setState({ items: previousLocalHist });
    throw error;
  }
}
