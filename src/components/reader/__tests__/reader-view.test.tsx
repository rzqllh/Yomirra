import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { ReaderView } from '../reader-view';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/shared/store/history-store', () => ({
  useHistoryStore: vi.fn(() => vi.fn())
}));
vi.mock('@/shared/store/library-store', () => ({
  useLibraryStore: vi.fn(() => vi.fn())
}));
vi.mock('@/shared/store/download-store', () => ({
  useDownloadStore: vi.fn(() => 'downloaded')
}));
vi.mock('@/shared/api-client', () => ({
  apiClient: { getPages: vi.fn() }
}));
vi.mock('@/components/reader/continuous-vertical-reader', () => ({
  ContinuousVerticalReader: () => <div data-testid="reader">Reader</div>
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn()
  })
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const mockInitialDetail = { title: "Test Manga", coverUrl: "test.jpg" };
const mockChapters = [{ id: "c1", title: "Chapter 1" }, { id: "c2", title: "Chapter 2" }];

describe('ReaderView', () => {
  let container: HTMLDivElement;
  let root: any;
  let createObjectURLMock: any;
  let revokeObjectURLMock: any;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    createObjectURLMock = vi.fn((blob) => `blob:test-${Math.random()}`);
    revokeObjectURLMock = vi.fn();
    
    vi.stubGlobal('URL', {
      createObjectURL: createObjectURLMock,
      revokeObjectURL: revokeObjectURLMock,
    });

    const mockMatch = vi.fn().mockResolvedValue({
      blob: () => Promise.resolve(new Blob(['test'], { type: 'image/jpeg' }))
    });

    const mockCache = {
      keys: vi.fn().mockResolvedValue([
        { url: '/offline-images/src::manga::c1/1.jpg' }
      ]),
      match: mockMatch
    };

    vi.stubGlobal('caches', {
      open: vi.fn().mockResolvedValue(mockCache)
    });
  });

  afterEach(() => {
    act(() => { root.unmount(); });
    document.body.removeChild(container);
    vi.restoreAllMocks();
  });

  it('Blob URLs are revoked on cleanup', async () => {
    await act(async () => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <ReaderView
            sourceId="src"
            mangaId="manga"
            chapterId="c1"
            initialDetail={mockInitialDetail as any}
            initialChapters={mockChapters as any}
            initialPages={null}
          />
        </QueryClientProvider>
      );
    });

    expect(createObjectURLMock).toHaveBeenCalled();
    
    await act(async () => {
      root.unmount();
    });

    expect(revokeObjectURLMock).toHaveBeenCalled();
  });

  it('Blob URLs are revoked after chapter change', async () => {
    await act(async () => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <ReaderView
            sourceId="src"
            mangaId="manga"
            chapterId="c1"
            initialDetail={mockInitialDetail as any}
            initialChapters={mockChapters as any}
            initialPages={null}
          />
        </QueryClientProvider>
      );
    });

    expect(createObjectURLMock).toHaveBeenCalled();
    expect(revokeObjectURLMock).not.toHaveBeenCalled();

    await act(async () => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <ReaderView
            sourceId="src"
            mangaId="manga"
            chapterId="c2"
            initialDetail={mockInitialDetail as any}
            initialChapters={mockChapters as any}
            initialPages={null}
          />
        </QueryClientProvider>
      );
    });

    expect(revokeObjectURLMock).toHaveBeenCalled();
  });
});
