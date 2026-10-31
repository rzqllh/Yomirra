import { getLocalDataOwnerUid } from "./local-data-owner";

export const BOOKMARK_SUGGESTION_EVENT = "yomirra:bookmark-suggestion";
export function bookmarkSuggestionKey(sourceId: string, mangaId: string) {
  return `yomirra-save-suggestion-v2:${getLocalDataOwnerUid() ?? "guest"}:${encodeURIComponent(sourceId)}:${encodeURIComponent(mangaId)}`;
}
function read(key: string): { chapters: string[]; offered: boolean } {
  try {
    const value = JSON.parse(sessionStorage.getItem(key) ?? "null");
    return { chapters: Array.isArray(value?.chapters) ? value.chapters.filter((id: unknown) => typeof id === "string") : [], offered: value?.offered === true };
  } catch { return { chapters: [], offered: false }; }
}
// Recommendation evidence only: this never writes a reading milestone.
export function noteCompletedChapter(sourceId: string, mangaId: string, chapterId: string) {
  const key = bookmarkSuggestionKey(sourceId, mangaId);
  const state = read(key);
  if (state.offered || state.chapters.includes(chapterId)) return;
  state.chapters = [...state.chapters, chapterId].slice(-4);
  try { sessionStorage.setItem(key, JSON.stringify(state)); } catch { return; }
  if (state.chapters.length > 3) window.dispatchEvent(new Event(BOOKMARK_SUGGESTION_EVENT));
}
export function takeBookmarkSuggestion(sourceId: string, mangaId: string) {
  const key = bookmarkSuggestionKey(sourceId, mangaId);
  const state = read(key);
  if (state.offered || state.chapters.length <= 3) return false;
  try { sessionStorage.setItem(key, JSON.stringify({ ...state, offered: true })); } catch { return false; }
  return true;
}

export function dismissBookmarkSuggestion(sourceId: string, mangaId: string) {
  const key = bookmarkSuggestionKey(sourceId, mangaId);
  try { sessionStorage.setItem(key, JSON.stringify({ ...read(key), offered: true })); } catch { /* Optional recommendation state. */ }
}
