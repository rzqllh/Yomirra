import { auth, db } from "./firebase";
import { doc, setDoc, deleteDoc } from "firebase/firestore";

export async function pushLibraryItem(item: any) {
  if (!auth || !db) return;
  const user = auth.currentUser;
  if (!user) return;
  try {
    const id = `${item.sourceId}::${item.mangaId}`;
    await setDoc(doc(db, `users/${user.uid}/library`, id), item);
  } catch (e) {
    console.error("Failed to sync library item", e);
  }
}

export async function deleteLibraryItem(sourceId: string, mangaId: string) {
  if (!auth || !db) return;
  const user = auth.currentUser;
  if (!user) return;
  try {
    const id = `${sourceId}::${mangaId}`;
    await deleteDoc(doc(db, `users/${user.uid}/library`, id));
  } catch (e) {
    console.error("Failed to delete library item from sync", e);
  }
}

export async function pushHistoryItem(item: any) {
  if (!auth || !db) return;
  const user = auth.currentUser;
  if (!user) return;
  try {
    const id = `${item.sourceId}::${item.mangaId}::${item.chapterId}`;
    await setDoc(doc(db, `users/${user.uid}/history`, id), item);
  } catch (e) {
    console.error("Failed to sync history item", e);
  }
}

export async function deleteHistoryItem(sourceId: string, mangaId: string, chapterId: string) {
  if (!auth || !db) return;
  const user = auth.currentUser;
  if (!user) return;
  try {
    const id = `${sourceId}::${mangaId}::${chapterId}`;
    await deleteDoc(doc(db, `users/${user.uid}/history`, id));
  } catch (e) {
    console.error("Failed to delete history item from sync", e);
  }
}
