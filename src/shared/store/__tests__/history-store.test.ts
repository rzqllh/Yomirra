import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useHistoryStore } from '../history-store';
import { useLibraryStore } from '../library-store';
import { deleteHistoryItem, pushHistoryItem } from '@/shared/lib/sync-utils';

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

  it('compacts overflow without deleting cloud progress', () => {
    vi.mocked(deleteHistoryItem).mockClear();
    const items = Object.fromEntries(Array.from({ length: 1000 }, (_, index) => [
      `source::manga-${index}::chapter`,
      { sourceId: 'source', mangaId: `manga-${index}`, chapterId: 'chapter', mangaTitle: 'Title', readAt: index + 1 },
    ]));
    useHistoryStore.setState({ items });
    useHistoryStore.getState().upsertHistory({ sourceId: 'source', mangaId: 'new', chapterId: 'chapter', mangaTitle: 'New', readAt: 2000 });
    const retained = Object.values(useHistoryStore.getState().items);
    expect(retained.filter(item => !item.isCompact)).toHaveLength(512);
    expect(retained).toHaveLength(1001);
    expect(deleteHistoryItem).not.toHaveBeenCalled();
  });
  it('keeps newer local progress when an earlier cloud write fails', async () => {
    localStorage.setItem('yomirra-local-data-owner-uid', 'owner-A');
    let rejectWrite!: (reason: Error) => void;
    vi.mocked(pushHistoryItem).mockImplementationOnce(() => new Promise<void>((_, reject) => { rejectWrite = reject; }));
    useHistoryStore.setState({ items: { 's::m::a': { sourceId: 's', mangaId: 'm', chapterId: 'a', mangaTitle: 'M', readAt: 1 } } });
    useHistoryStore.getState().markChapterProgress('s', 'm', 'a', 2, 10);
    await Promise.resolve();
    await Promise.resolve();
    useHistoryStore.getState().saveProgress('s', 'm', 'b', 7);
    rejectWrite(new Error('offline'));
    await Promise.resolve();
    await Promise.resolve();
    expect(useHistoryStore.getState().items['s::m::b'].pageIndex).toBe(7);
    expect(useHistoryStore.getState().items['s::m::a'].pageIndex).toBe(2);
    useHistoryStore.getState().clearHistory();
    localStorage.removeItem('yomirra-local-data-owner-uid');
  });

  it('migrates version 1 persistence to 512 details without dropping old-title cursors', async () => {
    const items = Object.fromEntries(Array.from({ length: 700 }, (_, index) => [
      `source::title-${index}::c`, { sourceId: 'source', mangaId: `title-${index}`, chapterId: 'c', mangaTitle: 'Title', readAt: index + 1, pageIndex: 7 },
    ]));
    localStorage.setItem('yomirra-history', JSON.stringify({ state: { items }, version: 1 }));
    await useHistoryStore.persist.rehydrate();
    const retained = Object.values(useHistoryStore.getState().items);
    expect(retained.filter(item => !item.isCompact)).toHaveLength(512);
    expect(retained).toHaveLength(700);
    expect(useHistoryStore.getState().items['source::title-0::c'].pageIndex).toBe(7);
  });

  it('restores only the failed deletion while preserving newer chapter progress', async () => {
    let rejectDelete!: (reason: Error) => void;
    vi.mocked(deleteHistoryItem).mockImplementationOnce(() => new Promise<void>((_, reject) => { rejectDelete = reject; }));
    useHistoryStore.setState({ items: { 's::m::a': { sourceId: 's', mangaId: 'm', chapterId: 'a', mangaTitle: 'M', readAt: 1 } } });
    useHistoryStore.getState().removeHistoryItem('s', 'm', 'a');
    useHistoryStore.getState().saveProgress('s', 'm', 'b', 9);
    rejectDelete(new Error('offline'));
    await Promise.resolve();
    expect(useHistoryStore.getState().items['s::m::a']).toBeDefined();
    expect(useHistoryStore.getState().items['s::m::b'].pageIndex).toBe(9);
    useHistoryStore.getState().clearHistory();
  });

});
