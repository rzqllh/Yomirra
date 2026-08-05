import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SearchPage from '../page';
import { useSearchFilterStore } from '@/shared/store/search-filter-store';
import { useSettingsStore } from '@/shared/store/settings-store';
import { apiClient } from '@/shared/api-client';
import { dynamicSourceRegistry } from '@/shared/sources/dynamic-source-registry';

// Mock everything that does IO or routing
vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams('?q=test'),
  usePathname: () => '/search',
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock('@/shared/api-client', () => ({
  apiClient: {
    getSources: vi.fn(),
    getFilters: vi.fn(),
    search: vi.fn(),
    searchGlobal: vi.fn(),
  }
}));

vi.mock('@/shared/sources/dynamic-source-registry', () => ({
  dynamicSourceRegistry: {
    getAll: vi.fn(),
  }
}));

// Mock Drawer to prove it doesn't need to be open to prune
vi.mock('@/components/search/search-filter-drawer', () => ({
  SearchFilterDrawer: () => <div data-testid="drawer-stub" data-state="closed" />
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } }
});

describe('Search Page Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
    useSearchFilterStore.setState({
      selectedSources: ['sourceA', 'sourceB'],
      genres: ['action', 'invalid'],
      formats: [],
      status: '',
      sort: 'popular'
    });
    useSettingsStore.setState({ hideNsfw: false });

    // Mock sources
    (dynamicSourceRegistry.getAll as any).mockReturnValue([
      { id: 'sourceA', name: 'Source A', isInstalled: true, capabilities: { search: true }, status: 'online' },
      { id: 'sourceB', name: 'Source B', isInstalled: true, capabilities: { search: true }, status: 'online' },
    ]);
    (apiClient.getSources as any).mockResolvedValue([]);
    (apiClient.search as any).mockResolvedValue({ sourceId: 'sourceA', query: 'test', page: 1, results: [] });
    (apiClient.searchGlobal as any).mockResolvedValue({ resultsBySource: {} });
  });

  it('orchestrates pruning, resets, and preserves valid filters even when drawer is closed', async () => {
    // Both sources return capability
    (apiClient.getFilters as any).mockImplementation(async (sourceId: string) => {
      if (sourceId === 'sourceA') {
        return { genres: [{ id: 'action', name: 'Action' }, { id: 'romance', name: 'Romance' }], sorts: [], statuses: [], formats: [] };
      }
      if (sourceId === 'sourceB') {
        return { genres: [{ id: 'action', name: 'Action' }], sorts: [], statuses: [], formats: [] };
      }
      return null;
    });

    render(
      <QueryClientProvider client={queryClient}>
        <React.Suspense fallback={<div>Loading...</div>}>
          <SearchPage />
        </React.Suspense>
      </QueryClientProvider>
    );

    // Wait for queries to resolve and pruning to occur
    await waitFor(() => {
      const state = useSearchFilterStore.getState();
      // "invalid" should be removed, "action" should remain
      expect(state.genres).toEqual(['action']);
    });

    // Verify pruning happened without drawer interaction (drawer is mocked closed)
    expect(screen.getByTestId('drawer-stub').getAttribute('data-state')).toBe('closed');
  });

  it('prevents pruning when partial loading or error occurs', async () => {
    // sourceA returns data, sourceB throws error
    (apiClient.getFilters as any).mockImplementation(async (sourceId: string) => {
      if (sourceId === 'sourceA') {
        return { genres: [{ id: 'action', name: 'Action' }], sorts: [], statuses: [], formats: [] };
      }
      throw new Error("Network error");
    });

    render(
      <QueryClientProvider client={queryClient}>
        <React.Suspense fallback={<div>Loading...</div>}>
          <SearchPage />
        </React.Suspense>
      </QueryClientProvider>
    );

    // Wait for sourceA to load, sourceB to error
    await waitFor(() => {
      expect(apiClient.getFilters).toHaveBeenCalledWith('sourceA');
      expect(apiClient.getFilters).toHaveBeenCalledWith('sourceB');
    });

    // Wait a bit to ensure pruning doesn't happen
    await new Promise(resolve => setTimeout(resolve, 50));

    const state = useSearchFilterStore.getState();
    // Genres should not be pruned because of partial failure!
    expect(state.genres).toContain('invalid');
  });

  it('executes parallel per-source search with source-specific payloads and does not call searchGlobal', async () => {
    useSearchFilterStore.setState({
      selectedSources: ['sourceA', 'sourceB'],
      genres: ['action'],
      formats: ['webtoon'],
      status: '',
      sort: 'popular'
    });

    (apiClient.getFilters as any).mockImplementation(async (sourceId: string) => {
      if (sourceId === 'sourceA') {
        // Source A supports action genre, but NOT webtoon format
        return { genres: [{ id: 'action', name: 'Action' }], formats: [{ id: 'manga', name: 'Manga' }], sorts: [], statuses: [] };
      }
      if (sourceId === 'sourceB') {
        // Source B supports webtoon format, but NOT action genre
        return { genres: [{ id: 'romance', name: 'Romance' }], formats: [{ id: 'webtoon', name: 'Webtoon' }], sorts: [], statuses: [] };
      }
      return null;
    });

    (apiClient.search as any).mockImplementation(async (sourceId: string) => {
      if (sourceId === 'sourceA') {
        return { sourceId: 'sourceA', query: 'test', page: 1, results: [{ id: 'm1', title: 'Solo Leveling', coverUrl: '/cover1.jpg' }] };
      }
      if (sourceId === 'sourceB') {
        return { sourceId: 'sourceB', query: 'test', page: 1, results: [{ id: 'm2', title: 'Tower of God', coverUrl: '/cover2.jpg' }] };
      }
      return { sourceId, query: 'test', page: 1, results: [] };
    });

    render(
      <QueryClientProvider client={queryClient}>
        <React.Suspense fallback={<div>Loading...</div>}>
          <SearchPage />
        </React.Suspense>
      </QueryClientProvider>
    );

    await waitFor(() => {
      // 1. Source A receives only action genre (webtoon format excluded because not supported)
      expect(apiClient.search).toHaveBeenCalledWith(
        'sourceA',
        'test',
        1,
        { 'genre[]': ['action'] },
        false
      );

      // 2. Source B receives only webtoon format (action genre excluded because not supported)
      expect(apiClient.search).toHaveBeenCalledWith(
        'sourceB',
        'test',
        1,
        { 'format[]': ['webtoon'] },
        false
      );
    });

    // 3. searchGlobal is NOT called by Search Page
    expect(apiClient.searchGlobal).not.toHaveBeenCalled();

    // 4. Combined results are rendered
    await waitFor(() => {
      expect(screen.getByText('Solo Leveling')).toBeDefined();
      expect(screen.getByText('Tower of God')).toBeDefined();
    });
  });

  it('handles single source search error without removing results from successful sources', async () => {
    useSearchFilterStore.setState({
      selectedSources: ['sourceA', 'sourceB'],
      genres: [],
      formats: [],
      status: '',
      sort: ''
    });

    (apiClient.getFilters as any).mockImplementation(async () => ({ genres: [], formats: [], sorts: [], statuses: [] }));

    (apiClient.search as any).mockImplementation(async (sourceId: string) => {
      if (sourceId === 'sourceA') {
        return { sourceId: 'sourceA', query: 'test', page: 1, results: [{ id: 'm1', title: 'Naruto', coverUrl: '/cover.jpg' }] };
      }
      throw new Error('Source B Server Error');
    });

    render(
      <QueryClientProvider client={queryClient}>
        <React.Suspense fallback={<div>Loading...</div>}>
          <SearchPage />
        </React.Suspense>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Naruto')).toBeDefined();
    });
  });
});
