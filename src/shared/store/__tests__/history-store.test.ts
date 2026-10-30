import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useHistoryStore } from '../history-store';
import { useLibraryStore } from '../library-store';
import { deleteHistoryItem, deleteMangaHistory, PartialHistoryDeletionError, pushHistoryItem } from '@/shared/lib/sync-utils';
import { toast } from 'sonner';

vi.mock('@/shared/lib/sync-utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/lib/sync-utils')>();
  return {
    PartialHistoryDeletionError: actual.PartialHistoryDeletionError,
    pushHistoryItem: vi.fn().mockResolvedValue(undefined),
    deleteHistoryItem: vi.fn().mockResolvedValue(undefined),
    deleteMangaHistory: vi.fn().mockResolvedValue(undefined),
  };
});
vi.mock('sonner', () => ({ toast: { error: vi.fn(), warning: vi.fn() } }));

describe('history-store', () => {
  beforeEach(() => {
    // Clear Zustand store before each test
    useHistoryStore.getState().clearHistory();
    useLibraryStore.setState({ items: {} });
  });

  afterEach(() => {
    useHistoryStore.getState().clearHistory();
    localStorage.removeItem('yomirra-local-data-owner-uid');
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

  it('restores only uncommitted chapters after a partial bulk delete', async () => {
    let rejectDelete!: (reason: Error) => void;
    vi.mocked(deleteMangaHistory).mockReturnValueOnce(new Promise<void>((_, reject) => { rejectDelete = reject; }));
    const original = { sourceId: 's', mangaId: 'm', mangaTitle: 'M', readAt: 1 };
    useHistoryStore.setState({ items: {
      's::m::committed': { ...original, chapterId: 'committed' },
      's::m::failed': { ...original, chapterId: 'failed' },
      's::m::reread': { ...original, chapterId: 'reread' },
    } });
    useHistoryStore.getState().removeMangaHistory('s', 'm');
    useHistoryStore.getState().saveProgress('s', 'm', 'reread', 8);
    useHistoryStore.getState().saveProgress('s', 'other', 'new', 9);
    rejectDelete(new PartialHistoryDeletionError(['committed']));
    await Promise.resolve();

    const items = useHistoryStore.getState().items;
    expect(items['s::m::committed']).toBeUndefined();
    expect(items['s::m::failed']).toEqual({ ...original, chapterId: 'failed' });
    expect(items['s::m::reread'].pageIndex).toBe(8);
    expect(items['s::other::new'].pageIndex).toBe(9);
    expect(toast.error).toHaveBeenLastCalledWith('Sebagian Riwayat Berhasil Dihapus', expect.any(Object));
  });

  describe.each(['single', 'bulk'] as const)('%s deletion rollback', (mode) => {
    const remove = () => {
      const store = useHistoryStore.getState();
      if (mode === 'single') store.removeHistoryItem('s', 'm', 'a');
      else store.removeMangaHistory('s', 'm');
    };
    const original = { sourceId: 's', mangaId: 'm', chapterId: 'a', mangaTitle: 'M', readAt: 1 };

    it('keeps the snapshot deleted when the earlier operation succeeds and the later bulk fails', async () => {
      let resolveFirst!: () => void;
      let rejectSecond!: (reason: Error) => void;
      const deleteFirst = mode === 'single' ? deleteHistoryItem : deleteMangaHistory;
      vi.mocked(deleteFirst).mockReturnValueOnce(new Promise<void>(resolve => { resolveFirst = resolve; }));
      useHistoryStore.setState({ items: { 's::m::a': original } });
      remove();
      vi.mocked(deleteMangaHistory).mockReturnValueOnce(new Promise<void>((_, reject) => { rejectSecond = reject; }));
      useHistoryStore.getState().removeMangaHistory('s', 'm');
      resolveFirst();
      await Promise.resolve();
      rejectSecond(new Error('later deletion failed'));
      await Promise.resolve();
      expect(useHistoryStore.getState().items['s::m::a']).toBeUndefined();
    });

    it.each(['earlier-first', 'later-first'] as const)('restores the snapshot when both overlapping deletions fail without re-addition: %s', async (failureOrder) => {
      let rejectFirst!: (reason: Error) => void;
      let rejectSecond!: (reason: Error) => void;
      const deleteFirst = mode === 'single' ? deleteHistoryItem : deleteMangaHistory;
      vi.mocked(deleteFirst).mockReturnValueOnce(new Promise<void>((_, reject) => { rejectFirst = reject; }));
      useHistoryStore.setState({ items: { 's::m::a': original } });
      remove();
      vi.mocked(deleteMangaHistory).mockReturnValueOnce(new Promise<void>((_, reject) => { rejectSecond = reject; }));
      useHistoryStore.getState().removeMangaHistory('s', 'm');
      const [early, late] = failureOrder === 'earlier-first' ? [rejectFirst, rejectSecond] : [rejectSecond, rejectFirst];
      early(new Error('one deletion failed'));
      await Promise.resolve();
      expect(useHistoryStore.getState().items['s::m::a']).toBeUndefined();
      late(new Error('other deletion failed'));
      await Promise.resolve();
      expect(useHistoryStore.getState().items['s::m::a']).toEqual(original);
    });

    it('does not restore an absent chapter after a later bulk deletion succeeds', async () => {
      let rejectFirst!: (reason: Error) => void;
      const deleteFirst = mode === 'single' ? deleteHistoryItem : deleteMangaHistory;
      vi.mocked(deleteFirst).mockReturnValueOnce(new Promise<void>((_, reject) => { rejectFirst = reject; }));
      useHistoryStore.setState({ items: { 's::m::a': original } });
      remove();
      expect(useHistoryStore.getState().items['s::m::a']).toBeUndefined();
      useHistoryStore.getState().removeMangaHistory('s', 'm');
      await Promise.resolve();
      rejectFirst(new Error('earlier deletion failed'));
      await Promise.resolve();
      expect(useHistoryStore.getState().items['s::m::a']).toBeUndefined();
    });

    it.each(['single', 'bulk'] as const)('ignores a stale failure after re-addition and a successful %s deletion', async (secondMode) => {
      let rejectFirst!: (reason: Error) => void;
      const deleteFirst = mode === 'single' ? deleteHistoryItem : deleteMangaHistory;
      vi.mocked(deleteFirst).mockReturnValueOnce(new Promise<void>((_, reject) => { rejectFirst = reject; }));
      useHistoryStore.setState({ items: { 's::m::a': original } });
      remove();
      useHistoryStore.getState()._setItemLocal({ ...original, readAt: 2, pageIndex: 9 });
      if (secondMode === 'single') useHistoryStore.getState().removeHistoryItem('s', 'm', 'a');
      else useHistoryStore.getState().removeMangaHistory('s', 'm');
      await Promise.resolve();
      rejectFirst(new Error('earlier delete failed'));
      await Promise.resolve();
      expect(useHistoryStore.getState().items['s::m::a']).toBeUndefined();
    });

    it('restores the second snapshot when both deletions fail in order', async () => {
      let rejectFirst!: (reason: Error) => void;
      let rejectSecond!: (reason: Error) => void;
      const deleteFirst = mode === 'single' ? deleteHistoryItem : deleteMangaHistory;
      vi.mocked(deleteFirst).mockReturnValueOnce(new Promise<void>((_, reject) => { rejectFirst = reject; }));
      useHistoryStore.setState({ items: { 's::m::a': original } });
      remove();
      useHistoryStore.getState().saveProgress('s', 'm', 'a', 9);
      vi.mocked(deleteHistoryItem).mockReturnValueOnce(new Promise<void>((_, reject) => { rejectSecond = reject; }));
      useHistoryStore.getState().removeHistoryItem('s', 'm', 'a');
      rejectFirst(new Error('earlier delete failed'));
      await Promise.resolve();
      expect(useHistoryStore.getState().items['s::m::a']).toBeUndefined();
      rejectSecond(new Error('latest delete failed'));
      await Promise.resolve();
      expect(useHistoryStore.getState().items['s::m::a'].pageIndex).toBe(9);
    });

    it.each(['owner', 'reset'] as const)('preserves the %s rollback guard', async (guard) => {
      localStorage.setItem('yomirra-local-data-owner-uid', 'owner-A');
      let rejectDelete!: (reason: Error) => void;
      const deleteRemote = mode === 'single' ? deleteHistoryItem : deleteMangaHistory;
      vi.mocked(deleteRemote).mockReturnValueOnce(new Promise<void>((_, reject) => { rejectDelete = reject; }));
      useHistoryStore.setState({ items: { 's::m::a': original } });
      remove();
      if (guard === 'owner') localStorage.setItem('yomirra-local-data-owner-uid', 'owner-B');
      else useHistoryStore.getState().clearHistory();
      rejectDelete(new Error('offline'));
      await Promise.resolve();
      expect(useHistoryStore.getState().items['s::m::a']).toBeUndefined();
    });
  });

  it.each(['earlier-first', 'later-first'] as const)('retains committed deletion and restores the uncommitted snapshot across overlapping bulk failures: %s', async (failureOrder) => {
    let rejectFirst!: (reason: Error) => void;
    let rejectSecond!: (reason: Error) => void;
    const original = { sourceId: 's', mangaId: 'm', mangaTitle: 'M', readAt: 1 };
    vi.mocked(deleteMangaHistory)
      .mockReturnValueOnce(new Promise<void>((_, reject) => { rejectFirst = reject; }))
      .mockReturnValueOnce(new Promise<void>((_, reject) => { rejectSecond = reject; }));
    useHistoryStore.setState({ items: {
      's::m::committed': { ...original, chapterId: 'committed' },
      's::m::failed': { ...original, chapterId: 'failed' },
    } });
    useHistoryStore.getState().removeMangaHistory('s', 'm');
    useHistoryStore.getState().removeMangaHistory('s', 'm');
    const partial = new PartialHistoryDeletionError(['committed']);
    if (failureOrder === 'earlier-first') {
      rejectFirst(partial);
      await Promise.resolve();
      rejectSecond(new Error('later deletion failed'));
    } else {
      rejectSecond(new Error('later deletion failed'));
      await Promise.resolve();
      rejectFirst(partial);
    }
    await Promise.resolve();
    expect(useHistoryStore.getState().items['s::m::committed']).toBeUndefined();
    expect(useHistoryStore.getState().items['s::m::failed']).toEqual({ ...original, chapterId: 'failed' });
  });

});
