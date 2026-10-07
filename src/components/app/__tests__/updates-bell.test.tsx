import { render, screen, fireEvent } from '@testing-library/react';
import { UpdatesBell } from '@/components/overlays/updates-bell';
import { useUpdateStore } from '@/shared/store/update-store';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@/shared/store/update-store', () => ({
  useUpdateStore: vi.fn(),
}));

vi.mock('@/shared/store/settings-store', () => ({
  useSettingsStore: vi.fn(),
}));

vi.mock('@/shared/hooks/use-mounted', () => ({
  useMounted: () => true,
}));

vi.mock('motion/react', () => ({
  motion: {
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
  useReducedMotion: () => false,
}));

describe('UpdatesBell Component', () => {
  const mockMarkAllAsSeen = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const setupStore = (unreadCount: number, items: Record<string, any> = {}) => {
    (useUpdateStore as any).mockImplementation((selector: any) => {
      const state = {
        getUnreadCount: () => unreadCount,
        items,
        markAllAsSeen: mockMarkAllAsSeen,
      };
      return selector(state);
    });
  };

  it('renders button trigger with accessible label when 0 unread', () => {
    setupStore(0);
    render(<UpdatesBell />);
    
    const bellBtn = screen.getByRole('button', { name: 'Pembaruan' });
    expect(bellBtn).toBeTruthy();
    
    const badge = screen.queryByTestId('updates-badge');
    expect(badge).toBeNull();
  });

  it('shows badge and correct accessible label when unread count > 0', () => {
    setupStore(5);
    render(<UpdatesBell />);
    
    const bellBtn = screen.getByRole('button', { name: 'Pembaruan, 5 belum dibaca' });
    expect(bellBtn).toBeTruthy();
    
    const badge = screen.getByTestId('updates-badge');
    expect(badge).toBeTruthy();
    expect(badge.textContent).toBe('5');
  });

  it('displays 99+ when unread count exceeds 99', () => {
    setupStore(120);
    render(<UpdatesBell />);
    
    const bellBtn = screen.getByRole('button', { name: 'Pembaruan, 120 belum dibaca' });
    expect(bellBtn).toBeTruthy();
    
    const badge = screen.getByTestId('updates-badge');
    expect(badge.textContent).toBe('99+');
  });

  it('opens dropdown on click, triggers markAllAsSeen, and displays recent updates and link to /updates', () => {
    setupStore(2, {
      'shinigami::solo-leveling': {
        sourceId: 'shinigami',
        mangaId: 'solo-leveling',
        mangaTitle: 'Solo Leveling',
        latestChapterId: 'ch-200',
        latestChapterNumber: 200,
        latestChapterTitle: 'Chapter 200',
        detectedAt: new Date().toISOString(),
      },
    });

    render(<UpdatesBell />);
    const bellBtn = screen.getByRole('button', { name: 'Pembaruan, 2 belum dibaca' });
    fireEvent.pointerDown(bellBtn);

    expect(mockMarkAllAsSeen).toHaveBeenCalled();
    expect(screen.getByText('Notifikasi Pembaruan')).toBeDefined();
    expect(screen.getByText('Solo Leveling')).toBeDefined();
    expect(screen.getByText('Chapter 200')).toBeDefined();
    
    const allUpdatesLink = screen.getByRole('menuitem', { name: /Tampilkan semua notifikasi/i });
    expect(allUpdatesLink).toBeDefined();
    expect(allUpdatesLink.getAttribute('href')).toBe('/updates');
  });

  it('deduplicates multiple entries for the same manga to prevent duplicate keys and duplicate rows', () => {
    setupStore(2, {
      'legacy-key': {
        sourceId: 'shinigami',
        mangaId: 'eefbdd4d-a794-43da-9725-180c98114d40',
        mangaTitle: 'The Regressed Mercenary',
        latestChapterId: 'ch-108',
        latestChapterTitle: 'Chapter 108',
        detectedAt: new Date(Date.now() - 300000).toISOString(),
      },
      'saved-key': {
        sourceId: 'shinigami',
        mangaId: 'eefbdd4d-a794-43da-9725-180c98114d40',
        savedTitleId: 'eefbdd4d-a794-43da-9725-180c98114d40',
        mangaTitle: 'The Regressed Mercenary',
        latestChapterId: 'ch-109',
        latestChapterTitle: 'Chapter 109',
        detectedAt: new Date(Date.now() - 60000).toISOString(),
      },
    });

    render(<UpdatesBell />);
    const bellBtn = screen.getByRole('button', { name: 'Pembaruan, 2 belum dibaca' });
    fireEvent.pointerDown(bellBtn);

    const titleElements = screen.getAllByText('The Regressed Mercenary');
    // Should be deduplicated to exactly 1 item in the list
    expect(titleElements).toHaveLength(1);
    expect(screen.getByText('Chapter 109')).toBeDefined();
    expect(screen.queryByText('Chapter 108')).toBeNull();
  });
});
