import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SearchPage from '../page';
import { useSearchFilterStore } from '@/shared/store/search-filter-store';
import { useSettingsStore } from '@/shared/store/settings-store';
import { apiClient } from '@/shared/api-client';
import { dynamicSourceRegistry } from '@/shared/sources/dynamic-source-registry';

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(''),
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

vi.mock('@/components/search/search-filter-drawer', () => ({
  SearchFilterDrawer: () => <div data-testid="drawer-stub" />
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } }
});

describe('Search Page Revamp Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
    useSearchFilterStore.setState({
      selectedSources: ['source1', 'source2'],
      genres: [],
      formats: [],
      status: '',
      sort: 'popular'
    });
    useSettingsStore.setState({ hideNsfw: false });

    (dynamicSourceRegistry.getAll as any).mockReturnValue([
      { id: 'source1', name: 'Shinigami', isInstalled: true, capabilities: { search: true }, status: 'online' },
      { id: 'source2', name: 'Komikindo', isInstalled: true, capabilities: { search: true }, status: 'online' },
    ]);
    (apiClient.getSources as any).mockResolvedValue([
      { id: 'source1', name: 'Shinigami', isInstalled: true, capabilities: { search: true }, status: 'online' },
      { id: 'source2', name: 'Komikindo', isInstalled: true, capabilities: { search: true }, status: 'online' },
    ]);
    (apiClient.getFilters as any).mockResolvedValue({ genres: [], formats: [], statuses: [], sorts: [] });
    (apiClient.search as any).mockResolvedValue({ sourceId: 'source1', query: '', page: 1, results: [] });
  });

  it('renders document-flow header "Pencarian" and subtitle', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <React.Suspense fallback={<div>Loading...</div>}>
          <SearchPage />
        </React.Suspense>
      </QueryClientProvider>
    );

    expect(screen.getByRole('heading', { level: 1, name: /Pencarian/i })).toBeDefined();
    expect(screen.getByText('Temukan komik dari berbagai sumber')).toBeDefined();
  });

  it('renders source control chips and prevents deselecting the last source', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <React.Suspense fallback={<div>Loading...</div>}>
          <SearchPage />
        </React.Suspense>
      </QueryClientProvider>
    );

    const shinigamiBtn = screen.getByRole('checkbox', { name: /Sumber Shinigami/i });
    const komikindoBtn = screen.getByRole('checkbox', { name: /Sumber Komikindo/i });

    expect(shinigamiBtn.getAttribute('aria-checked')).toBe('true');
    expect(komikindoBtn.getAttribute('aria-checked')).toBe('true');

    // Deselect Shinigami -> Komikindo remains
    fireEvent.click(shinigamiBtn);
    expect(useSearchFilterStore.getState().selectedSources).toEqual(['source2']);

    // Attempt to deselect Komikindo (last source) -> should stay selected
    fireEvent.click(komikindoBtn);
    expect(useSearchFilterStore.getState().selectedSources).toEqual(['source2']);
  });

  it('displays compact warning for partial source failure alongside successful results', async () => {
    (apiClient.search as any).mockImplementation(async (sourceId: string) => {
      if (sourceId === 'source1') {
        return { sourceId: 'source1', query: '', page: 1, results: [{ id: 'm1', title: 'Overgeared', coverUrl: '/c.jpg' }] };
      }
      throw new Error('Komikindo Server Error');
    });

    render(
      <QueryClientProvider client={queryClient}>
        <React.Suspense fallback={<div>Loading...</div>}>
          <SearchPage />
        </React.Suspense>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Overgeared')).toBeDefined();
      expect(screen.getByText('Komikindo gagal dimuat')).toBeDefined();
    });
  });

  it('displays single-source failure title when only one source is selected and fails', async () => {
    useSearchFilterStore.setState({
      selectedSources: ['source1'],
      genres: [],
      formats: [],
      status: '',
      sort: 'popular'
    });

    (apiClient.search as any).mockRejectedValue(new Error('MangaDex Server Error'));

    render(
      <QueryClientProvider client={queryClient}>
        <React.Suspense fallback={<div>Loading...</div>}>
          <SearchPage />
        </React.Suspense>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Shinigami tidak dapat dimuat')).toBeDefined();
    }, { timeout: 3000 });
  });
});
