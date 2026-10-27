import type { LibraryItem } from "@/shared/store/library-store";
import type { HistoryItem } from "@/shared/store/history-store";
import { useLibraryStore } from "@/shared/store/library-store";
import { useHistoryStore } from "@/shared/store/history-store";
import { setLocalDataOwnerUid } from "@/shared/lib/local-data-owner";
import { parseChapterNumber } from "@/shared/lib/chapter-parser";

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

function cleanRecord(item: object): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(item).filter(([, value]) => value !== undefined)
  );
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
      if (data._deleted) {
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
      if (data._deleted) {
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

/**
 * Verified milestone resolution adhering strictly to Q52.
 * Compares highest verified milestone progress using index and parsed chapter number.
 */
function getVerifiedMilestoneMetric(item: LibraryItem): {
  metric: number;
  chapterTitle: string;
} {
  const idx = typeof item.highestMilestoneIndex === "number" && !Number.isNaN(item.highestMilestoneIndex)
    ? item.highestMilestoneIndex
    : -1;

  const candidateTitle =
    item.highestMilestoneChapterTitle ||
    item.lastReadChapterTitle ||
    "";
  const parsedNum = parseChapterNumber(candidateTitle) ?? -1;

  const metric = Math.max(idx, parsedNum);
  return {
    metric,
    chapterTitle: candidateTitle || `Chapter ${metric > 0 ? metric : 0}`,
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
      const guestM = getVerifiedMilestoneMetric(guestItem);
      const cloudM = getVerifiedMilestoneMetric(cloudItem);

      const guestWins = guestM.metric >= cloudM.metric;
      const resolvedChapter = guestWins ? guestM.chapterTitle : cloudM.chapterTitle;

      conflictingLibrary.push({
        id: key,
        title: guestItem.title || cloudItem.title,
        guestChapterTitle: guestM.chapterTitle,
        cloudChapterTitle: cloudM.chapterTitle,
        guestMilestoneIndex: guestM.metric,
        cloudMilestoneIndex: cloudM.metric,
        resolvedMilestoneChapter: resolvedChapter,
        resolutionReason: guestWins
          ? "Milestone lokal lebih tinggi atau sama (Q52 dipertahankan)"
          : "Milestone cloud lebih tinggi (Q52 dipertahankan)",
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
      const guestM = getVerifiedMilestoneMetric(guestItem);
      const cloudM = getVerifiedMilestoneMetric(cloudItem);
      const guestWinsMilestone = guestM.metric >= cloudM.metric;

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

  return { library: mergedLibrary, history: mergedHistory };
}

/**
 * Direct Firestore committer for merged data.
 * Executes writes in atomic batches (up to 450 items per batch).
 */
export async function commitMergedDataToFirestore({
  uid,
  library,
  history,
}: {
  uid: string;
  library: Record<string, LibraryItem>;
  history: Record<string, HistoryItem>;
}): Promise<{ libraryWrites: number; historyWrites: number; totalWrites: number }> {
  const { initFirebase } = await import("@/shared/lib/firebase");
  const { loadFirestore } = await import("@/shared/lib/firestore-runtime");

  const { db: firestore } = await initFirebase();
  if (!firestore) {
    throw new Error("Koneksi Firebase tidak tersedia untuk melakukan commit.");
  }

  const { doc, writeBatch } = await loadFirestore();

  let batch = writeBatch(firestore);
  let batchCount = 0;
  let libraryWrites = 0;
  let historyWrites = 0;
  const commits: Promise<void>[] = [];

  const commitBatch = () => {
    if (batchCount > 0) {
      commits.push(batch.commit());
      batch = writeBatch(firestore);
      batchCount = 0;
    }
  };

  for (const [id, item] of Object.entries(library)) {
    batch.set(doc(firestore, `users/${uid}/libraryV2`, id), cleanRecord(item));
    batchCount++;
    libraryWrites++;
    if (batchCount === 450) commitBatch();
  }

  for (const [id, item] of Object.entries(history)) {
    batch.set(
      doc(firestore, `users/${uid}/history`, id),
      cleanRecord({ ...item, readAt: getSafeTime(item.readAt) })
    );
    batchCount++;
    historyWrites++;
    if (batchCount === 450) commitBatch();
  }

  commitBatch();
  await Promise.all(commits);

  return {
    libraryWrites,
    historyWrites,
    totalWrites: libraryWrites + historyWrites,
  };
}

export function restoreGuestBackup(): GuestSnapshot | null {
  try {
    const key = localStorage.getItem("yomirra_last_guest_backup_key");
    if (!key) return null;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as GuestSnapshot;
  } catch (e) {
    console.error("Failed to restore guest backup", e);
    return null;
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

    if (strategy === "cloud-replace") {
      // 1. Create a verifiable local backup before destructive replacement
      backupKey = `yomirra_guest_backup_${Date.now()}`;
      try {
        localStorage.setItem(backupKey, JSON.stringify(guestSnapshot));
        localStorage.setItem("yomirra_last_guest_backup_key", backupKey);
      } catch (e) {
        console.warn("Could not save pre-replace backup to localStorage", e);
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
      } else if (commitToFirestore) {
        await commitToFirestore({
          library: finalLibrary,
          history: finalHistory,
        });
        actualCloudWrites = Object.keys(finalLibrary).length + Object.keys(finalHistory).length;
      } else {
        const res = await commitMergedDataToFirestore({
          uid,
          library: finalLibrary,
          history: finalHistory,
        });
        actualCloudWrites = res.totalWrites;
      }
    }

    // 3. Apply to local stores ONLY after cloud write succeeds!
    useLibraryStore.setState({ items: finalLibrary });
    useHistoryStore.setState({ items: finalHistory });

    // 4. Update owner UID
    setLocalDataOwnerUid(uid);

    return {
      success: true,
      strategy,
      stats: {
        libraryCount: Object.keys(finalLibrary).length,
        historyCount: Object.keys(finalHistory).length,
        actualCloudWrites,
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
