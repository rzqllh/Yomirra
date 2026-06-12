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
    await setDoc(doc(db, `users/${user.uid}/library`, id), item);
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
    await setDoc(doc(db, `users/${user.uid}/history`, id), item);
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
