import { getLocalDataOwnerUid } from "./local-data-owner";

export const BOOKMARK_SUGGESTION_EVENT = "yomirra:bookmark-suggestion";
export function bookmarkSuggestionKey(sourceId: string, mangaId: string) {
  return `yomirra-save-suggestion-v2:${getLocalDataOwnerUid() ?? "guest"}:${encodeURIComponent(sourceId)}:${encodeURIComponent(mangaId)}`;
}
interface SuggestionState { chapters: string[]; offered: boolean }
function read(key: string): SuggestionState {
  let raw: string | null = null;
  try { raw = localStorage.getItem(key); } catch { /* Private mode or storage denied. */ }
  if (!raw) {
    // Upgrade existing session-only suggestions without prompting a second time.
    try { raw = sessionStorage.getItem(key); } catch { /* Storage unavailable. */ }
  }
  try {
    const value = JSON.parse(raw ?? "null");
    return { chapters: Array.isArray(value?.chapters) ? value.chapters.filter((id: unknown) => typeof id === "string") : [], offered: value?.offered === true };
  } catch { return { chapters: [], offered: false }; }
}

function persist(key: string, state: SuggestionState): boolean {
  const value = JSON.stringify(state);
  try { localStorage.setItem(key, value); return true; }
  catch {
    // Session-only fallback avoids silently losing the entire feature on
    // browsers that deny durable storage.
    try { sessionStorage.setItem(key, value); return true; }
    catch { return false; }
  }
}
// Recommendation evidence only: this never writes a reading milestone.
export function noteCompletedChapter(sourceId: string, mangaId: string, chapterId: string) {
  const key = bookmarkSuggestionKey(sourceId, mangaId);
  const state = read(key);
  if (state.offered || state.chapters.includes(chapterId)) return;
  state.chapters = [...state.chapters, chapterId].slice(-4);
  if (!persist(key, state)) return;
  if (state.chapters.length > 3) window.dispatchEvent(new Event(BOOKMARK_SUGGESTION_EVENT));
}
export function takeBookmarkSuggestion(sourceId: string, mangaId: string) {
  const key = bookmarkSuggestionKey(sourceId, mangaId);
  const state = read(key);
  if (state.offered || state.chapters.length <= 3) return false;
  if (!persist(key, { ...state, offered: true })) return false;
  return true;
}

export function dismissBookmarkSuggestion(sourceId: string, mangaId: string) {
  const key = bookmarkSuggestionKey(sourceId, mangaId);
  persist(key, { ...read(key), offered: true });
}
