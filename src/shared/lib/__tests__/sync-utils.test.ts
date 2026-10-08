import { describe, it, expect, vi } from 'vitest';
import { deleteHistoryItem, deleteLibraryItem, deleteMangaHistory, pullHistoryData, pullLegacyLibraryData } from '../sync-utils';
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
});
