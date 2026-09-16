import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import React, { act } from "react";
import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { getDownloadChapterId } from "@/shared/utils/download-helpers";
import { useDownloadStore, type DownloadChapter } from "@/shared/store/download-store";
import { ReaderImage } from "../reader-image";
import { ReaderView } from "../reader-view";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/"),
  useRouter: vi.fn(() => ({ back: vi.fn(), push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() })),
}));

describe("Reader Offline Fixes Unit Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useDownloadStore.setState({ downloads: {}, queue: [], activeDownloads: [] });

    class MockIntersectionObserver {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    }
    global.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;
  });

  describe("A1 — Blob/Object URL Lifecycle & Teardown Race Prevention", () => {
    let originalCaches: unknown;
    let originalCreateObjectURL: unknown;
    let originalRevokeObjectURL: unknown;

    beforeEach(() => {
      originalCaches = global.caches;
      originalCreateObjectURL = URL.createObjectURL;
      originalRevokeObjectURL = URL.revokeObjectURL;

      URL.createObjectURL = vi.fn((_blob: Blob) => `blob:mock-url-${Math.random()}`);
      URL.revokeObjectURL = vi.fn();
    });

    afterEach(() => {
      if (originalCaches !== undefined) {
        global.caches = originalCaches as CacheStorage;
      } else {
        delete (global as { caches?: unknown }).caches;
      }
      URL.createObjectURL = originalCreateObjectURL as typeof URL.createObjectURL;
      URL.revokeObjectURL = originalRevokeObjectURL as typeof URL.revokeObjectURL;
    });

    it("should create, track, and revoke Object URLs on component unmount", async () => {
      const mockBlob = new Blob(["test image content"], { type: "image/jpeg" });
      const mockCache = {
        keys: vi.fn().mockResolvedValue([
          { url: "http://localhost/offline-images/src1::manga1::ch1/0" },
          { url: "http://localhost/offline-images/src1::manga1::ch1/1" },
        ]),
        match: vi.fn().mockResolvedValue({
          blob: vi.fn().mockResolvedValue(mockBlob),
        }),
      };

      global.caches = {
        open: vi.fn().mockResolvedValue(mockCache),
      } as unknown as CacheStorage;

      const downloadId = getDownloadChapterId("src1", "manga1", "ch1");
      const downloadItem: DownloadChapter = {
        id: downloadId,
        sourceId: "src1",
        mangaId: "manga1",
        chapterId: "ch1",
        chapterTitle: "Ch 1",
        mangaTitle: "Manga 1",
        status: "downloaded",
        progress: 100,
        downloadedPages: 2,
        totalPages: 2,
        pages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      useDownloadStore.setState({
        downloads: { [downloadId]: downloadItem },
      });

      const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
      const { unmount } = render(
        <QueryClientProvider client={queryClient}>
          <ReaderView
            sourceId="src1"
            mangaId="manga1"
            chapterId="ch1"
            initialDetail={{ id: "manga1", title: "Manga 1", coverUrl: "/cover.jpg", description: "", genres: [], status: "ONGOING" }}
            initialChapters={[{ id: "ch1", mangaId: "manga1", number: 1, title: "Ch 1", date: "2026-01-01" }]}
            initialPages={[{ index: 0, url: "http://example.com/0.jpg" }]}
          />
        </QueryClientProvider>
      );

      await act(async () => {
        await new Promise((r) => setTimeout(r, 50));
      });

      expect(URL.createObjectURL).toHaveBeenCalledTimes(2);

      unmount();

      expect(URL.revokeObjectURL).toHaveBeenCalledTimes(2);
    });

    it("should revoke previous Object URLs when chapter/downloadId changes", async () => {
      const mockBlob = new Blob(["image"], { type: "image/jpeg" });
      const mockCache = {
        keys: vi.fn().mockResolvedValue([
          { url: "http://localhost/offline-images/src1::manga1::ch1/0" },
        ]),
        match: vi.fn().mockResolvedValue({
          blob: vi.fn().mockResolvedValue(mockBlob),
        }),
      };

      global.caches = { open: vi.fn().mockResolvedValue(mockCache) } as unknown as CacheStorage;

      const downloadId1 = getDownloadChapterId("src1", "manga1", "ch1");
      const downloadId2 = getDownloadChapterId("src1", "manga1", "ch2");

      const now = Date.now();
      useDownloadStore.setState({
        downloads: {
          [downloadId1]: { id: downloadId1, sourceId: "src1", mangaId: "manga1", chapterId: "ch1", chapterTitle: "Ch 1", mangaTitle: "Manga 1", status: "downloaded", progress: 100, downloadedPages: 1, totalPages: 1, pages: [], createdAt: now, updatedAt: now },
          [downloadId2]: { id: downloadId2, sourceId: "src1", mangaId: "manga1", chapterId: "ch2", chapterTitle: "Ch 2", mangaTitle: "Manga 1", status: "downloaded", progress: 100, downloadedPages: 1, totalPages: 1, pages: [], createdAt: now, updatedAt: now },
        },
      });

      const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
      const { rerender } = render(
        <QueryClientProvider client={queryClient}>
          <ReaderView
            sourceId="src1"
            mangaId="manga1"
            chapterId="ch1"
            initialDetail={{ id: "manga1", title: "Manga 1", coverUrl: "/cover.jpg", description: "", genres: [], status: "ONGOING" }}
            initialChapters={[
              { id: "ch1", mangaId: "manga1", number: 1, title: "Ch 1", date: "2026-01-01" },
              { id: "ch2", mangaId: "manga1", number: 2, title: "Ch 2", date: "2026-01-02" },
            ]}
            initialPages={[{ index: 0, url: "http://example.com/0.jpg" }]}
          />
        </QueryClientProvider>
      );

      await act(async () => {
        await new Promise((r) => setTimeout(r, 50));
      });

      expect(URL.createObjectURL).toHaveBeenCalledTimes(1);

      // Switch chapter to ch2
      rerender(
        <QueryClientProvider client={queryClient}>
          <ReaderView
            sourceId="src1"
            mangaId="manga1"
            chapterId="ch2"
            initialDetail={{ id: "manga1", title: "Manga 1", coverUrl: "/cover.jpg", description: "", genres: [], status: "ONGOING" }}
            initialChapters={[
              { id: "ch1", mangaId: "manga1", number: 1, title: "Ch 1", date: "2026-01-01" },
              { id: "ch2", mangaId: "manga1", number: 2, title: "Ch 2", date: "2026-01-02" },
            ]}
            initialPages={[{ index: 0, url: "http://example.com/0.jpg" }]}
          />
        </QueryClientProvider>
      );

      await act(async () => {
        await new Promise((r) => setTimeout(r, 50));
      });

      // Chapter 1's created URL should be revoked
      expect(URL.revokeObjectURL).toHaveBeenCalled();
    });

    it("should NOT create Object URLs after teardown during async Cache resolution", async () => {
      let resolveMatch: ((value: unknown) => void) | undefined;
      const pendingMatchPromise = new Promise((r) => {
        resolveMatch = r;
      });

      const mockBlob = new Blob(["image"], { type: "image/jpeg" });
      const mockCache = {
        keys: vi.fn().mockResolvedValue([
          { url: "http://localhost/offline-images/src1::manga1::ch1/0" },
        ]),
        match: vi.fn().mockReturnValue(pendingMatchPromise),
      };

      global.caches = { open: vi.fn().mockResolvedValue(mockCache) } as unknown as CacheStorage;

      const downloadId = getDownloadChapterId("src1", "manga1", "ch1");
      const now = Date.now();
      useDownloadStore.setState({
        downloads: {
          [downloadId]: { id: downloadId, sourceId: "src1", mangaId: "manga1", chapterId: "ch1", chapterTitle: "Ch 1", mangaTitle: "Manga 1", status: "downloaded", progress: 100, downloadedPages: 1, totalPages: 1, pages: [], createdAt: now, updatedAt: now },
        },
      });

      const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
      const { unmount } = render(
        <QueryClientProvider client={queryClient}>
          <ReaderView
            sourceId="src1"
            mangaId="manga1"
            chapterId="ch1"
            initialDetail={{ id: "manga1", title: "Manga 1", coverUrl: "/cover.jpg", description: "", genres: [], status: "ONGOING" }}
            initialChapters={[{ id: "ch1", mangaId: "manga1", number: 1, title: "Ch 1", date: "2026-01-01" }]}
            initialPages={[{ index: 0, url: "http://example.com/0.jpg" }]}
          />
        </QueryClientProvider>
      );

      // Unmount BEFORE the Cache match resolves
      unmount();

      // Resolve match promise after unmount
      await act(async () => {
        if (resolveMatch) {
          resolveMatch({ blob: () => Promise.resolve(mockBlob) });
        }
        await new Promise((r) => setTimeout(r, 50));
      });

      // Object URL creation MUST NOT happen post-unmount
      expect(URL.createObjectURL).not.toHaveBeenCalled();
    });

    it("should revoke previously created URLs if a subsequent Cache match fails with exception", async () => {
      const mockBlob = new Blob(["image"], { type: "image/jpeg" });
      const mockCache = {
        keys: vi.fn().mockResolvedValue([
          { url: "http://localhost/offline-images/src1::manga1::ch1/0" },
          { url: "http://localhost/offline-images/src1::manga1::ch1/1" },
        ]),
        match: vi.fn()
          .mockResolvedValueOnce({ blob: vi.fn().mockResolvedValue(mockBlob) })
          .mockRejectedValueOnce(new Error("Disk read error")),
      };

      global.caches = { open: vi.fn().mockResolvedValue(mockCache) } as unknown as CacheStorage;

      const downloadId = getDownloadChapterId("src1", "manga1", "ch1");
      const now = Date.now();
      useDownloadStore.setState({
        downloads: {
          [downloadId]: { id: downloadId, sourceId: "src1", mangaId: "manga1", chapterId: "ch1", chapterTitle: "Ch 1", mangaTitle: "Manga 1", status: "downloaded", progress: 100, downloadedPages: 2, totalPages: 2, pages: [], createdAt: now, updatedAt: now },
        },
      });

      const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
      render(
        <QueryClientProvider client={queryClient}>
          <ReaderView
            sourceId="src1"
            mangaId="manga1"
            chapterId="ch1"
            initialDetail={{ id: "manga1", title: "Manga 1", coverUrl: "/cover.jpg", description: "", genres: [], status: "ONGOING" }}
            initialChapters={[{ id: "ch1", mangaId: "manga1", number: 1, title: "Ch 1", date: "2026-01-01" }]}
            initialPages={[{ index: 0, url: "http://example.com/0.jpg" }]}
          />
        </QueryClientProvider>
      );

      await act(async () => {
        await new Promise((r) => setTimeout(r, 50));
      });

      // 1 URL created before exception
      expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
      // Catch block revokes already created URL
      expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1);
    });
  });

  describe("A2 — Encoded Download ID Consistency", () => {
    it("should format complex/encoded IDs consistently using getDownloadChapterId", () => {
      const sourceId = "komikindo";
      const mangaId = "manga/one-piece:special";
      const chapterId = "ch/100.5:v1";

      const formattedId = getDownloadChapterId(sourceId, mangaId, chapterId);
      expect(formattedId).toBe("komikindo::manga%2Fone-piece%3Aspecial::ch%2F100.5%3Av1");

      useDownloadStore.getState().addDownload({
        sourceId,
        mangaId,
        chapterId,
        chapterTitle: "Chapter 100.5",
        mangaTitle: "One Piece",
      });

      const storeItem = useDownloadStore.getState().downloads[formattedId];
      expect(storeItem).toBeDefined();
      expect(storeItem?.id).toBe(formattedId);
      expect(storeItem?.chapterId).toBe(chapterId);
    });
  });

  describe("A3 — ReaderImage Local Image Optimization Bypass", () => {
    it("should set unoptimized=true for blob URLs even when dataSaver is ON", () => {
      const { container } = render(
        <ReaderImage
          pageIndex={0}
          pageUrl="blob:http://localhost:3000/offline-1"
          isWebtoon={true}
          dataSaver={true}
          isAllowedToLoad={true}
          onLoadComplete={() => {}}
          onError={() => {}}
        />
      );

      const img = container.querySelector("img");
      expect(img).not.toBeNull();
      expect(img?.getAttribute("src")).toBe("blob:http://localhost:3000/offline-1");
    });

    it("should set unoptimized=true for data URLs even when dataSaver is ON", () => {
      const dataUrl = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD";
      const { container } = render(
        <ReaderImage
          pageIndex={0}
          pageUrl={dataUrl}
          isWebtoon={true}
          dataSaver={true}
          isAllowedToLoad={true}
          onLoadComplete={() => {}}
          onError={() => {}}
        />
      );

      const img = container.querySelector("img");
      expect(img).not.toBeNull();
      expect(img?.getAttribute("src")).toBe(dataUrl);
    });

    it("should allow optimization for normal remote HTTP URLs when dataSaver is ON", () => {
      const remoteUrl = "https://example.com/image.jpg";
      const { container } = render(
        <ReaderImage
          pageIndex={0}
          pageUrl={remoteUrl}
          isWebtoon={true}
          dataSaver={true}
          isAllowedToLoad={true}
          onLoadComplete={() => {}}
          onError={() => {}}
        />
      );

      const img = container.querySelector("img");
      expect(img).not.toBeNull();
      expect(img?.getAttribute("src")).toContain("_next/image");
    });

    it("should set unoptimized=true for normal remote URLs when dataSaver is OFF", () => {
      const remoteUrl = "https://example.com/image.jpg";
      const { container } = render(
        <ReaderImage
          pageIndex={0}
          pageUrl={remoteUrl}
          isWebtoon={true}
          dataSaver={false}
          isAllowedToLoad={true}
          onLoadComplete={() => {}}
          onError={() => {}}
        />
      );

      const img = container.querySelector("img");
      expect(img).not.toBeNull();
      expect(img?.getAttribute("src")).toBe(remoteUrl);
    });
  });
});
