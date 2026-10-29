import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useHistoryStore } from '../history-store';
import { useLibraryStore } from '../library-store';
import { setLocalDataOwnerUid, clearLocalDataOwnerUid } from '@/shared/lib/local-data-owner';
import { deleteHistoryItem, deleteMangaHistory, pushHistoryItem } from '@/shared/lib/sync-utils';

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

  it('retains every chapter beyond 1,000 items without issuing automatic cloud tombstones', async () => {
    vi.useFakeTimers();
    try {
      vi.mocked(deleteHistoryItem).mockClear();
      const items = Object.fromEntries(Array.from({ length: 1200 }, (_, index) => [
        `source::manga::chapter-${index}`,
        { sourceId: 'source', mangaId: 'manga', chapterId: `chapter-${index}`, mangaTitle: 'Title', readAt: index },
      ]));
      useHistoryStore.setState({ items });

      useHistoryStore.getState().upsertHistory({
        sourceId: 'source', mangaId: 'manga', chapterId: 'chapter-new', mangaTitle: 'Title', readAt: 2000,
      });
      await vi.runAllTimersAsync();

      const current = useHistoryStore.getState().items;
      expect(Object.keys(current)).toHaveLength(1201);
      expect(current['source::manga::chapter-0']).toBeDefined();
      expect(current['source::manga::chapter-1199']).toBeDefined();
      expect(current['source::manga::chapter-new']).toBeDefined();
      expect(deleteHistoryItem).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it('keeps the local chapter cursor and later unrelated progress after cloud sync rejects', async () => {
    useHistoryStore.setState({
      items: {
        'source1::manga1::chapter1': {
          sourceId: 'source1', mangaId: 'manga1', chapterId: 'chapter1',
          mangaTitle: 'Title', readAt: 100, pageIndex: 1,
        },
      },
    });
    vi.mocked(pushHistoryItem).mockRejectedValueOnce(new Error('offline'));

    useHistoryStore.getState().markChapterProgress('source1', 'manga1', 'chapter1', 4, 10, 40);
    // A second, independent local update must survive the earlier rejected write.
    useHistoryStore.getState().saveProgress('source2', 'manga2', 'chapter2', 7);
    await Promise.resolve();
    await Promise.resolve();

    const current = useHistoryStore.getState().items;
    expect(current['source1::manga1::chapter1'].pageIndex).toBe(4);
    expect(current['source1::manga1::chapter1'].progressPercent).toBe(40);
    expect(current['source2::manga2::chapter2'].pageIndex).toBe(7);
  });


  it('restores only the affected chapter when a single-item cloud delete fails', async () => {
    const original = {
      sourceId: 'source1', mangaId: 'manga1', chapterId: 'chapter1',
      mangaTitle: 'Title', readAt: 100,
    };
    useHistoryStore.setState({ items: { 'source1::manga1::chapter1': original } });
    let rejectDelete!: (reason?: unknown) => void;
    vi.mocked(deleteHistoryItem).mockReturnValueOnce(new Promise<void>((_resolve, reject) => {
      rejectDelete = reject;
    }));

    useHistoryStore.getState().removeHistoryItem('source1', 'manga1', 'chapter1');
    useHistoryStore.getState().saveProgress('source2', 'manga2', 'chapter2', 9);
    rejectDelete(new Error('offline'));
    await Promise.resolve();
    await Promise.resolve();

    const items = useHistoryStore.getState().items;
    expect(items['source1::manga1::chapter1']).toEqual(original);
    expect(items['source2::manga2::chapter2'].pageIndex).toBe(9);
  });

  it('restores deleted manga chapters without overwriting newer cursors or unrelated progress', async () => {
    const chapter1 = {
      sourceId: 'source1', mangaId: 'manga1', chapterId: 'chapter1',
      mangaTitle: 'Title', readAt: 100, pageIndex: 1,
    };
    const chapter2 = {
      ...chapter1, chapterId: 'chapter2', pageIndex: 2,
    };
    useHistoryStore.setState({ items: {
      'source1::manga1::chapter1': chapter1,
      'source1::manga1::chapter2': chapter2,
    } });
    let rejectDelete!: (reason?: unknown) => void;
    vi.mocked(deleteMangaHistory).mockReturnValueOnce(new Promise<void>((_resolve, reject) => {
      rejectDelete = reject;
    }));

    useHistoryStore.getState().removeMangaHistory('source1', 'manga1');
    useHistoryStore.getState().saveProgress('source1', 'manga1', 'chapter2', 8);
    useHistoryStore.getState().saveProgress('source2', 'manga2', 'chapter3', 9);
    rejectDelete(new Error('offline'));
    await Promise.resolve();
    await Promise.resolve();

    const items = useHistoryStore.getState().items;
    expect(items['source1::manga1::chapter1']).toEqual(chapter1);
    expect(items['source1::manga1::chapter2'].pageIndex).toBe(8);
    expect(items['source2::manga2::chapter3'].pageIndex).toBe(9);
  });


  it('captures history sync owner before delayed dispatch and does not queue guest data', async () => {
    vi.useFakeTimers();
    try {
      vi.mocked(pushHistoryItem).mockClear();
      clearLocalDataOwnerUid();
      useHistoryStore.getState().upsertHistory({
        sourceId: 'source', mangaId: 'guest', chapterId: 'ch1',
        mangaTitle: 'Guest chapter', readAt: 10,
      });
      await vi.runAllTimersAsync();
      expect(pushHistoryItem).not.toHaveBeenCalled();

      setLocalDataOwnerUid('owner-A');
      useHistoryStore.getState().upsertHistory({
        sourceId: 'source', mangaId: 'owner-a', chapterId: 'ch1',
        mangaTitle: 'Owner A chapter', readAt: 11,
      });
      setLocalDataOwnerUid('owner-B');
      await vi.runAllTimersAsync();
      expect(pushHistoryItem).toHaveBeenCalledTimes(1);
      expect(pushHistoryItem).toHaveBeenCalledWith(
        expect.objectContaining({ mangaId: 'owner-a' }),
        'owner-A',
      );
    } finally {
      clearLocalDataOwnerUid();
      vi.useRealTimers();
    }
  });

});
