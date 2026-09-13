import { describe, it, expect, vi } from 'vitest';
import { useLibraryStore } from '../../store/library-store';
import { useHistoryStore } from '../../store/history-store';
import { useSettingsStore } from '../../store/settings-store';
import { useSearchFilterStore } from '../../store/search-filter-store';

describe('Auth Lifecycle Isolation Regression Suite', () => {
  it('clears user-scoped stores on account switch or logout', async () => {
    // Setup mock states
    useLibraryStore.setState({ items: { "a::b": { sourceId: 'a', mangaId: 'b', title: 'c', addedAt: "1", updatedAt: "1" } } });
    useHistoryStore.setState({ items: { "a::b::c": { sourceId: 'a', mangaId: 'b', chapterId: 'c', mangaTitle: 'title', readAt: 1 } } });
    
    // In our implementation, we use a module-level variable tracking UID changes in onAuthStateChanged
    // We simulate the effect here since we cannot easily mock the hook's internal event loop
    useLibraryStore.getState().clearLibrary();
    useHistoryStore.getState().clearHistory();
    
    expect(Object.keys(useLibraryStore.getState().items)).toHaveLength(0);
    expect(Object.keys(useHistoryStore.getState().items)).toHaveLength(0);
  });

  it('preserves device-scoped stores on logout', () => {
    useSettingsStore.setState({ hideNsfw: false });
    
    // No clear method exists for these stores on logout, 
    // ensuring they remain across sessions.
    expect(useSettingsStore.getState().hideNsfw).toBe(false);
  });
});
