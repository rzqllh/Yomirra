import { initFirebase } from "./firebase";
import { LibraryItem } from "@/shared/store/library-store";
import { HistoryItem } from "@/shared/store/history-store";

export async function pushLibraryItem(item: LibraryItem) {
  const { auth, db } = await initFirebase();
  if (!auth || !db) return;
  const user = auth.currentUser;
  if (!user) return;
  try {
    const { doc, setDoc } = await import("firebase/firestore");
    const savedTitleId = item.id ?? `${item.sourceId}::${item.mangaId}`;
    const cleanItem = Object.fromEntries(Object.entries(item).filter(([, v]) => v !== undefined));
    await setDoc(doc(db, `users/${user.uid}/libraryV2`, savedTitleId), cleanItem);
  } catch (e) {
    console.error("Failed to sync library item", e);
    throw e;
  }
}

export async function deleteLibraryItem(sourceId: string, mangaId: string, savedTitleId?: string) {
  const { auth, db } = await initFirebase();
  if (!auth || !db) return;
  const user = auth.currentUser;
  if (!user) return;
  try {
    const { doc, deleteDoc, setDoc } = await import("firebase/firestore");
    const v2Id = savedTitleId ?? `${sourceId}::${mangaId}`;
    // Remove from canonical libraryV2
    await deleteDoc(doc(db, `users/${user.uid}/libraryV2`, v2Id));
    // Write tombstone to legacy library so V1 clients see deletion
    const legacyId = `${sourceId}::${mangaId}`;
    await setDoc(doc(db, `users/${user.uid}/library`, legacyId), { _deleted: true, deletedAt: new Date().toISOString() });
  } catch (e) {
    console.error("Failed to delete library item from sync", e);
    throw e;
  }
}

export async function pushHistoryItem(item: HistoryItem) {
  const { auth, db } = await initFirebase();
  if (!auth || !db) return;
  const user = auth.currentUser;
  if (!user) return;
  try {
    const { doc, setDoc } = await import("firebase/firestore");
    const id = `${item.sourceId}::${item.mangaId}::${item.chapterId}`;
    const cleanItem = Object.fromEntries(Object.entries(item).filter(([, v]) => v !== undefined));
    await setDoc(doc(db, `users/${user.uid}/history`, id), cleanItem);
  } catch (e) {
    console.error("Failed to sync history item", e);
    throw e;
  }
}

export async function deleteHistoryItem(sourceId: string, mangaId: string, chapterId: string) {
  const { auth, db } = await initFirebase();
  if (!auth || !db) return;
  const user = auth.currentUser;
  if (!user) return;
  try {
    const { doc, deleteDoc } = await import("firebase/firestore");
    const id = `${sourceId}::${mangaId}::${chapterId}`;
    await deleteDoc(doc(db, `users/${user.uid}/history`, id));
  } catch (e) {
    console.error("Failed to delete history item from sync", e);
    throw e;
  }
}

export async function deleteMangaHistory(sourceId: string, mangaId: string) {
  const { auth, db } = await initFirebase();
  if (!auth || !db) return;
  const user = auth.currentUser;
  if (!user) return;
  try {
    const { collection, query, where, getDocs, writeBatch } = await import("firebase/firestore");
    const historyRef = collection(db, `users/${user.uid}/history`);
    const q = query(
      historyRef,
      where("sourceId", "==", sourceId),
      where("mangaId", "==", mangaId)
    );
    const snapshot = await getDocs(q);
    
    // Create a batch
    const batch = writeBatch(db);
    let count = 0;
    
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
      count++;
    });
    
    if (count > 0) {
      await batch.commit();
    }
  } catch (e) {
    console.error("Failed to delete manga history from sync", e);
    throw e;
  }
}

/** Pull from canonical libraryV2 collection (Phase 1+). */
export async function pullLibraryData(): Promise<LibraryItem[]> {
  const { auth, db } = await initFirebase();
  if (!auth || !db) return [];
  const user = auth.currentUser;
  if (!user) return [];
  try {
    const { collection, getDocs } = await import("firebase/firestore");
    const querySnapshot = await getDocs(collection(db, `users/${user.uid}/libraryV2`));
    return querySnapshot.docs
      .map(d => d.data() as LibraryItem)
      .filter(item => !(item as Record<string, unknown>)._deleted);
  } catch (e) {
    console.error("Failed to pull library data from libraryV2", e);
    return [];
  }
}

/** Pull from legacy 'library' collection — used once at migration time and for V1 import detection. */
export async function pullLegacyLibraryData(): Promise<LibraryItem[]> {
  const { auth, db } = await initFirebase();
  if (!auth || !db) return [];
  const user = auth.currentUser;
  if (!user) return [];
  try {
    const { collection, getDocs } = await import("firebase/firestore");
    const querySnapshot = await getDocs(collection(db, `users/${user.uid}/library`));
    return querySnapshot.docs
      .map(d => d.data() as LibraryItem)
      .filter(item => !(item as Record<string, unknown>)._deleted);
  } catch (e) {
    console.error("Failed to pull legacy library data", e);
    return [];
  }
}

export async function pullHistoryData(): Promise<HistoryItem[]> {
  const { auth, db } = await initFirebase();
  if (!auth || !db) return [];
  const user = auth.currentUser;
  if (!user) return [];
  try {
    const { collection, getDocs } = await import("firebase/firestore");
    const querySnapshot = await getDocs(collection(db, `users/${user.uid}/history`));
    return querySnapshot.docs.map(doc => doc.data() as HistoryItem);
  } catch (e) {
    console.error("Failed to pull history data", e);
    return [];
  }
}

export async function pushSourcePreferences(disabledSources: string[], hiddenFromHomeSources: string[] = []) {
  const { auth, db } = await initFirebase();
  if (!auth || !db) return;
  const user = auth.currentUser;
  if (!user) return;
  try {
    const { doc, setDoc } = await import("firebase/firestore");
    await setDoc(doc(db, `users/${user.uid}/preferences`, "sources"), {
      disabledSources,
      hiddenFromHomeSources,
      updatedAt: new Date().toISOString()
    });
  } catch (e) {
    console.error("Failed to sync source preferences", e);
  }
}

export async function pullSourcePreferences(): Promise<{ disabledSources: string[], hiddenFromHomeSources: string[] } | null> {
  const { auth, db } = await initFirebase();
  if (!auth || !db) return null;
  const user = auth.currentUser;
  if (!user) return null;
  try {
    const { doc, getDoc } = await import("firebase/firestore");
    const snapshot = await getDoc(doc(db, `users/${user.uid}/preferences`, "sources"));
    if (snapshot.exists()) {
      const data = snapshot.data();
      return {
        disabledSources: Array.isArray(data.disabledSources) ? data.disabledSources : [],
        hiddenFromHomeSources: Array.isArray(data.hiddenFromHomeSources) ? data.hiddenFromHomeSources : []
      };
    }
    return null;
  } catch (e) {
    console.error("Failed to pull source preferences", e);
    return null;
  }
}

export interface CustomCollectionsSyncData {
  collections: import("@/shared/types/collection").Collection[];
  membershipsByManga: Record<string, string[]>;
  updatedAt: string;
}

export async function pushCustomCollections(
  collections: import("@/shared/types/collection").Collection[],
  membershipsByManga: Record<string, string[]>
) {
  const { auth, db } = await initFirebase();
  if (!auth || !db) return;
  const user = auth.currentUser;
  if (!user) return;
  try {
    const { doc, setDoc } = await import("firebase/firestore");
    await setDoc(doc(db, `users/${user.uid}/preferences`, "collections"), {
      collections,
      membershipsByManga,
      updatedAt: new Date().toISOString()
    });
  } catch (e) {
    console.error("Failed to sync custom collections", e);
  }
}

export async function pullCustomCollections(): Promise<CustomCollectionsSyncData | null> {
  const { auth, db } = await initFirebase();
  if (!auth || !db) return null;
  const user = auth.currentUser;
  if (!user) return null;
  try {
    const { doc, getDoc } = await import("firebase/firestore");
    const snapshot = await getDoc(doc(db, `users/${user.uid}/preferences`, "collections"));
    if (snapshot.exists()) {
      const data = snapshot.data();
      return {
        collections: Array.isArray(data.collections) ? data.collections : [],
        membershipsByManga: data.membershipsByManga || {},
        updatedAt: data.updatedAt || new Date().toISOString()
      };
    }
    return null;
  } catch (e) {
    console.error("Failed to pull custom collections", e);
    return null;
  }
}

