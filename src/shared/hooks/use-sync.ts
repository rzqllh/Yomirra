import { useEffect, useRef } from 'react';
import { useAuth } from './use-auth';
import { useLibraryStore } from '@/shared/store/library-store';
import { useHistoryStore } from '@/shared/store/history-store';
import { db } from '@/shared/lib/firebase';
import { doc, setDoc, onSnapshot, collection, getDocs, writeBatch } from 'firebase/firestore';

export function useSync() {
  const { user } = useAuth();
  
  const { items: libraryItems, updateLibraryItem, addToLibrary } = useLibraryStore();
  const { items: historyItems, upsertHistory } = useHistoryStore();
  
  const hasSyncedInitial = useRef(false);

  useEffect(() => {
    if (!user) {
      hasSyncedInitial.current = false;
      return;
    }

    if (hasSyncedInitial.current) return;
    
    // Extracted sync logic so it can be called on 'online' event
    const runFullSync = async () => {
      try {
        const firestore = db;
        if (!firestore) return;
        const uid = user.uid;
        
        // 1. Fetch remote library
        const remoteLibSnapshot = await getDocs(collection(firestore, `users/${uid}/library`));
        const remoteLibrary: Record<string, any> = {};
        remoteLibSnapshot.forEach(doc => {
          remoteLibrary[doc.id] = doc.data();
        });

        // 2. Fetch remote history
        const remoteHistSnapshot = await getDocs(collection(firestore, `users/${uid}/history`));
        const remoteHistory: Record<string, any> = {};
        remoteHistSnapshot.forEach(doc => {
          remoteHistory[doc.id] = doc.data();
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
            addToLibrary(remoteItem as any);
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
            upsertHistory(remoteItem as any);
          }
        });

        if (batchCount > 0) {
          await batch.commit();
          console.log(`[Sync] Synced ${batchCount} local items to Cloud`);
        }

        hasSyncedInitial.current = true;
      } catch (error) {
        console.error("Sync error:", error);
      } finally {
        hasSyncedInitial.current = true;
      }
    };

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
  }, [user, libraryItems, historyItems, addToLibrary, upsertHistory]);

  // Setup real-time listeners for cross-device sync
  useEffect(() => {
    if (!user || !hasSyncedInitial.current || !db) return;

    const uid = user.uid;

    const unsubLibrary = onSnapshot(collection(db, `users/${uid}/library`), (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added" || change.type === "modified") {
          const data = change.doc.data() as any;
          const localItem = useLibraryStore.getState().items[change.doc.id];
          
          if (!localItem || new Date(data.updatedAt).getTime() > new Date(localItem.updatedAt).getTime()) {
            useLibraryStore.getState().addToLibrary(data);
          }
        }
      });
    }, (error) => {
      console.error("Library sync listener error:", error);
    });

    const unsubHistory = onSnapshot(collection(db, `users/${uid}/history`), (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added" || change.type === "modified") {
          const data = change.doc.data() as any;
          const localItem = useHistoryStore.getState().items[change.doc.id];
          
          if (!localItem || new Date(data.readAt).getTime() > new Date(localItem.readAt).getTime()) {
            useHistoryStore.getState().upsertHistory(data);
          }
        }
      });
    }, (error) => {
      console.error("History sync listener error:", error);
    });

    return () => {
      unsubLibrary();
      unsubHistory();
    };
  }, [user]);

  // Helper to push updates immediately upon local action
  const syncLibraryItem = async (item: any) => {
    if (!user || !db) return;
    try {
      const id = `${item.sourceId}::${item.mangaId}`;
      await setDoc(doc(db, `users/${user.uid}/library`, id), item);
    } catch (e) {
      console.error("Failed to sync library item", e);
    }
  };

  const syncHistoryItem = async (item: any) => {
    if (!user || !db) return;
    try {
      const id = `${item.sourceId}::${item.mangaId}::${item.chapterId}`;
      await setDoc(doc(db, `users/${user.uid}/history`, id), item);
    } catch (e) {
      console.error("Failed to sync history item", e);
    }
  };

  return { syncLibraryItem, syncHistoryItem };
}
