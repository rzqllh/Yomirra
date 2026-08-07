import { render, screen, fireEvent } from '@testing-library/react';
import { HomeFeedClient } from '../home-feed-client';
import { HomeView } from '../home-view';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/shared/store/history-store', () => ({
  useHistoryStore: (selector: any) => selector({
    getContinueReading: () => [
      {
        sourceId: 'shinigami',
        mangaId: 'solo-leveling',
        mangaTitle: 'Solo Leveling',
        chapterId: '100',
        chapterTitle: 'Chapter 100',
        coverUrl: 'https://example.com/cover.jpg',
        progressPercent: 50,
      }
    ]
  }),
}));

vi.mock('@/shared/store/source-preferences-store', () => ({
  useSourcePreferencesStore: () => ({
    isSourceDisabled: () => false,
    isSourceHiddenFromHome: () => false,
  }),
}));

const mockSettingsState = {
  notifyForAllLibraryItems: true,
  mutedMangaKeys: [],
  hideNsfw: false,
};

vi.mock('@/shared/store/settings-store', () => ({
  useSettingsStore: Object.assign(
    (selector: any) => (typeof selector === 'function' ? selector(mockSettingsState) : mockSettingsState),
    { getState: () => mockSettingsState }
  ),
}));

vi.mock('@/shared/hooks/use-nsfw-source-ids', () => ({
  useNsfwSourceIds: () => new Set(),
}));

vi.mock('@/shared/hooks/use-mounted', () => ({
  useMounted: () => true
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: null, isLoading: false })
}));

describe('Home Page Components', () => {
  const samplePopular = [
    {
      id: 'manga-1',
      title: 'Manga Test 1',
      coverUrl: 'https://example.com/1.jpg',
      sourceId: 'shinigami',
    }
  ];

  const sampleLatest = [
    {
      id: 'manga-2',
      title: 'Manga Featured',
      coverUrl: 'https://example.com/2.jpg',
      sourceId: 'shinigami',
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders bell button in Home header', () => {
    render(<HomeView><div>Child</div></HomeView>);
    const bellLinks = screen.getAllByRole('link', { name: /pembaruan/i });
    expect(bellLinks.length).toBeGreaterThan(0);
  });

  it('renders Home sections and continue reading link', () => {
    render(<HomeFeedClient unifiedPopular={samplePopular} unifiedLatest={sampleLatest} />);
    expect(screen.getByRole('heading', { name: 'Lanjut Baca' })).toBeTruthy();
    
    const continueLink = screen.getByRole('link', { name: /lanjut baca solo leveling/i });
    expect(continueLink).toBeTruthy();
    expect(continueLink.getAttribute('href')).toBe('/manga/shinigami/solo-leveling/read/100');
  });

  it('renders source selector chips and handles clicking chip', () => {
    render(<HomeFeedClient unifiedPopular={samplePopular} unifiedLatest={sampleLatest} />);
    const sourceChip = screen.getByRole('button', { name: /shinigami/i });
    expect(sourceChip).toBeTruthy();
    fireEvent.click(sourceChip);
  });

  it('renders featured hero CTA button with correct href', () => {
    render(<HomeFeedClient unifiedPopular={samplePopular} unifiedLatest={sampleLatest} />);
    const ctaButton = screen.getByRole('link', { name: 'Baca' });
    expect(ctaButton).toBeTruthy();
    expect(ctaButton.getAttribute('href')).toBe('/manga/shinigami/manga-2');
  });
});
