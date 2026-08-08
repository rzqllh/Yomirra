import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import BookmarkPage from '../page';
import { useLibraryStore } from '@/shared/store/library-store';
import { useHistoryStore } from '@/shared/store/history-store';
import { useSettingsStore } from '@/shared/store/settings-store';
import { useSourcePreferencesStore } from '@/shared/store/source-preferences-store';

vi.mock('@/shared/store/library-store', () => ({
  useLibraryStore: vi.fn(),
}));

vi.mock('@/shared/store/history-store', () => ({
  useHistoryStore: vi.fn(),
}));

vi.mock('@/shared/store/settings-store', () => ({
  useSettingsStore: vi.fn(),
}));

vi.mock('@/shared/store/source-preferences-store', () => ({
  useSourcePreferencesStore: vi.fn(() => ({
    isSourceDisabled: vi.fn(() => false),
  })),
}));

vi.mock('@/shared/hooks/use-nsfw-source-ids', () => ({
  useNsfwSourceIds: vi.fn(() => new Set()),
}));

vi.mock('@/shared/hooks/use-mounted', () => ({
  useMounted: vi.fn(() => true),
}));

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => <a href={href} {...props}>{children}</a>
}));

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ back: vi.fn(), push: vi.fn() })),
  usePathname: vi.fn(() => '/bookmark'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

describe('BookmarkPage Reworked', () => {
  const mockRemoveFromLibrary = vi.fn();
  const mockRemoveMangaHistory = vi.fn();
  const mockIsInLibrary = vi.fn(() => true);
  const mockToggleLibrary = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useLibraryStore as any).mockImplementation((selector: any) =>
      selector ? selector({
        items: {
          'src1::manga1': { sourceId: 'src1', mangaId: 'manga1', title: 'Solo Leveling', updatedAt: '2026-08-01' },
          'src1::manga2': { sourceId: 'src1', mangaId: 'manga2', title: 'Tower of God', updatedAt: '2026-08-02' }
        },
        isInLibrary: mockIsInLibrary,
        toggleLibrary: mockToggleLibrary,
        removeFromLibrary: mockRemoveFromLibrary
      }) : {
        items: {},
        isInLibrary: mockIsInLibrary,
        toggleLibrary: mockToggleLibrary,
        removeFromLibrary: mockRemoveFromLibrary
      }
    );

    (useHistoryStore as any).mockImplementation((selector: any) =>
      selector ? selector({
        items: {},
        getHistoryList: () => [
          { sourceId: 'src1', mangaId: 'manga1', mangaTitle: 'Solo Leveling', chapterId: 'ch-100', chapterTitle: 'Chapter 100', readAt: Date.now() }
        ],
        removeMangaHistory: mockRemoveMangaHistory
      }) : { items: {}, getHistoryList: () => [], removeMangaHistory: mockRemoveMangaHistory }
    );

    (useSettingsStore as any).mockImplementation((selector: any) =>
      selector ? selector({ hideNsfw: false }) : { hideNsfw: false }
    );
  });

  it('renders reading history card with continue CTA and trash button', () => {
    render(<BookmarkPage />);
    
    expect(screen.getByRole('heading', { level: 1, name: /Rak Buku/i })).toBeTruthy();
    expect(screen.getAllByText('Solo Leveling').length).toBeGreaterThan(0);
    expect(screen.getByText('Chapter 100')).toBeTruthy();

    const continueBtn = screen.getByRole('button', { name: /Lanjutkan/i });
    expect(continueBtn).toBeTruthy();

    const trashBtn = screen.getByRole('button', { name: /Hapus Solo Leveling dari riwayat/i });
    expect(trashBtn).toBeTruthy();
  });

  it('switches to collection tab and filters items', () => {
    render(<BookmarkPage />);
    
    const collectionTab = screen.getByRole('tab', { name: /Koleksi/i });
    fireEvent.click(collectionTab);

    expect(screen.getAllByText('Solo Leveling').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Tower of God').length).toBeGreaterThan(0);

    const searchInput = screen.getByPlaceholderText(/Cari di koleksi.../i);
    fireEvent.change(searchInput, { target: { value: 'Solo' } });

    expect(screen.getAllByText('Solo Leveling').length).toBeGreaterThan(0);
    expect(screen.queryByText('Tower of God')).toBeNull();
  });
});
