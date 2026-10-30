import { describe, it, expect, vi, beforeEach } from 'vitest';
import { deleteHistoryItem, deleteLibraryItem, deleteMangaHistory, PartialHistoryDeletionError, pullHistoryData, pullLegacyLibraryData, pushLibraryItem, pushHistoryItem } from '../sync-utils';
import { initFirebase } from '../firebase';

vi.mock('../firebase', () => ({
  initFirebase: vi.fn().mockResolvedValue({
    auth: { currentUser: { uid: 'user123' } },
    db: {}
  })
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn((...path) => ({ path: path.slice(1).join('/') })),
  setDoc: vi.fn().mockResolvedValue(undefined),
  deleteDoc: vi.fn().mockResolvedValue(undefined),
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn((field, op, val) => ({ field, op, val })),
  getDocs: vi.fn().mockResolvedValue({
    docs: [
      {
        ref: 'docRef1',
        data: () => ({ sourceId: 'shinigami', mangaId: 'manga1' })
      }
    ]
  }),
  writeBatch: vi.fn(() => ({
    delete: vi.fn(),
    set: vi.fn(),
    commit: vi.fn().mockResolvedValue(undefined)
  }))
}));

describe('Firestore Sync Utils Regression Suite', () => {
  beforeEach(() => { localStorage.setItem('yomirra-local-data-owner-uid', 'user123'); });
  it('rejects an account switch while Firebase initialization is pending', async () => {
    let resolveFirebase!: (value: never) => void;
    vi.mocked(initFirebase).mockImplementationOnce(() => new Promise(resolve => { resolveFirebase = resolve; }));
    const pending = pushHistoryItem({ sourceId: 's', mangaId: 'm', chapterId: 'c', mangaTitle: 'M', readAt: 1 }, 'owner-A');
    resolveFirebase({ auth: { currentUser: { uid: 'owner-B' } }, db: {} } as never);
    await expect(pending).rejects.toThrow(/Account changed/);
  });
  it('blocks history writes and deletes for another account', async () => {
    const item = { sourceId: 's', mangaId: 'm', chapterId: 'c', mangaTitle: 'M', readAt: 1 };
    await expect(pushHistoryItem(item, 'owner-A')).rejects.toThrow(/Account changed/);
    await expect(deleteHistoryItem('s', 'm', 'c', 'owner-A')).rejects.toThrow(/Account changed/);
    await expect(deleteMangaHistory('s', 'm', 'owner-A')).rejects.toThrow(/Account changed/);
    await expect(pushHistoryItem(item, null)).resolves.toBeUndefined();
  });

  it('uses scoped query instead of full scan for deleteMangaHistory', async () => {
    const firestore = await import('firebase/firestore');
    
    await deleteMangaHistory('shinigami', 'manga1');
    
    expect(firestore.query).toHaveBeenCalled();
    expect(firestore.where).toHaveBeenCalledWith('sourceId', '==', 'shinigami');
    expect(firestore.where).toHaveBeenCalledWith('mangaId', '==', 'manga1');
  });

  it('commits canonical and legacy library tombstones atomically with the required identity fields', async () => {
    const firestore = await import('firebase/firestore');

    await deleteLibraryItem('shinigami', 'manga1', 'saved-title-1');
    const libraryBatch = vi.mocked(firestore.writeBatch).mock.results[1]?.value;

    expect(libraryBatch.set).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'users/user123/libraryV2/saved-title-1' }),
      expect.objectContaining({
        _deleted: true,
        id: 'saved-title-1',
        sourceId: 'shinigami',
        mangaId: 'manga1',
        deletedAt: expect.any(String),
      }),
    );
    expect(libraryBatch.set).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'users/user123/library/shinigami::manga1' }),
      expect.objectContaining({ _deleted: true, deletedAt: expect.any(String) }),
    );
    expect(libraryBatch.commit).toHaveBeenCalledOnce();

    await deleteHistoryItem('shinigami', 'manga1', 'chapter-1');
    expect(firestore.setDoc).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'users/user123/history/shinigami::manga1::chapter-1' }),
      expect.objectContaining({
        _deleted: true,
        sourceId: 'shinigami',
        mangaId: 'manga1',
        chapterId: 'chapter-1',
        deletedAt: expect.any(String),
      }),
    );
    expect(firestore.deleteDoc).not.toHaveBeenCalled();
  });

  it('keeps legacy and history tombstones out of public pull helpers', async () => {
    const firestore = await import('firebase/firestore');
    vi.mocked(firestore.getDocs)
      .mockResolvedValueOnce({
        docs: [
          { data: () => ({ sourceId: 'source', mangaId: 'live' }) },
          { data: () => ({ _deleted: true, sourceId: 'source', mangaId: 'deleted' }) },
        ],
      } as never)
      .mockResolvedValueOnce({
        docs: [
          { data: () => ({ sourceId: 'source', mangaId: 'live', chapterId: '1', readAt: 1 }) },
          { data: () => ({ _deleted: true, sourceId: 'source', mangaId: 'deleted', chapterId: '2' }) },
        ],
      } as never);

    await expect(pullLegacyLibraryData()).resolves.toEqual([{ sourceId: 'source', mangaId: 'live' }]);
    await expect(pullHistoryData()).resolves.toEqual([{ sourceId: 'source', mangaId: 'live', chapterId: '1', readAt: 1 }]);
  });

  it('rejects deletion when Firebase is unavailable so store rollback can run', async () => {
    vi.mocked(initFirebase).mockResolvedValueOnce({ auth: null, db: null } as never);

    await expect(deleteLibraryItem('source', 'manga', 'saved-title')).rejects.toThrow(/Firebase/i);
  });

  it('rejects a strict legacy pull when Firestore cannot read migration data', async () => {
    const firestore = await import('firebase/firestore');
    vi.mocked(firestore.getDocs).mockRejectedValueOnce(new Error('legacy read failed'));

    await expect(pullLegacyLibraryData({ strict: true })).rejects.toThrow('legacy read failed');
  });

  it.each([
    { auth: null, db: null },
    { auth: null, db: {} },
    { auth: { currentUser: null }, db: {} },
  ])('rejects strict legacy reads without Firebase or authentication: %j', async (firebase) => {
    vi.mocked(initFirebase).mockResolvedValueOnce(firebase as never);
    await expect(pullLegacyLibraryData({ strict: true, expectedUid: 'user123' })).rejects.toThrow(/Firebase|authenticated/i);
    vi.mocked(initFirebase).mockResolvedValueOnce(firebase as never);
    await expect(pullLegacyLibraryData()).resolves.toEqual([]);
  });

  it('rejects a legacy read for a different expected account before querying', async () => {
    const firestore = await import('firebase/firestore');
    const reads = vi.mocked(firestore.getDocs).mock.calls.length;
    await expect(pullLegacyLibraryData({ strict: true, expectedUid: 'other-user' })).rejects.toThrow(/Account changed/);
    expect(firestore.getDocs).toHaveBeenCalledTimes(reads);
  });

  it('rejects strict legacy data returned after its initiating account signs out', async () => {
    const firestore = await import('firebase/firestore');
    const auth = { currentUser: { uid: 'user123' } as { uid: string } | null };
    vi.mocked(initFirebase).mockResolvedValueOnce({ auth, db: {} } as never);
    let release!: (value: never) => void;
    vi.mocked(firestore.getDocs).mockImplementationOnce(() => new Promise(resolve => { release = resolve; }));
    const pending = pullLegacyLibraryData({ strict: true, expectedUid: 'user123' });
    await vi.waitFor(() => expect(release).toBeTypeOf('function'));
    auth.currentUser = null;
    release({ docs: [{ data: () => ({ sourceId: 's', mangaId: 'private' }) }] } as never);
    await expect(pending).rejects.toThrow(/Account changed/);
  });

  it('keeps guest library mutations local-only without creating cloud tombstones', async () => {
    const firestore = await import('firebase/firestore');
    const previousCommits = vi.mocked(firestore.writeBatch).mock.calls.length;
    const previousPushes = vi.mocked(firestore.setDoc).mock.calls.length;

    await deleteLibraryItem('source', 'guest-title', 'saved-guest', null);
    await pushLibraryItem({
      sourceId: 'source', mangaId: 'guest-title', title: 'Guest',
      addedAt: '2026-10-29', updatedAt: '2026-10-29',
    }, null);

    expect(vi.mocked(firestore.writeBatch).mock.calls.length).toBe(previousCommits);
    expect(vi.mocked(firestore.setDoc).mock.calls.length).toBe(previousPushes);
  });

  it('refuses cross-account writes and deletes while a queued mutation is settling', async () => {
    const item = {
      id: 'saved-owner-a', sourceId: 'source', mangaId: 'manga',
      title: 'Account A', addedAt: '2026-10-29', updatedAt: '2026-10-29',
    };
    await expect(pushLibraryItem(item, 'owner-A')).rejects.toThrow(/Account changed/);
    await expect(deleteLibraryItem('source', 'manga', 'saved-owner-a', 'owner-A')).rejects.toThrow(/Account changed/);
  });

  const historyDocs = (count: number) => Array.from({ length: count }, (_, index) => ({
    ref: `history-${index}`,
    data: () => ({ sourceId: 'source', mangaId: 'manga', chapterId: `chapter-${index}` }),
  }));

  it('waits for each 450-operation batch before starting the next', async () => {
    const firestore = await import('firebase/firestore');
    let releaseFirst!: () => void;
    let firstStarted!: () => void;
    const started = new Promise<void>(resolve => { firstStarted = resolve; });
    const first = { set: vi.fn(), commit: vi.fn(() => {
      firstStarted();
      return new Promise<void>(resolve => { releaseFirst = resolve; });
    }) };
    const second = { set: vi.fn(), commit: vi.fn().mockResolvedValue(undefined) };
    const third = { set: vi.fn(), commit: vi.fn().mockResolvedValue(undefined) };
    vi.mocked(firestore.getDocs).mockResolvedValueOnce({ docs: historyDocs(901) } as never);
    vi.mocked(firestore.writeBatch)
      .mockReturnValueOnce(first as never)
      .mockReturnValueOnce(second as never)
      .mockReturnValueOnce(third as never);

    const pending = deleteMangaHistory('source', 'manga');
    await started;
    expect(first.set).toHaveBeenCalledTimes(450);
    expect(second.set).not.toHaveBeenCalled();
    expect(second.commit).not.toHaveBeenCalled();
    releaseFirst();
    await pending;
    expect([first.set.mock.calls.length, second.set.mock.calls.length, third.set.mock.calls.length]).toEqual([450, 450, 1]);
    for (const batch of [first, second, third]) expect(batch.commit).toHaveBeenCalledOnce();
  });

  it('uses one deletion timestamp even when batch commits take time', async () => {
    const firestore = await import('firebase/firestore');
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date('2026-10-30T00:00:00Z'));
      const first = { set: vi.fn(), commit: vi.fn(async () => { vi.setSystemTime(new Date('2026-10-30T00:01:00Z')); }) };
      const second = { set: vi.fn(), commit: vi.fn().mockResolvedValue(undefined) };
      vi.mocked(firestore.getDocs).mockResolvedValueOnce({ docs: historyDocs(451) } as never);
      vi.mocked(firestore.writeBatch).mockReturnValueOnce(first as never).mockReturnValueOnce(second as never);
      await deleteMangaHistory('source', 'manga');
      expect(first.set.mock.calls[0][1].deletedAt).toBe('2026-10-30T00:00:00.000Z');
      expect(second.set.mock.calls[0][1].deletedAt).toBe(first.set.mock.calls[0][1].deletedAt);
    } finally {
      vi.useRealTimers();
    }
  });

  it('reports exactly the committed chapters after a later batch fails and stops', async () => {
    const firestore = await import('firebase/firestore');
    const first = { set: vi.fn(), commit: vi.fn().mockResolvedValue(undefined) };
    const second = { set: vi.fn(), commit: vi.fn().mockRejectedValue(new Error('quota exceeded')) };
    const priorBatches = vi.mocked(firestore.writeBatch).mock.calls.length;
    vi.mocked(firestore.getDocs).mockResolvedValueOnce({ docs: historyDocs(901) } as never);
    vi.mocked(firestore.writeBatch).mockReturnValueOnce(first as never).mockReturnValueOnce(second as never);
    let thrown: unknown;
    try { await deleteMangaHistory('source', 'manga'); } catch (error) { thrown = error; }
    expect(thrown).toBeInstanceOf(PartialHistoryDeletionError);
    expect((thrown as PartialHistoryDeletionError).committedChapterIds).toEqual(
      Array.from({ length: 450 }, (_, index) => `chapter-${index}`),
    );
    expect(firestore.writeBatch).toHaveBeenCalledTimes(priorBatches + 2);
    expect(second.commit).toHaveBeenCalledOnce();
  });

  it('preserves the original error when the first batch fails', async () => {
    const firestore = await import('firebase/firestore');
    const failure = new Error('first batch unavailable');
    const first = { set: vi.fn(), commit: vi.fn().mockRejectedValue(failure) };
    const priorBatches = vi.mocked(firestore.writeBatch).mock.calls.length;
    vi.mocked(firestore.getDocs).mockResolvedValueOnce({ docs: historyDocs(901) } as never);
    vi.mocked(firestore.writeBatch).mockReturnValueOnce(first as never);
    await expect(deleteMangaHistory('source', 'manga')).rejects.toBe(failure);
    expect(firestore.writeBatch).toHaveBeenCalledTimes(priorBatches + 1);
  });

  it('skips existing tombstones without changing their timestamps', async () => {
    const firestore = await import('firebase/firestore');
    const priorBatches = vi.mocked(firestore.writeBatch).mock.calls.length;
    vi.mocked(firestore.getDocs).mockResolvedValueOnce({ docs: [{
      ref: 'old', data: () => ({ _deleted: true, deletedAt: '2020-01-01', sourceId: 'source', mangaId: 'manga', chapterId: 'old' }),
    }] } as never);
    await deleteMangaHistory('source', 'manga');
    expect(firestore.writeBatch).toHaveBeenCalledTimes(priorBatches);
  });

  it('stops after an account switch between commits and reports the committed chunk', async () => {
    const firestore = await import('firebase/firestore');
    const auth = { currentUser: { uid: 'user123' } };
    vi.mocked(initFirebase).mockResolvedValueOnce({ auth, db: {} } as never);
    const first = { set: vi.fn(), commit: vi.fn(async () => { auth.currentUser = { uid: 'other-user' }; }) };
    const priorBatches = vi.mocked(firestore.writeBatch).mock.calls.length;
    vi.mocked(firestore.getDocs).mockResolvedValueOnce({ docs: historyDocs(901) } as never);
    vi.mocked(firestore.writeBatch).mockReturnValueOnce(first as never);
    await expect(deleteMangaHistory('source', 'manga')).rejects.toMatchObject({
      name: 'PartialHistoryDeletionError',
      committedChapterIds: Array.from({ length: 450 }, (_, index) => `chapter-${index}`),
    });
    expect(firestore.writeBatch).toHaveBeenCalledTimes(priorBatches + 1);
  });
});
