import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useHistoryStore } from '../history-store';
import { useLibraryStore } from '../library-store';
import { deleteHistoryItem } from '@/shared/lib/sync-utils';

vi.mock('@/shared/lib/sync-utils', () => ({
  pushHistoryItem: vi.fn().mockResolvedValue(undefined),
  deleteHistoryItem: vi.fn().mockResolvedValue(undefined),
  deleteMangaHistory: vi.fn().mockResolvedValue(undefined),
}));

describe('history-store', () => {
  beforeEach(() => {
    // Clear Zustand store before each test
    useHistoryStore.setState({ items: {} });
    useLibraryStore.setState({ items: {} });
  });

  it('should save progress correctly', () => {
    const store = useHistoryStore.getState();
    store.upsertHistory({
      sourceId: 'source1',
      mangaId: 'manga1',
      chapterId: 'chapter1',
      mangaTitle: 'Manga 1',
      readAt: Date.now()
    });
    store.saveProgress('source1', 'manga1', 'chapter1', 10, 500);

    const newState = useHistoryStore.getState();
    const item = newState.items['source1::manga1::chapter1'];

    expect(item).toBeDefined();
    expect(item.chapterId).toBe('chapter1');
    expect(item.pageIndex).toBe(10);
    expect(item.pageOffset).toBe(500);
    expect(typeof item.readAt).toBe('number');
  });

  it('should get latest progress', () => {
    const store = useHistoryStore.getState();
    store.upsertHistory({
      sourceId: 'source1',
      mangaId: 'manga1',
      chapterId: 'chapter1',
      mangaTitle: 'Manga 1',
      readAt: Date.now()
    });
    store.saveProgress('source1', 'manga1', 'chapter1', 1);
    
    const latest = useHistoryStore.getState().getLatestForManga('source1', 'manga1');
    expect(latest).toBeDefined();
    expect(latest?.chapterId).toBe('chapter1');
  });

  it('should clear history', () => {
    const store = useHistoryStore.getState();
    store.saveProgress('source1', 'manga1', 'chapter1', 1);
    store.clearHistory();
    
    const newState = useHistoryStore.getState();
    expect(Object.keys(newState.items).length).toBe(0);
  });
  it('groups continue reading by canonical title across sources', () => {
    useLibraryStore.setState({
      items: {
        canonical: {
          id: 'canonical',
          sourceId: 'source1',
          mangaId: 'manga1',
          primarySourceId: 'source1',
          primaryMangaId: 'manga1',
          title: 'Manga 1',
          linkedSources: [
            {
              sourceId: 'source2',
              mangaId: 'manga2',
              addedAt: Date.now(),
              matchConfidence: 'CONFIRMED',
            },
          ],
          addedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      },
    });

    const store = useHistoryStore.getState();
    store.upsertHistory({
      sourceId: 'source1',
      mangaId: 'manga1',
      chapterId: 'chapter1',
      mangaTitle: 'Manga 1',
      readAt: 100,
    });
    store.upsertHistory({
      sourceId: 'source2',
      mangaId: 'manga2',
      chapterId: 'chapter2',
      mangaTitle: 'Manga 1',
      readAt: 200,
    });

    const continueReading = useHistoryStore.getState().getContinueReading();
    expect(continueReading).toHaveLength(1);
    expect(continueReading[0].sourceId).toBe('source2');
    expect(continueReading[0].savedTitleId).toBe('canonical');
  });

  it('safely handles resolveSavedTitleId when library is not yet hydrated or resolved', () => {
    const store = useHistoryStore.getState();
    const resolved = store.resolveSavedTitleId('unknownSource', 'unknownManga');
    expect(resolved).toBeNull();
  });

  it('handles a rejected cloud delete for cap eviction without an unhandled rejection', async () => {
    vi.useFakeTimers();
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.mocked(deleteHistoryItem).mockRejectedValueOnce(new Error('offline'));
    const items = Object.fromEntries(Array.from({ length: 1000 }, (_, index) => [
      `source::manga::chapter-${index}`,
      { sourceId: 'source', mangaId: 'manga', chapterId: `chapter-${index}`, mangaTitle: 'Title', readAt: index },
    ]));
    useHistoryStore.setState({ items });

    useHistoryStore.getState().upsertHistory({
      sourceId: 'source', mangaId: 'manga', chapterId: 'chapter-new', mangaTitle: 'New', readAt: 2000,
    });
    await vi.runAllTimersAsync();

    expect(error).toHaveBeenCalledWith('Failed to delete evicted history item', expect.any(Error));
    error.mockRestore();
    vi.useRealTimers();
  });
});
