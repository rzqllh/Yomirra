import { useSyncDiagnosticsStore } from "@/shared/store/sync-diagnostics-store";
import { useGuestMergeStore } from "@/shared/store/guest-merge-store";
import { useEffect, useRef, useState } from 'react';
import { useAuth } from './use-auth';
import { useLibraryStore, LibraryItem } from "@/shared/store/library-store";
import { useHistoryStore, HistoryItem } from "@/shared/store/history-store";
import { useSettingsStore } from "@/shared/store/settings-store";
import { useSourcePreferencesStore } from "@/shared/store/source-preferences-store";
import { initFirebase } from '@/shared/lib/firebase';
import { loadFirestore } from "@/shared/lib/firestore-runtime";
import { pullSourcePreferences, pullLegacyLibraryData, pullCustomCollections } from '@/shared/lib/sync-utils';
import { useCollectionStore } from '@/shared/store/collection-store';
import { retainHistory } from '@/shared/lib/history-retention';
import { nextSyncRetryDelayMs } from '@/shared/lib/sync-retry';

type Tombstone = {
  _deleted: true;
  _compacted?: boolean;
  deletedAt: unknown;
  id?: string;
  sourceId?: string;
  mangaId?: string;
  chapterId?: string;
};

const inFlightSyncs = new Map<string, Promise<void>>();

const getSafeTimestamp = (value: unknown): number => {
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  if (typeof value === "string") {
    const parsed = new Date(value).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  if (value && typeof value === "object" && "seconds" in value) {
    return Number((value as { seconds: unknown }).seconds) * 1000 || 0;
  }
  return 0;
};

const removeLibraryItemLocal = (id: string, item?: Partial<LibraryItem>) => {
  useLibraryStore.setState((state) => {
    const items = { ...state.items };
    for (const [key, localItem] of Object.entries(items)) {
      if (
        key === id ||
        localItem.id === id ||
        (item?.sourceId === localItem.sourceId && item.mangaId === localItem.mangaId)
      ) {
        delete items[key];
      }
    }
    return { items };
  });
};

const findLibraryItemLocal = (id: string, item?: Partial<LibraryItem>) => {
  const items = useLibraryStore.getState().items;
  return items[id] ?? Object.values(items).find((localItem) =>
    localItem.id === id ||
    (item?.sourceId === localItem.sourceId && item.mangaId === localItem.mangaId),
  );
};

const removeHistoryItemLocal = (id: string, item?: Partial<HistoryItem>) => {
  useHistoryStore.setState((state) => {
    const items = { ...state.items };
    for (const [key, localItem] of Object.entries(items)) {
      if (
        key === id ||
        (item?.sourceId === localItem.sourceId && item.mangaId === localItem.mangaId && item.chapterId === localItem.chapterId)
      ) {
        delete items[key];
      }
    }
    return { items };
  });
};

export function useSync(options = { autoSync: true }) {
  const isMergePending = useGuestMergeStore((state) => state.isMergePending);
  const mergeError = useGuestMergeStore((state) => state.mergeError);
  const isBlockedByMerge = isMergePending || Boolean(mergeError);
  const { user } = useAuth();
  const userUid = user?.uid;
  const [isSyncing, setIsSyncing] = useState(false);
  const currentUidRef = useRef<string | undefined>(userUid);
  const initialSyncUidRef = useRef<string | undefined>(undefined);
  const syncOperationTokenRef = useRef(0);

  useEffect(() => {
    currentUidRef.current = userUid;
  }, [userUid, isBlockedByMerge]);

  const runFullSync = (): Promise<void> => {
    if (isBlockedByMerge) {
      return Promise.reject(new Error("Sync is blocked while guest merge review is active."));
    }
    const uid = userUid;
    if (!uid) return Promise.reject(new Error("No authenticated user is available for sync."));
    useSyncDiagnosticsStore.getState().recordSyncStart();

    const existing = inFlightSyncs.get(uid);
    const trackSyncLifecycle = (syncOperation: Promise<void>) => {
      const operationToken = ++syncOperationTokenRef.current;
      setIsSyncing(true);
      const finish = () => {
        if (operationToken === syncOperationTokenRef.current && currentUidRef.current === uid) {
          setIsSyncing(false);
        }
      };
      syncOperation.then(finish, finish);
    };
    if (existing) {
      trackSyncLifecycle(existing);
      return existing;
    }

    const operation = (async () => {
      const { auth, db: firestore } = await initFirebase();
      if (!firestore) throw new Error("Firebase is unavailable for sync.");
      if (!auth?.currentUser) throw new Error("No authenticated user is available for sync.");
      const isCurrentUser = () => currentUidRef.current === uid && auth.currentUser?.uid === uid;
      if (!isCurrentUser()) return;
      const { collection, doc, getDocs, writeBatch } = await loadFirestore();
      if (!isCurrentUser()) return;

      let batch = writeBatch(firestore);
      let batchCount = 0;
      let totalSynced = 0;
      let syncedLibCount = 0;
      let syncedHistCount = 0;
      let cloudPrefsResult: unknown = null;
      let cloudCollectionsResult: unknown = null;
      const commits: Array<() => Promise<void>> = [];
      const commitCurrentBatch = () => {
        if (batchCount > 0) {
          const batchToCommit = batch;
          commits.push(() => batchToCommit.commit());
          totalSynced += batchCount;
          batch = writeBatch(firestore);
          batchCount = 0;
        }
      };
      const pushToBatch = (reference: Parameters<typeof batch.set>[0], data: Record<string, unknown>) => {
        batch.set(reference, data);
        batchCount += 1;
        if (batchCount === 450) commitCurrentBatch();
      };

      const remoteLibrarySnapshot = await getDocs(collection(firestore, `users/${uid}/libraryV2`));
      if (!isCurrentUser()) return;

      const remoteLibrary: Record<string, LibraryItem> = {};
      const libraryTombstones: Record<string, Tombstone> = {};
      remoteLibrarySnapshot.forEach((remoteDoc) => {
        const item = remoteDoc.data() as LibraryItem & Tombstone;
        if (item._deleted) libraryTombstones[remoteDoc.id] = item;
        else remoteLibrary[remoteDoc.id] = item;
      });

      const migrationKey = `yomirra-libraryV2-migrated:${uid}`;
      const isMigrationComplete = localStorage.getItem(migrationKey) === 'true';
      const needsInitialMigration = !isMigrationComplete && remoteLibrarySnapshot.empty;
      if (needsInitialMigration) {
        const legacyItems = await pullLegacyLibraryData({ strict: true, expectedUid: uid });
        if (!isCurrentUser()) return;
        for (const legacyItem of legacyItems) {
          const savedTitleId = legacyItem.id ?? `${legacyItem.sourceId}::${legacyItem.mangaId}`;
          if (!remoteLibrary[savedTitleId] && !libraryTombstones[savedTitleId]) {
            const enriched: LibraryItem = {
              ...legacyItem,
              id: savedTitleId,
              schemaVersion: 2,
              primarySourceId: legacyItem.sourceId,
              primaryMangaId: legacyItem.mangaId,
              linkedSources: legacyItem.linkedSources ?? [],
            };
            pushToBatch(doc(firestore, `users/${uid}/libraryV2`, savedTitleId), cleanRecord(enriched)); syncedLibCount++;
            remoteLibrary[savedTitleId] = enriched;
          }
        }
      }

      // Reconcile legacy-only titles even when canonical data already exists.
      if (!needsInitialMigration) {
        const legacySnapshot = await getDocs(collection(firestore, `users/${uid}/library`));
        if (!isCurrentUser()) return;
        legacySnapshot.forEach((legacyDoc) => {
          const legacyItem = legacyDoc.data() as LibraryItem & Tombstone;
          if (legacyItem._deleted) return;
          const tombstone = Object.values(libraryTombstones)
            .filter((candidate) =>
              candidate.id === legacyDoc.id ||
              (candidate.sourceId === legacyItem.sourceId && candidate.mangaId === legacyItem.mangaId),
            )
            .reduce<Tombstone | undefined>((newest, candidate) =>
              !newest || getSafeTimestamp(candidate.deletedAt) > getSafeTimestamp(newest.deletedAt)
                ? candidate
                : newest,
            undefined,
            );
          if (tombstone && getSafeTimestamp(tombstone.deletedAt) >= getSafeTimestamp(legacyItem.updatedAt ?? legacyItem.addedAt)) {
            return;
          }
          const alreadyImported = Boolean(remoteLibrary[legacyDoc.id]) || Object.values(remoteLibrary).some(
            (v2) => v2.sourceId === legacyItem.sourceId && v2.mangaId === legacyItem.mangaId,
          );
          if (!alreadyImported) {
            const savedTitleId = legacyItem.id ?? `${legacyItem.sourceId}::${legacyItem.mangaId}`;
            const enriched: LibraryItem = {
              ...legacyItem,
              id: savedTitleId,
              schemaVersion: 2,
              primarySourceId: legacyItem.sourceId,
              primaryMangaId: legacyItem.mangaId,
              linkedSources: legacyItem.linkedSources ?? [],
            };
            pushToBatch(doc(firestore, `users/${uid}/libraryV2`, savedTitleId), cleanRecord(enriched)); syncedLibCount++;
            remoteLibrary[savedTitleId] = enriched;
          }
        });
      }

      // Fetch remote history.
      const remoteHistorySnapshot = await getDocs(collection(firestore, `users/${uid}/history`));
      if (!isCurrentUser()) return;
      const remoteHistory: Record<string, HistoryItem> = {};
      const historyTombstones: Record<string, Tombstone> = {};
      remoteHistorySnapshot.forEach((remoteDoc) => {
        const item = remoteDoc.data() as HistoryItem & Tombstone;
        if (item._deleted || item._compacted) historyTombstones[remoteDoc.id] = item;
        else remoteHistory[remoteDoc.id] = item;
      });

      // Merge library with tombstone precedence.
      const localLibrary = useLibraryStore.getState().items;
      for (const localItem of Object.values(localLibrary)) {
        const id = localItem.id ?? `${localItem.sourceId}::${localItem.mangaId}`;
        const tombstone = libraryTombstones[id];
        if (tombstone) {
          if (getSafeTimestamp(tombstone.deletedAt) >= getSafeTimestamp(localItem.updatedAt)) {
            removeLibraryItemLocal(id, localItem);
          } else {
            pushToBatch(doc(firestore, `users/${uid}/libraryV2`, id), cleanRecord(localItem)); syncedLibCount++;
          }
          continue;
        }
        const remoteItem = remoteLibrary[id];
        if (!remoteItem || getSafeTimestamp(localItem.updatedAt) > getSafeTimestamp(remoteItem.updatedAt)) {
          pushToBatch(doc(firestore, `users/${uid}/libraryV2`, id), cleanRecord(localItem)); syncedLibCount++;
        }
      }

      for (const [id, remoteItem] of Object.entries(remoteLibrary)) {
        if (!isCurrentUser()) return;
        const localItem = useLibraryStore.getState().items[id];
        if (!localItem || getSafeTimestamp(remoteItem.updatedAt) > getSafeTimestamp(localItem.updatedAt)) {
          useLibraryStore.getState()._setItemLocal(remoteItem);
        }
      }

      const mergedHistory = { ...useHistoryStore.getState().items };
      for (const [id, marker] of Object.entries(historyTombstones)) {
        if (getSafeTimestamp(marker.deletedAt) >= getSafeTimestamp(mergedHistory[id]?.readAt)) delete mergedHistory[id];
      }
      for (const [id, remoteItem] of Object.entries(remoteHistory)) {
        const localItem = mergedHistory[id];
        if (!localItem || getSafeTimestamp(remoteItem.readAt) > getSafeTimestamp(localItem.readAt)) {
          mergedHistory[id] = { ...remoteItem, readAt: getSafeTimestamp(remoteItem.readAt) };
        }
      }
      const retainedHistory = retainHistory(mergedHistory, (sourceId, mangaId) =>
        useLibraryStore.getState().resolveBySourceRef(sourceId, mangaId)?.id ?? null,
      );
      useHistoryStore.setState({ items: retainedHistory });
      for (const [id, item] of Object.entries(mergedHistory)) {
        const retained = retainedHistory[id];
        const remote = remoteHistory[id];
        const data = retained ? cleanRecord(retained) : {
          _compacted: true, deletedAt: item.readAt,
          sourceId: item.sourceId, mangaId: item.mangaId, chapterId: item.chapterId,
          mangaTitle: item.mangaTitle, readAt: item.readAt,
        };
        const retainedRecord = retained ? cleanRecord(retained) : undefined;
        const remoteRecord = remote ? cleanRecord(remote) : undefined;
        const unchanged = retainedRecord && remoteRecord &&
          Object.keys(retainedRecord).length === Object.keys(remoteRecord).length &&
          Object.entries(retainedRecord).every(([key, value]) => remoteRecord[key] === value);
        if (!unchanged) {
          pushToBatch(doc(firestore, `users/${uid}/history`, id), data);
          syncedHistCount++;
        }
      }

      if (!isCurrentUser()) return;
      commitCurrentBatch();
      for (const commit of commits) {
        if (!isCurrentUser()) return;
        await commit();
      }
      if (!isCurrentUser()) return;
      if (!isMigrationComplete) {
        try { localStorage.setItem(migrationKey, 'true'); } catch { /* optional storage */ }
      }

      // Source preferences and custom collections remain best-effort.
      try {
        const cloudPrefs = await pullSourcePreferences(); cloudPrefsResult = cloudPrefs;
        if (isCurrentUser() && cloudPrefs) {
          useSourcePreferencesStore.getState().syncWithCloud(cloudPrefs.disabledSources, cloudPrefs.hiddenFromHomeSources);
        }
      } catch (error) {
        console.error("Failed to pull source preferences during sync", error);
      }

      try {
        const cloudCollections = await pullCustomCollections(); cloudCollectionsResult = cloudCollections;
        if (isCurrentUser() && cloudCollections) {
          useCollectionStore.getState().syncWithCloud(cloudCollections.collections, cloudCollections.membershipsByManga);
        }
      } catch (error) {
        console.error("Failed to pull custom collections during sync", error);
      }

      if (!isCurrentUser()) return;
      if (totalSynced > 0 && process.env.NODE_ENV === 'development') {
        console.log(`[Sync] Synced ${totalSynced} local items to Cloud`);
      }
      const now = new Date().toISOString();
      useSettingsStore.getState().setLastSyncedAt(now);
      useSyncDiagnosticsStore.getState().recordSuccessfulCommit({
        uid,
        domains: [
          {
            domain: "library",
            successfulWriteCount: syncedLibCount,
            verifiedReadCount: Object.keys(remoteLibrary).length,
          },
          {
            domain: "history",
            successfulWriteCount: syncedHistCount,
            verifiedReadCount: Object.keys(remoteHistory).length,
          },
          ...(cloudPrefsResult ? [{ domain: "preferences" as const, successfulWriteCount: 1, verifiedReadCount: 1 }] : []),
          ...(cloudCollectionsResult ? [{ domain: "collections" as const, successfulWriteCount: 1, verifiedReadCount: 1 }] : []),
        ],
        timestamp: now,
      });
    })().catch((err) => {
      const isCloudUnreachable = typeof window !== "undefined" && (!window.navigator.onLine || /network|unavailable|timeout|offline/i.test(err?.message || ""));
      useSyncDiagnosticsStore.getState().recordSyncFailure(err?.message || "Sync failed", isCloudUnreachable);
      throw err;
    });

    inFlightSyncs.set(uid, operation);
    const clearInFlight = () => {
      if (inFlightSyncs.get(uid) === operation) inFlightSyncs.delete(uid);
    };
    operation.then(clearInFlight, clearInFlight);
    trackSyncLifecycle(operation);
    return operation;
  };

  useEffect(() => {
    if (!options.autoSync) return;
    if (!userUid || isBlockedByMerge) {
      initialSyncUidRef.current = undefined;
      return;
    }
    if (initialSyncUidRef.current === userUid) return;

    initialSyncUidRef.current = userUid;
    let cancelled = false;
    let failures = 0;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const cancelRetry = () => {
      if (retryTimer !== null) {
        clearTimeout(retryTimer);
        retryTimer = null;
      }
    };
    const attemptSync = () => {
      if (cancelled || currentUidRef.current !== userUid || !window.navigator.onLine) return;
      // Only background auto-sync retries; manual sync continues to report errors.
      void runFullSync().then(
        () => {
          if (cancelled) return;
          failures = 0;
          cancelRetry();
        },
        (error) => {
          if (cancelled || currentUidRef.current !== userUid) return;
          console.error("Automatic sync failed", error);
          if (!window.navigator.onLine) return;
          const delay = nextSyncRetryDelayMs(++failures);
          cancelRetry();
          retryTimer = setTimeout(attemptSync, delay);
        },
      );
    };

    attemptSync();
    const handleOnline = () => {
      useSyncDiagnosticsStore.getState().setNetworkOnline(true);
      cancelRetry();
      failures = 0;
      attemptSync();
    };
    const handleOffline = () => {
      useSyncDiagnosticsStore.getState().setNetworkOnline(false);
      cancelRetry();
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      cancelled = true;
      cancelRetry();
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userUid, options.autoSync, isBlockedByMerge]);

  useEffect(() => {
    if (!userUid || isBlockedByMerge) return;
    let isCancelled = false;
    let unsubscribeLibrary: (() => void) | undefined;
    let unsubscribeHistory: (() => void) | undefined;
    let unsubscribePreferences: (() => void) | undefined;

    initFirebase().then(async ({ db, auth }) => {
      if (!db || isCancelled) return;
      const uid = userUid;
      const isCurrentAccount = () =>
        !isCancelled && currentUidRef.current === uid && auth?.currentUser?.uid === uid;
      const { collection, doc, onSnapshot } = await loadFirestore();
      if (!isCurrentAccount()) return;
      unsubscribeLibrary = onSnapshot(collection(db, `users/${uid}/libraryV2`), (remoteSnapshot) => {
        // A callback may already be queued while logout/UID switch is tearing
        // down old listeners. Never apply an old account's data to local state.
        if (!isCurrentAccount()) return;
        remoteSnapshot.docChanges().forEach((change) => {
          const data = change.doc.data() as LibraryItem & Tombstone;
          const localItem = findLibraryItemLocal(change.doc.id, data);
          if (change.type === "removed") {
            removeLibraryItemLocal(change.doc.id, data);
            return;
          }
          if (data._deleted) {
            if (!localItem || getSafeTimestamp(data.deletedAt) >= getSafeTimestamp(localItem.updatedAt)) {
              removeLibraryItemLocal(change.doc.id, data);
            }
            return;
          }
          if (change.type !== "added" && change.type !== "modified") return;
          if (!localItem || getSafeTimestamp(data.updatedAt) > getSafeTimestamp(localItem.updatedAt)) {
            useLibraryStore.getState()._setItemLocal(data);
          }
        });
      }, (error) => console.error("Library sync listener error:", error));

      unsubscribeHistory = onSnapshot(collection(db, `users/${uid}/history`), (remoteSnapshot) => {
        if (!isCurrentAccount()) return;
        remoteSnapshot.docChanges().forEach((change) => {
          const data = change.doc.data() as HistoryItem & Tombstone;
          const localItem = useHistoryStore.getState().items[change.doc.id];
          if (change.type === "removed") {
            removeHistoryItemLocal(change.doc.id, data);
            return;
          }
          if (data._deleted || data._compacted) {
            if (!localItem || getSafeTimestamp(data.deletedAt) >= getSafeTimestamp(localItem.readAt)) {
              removeHistoryItemLocal(change.doc.id, data);
            }
            return;
          }
          if (change.type !== "added" && change.type !== "modified") return;
          if (!localItem || getSafeTimestamp(data.readAt) > getSafeTimestamp(localItem.readAt)) {
            useHistoryStore.getState()._setItemLocal({ ...data, readAt: getSafeTimestamp(data.readAt) });
          }
        });
      }, (error) => console.error("History sync listener error:", error));

      unsubscribePreferences = onSnapshot(doc(db, `users/${uid}/preferences`, "sources"), (preferenceSnapshot) => {
        if (!isCurrentAccount()) return;
        if (!preferenceSnapshot.exists()) return;
        const data = preferenceSnapshot.data();
        if (Array.isArray(data.disabledSources) || Array.isArray(data.hiddenFromHomeSources)) {
          useSourcePreferencesStore.getState().syncWithCloud(
            Array.isArray(data.disabledSources) ? data.disabledSources : [],
            Array.isArray(data.hiddenFromHomeSources) ? data.hiddenFromHomeSources : [],
          );
        }
      }, (error) => console.error("Pref sync error", error));
    }).catch((error) => console.error("Failed to start realtime sync", error));

    return () => {
      isCancelled = true;
      unsubscribeLibrary?.();
      unsubscribeHistory?.();
      unsubscribePreferences?.();
    };
  }, [userUid, isBlockedByMerge]);

  const syncLibraryItem = async (item: LibraryItem) => {
    const { db: firestore } = await initFirebase();
    const uid = userUid;
    if (!firestore || !uid) return;
    const { doc, setDoc } = await loadFirestore();
    const id = item.id ?? `${item.sourceId}::${item.mangaId}`;
    await setDoc(doc(firestore, `users/${uid}/libraryV2`, id), cleanRecord(item));
  };

  const syncHistoryItem = async (item: HistoryItem) => {
    const { db: firestore } = await initFirebase();
    const uid = userUid;
    if (!firestore || !uid) return;
    const { doc, setDoc } = await loadFirestore();
    const id = `${item.sourceId}::${item.mangaId}::${item.chapterId}`;
    await setDoc(doc(firestore, `users/${uid}/history`, id), cleanRecord(item));
  };

  return { runFullSync, isSyncing, syncLibraryItem, syncHistoryItem };
}

function cleanRecord(item: object): Record<string, unknown> {
  return Object.fromEntries(Object.entries(item).filter(([, value]) => value !== undefined));
}
