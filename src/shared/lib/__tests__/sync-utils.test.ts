import { describe, it, expect, vi } from 'vitest';
import { deleteMangaHistory } from '../sync-utils';

vi.mock('../firebase', () => ({
  initFirebase: vi.fn().mockResolvedValue({
    auth: { currentUser: { uid: 'user123' } },
    db: {}
  })
}));

vi.mock('firebase/firestore', () => ({
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
});
