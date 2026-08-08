import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { UpdatesList } from '../updates-list';
import { useUpdateStore } from '@/shared/store/update-store';
import { useUpdateChecker } from '@/shared/hooks/use-update-checker';

vi.mock('@/shared/store/update-store', () => ({
  useUpdateStore: vi.fn(),
}));

vi.mock('@/shared/hooks/use-update-checker', () => ({
  useUpdateChecker: vi.fn(),
}));

// Mock Link to just render a anchor
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => <a href={href} {...props}>{children}</a>
}));

describe('UpdatesList Component', () => {
  const mockMarkAllAsSeen = vi.fn();
  const mockTriggerScan = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useUpdateChecker as any).mockReturnValue({
      isScanning: false,
      triggerScan: mockTriggerScan,
    });
  });

  it('renders empty state when there are no updates', () => {
    (useUpdateStore as any).mockReturnValue({
      items: {},
      markAllAsSeen: mockMarkAllAsSeen,
    });

    render(<UpdatesList />);
    expect(screen.getByText(/Tidak ada update/i)).toBeTruthy();
  });

  it('groups updates by day and sorts them by detectedAt descending', () => {
    const today = new Date().toISOString();
    const yesterday = new Date(Date.now() - 86400000).toISOString();
    
    (useUpdateStore as any).mockReturnValue({
      items: {
        'sourceA::manga1': { sourceId: 'sourceA', mangaId: 'manga1', mangaTitle: 'Title 1', detectedAt: yesterday, latestChapterId: 'chap1', latestChapterNumber: 10 },
        'sourceB::manga2': { sourceId: 'sourceB', mangaId: 'manga2', mangaTitle: 'Title 2', detectedAt: today, latestChapterId: 'chap2', latestChapterNumber: 20 },
      },
      markAllAsSeen: mockMarkAllAsSeen,
    });

    render(<UpdatesList />);
    
    const titles = screen.getAllByRole('heading', { level: 4 }).map(el => el.textContent);
    expect(titles[0]).toBe('Title 2'); // Today's should be first
    expect(titles[1]).toBe('Title 1');
  });

  it('marks all as seen on unmount', async () => {
    (useUpdateStore as any).mockReturnValue({
      items: {
        'sourceA::manga1': { sourceId: 'sourceA', mangaId: 'manga1', mangaTitle: 'Title 1', detectedAt: new Date().toISOString() }
      },
      markAllAsSeen: mockMarkAllAsSeen,
    });

    const { unmount } = render(<UpdatesList />);
    unmount();
    
    await waitFor(() => {
      expect(mockMarkAllAsSeen).toHaveBeenCalled();
    });
  });

  it('calls scanLibraryUpdates with forceRefresh when refresh button clicked', () => {
    (useUpdateStore as any).mockReturnValue({
      items: {},
      markAllAsSeen: mockMarkAllAsSeen,
    });

    render(<UpdatesList />);
    
    const refreshBtn = screen.getByRole('button', { name: /refresh/i });
    fireEvent.click(refreshBtn);
    
    expect(mockTriggerScan).toHaveBeenCalledWith({ forceRefresh: true });
  });

  it('shows valid updates even if another item has an error, and displays warning', () => {
    (useUpdateStore as any).mockReturnValue({
      items: {
        'sourceA::manga1': { sourceId: 'sourceA', mangaId: 'manga1', mangaTitle: 'Title 1', detectedAt: new Date().toISOString(), error: 'Network Error' },
        'sourceB::manga2': { sourceId: 'sourceB', mangaId: 'manga2', mangaTitle: 'Title 2', detectedAt: new Date().toISOString() },
      },
      markAllAsSeen: mockMarkAllAsSeen,
    });

    render(<UpdatesList />);
    
    expect(screen.getByText('Title 1')).toBeTruthy();
    expect(screen.getByText('Title 2')).toBeTruthy();
    expect(screen.getByText(/Network Error/i)).toBeTruthy(); // Warning exists
  });

  it('links to reader when latestChapterId exists, otherwise links to manga detail', () => {
    (useUpdateStore as any).mockReturnValue({
      items: {
        'sourceA::manga1': { sourceId: 'sourceA', mangaId: 'manga1', mangaTitle: 'Title 1', detectedAt: new Date().toISOString(), latestChapterId: 'chap1' },
        'sourceB::manga2': { sourceId: 'sourceB', mangaId: 'manga2', mangaTitle: 'Title 2', detectedAt: new Date().toISOString() }, // No chapter ID
      },
      markAllAsSeen: mockMarkAllAsSeen,
    });

    render(<UpdatesList />);
    
    const link1 = screen.getByText('Title 1').closest('a');
    expect(link1?.getAttribute('href')).toMatch(/\/read\//);
    
    const link2 = screen.getByText('Title 2').closest('a');
    expect(link2?.getAttribute('href')).toMatch(/\/manga\//);
  });
});
