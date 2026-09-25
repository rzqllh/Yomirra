import { render, screen, fireEvent } from '@testing-library/react';
import { HomeFeedClient } from '../home-feed-client';
import { HomeView } from '../home-view';
import { EditorialSpotlight } from '../editorial-spotlight';
import { HomeLeaderboardPanel } from '../home-leaderboard-panel';
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
    ],
    removeMangaHistory: vi.fn(),
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
  listingViewMode: 'compact',
};

vi.mock('@/shared/store/settings-store', () => ({
  useSettingsStore: Object.assign(
    (selector: any) => (typeof selector === 'function' ? selector(mockSettingsState) : mockSettingsState),
    { getState: () => mockSettingsState }
  ),
}));

vi.mock('@/shared/hooks/use-nsfw-source-ids', () => ({
  useNsfwSourceIds: () => ({ status: "KNOWN", ids: new Set() }),
}));

vi.mock('@/shared/hooks/use-mounted', () => ({
  useMounted: () => true
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: null, isLoading: false })
}));

describe('Yomirra Editorial Home Components', () => {
  const samplePopular = [
    {
      id: 'manga-1',
      title: 'Manga Test 1',
      coverUrl: 'https://example.com/1.jpg',
      sourceId: 'shinigami',
      score: 8.5,
      latestChapter: 'Ch. 120',
    },
    {
      id: 'manga-2',
      title: 'Manga Test 2',
      coverUrl: 'https://example.com/2.jpg',
      sourceId: 'shinigami',
      score: 9.0,
      latestChapter: 'Ch. 45',
    },
    {
      id: 'manga-kc-1',
      title: 'Komikcast Alpha',
      coverUrl: 'https://example.com/kc1.jpg',
      sourceId: 'komikcast',
      score: 9.5,
      latestChapter: 'Ch. 10',
    }
  ];

  const sampleLatest = [
    {
      id: 'manga-feat-1',
      title: 'Featured Manga Alpha',
      coverUrl: 'https://example.com/feat1.jpg',
      sourceId: 'shinigami',
      latestChapter: 'Ch. 50',
      description: 'Sinopsis petualangan epik komik alpha.',
    },
    {
      id: 'manga-feat-2',
      title: 'Featured Manga Beta',
      coverUrl: 'https://example.com/feat2.jpg',
      sourceId: 'komikcast',
      latestChapter: 'Ch. 12',
      description: 'Sinopsis komik beta yang mendebarkan.',
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('HomeView & Layout Hierarchy', () => {
    it('renders clean layout with mobile actions and feed content', () => {
      render(
        <HomeView>
          <div data-testid="feed-child">Content</div>
        </HomeView>
      );

      expect(screen.getByTestId('feed-child')).toBeTruthy();
      // Mobile bell notification button exists
      const bellLinks = screen.getAllByRole('link', { name: /pembaruan/i });
      expect(bellLinks.length).toBeGreaterThan(0);
    });
  });

  describe('Spotlight Carousel & Leaderboard', () => {
    it('renders semantic H1 on Sorotan & peringkat and cycles through carousel items', () => {
      render(<HomeFeedClient unifiedPopular={samplePopular} unifiedLatest={sampleLatest} />);

      // Semantic H1 for the page (Phase 4)
      const h1 = screen.getByRole('heading', { level: 1, name: /sorotan & peringkat/i });
      expect(h1).toBeTruthy();

      // First spotlight item
      expect(screen.getByRole('heading', { level: 2, name: 'Featured Manga Alpha' })).toBeTruthy();
      expect(screen.getByText(/01 \/ 02/)).toBeTruthy();

      const nextBtn = screen.getByRole('button', { name: /komik berikutnya/i });
      expect(nextBtn).toBeTruthy();

      // Click next -> switches to second spotlight item
      fireEvent.click(nextBtn);
      expect(screen.getByRole('heading', { level: 2, name: 'Featured Manga Beta' })).toBeTruthy();
      expect(screen.getByText(/02 \/ 02/)).toBeTruthy();

      // Click next again -> wraps around to first item
      fireEvent.click(nextBtn);
      expect(screen.getByRole('heading', { level: 2, name: 'Featured Manga Alpha' })).toBeTruthy();

      // Click prev -> wraps back to second item
      const prevBtn = screen.getByRole('button', { name: /komik sebelumnya/i });
      fireEvent.click(prevBtn);
      expect(screen.getByRole('heading', { level: 2, name: 'Featured Manga Beta' })).toBeTruthy();
    });

    it('renders Leaderboard with source-awareness, allows switching sources, and resets ranks to 01-05', () => {
      render(<HomeLeaderboardPanel items={samplePopular} />);

      expect(screen.getByText('Paling banyak dibaca')).toBeTruthy();

      // Default active source is shinigami: only Shinigami items render
      expect(screen.getByText('01')).toBeTruthy();
      expect(screen.getByText('Manga Test 1')).toBeTruthy();
      expect(screen.getByText('02')).toBeTruthy();
      expect(screen.getByText('Manga Test 2')).toBeTruthy();
      expect(screen.queryByText('Komikcast Alpha')).toBeNull();

      // Source selector exists and can be changed to komikcast
      const select = screen.getByRole('combobox', { name: /pilih sumber peringkat/i });
      expect(select).toBeTruthy();

      fireEvent.change(select, { target: { value: 'komikcast' } });

      // After switching to komikcast, Komikcast Alpha renders at rank 01, Shinigami items disappear
      expect(screen.getByText('Komikcast Alpha')).toBeTruthy();
      expect(screen.queryByText('Manga Test 1')).toBeNull();
      expect(screen.queryByText('Manga Test 2')).toBeNull();
    });

    it('renders empty state when selected source has no ranking items', () => {
      render(<HomeLeaderboardPanel items={[]} defaultSourceId="mangadex" />);

      expect(screen.getByText(/belum ada peringkat dari sumber ini/i)).toBeTruthy();
    });

    it('clamps leaderboard to maximum 5 items', () => {
      const tenItems = Array.from({ length: 10 }, (_, i) => ({
        id: `manga-${i}`,
        title: `Manga ${i}`,
        sourceId: 'shinigami',
        coverUrl: 'https://example.com/cover.jpg',
      }));

      render(<HomeLeaderboardPanel items={tenItems} defaultSourceId="shinigami" />);

      expect(screen.getByText('01')).toBeTruthy();
      expect(screen.getByText('05')).toBeTruthy();
      expect(screen.queryByText('06')).toBeNull();
    });
  });

  describe('Continue Reading Shelf', () => {
    it('renders Continue Reading with normalized progress and context menu trigger', () => {
      render(<HomeFeedClient unifiedPopular={samplePopular} unifiedLatest={sampleLatest} />);

      expect(screen.getByRole('heading', { name: 'Lanjut Baca' })).toBeTruthy();
      expect(screen.getByText('Solo Leveling')).toBeTruthy();
      expect(screen.getByText('50%')).toBeTruthy();

      const continueLink = screen.getByRole('link', { name: /lanjut baca solo leveling/i });
      expect(continueLink).toBeTruthy();
      expect(continueLink.getAttribute('href')).toBe('/manga/shinigami/solo-leveling/read/100');

      const optionsBtn = screen.getByRole('button', { name: /opsi untuk solo leveling/i });
      expect(optionsBtn).toBeTruthy();
    });
  });

  describe('Phase 7: Popularity Deduplication', () => {
    it('only renders compact "Paling banyak dibaca" leaderboard and does NOT render redundant "Banyak dibaca" shelf', () => {
      render(<HomeFeedClient unifiedPopular={samplePopular} unifiedLatest={sampleLatest} />);

      // Canonical compact preview exists
      expect(screen.getByText('Paling banyak dibaca')).toBeTruthy();

      // Redundant large-cover shelf must NOT exist
      expect(screen.queryByRole('heading', { level: 2, name: /banyak dibaca/i })).toBeNull();
      expect(document.getElementById('popular-section')).toBeNull();
    });
  });
});
