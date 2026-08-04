import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useDownloadStore } from '../download-store';
import { abortControllers } from '../../lib/download-engine';

const dummyChapter = {
  sourceId: "src1",
  mangaId: "manga1",
  mangaTitle: "Manga 1",
  chapterId: "ch1",
  chapterTitle: "Chapter 1"
};

const dummyChapter2 = {
  sourceId: "src1",
  mangaId: "manga1",
  mangaTitle: "Manga 1",
  chapterId: "ch2",
  chapterTitle: "Chapter 2"
};

const mockCache = {
  keys: vi.fn(),
  delete: vi.fn(),
};

describe('download-store', () => {
  beforeEach(async () => {
    await useDownloadStore.getState().clearDownloads();
    for (const key in abortControllers) {
      delete abortControllers[key];
    }
    vi.stubGlobal('caches', {
      open: vi.fn().mockResolvedValue(mockCache),
      delete: vi.fn()
    });
    mockCache.keys.mockClear();
    mockCache.delete.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('removeDownloads', () => {
    it('should return safely for empty input', async () => {
      await expect(useDownloadStore.getState().removeDownloads([])).resolves.not.toThrow();
      expect(caches.open).not.toHaveBeenCalled();
    });

    it('should remove one ID successfully', async () => {
      useDownloadStore.getState().addDownload(dummyChapter);
      const id = "src1::manga1::ch1";
      
      mockCache.keys.mockResolvedValue([
        { url: `/offline-images/${id}/1.jpg` },
        { url: '/offline-images/other_id/1.jpg' }
      ]);
      mockCache.delete.mockResolvedValue(true);

      await useDownloadStore.getState().removeDownloads([id]);

      expect(caches.open).toHaveBeenCalledTimes(1);
      expect(mockCache.keys).toHaveBeenCalledTimes(1);
      expect(mockCache.delete).toHaveBeenCalledTimes(1); // Only for the matching prefix
      expect(mockCache.delete).toHaveBeenCalledWith({ url: `/offline-images/${id}/1.jpg` });

      const state = useDownloadStore.getState();
      expect(state.downloads[id]).toBeUndefined();
    });

    it('should normalize and deduplicate multiple IDs', async () => {
      useDownloadStore.getState().addDownload(dummyChapter);
      useDownloadStore.getState().addDownload(dummyChapter2);
      
      const id1 = "src1::manga1::ch1";
      const id2 = "src1::manga1::ch2";

      mockCache.keys.mockResolvedValue([
        { url: `/offline-images/${id1}/1.jpg` },
        { url: `/offline-images/${id2}/1.jpg` }
      ]);
      mockCache.delete.mockResolvedValue(true);

      // Pass id1 twice to test deduplication
      await useDownloadStore.getState().removeDownloads([id1, id1, id2]);

      expect(caches.open).toHaveBeenCalledTimes(1);
      expect(mockCache.keys).toHaveBeenCalledTimes(1);
      // Both matching requests are deleted
      expect(mockCache.delete).toHaveBeenCalledTimes(2);

      const state = useDownloadStore.getState();
      expect(state.downloads[id1]).toBeUndefined();
      expect(state.downloads[id2]).toBeUndefined();
    });

    it('should throw partial deletion failure error', async () => {
      useDownloadStore.getState().addDownload(dummyChapter);
      const id = "src1::manga1::ch1";

      mockCache.keys.mockResolvedValue([
        { url: `/offline-images/${id}/1.jpg` }
      ]);
      mockCache.delete.mockRejectedValue(new Error("Cache delete failed"));

      await expect(useDownloadStore.getState().removeDownloads([id]))
        .rejects.toThrow("Gagal menghapus cache untuk 1 item.");

      // State is NOT updated for failed deletions
      const state = useDownloadStore.getState();
      expect(state.downloads[id]).toBeDefined();
    });

    it('should leave unrelated cache preserved', async () => {
      useDownloadStore.getState().addDownload(dummyChapter);
      const id = "src1::manga1::ch1";

      mockCache.keys.mockResolvedValue([
        { url: `/offline-images/${id}/1.jpg` },
        { url: `/offline-images/unrelated_id/1.jpg` }
      ]);
      mockCache.delete.mockResolvedValue(true);

      await useDownloadStore.getState().removeDownloads([id]);

      expect(mockCache.delete).toHaveBeenCalledTimes(1);
      expect(mockCache.delete).toHaveBeenCalledWith({ url: `/offline-images/${id}/1.jpg` });
    });

    it('should remove from state even if cache is already empty', async () => {
      useDownloadStore.getState().addDownload(dummyChapter);
      const id = "src1::manga1::ch1";

      // Cache keys is empty (already evicted)
      mockCache.keys.mockResolvedValue([]);
      
      await useDownloadStore.getState().removeDownloads([id]);

      // Cache is not called for delete
      expect(mockCache.delete).not.toHaveBeenCalled();
      
      // But state should still be updated
      const state = useDownloadStore.getState();
      expect(state.downloads[id]).toBeUndefined();
    });
  });

  describe('removeDownload', () => {
    it('should delegate to removeDownloads', async () => {
      const removeSpy = vi.spyOn(useDownloadStore.getState(), 'removeDownloads');
      await useDownloadStore.getState().removeDownload("test_id");
      expect(removeSpy).toHaveBeenCalledWith(["test_id"]);
    });
  });
});
