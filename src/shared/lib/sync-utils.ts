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
    const id = `${item.sourceId}::${item.mangaId}`;
    const cleanItem = Object.fromEntries(Object.entries(item).filter(([, v]) => v !== undefined));
    await setDoc(doc(db, `users/${user.uid}/library`, id), cleanItem);
  } catch (e) {
    console.error("Failed to sync library item", e);
  }
}

export async function deleteLibraryItem(sourceId: string, mangaId: string) {
  const { auth, db } = await initFirebase();
  if (!auth || !db) return;
  const user = auth.currentUser;
  if (!user) return;
  try {
    const { doc, deleteDoc } = await import("firebase/firestore");
    const id = `${sourceId}::${mangaId}`;
    await deleteDoc(doc(db, `users/${user.uid}/library`, id));
  } catch (e) {
    console.error("Failed to delete library item from sync", e);
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
  }
}

export async function deleteMangaHistory(sourceId: string, mangaId: string) {
  const { auth, db } = await initFirebase();
  if (!auth || !db) return;
  const user = auth.currentUser;
  if (!user) return;
  try {
    const { collection, query, getDocs, writeBatch } = await import("firebase/firestore");
    const historyRef = collection(db, `users/${user.uid}/history`);
    const q = query(historyRef);
    const snapshot = await getDocs(q);
    
    // Create a batch
    const batch = writeBatch(db);
    let count = 0;
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.sourceId === sourceId && data.mangaId === mangaId) {
        batch.delete(doc.ref);
        count++;
      }
    });
    
    if (count > 0) {
      await batch.commit();
    }
  } catch (e) {
    console.error("Failed to delete manga history from sync", e);
  }
}

export async function pullLibraryData(): Promise<LibraryItem[]> {
  const { auth, db } = await initFirebase();
  if (!auth || !db) return [];
  const user = auth.currentUser;
  if (!user) return [];
  try {
    const { collection, getDocs } = await import("firebase/firestore");
    const querySnapshot = await getDocs(collection(db, `users/${user.uid}/library`));
    return querySnapshot.docs.map(doc => doc.data() as LibraryItem);
  } catch (e) {
    console.error("Failed to pull library data", e);
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

export async function pushSourcePreferences(disabledSources: string[]) {
  const { auth, db } = await initFirebase();
  if (!auth || !db) return;
  const user = auth.currentUser;
  if (!user) return;
  try {
    const { doc, setDoc } = await import("firebase/firestore");
    await setDoc(doc(db, `users/${user.uid}/preferences`, "sources"), {
      disabledSources,
      updatedAt: new Date().toISOString()
    });
  } catch (e) {
    console.error("Failed to sync source preferences", e);
  }
}

export async function pullSourcePreferences(): Promise<string[]> {
  const { auth, db } = await initFirebase();
  if (!auth || !db) return [];
  const user = auth.currentUser;
  if (!user) return [];
  try {
    const { doc, getDoc } = await import("firebase/firestore");
    const snapshot = await getDoc(doc(db, `users/${user.uid}/preferences`, "sources"));
    if (snapshot.exists()) {
      const data = snapshot.data();
      return Array.isArray(data.disabledSources) ? data.disabledSources : [];
    }
    return [];
  } catch (e) {
    console.error("Failed to pull source preferences", e);
    return [];
  }
}
