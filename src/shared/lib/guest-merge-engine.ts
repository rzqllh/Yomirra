import type { LibraryItem } from "@/shared/store/library-store";
import type { HistoryItem } from "@/shared/store/history-store";
import { useLibraryStore } from "@/shared/store/library-store";
import { useHistoryStore } from "@/shared/store/history-store";
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
    conflictsResolved: number;
  };
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
      const guestIdx = guestItem.highestMilestoneIndex ?? 0;
      const cloudIdx = cloudItem.highestMilestoneIndex ?? 0;

      const guestChap =
        guestItem.highestMilestoneChapterTitle ||
        guestItem.lastReadChapterTitle ||
        "Chapter awal";
      const cloudChap =
        cloudItem.highestMilestoneChapterTitle ||
        cloudItem.lastReadChapterTitle ||
        "Chapter awal";

      const guestWins = guestIdx >= cloudIdx;
      const resolvedChapter = guestWins ? guestChap : cloudChap;

      conflictingLibrary.push({
        id: key,
        title: guestItem.title || cloudItem.title,
        guestChapterTitle: guestChap,
        cloudChapterTitle: cloudChap,
        guestMilestoneIndex: guestIdx,
        cloudMilestoneIndex: cloudIdx,
        resolvedMilestoneChapter: resolvedChapter,
        resolutionReason: guestWins
          ? "Progres lokal lebih tinggi atau sama (Q52 dipertahankan)"
          : "Progres cloud lebih tinggi (Q52 dipertahankan)",
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
      delete mergedLibrary[key];
      continue;
    }

    const cloudItem = mergedLibrary[key];
    if (!cloudItem) {
      mergedLibrary[key] = { ...guestItem };
    } else {
      const guestMilestone = guestItem.highestMilestoneIndex ?? 0;
      const cloudMilestone = cloudItem.highestMilestoneIndex ?? 0;
      const guestWinsMilestone = guestMilestone > cloudMilestone;

      const linkedMap = new Map<string, unknown>();
      (cloudItem.linkedSources || []).forEach((ref: any) =>
        linkedMap.set(`${ref.sourceId}::${ref.mangaId}`, ref)
      );
      (guestItem.linkedSources || []).forEach((ref: any) =>
        linkedMap.set(`${ref.sourceId}::${ref.mangaId}`, ref)
      );

      mergedLibrary[key] = {
        ...cloudItem,
        ...guestItem,
        highestMilestoneIndex: guestWinsMilestone
          ? guestItem.highestMilestoneIndex
          : cloudItem.highestMilestoneIndex,
        highestMilestoneChapterId: guestWinsMilestone
          ? guestItem.highestMilestoneChapterId
          : cloudItem.highestMilestoneChapterId,
        highestMilestoneChapterTitle: guestWinsMilestone
          ? guestItem.highestMilestoneChapterTitle
          : cloudItem.highestMilestoneChapterTitle,
        lastReadChapterId:
          getSafeTime(guestItem.lastReadAt) >= getSafeTime(cloudItem.lastReadAt)
            ? guestItem.lastReadChapterId
            : cloudItem.lastReadChapterId,
        lastReadChapterTitle:
          getSafeTime(guestItem.lastReadAt) >= getSafeTime(cloudItem.lastReadAt)
            ? guestItem.lastReadChapterTitle
            : cloudItem.lastReadChapterTitle,
        lastReadAt:
          getSafeTime(guestItem.lastReadAt) >= getSafeTime(cloudItem.lastReadAt)
            ? guestItem.lastReadAt
            : cloudItem.lastReadAt,
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
      mergedHistory[key] =
        getSafeTime(guestItem.readAt) >= getSafeTime(cloudItem.readAt)
          ? { ...cloudItem, ...guestItem }
          : { ...guestItem, ...cloudItem };
    }
  }

  return { library: mergedLibrary, history: mergedHistory };
}

export async function executeGuestMerge({
  uid,
  strategy,
  guestSnapshot,
  cloudSnapshot,
  commitToFirestore,
}: {
  uid: string;
  strategy: MergeStrategy;
  guestSnapshot: GuestSnapshot;
  cloudSnapshot: CloudSnapshot;
  commitToFirestore?: (mergedData: {
    library: Record<string, LibraryItem>;
    history: Record<string, HistoryItem>;
  }) => Promise<void>;
}): Promise<MergeExecutionResult> {
  const previousLocalLib = useLibraryStore.getState().items;
  const previousLocalHist = useHistoryStore.getState().items;

  try {
    let finalLibrary: Record<string, LibraryItem>;
    let finalHistory: Record<string, HistoryItem>;

    if (strategy === "cloud-replace") {
      finalLibrary = { ...cloudSnapshot.library };
      finalHistory = { ...cloudSnapshot.history };
    } else {
      const merged = resolveMergedState(guestSnapshot, cloudSnapshot);
      finalLibrary = merged.library;
      finalHistory = merged.history;
    }

    useLibraryStore.setState({ items: finalLibrary });
    useHistoryStore.setState({ items: finalHistory });

    if (commitToFirestore) {
      await commitToFirestore({ library: finalLibrary, history: finalHistory });
    }

    setLocalDataOwnerUid(uid);

    return {
      success: true,
      strategy,
      stats: {
        libraryCount: Object.keys(finalLibrary).length,
        historyCount: Object.keys(finalHistory).length,
        conflictsResolved: Object.keys(guestSnapshot.library).filter(
          (k) => cloudSnapshot.library[k]
        ).length,
      },
    };
  } catch (error) {
    useLibraryStore.setState({ items: previousLocalLib });
    useHistoryStore.setState({ items: previousLocalHist });
    throw error;
  }
}
