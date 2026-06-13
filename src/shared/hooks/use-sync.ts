import { useEffect, useRef, useState } from 'react';
import { useAuth } from './use-auth';
import { useLibraryStore, LibraryItem } from "@/shared/store/library-store";
import { useHistoryStore, HistoryItem } from "@/shared/store/history-store";
import { useSettingsStore } from "@/shared/store/settings-store";
import { initFirebase } from '@/shared/lib/firebase';

export function useSync(options = { autoSync: true }) {
  const { user } = useAuth();
  
  const { items: libraryItems, _setItemLocal: setLibraryItemLocal } = useLibraryStore();
  const { items: historyItems, _setItemLocal: setHistoryItemLocal } = useHistoryStore();
  const { setLastSyncedAt } = useSettingsStore();
  
  const hasSyncedInitial = useRef(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const runFullSync = async () => {
    if (!user) return;
    
    setIsSyncing(true);
    try {
      const { db: firestore } = await initFirebase();
      if (!firestore) return;
      const { doc, collection, getDocs, writeBatch } = await import('firebase/firestore');
      const uid = user.uid;
      
      // 1. Fetch remote library
      const remoteLibSnapshot = await getDocs(collection(firestore, `users/${uid}/library`));
      const remoteLibrary: Record<string, LibraryItem> = {};
      remoteLibSnapshot.forEach(d => {
        remoteLibrary[d.id] = d.data() as LibraryItem;
      });

      // 2. Fetch remote history
      const remoteHistSnapshot = await getDocs(collection(firestore, `users/${uid}/history`));
      const remoteHistory: Record<string, HistoryItem> = {};
      remoteHistSnapshot.forEach(d => {
        remoteHistory[d.id] = d.data() as HistoryItem;
      });

      const batch = writeBatch(firestore);
      let batchCount = 0;

      // 3. Merge Library (Local wins if newer, otherwise remote wins)
      Object.values(libraryItems).forEach(localItem => {
        const id = `${localItem.sourceId}::${localItem.mangaId}`;
        const remoteItem = remoteLibrary[id];
        
        if (!remoteItem || new Date(localItem.updatedAt).getTime() > new Date(remoteItem.updatedAt).getTime()) {
          // Push local to remote
          batch.set(doc(firestore, `users/${uid}/library`, id), localItem);
          batchCount++;
        }
      });

      Object.entries(remoteLibrary).forEach(([id, remoteItem]) => {
        const localItem = libraryItems[id];
        if (!localItem || new Date(remoteItem.updatedAt).getTime() > new Date(localItem.updatedAt).getTime()) {
          // Pull remote to local
          setLibraryItemLocal(remoteItem);
        }
      });

      // 4. Merge History
      Object.values(historyItems).forEach(localItem => {
        const id = `${localItem.sourceId}::${localItem.mangaId}::${localItem.chapterId}`;
        const remoteItem = remoteHistory[id];
        
        if (!remoteItem || new Date(localItem.readAt).getTime() > new Date(remoteItem.readAt).getTime()) {
          // Push local to remote
          batch.set(doc(firestore, `users/${uid}/history`, id), localItem);
          batchCount++;
        }
      });

      Object.entries(remoteHistory).forEach(([id, remoteItem]) => {
        const localItem = historyItems[id];
        if (!localItem || new Date(remoteItem.readAt).getTime() > new Date(localItem.readAt).getTime()) {
          // Pull remote to local
          setHistoryItemLocal(remoteItem);
        }
      });

      if (batchCount > 0) {
        await batch.commit();
        console.log(`[Sync] Synced ${batchCount} local items to Cloud`);
      }
      
      setLastSyncedAt(new Date().toISOString());

    } catch (error: unknown) {
      console.error("Sync error:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (!options.autoSync) return;

    if (!user) {
      hasSyncedInitial.current = false;
      return;
    }

    if (hasSyncedInitial.current) return;
    
    // Set to true immediately to prevent race conditions while fetching
    hasSyncedInitial.current = true;
    
    // Run initial sync
    runFullSync();

    // Listen for offline -> online transitions (POS-style background sync)
    const handleOnline = () => {
      console.log("[Sync] Device came online, running background sync...");
      runFullSync();
    };

    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("online", handleOnline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, options.autoSync]);

  // Setup real-time listeners for cross-device sync
  useEffect(() => {
    if (!user || !hasSyncedInitial.current) return;

    let unsubLibrary: () => void;
    let unsubHistory: () => void;

    initFirebase().then(({ db }) => {
      if (!db) return;
      import('firebase/firestore').then(({ collection, onSnapshot }) => {
        const uid = user.uid;

        unsubLibrary = onSnapshot(collection(db, `users/${uid}/library`), (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type === "added" || change.type === "modified") {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const data = change.doc.data() as any;
              const localItem = useLibraryStore.getState().items[change.doc.id];
              
              if (!localItem || new Date(data.updatedAt).getTime() > new Date(localItem.updatedAt).getTime()) {
                useLibraryStore.getState()._setItemLocal(data);
              }
            }
          });
        }, (error) => {
          console.error("Library sync listener error:", error);
        });

        unsubHistory = onSnapshot(collection(db, `users/${uid}/history`), (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type === "added" || change.type === "modified") {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const data = change.doc.data() as any;
              const localItem = useHistoryStore.getState().items[change.doc.id];
              
              if (!localItem || new Date(data.readAt).getTime() > new Date(localItem.readAt).getTime()) {
                useHistoryStore.getState()._setItemLocal(data);
              }
            }
          });
        }, (error) => {
          console.error("History sync listener error:", error);
        });
      });
    });

    return () => {
      if (unsubLibrary) unsubLibrary();
      if (unsubHistory) unsubHistory();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, options.autoSync]);

  const syncLibraryItem = async (item: LibraryItem) => {
    try {
      const { db: firestore } = await initFirebase();
      if (!firestore) return;
      const { doc, setDoc } = await import('firebase/firestore');
      const uid = user?.uid;
      if (!uid) return;
      
      const id = `${item.sourceId}::${item.mangaId}`;
      await setDoc(doc(firestore, `users/${uid}/library`, id), item);
    } catch (e) {
      console.error(e);
    }
  };

  const syncHistoryItem = async (item: HistoryItem) => {
    try {
      const { db: firestore } = await initFirebase();
      if (!firestore) return;
      const { doc, setDoc } = await import('firebase/firestore');
      const uid = user?.uid;
      if (!uid) return;
      
      const id = `${item.sourceId}::${item.mangaId}::${item.chapterId}`;
      await setDoc(doc(firestore, `users/${uid}/history`, id), item);
    } catch (e) {
      console.error(e);
    }
  };

  return { runFullSync, isSyncing, syncLibraryItem, syncHistoryItem };
}
