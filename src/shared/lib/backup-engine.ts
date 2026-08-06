import { useLibraryStore, type LibraryItem } from "@/shared/store/library-store";
import { useHistoryStore, type HistoryItem } from "@/shared/store/history-store";
import { useSettingsStore } from "@/shared/store/settings-store";
import { useReaderStore } from "@/shared/store/reader-store";
import { useSourcePreferencesStore } from "@/shared/store/source-preferences-store";
import { useStatsStore } from "@/shared/store/stats-store";
import { useUpdateStore } from "@/shared/store/update-store";
import { useCollectionStore } from "@/shared/store/collection-store";
import type { MangaUpdateItem } from "@/shared/types/update";
import type { Collection, MangaKey, ReadingStatus } from "@/shared/types/collection";
import {
  yomirraBackupSchemaV1,
  yomirraBackupSchemaV2,
  type YomirraBackupV1,
  type YomirraBackupV2,
  type AnyYomirraBackup,
  type DryRunPreview,
  type ImportMode,
  type LibraryItemBackup,
  type HistoryItemBackup,
  type UpdateItemBackup,
  type CollectionBackup,
} from "./backup-schema";

export const getLibraryId = (sourceId: string, mangaId: string) => `${sourceId}::${mangaId}`;
export const getHistoryId = (sourceId: string, mangaId: string, chapterId: string) => `${sourceId}::${mangaId}::${chapterId}`;

export interface CurrentStoresProjection {
  libraryItems: Record<string, LibraryItem>;
  historyItems: Record<string, HistoryItem>;
  updateItems: Record<string, MangaUpdateItem>;
  collections: Collection[];
  membershipsByManga: Record<string, string[]>;
  readingStatusByManga: Record<string, ReadingStatus>;
  statsTimeMs: number;
}

export function getCurrentStoresProjection(): CurrentStoresProjection {
  return {
    libraryItems: useLibraryStore.getState().items || {},
    historyItems: useHistoryStore.getState().items || {},
    updateItems: useUpdateStore.getState().items || {},
    collections: useCollectionStore.getState().collections || [],
    membershipsByManga: useCollectionStore.getState().membershipsByManga || {},
    readingStatusByManga: useCollectionStore.getState().readingStatusByManga || {},
    statsTimeMs: useStatsStore.getState().totalReadingTimeMs || 0,
  };
}

export function createBackupPayload(theme: "light" | "dark" | "system" = "system"): YomirraBackupV2 {
  const libraryState = useLibraryStore.getState();
  const historyState = useHistoryStore.getState();
  const settingsState = useSettingsStore.getState();
  const readerState = useReaderStore.getState();
  const sourcePrefState = useSourcePreferencesStore.getState();
  const statsState = useStatsStore.getState();
  const updateState = useUpdateStore.getState();
  const collectionState = useCollectionStore.getState();

  // Whitelist & filter out NSFW items
  const libraryList: LibraryItemBackup[] = Object.values(libraryState.items || {})
    .filter((item) => !item.isNsfw)
    .map((item) => ({
      sourceId: item.sourceId,
      mangaId: item.mangaId,
      title: item.title,
      coverUrl: item.coverUrl,
      author: item.author,
      status: item.status,
      format: item.format,
      sourceName: item.sourceName,
      addedAt: item.addedAt || new Date().toISOString(),
      updatedAt: item.updatedAt || item.addedAt || new Date().toISOString(),
      lastReadChapterId: item.lastReadChapterId,
      lastReadChapterTitle: item.lastReadChapterTitle,
      lastReadAt: item.lastReadAt,
      userRating: item.userRating,
      isNsfw: false,
    }));

  const historyList: HistoryItemBackup[] = Object.values(historyState.items || {})
    .filter((item) => !item.isNsfw)
    .map((item) => ({
      sourceId: item.sourceId,
      mangaId: item.mangaId,
      chapterId: item.chapterId,
      mangaTitle: item.mangaTitle,
      chapterTitle: item.chapterTitle,
      coverUrl: item.coverUrl,
      sourceName: item.sourceName,
      pageIndex: item.pageIndex,
      pageOffset: item.pageOffset,
      totalPages: item.totalPages,
      progressPercent: item.progressPercent,
      seriesProgressPercent: item.seriesProgressPercent,
      chapterIndex: item.chapterIndex,
      totalChapters: item.totalChapters,
      scrollPercent: item.scrollPercent,
      readAt: item.readAt || Date.now(),
      isNsfw: false,
    }));

  const updateList: UpdateItemBackup[] = Object.values(updateState.items || {}).map((item) => ({
    ...item
  }));

  const collectionsList: CollectionBackup[] = (collectionState.collections || []).map((item) => ({
    id: item.id,
    name: item.name,
    sortOrder: item.sortOrder,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }));

  return {
    schemaVersion: 2,
    appVersion: "1.0.0",
    exportedAt: new Date().toISOString(),
    data: {
      library: libraryList,
      history: historyList,
      updates: updateList,
      collections: collectionsList,
      membershipsByManga: collectionState.membershipsByManga,
      readingStatusByManga: collectionState.readingStatusByManga,
      settings: {
        dataSaver: settingsState.dataSaver,
        hideNsfw: settingsState.hideNsfw,
        keepScreenAwakeDuringDownloads: settingsState.keepScreenAwake,
        theme,
      },
      readerPreferences: {
        imageFit: readerState.preferences.imageFit,
        pageGap: readerState.preferences.pageGap,
        background: readerState.preferences.background,
        toolbarBehavior: readerState.preferences.toolbarBehavior,
        preloadIntensity: readerState.preferences.preloadIntensity,
        showPageProgress: readerState.preferences.showPageProgress,
        readingDirection: readerState.preferences.readingDirection,
        readingMode: readerState.preferences.readingMode,
        keepScreenAwakeWhileReading: readerState.preferences.keepScreenAwake ?? true,
      },
      sourcePreferences: {
        disabledSources: Array.from(new Set(sourcePrefState.disabledSources || [])),
        hiddenFromHomeSources: Array.from(new Set(sourcePrefState.hiddenFromHomeSources || [])),
      },
      stats: {
        totalReadingTimeMs: statsState.totalReadingTimeMs || 0,
      },
    },
  };
}

export function triggerBackupDownload(theme: "light" | "dark" | "system" = "system") {
  const payload = createBackupPayload(theme);
  const jsonStr = JSON.stringify(payload, null, 2);

  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");
  const filename = `yomirra-backup-${yyyy}-${mm}-${dd}-${hh}${min}.json`;

  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function performDryRun(
  jsonContent: string,
  currentStoresProjection: CurrentStoresProjection = getCurrentStoresProjection()
): DryRunPreview {
  const preview: DryRunPreview = {
    validLibraryCount: 0,
    validHistoryCount: 0,
    invalidItemCount: 0,
    duplicateInPayloadCount: 0,
    existingConflictCount: 0,
    addedCount: 0,
    replacedCount: 0,
    retainedCount: 0,
    excludedNsfwCount: 0,
    warnings: [],
    errors: [],
    isVersionSupported: true,
  };

  // 1. File size check (10MB limit)
  if (jsonContent.length > 10 * 1024 * 1024) {
    preview.errors.push({ path: "file", message: "Ukuran file backup melebihi batas 10 MB" });
    return preview;
  }

  // 2. Safe JSON parse
  let rawParsed: any;
  try {
    rawParsed = JSON.parse(jsonContent);
  } catch {
    preview.errors.push({ path: "file", message: "Format JSON tidak valid atau korup" });
    return preview;
  }

  if (!rawParsed || typeof rawParsed !== "object") {
    preview.errors.push({ path: "file", message: "Struktur root JSON tidak valid" });
    return preview;
  }

  // 3. Schema version check
  const schemaVersion = rawParsed.schemaVersion;
  if (typeof schemaVersion === "number" && schemaVersion > 2) {
    preview.isVersionSupported = false;
    preview.warnings.push(`Versi schema backup (${schemaVersion}) lebih baru dan tidak didukung`);
    preview.errors.push({ path: "schemaVersion", message: "unsupported_future_schema" });
    return preview;
  }

  // 4. Zod envelope validation
  const validationResult = schemaVersion === 2 
    ? yomirraBackupSchemaV2.safeParse(rawParsed) 
    : yomirraBackupSchemaV1.safeParse(rawParsed);
  if (!validationResult.success) {
    validationResult.error.issues.forEach((issue) => {
      preview.errors.push({
        path: issue.path.join(".") || "root",
        message: issue.message,
      });
    });
    preview.invalidItemCount = preview.errors.length;
    return preview;
  }

  const backupData = validationResult.data;
  preview.backupPayload = backupData;

  // 5. Track duplicates in payload & NSFW exclusions
  const seenLibKeys = new Set<string>();
  backupData.data.library.forEach((item) => {
    if (item.isNsfw) {
      preview.excludedNsfwCount++;
      return;
    }
    const key = getLibraryId(item.sourceId, item.mangaId);
    if (seenLibKeys.has(key)) {
      preview.duplicateInPayloadCount++;
    } else {
      seenLibKeys.add(key);
      preview.validLibraryCount++;
    }
  });

  const seenHistKeys = new Set<string>();
  backupData.data.history.forEach((item) => {
    if (item.isNsfw) {
      preview.excludedNsfwCount++;
      return;
    }
    const key = getHistoryId(item.sourceId, item.mangaId, item.chapterId);
    if (seenHistKeys.has(key)) {
      preview.duplicateInPayloadCount++;
    } else {
      seenHistKeys.add(key);
      preview.validHistoryCount++;
    }
  });

  const seenUpdKeys = new Set<string>();
  if (backupData.data.updates) {
    backupData.data.updates.forEach((item) => {
      const key = `${item.sourceId}::${item.mangaId}`;
      if (seenUpdKeys.has(key)) {
        preview.duplicateInPayloadCount++;
      } else {
        seenUpdKeys.add(key);
      }
    });
  }

  // 6. Domain conflict metrics against current store projection
  // Library domain conflict metrics
  const uniqueLibItems = new Map<string, LibraryItemBackup>();
  backupData.data.library.forEach((item) => {
    if (!item.isNsfw) {
      uniqueLibItems.set(getLibraryId(item.sourceId, item.mangaId), item);
    }
  });

  uniqueLibItems.forEach((backupItem, key) => {
    const existing = currentStoresProjection.libraryItems[key];
    if (existing) {
      preview.existingConflictCount++;
      const backupTime = Date.parse(backupItem.updatedAt);
      const existingTime = Date.parse(existing.updatedAt || existing.addedAt);
      if (!isNaN(backupTime) && !isNaN(existingTime) && backupTime > existingTime) {
        preview.replacedCount++;
      } else {
        preview.retainedCount++;
      }
    } else {
      preview.addedCount++;
    }
  });

  // History domain conflict metrics
  const uniqueHistItems = new Map<string, HistoryItemBackup>();
  backupData.data.history.forEach((item) => {
    if (!item.isNsfw) {
      uniqueHistItems.set(getHistoryId(item.sourceId, item.mangaId, item.chapterId), item);
    }
  });

  uniqueHistItems.forEach((backupItem, key) => {
    const existing = currentStoresProjection.historyItems[key];
    if (existing) {
      preview.existingConflictCount++;
      if (backupItem.readAt > existing.readAt) {
        preview.replacedCount++;
      } else {
        preview.retainedCount++;
      }
    } else {
      preview.addedCount++;
    }
  });

  return preview;
}

export function executeCoordinatedRestore(
  backup: AnyYomirraBackup,
  mode: ImportMode,
  themeSetter?: (theme: "light" | "dark" | "system") => void
): { success: boolean; restoredCount: number } {
  // Capture current store snapshots for in-memory rollback
  const snapLib = useLibraryStore.getState();
  const snapHist = useHistoryStore.getState();
  const snapSett = useSettingsStore.getState();
  const snapRead = useReaderStore.getState();
  const snapSrc = useSourcePreferencesStore.getState();
  const snapStat = useStatsStore.getState();
  const snapUpd = useUpdateStore.getState();
  const snapCol = useCollectionStore.getState();

  try {
    // 1. Compute target Library state
    let targetLibraryItems: Record<string, LibraryItem> = {};
    if (mode === "replace") {
      backup.data.library.forEach((item) => {
        if (!item.isNsfw) {
          const id = getLibraryId(item.sourceId, item.mangaId);
          targetLibraryItems[id] = { ...item };
        }
      });
    } else {
      // Merge mode: newer valid updatedAt wins. Tie => current wins.
      targetLibraryItems = { ...(snapLib.items || {}) };
      backup.data.library.forEach((item) => {
        if (item.isNsfw) return;
        const id = getLibraryId(item.sourceId, item.mangaId);
        const existing = targetLibraryItems[id];
        if (!existing) {
          targetLibraryItems[id] = { ...item };
        } else {
          const backupTime = Date.parse(item.updatedAt);
          const existingTime = Date.parse(existing.updatedAt || existing.addedAt);
          if (!isNaN(backupTime) && !isNaN(existingTime) && backupTime > existingTime) {
            targetLibraryItems[id] = { ...item };
          }
        }
      });
    }

    // 2. Compute target History state
    let targetHistoryItems: Record<string, HistoryItem> = {};
    if (mode === "replace") {
      backup.data.history.forEach((item) => {
        if (!item.isNsfw) {
          const id = getHistoryId(item.sourceId, item.mangaId, item.chapterId);
          targetHistoryItems[id] = { ...item };
        }
      });
    } else {
      // Merge mode: newer numeric readAt wins. Tie => current wins.
      targetHistoryItems = { ...(snapHist.items || {}) };
      backup.data.history.forEach((item) => {
        if (item.isNsfw) return;
        const id = getHistoryId(item.sourceId, item.mangaId, item.chapterId);
        const existing = targetHistoryItems[id];
        if (!existing) {
          targetHistoryItems[id] = { ...item };
        } else {
          if (item.readAt > existing.readAt) {
            targetHistoryItems[id] = { ...item };
          }
        }
      });
    }

    // 2.5 Compute target Updates state
    let targetUpdateItems: Record<string, MangaUpdateItem> = {};
    if (mode === "replace") {
      if (backup.data.updates) {
        backup.data.updates.forEach((item) => {
          const id = `${item.sourceId}::${item.mangaId}`;
          targetUpdateItems[id] = { ...item };
        });
      }
    } else {
      targetUpdateItems = { ...(snapUpd.items || {}) };
      if (backup.data.updates) {
        backup.data.updates.forEach((item) => {
          const id = `${item.sourceId}::${item.mangaId}`;
          const existing = targetUpdateItems[id];
          if (!existing) {
            targetUpdateItems[id] = { ...item };
          } else {
            const backupTime = Date.parse(item.lastCheckedAt || item.detectedAt || "");
            const existingTime = Date.parse(existing.lastCheckedAt || existing.detectedAt || "");
            if (!isNaN(backupTime) && !isNaN(existingTime) && backupTime > existingTime) {
              targetUpdateItems[id] = { ...item };
            }
          }
        });
      }
    }

    // 3. Compute target Settings
    const targetSettings = {
      dataSaver: backup.data.settings.dataSaver,
      hideNsfw: backup.data.settings.hideNsfw,
      keepScreenAwake: backup.data.settings.keepScreenAwakeDuringDownloads,
    };

    // 4. Compute target Reader Preferences
    const targetReaderPreferences = {
      ...snapRead.preferences,
      imageFit: backup.data.readerPreferences.imageFit,
      pageGap: backup.data.readerPreferences.pageGap,
      background: backup.data.readerPreferences.background,
      toolbarBehavior: backup.data.readerPreferences.toolbarBehavior,
      preloadIntensity: backup.data.readerPreferences.preloadIntensity,
      showPageProgress: backup.data.readerPreferences.showPageProgress,
      readingDirection: backup.data.readerPreferences.readingDirection,
      readingMode: backup.data.readerPreferences.readingMode,
      keepScreenAwake: backup.data.readerPreferences.keepScreenAwakeWhileReading,
    };

    // 5. Compute target Source Preferences
    const targetDisabledSources = Array.from(new Set(backup.data.sourcePreferences.disabledSources));
    const targetHiddenFromHomeSources = Array.from(new Set(backup.data.sourcePreferences.hiddenFromHomeSources));

    // 6. Compute target Stats
    const targetStatsMs =
      mode === "replace"
        ? backup.data.stats.totalReadingTimeMs
        : Math.max(snapStat.totalReadingTimeMs || 0, backup.data.stats.totalReadingTimeMs);

    // 7. Compute target Collections (from V2 or fallback to empty/merge)
    let targetCollections: Collection[] = [];
    let targetMemberships: Record<string, string[]> = {};
    let targetReadingStatus: Record<string, ReadingStatus> = {};
    
    if (backup.schemaVersion >= 2) {
      const v2Backup = backup as YomirraBackupV2;
      if (mode === "replace") {
        targetCollections = (v2Backup.data.collections || []).map(c => ({
          ...c, sortOrder: c.sortOrder ?? 0
        }));
        targetMemberships = v2Backup.data.membershipsByManga || {};
        targetReadingStatus = v2Backup.data.readingStatusByManga || {};
      } else {
        // Merge collections
        const currentCollections = snapCol.collections || [];
        const currentMemberships = snapCol.membershipsByManga || {};
        const currentReadingStatus = snapCol.readingStatusByManga || {};
        
        targetCollections = [...currentCollections];
        const existingColIds = new Set(targetCollections.map(c => c.id));
        
        (v2Backup.data.collections || []).forEach(c => {
          if (!existingColIds.has(c.id)) {
            targetCollections.push({ ...c, sortOrder: c.sortOrder ?? 0 });
          }
        });
        
        targetMemberships = { ...currentMemberships };
        Object.entries(v2Backup.data.membershipsByManga || {}).forEach(([mangaId, colIds]) => {
          const current = targetMemberships[mangaId] || [];
          targetMemberships[mangaId] = Array.from(new Set([...current, ...colIds]));
        });
        
        targetReadingStatus = { ...currentReadingStatus };
        Object.entries(v2Backup.data.readingStatusByManga || {}).forEach(([mangaId, status]) => {
          if (!targetReadingStatus[mangaId]) {
            targetReadingStatus[mangaId] = status as ReadingStatus;
          }
        });
      }
    } else {
      if (mode === "replace") {
        targetCollections = [];
        targetMemberships = {};
        targetReadingStatus = {};
      } else {
        targetCollections = [...(snapCol.collections || [])];
        targetMemberships = { ...(snapCol.membershipsByManga || {}) };
        targetReadingStatus = { ...(snapCol.readingStatusByManga || {}) };
      }
    }

    // Apply all store mutations using direct setState (No side effects, local-only)
    useLibraryStore.setState({ items: targetLibraryItems });
    useHistoryStore.setState({ items: targetHistoryItems });
    useSettingsStore.setState(targetSettings);
    useReaderStore.setState({ preferences: targetReaderPreferences });
    useSourcePreferencesStore.setState({
      disabledSources: targetDisabledSources,
      hiddenFromHomeSources: targetHiddenFromHomeSources,
    });
    useStatsStore.setState({ totalReadingTimeMs: targetStatsMs });
    useUpdateStore.setState({ items: targetUpdateItems });
    useCollectionStore.setState({
      collections: targetCollections,
      membershipsByManga: targetMemberships,
      readingStatusByManga: targetReadingStatus,
    });

    if (themeSetter && backup.data.settings.theme) {
      themeSetter(backup.data.settings.theme);
    }

    const restoredCount = Object.keys(targetLibraryItems).length + Object.keys(targetHistoryItems).length;
    return { success: true, restoredCount };
  } catch (err) {
    // In-Memory Rollback: Restore all stores to original snapshot
    useLibraryStore.setState({ items: snapLib.items });
    useHistoryStore.setState({ items: snapHist.items });
    useSettingsStore.setState({
      dataSaver: snapSett.dataSaver,
      hideNsfw: snapSett.hideNsfw,
      keepScreenAwake: snapSett.keepScreenAwake,
    });
    useReaderStore.setState({ preferences: snapRead.preferences });
    useSourcePreferencesStore.setState({
      disabledSources: snapSrc.disabledSources,
      hiddenFromHomeSources: snapSrc.hiddenFromHomeSources,
    });
    useStatsStore.setState({ totalReadingTimeMs: snapStat.totalReadingTimeMs });
    useUpdateStore.setState({ items: snapUpd.items });
    useCollectionStore.setState({
      collections: snapCol.collections,
      membershipsByManga: snapCol.membershipsByManga,
      readingStatusByManga: snapCol.readingStatusByManga,
    });

    throw err;
  }
}
