import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { UpdatesList } from '../updates-list';
import { useUpdateStore } from '@/shared/store/update-store';
import { useLibraryStore } from '@/shared/store/library-store';
import { useUpdateChecker } from '@/shared/hooks/use-update-checker';

vi.mock('@/shared/store/update-store', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/shared/store/update-store')>(),
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
    useLibraryStore.setState({ items: {} });
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
    expect(screen.getByText(/Belum ada jadwal/i)).toBeTruthy();
  });

  it('identifies today independently of the selected day and item counts', () => {
    (useUpdateStore as any).mockReturnValue({ items: {
      'sourceA::manga1': { sourceId: 'sourceA', mangaId: 'manga1', mangaTitle: 'Title 1', detectedAt: new Date().toISOString(), latestChapterId: 'chap1' },
    }, markAllAsSeen: mockMarkAllAsSeen });
    render(<UpdatesList initialDay="all" />);
    const today = screen.getByRole('button', { name: /Hari ini/ });
    expect(today.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(today);
    expect(today.getAttribute('aria-pressed')).toBe('true');
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

    render(<UpdatesList initialDay="all" />);
    
    const titles = screen.getAllByRole('heading', { level: 4 }).map(el => el.textContent);
    expect(titles[0]).toBe('Title 2'); // Today's should be first
    expect(titles[1]).toBe('Title 1');
  });

  it('does not mark all as seen on unmount (Q121), and allows explicit mark all as seen', () => {
    (useUpdateStore as any).mockReturnValue({
      items: {
        'sourceA::manga1': { sourceId: 'sourceA', mangaId: 'manga1', mangaTitle: 'Title 1', detectedAt: new Date().toISOString(), latestChapterId: 'chap1' }
      },
      markAllAsSeen: mockMarkAllAsSeen,
    });

    const { unmount } = render(<UpdatesList initialDay="all" />);
    
    const markAllBtn = screen.getByRole('button', { name: /Tandai Semua Dilihat/i });
    fireEvent.click(markAllBtn);
    expect(mockMarkAllAsSeen).toHaveBeenCalledTimes(1);

    unmount();
    expect(mockMarkAllAsSeen).toHaveBeenCalledTimes(1);
  });

  it.each([false, true])('refreshes updates from the lane with hideHeader=%s', (hideHeader) => {
    (useUpdateStore as any).mockReturnValue({
      items: {},
      markAllAsSeen: mockMarkAllAsSeen,
    });

    render(<UpdatesList hideHeader={hideHeader} />);

    const PerbaruiBtn = screen.getByRole('button', { name: /Perbarui/i });
    fireEvent.click(PerbaruiBtn);
    
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
    expect(screen.getByText(/gagal dimuat/i)).toBeTruthy(); // Warning banner exists
  });

  it.each([
    { recordKey: 'saved-title', hasStaleLegacyRecord: true },
    { recordKey: 'sourceA::manga1', hasStaleLegacyRecord: false },
  ])('reads chapter and error data from $recordKey and marks that record seen', ({ recordKey, hasStaleLegacyRecord }) => {
    const legacyKey = 'sourceA::manga1';
    const savedTitleId = 'saved-title';
    const detectedAt = '2026-11-23T12:00:00.000Z';
    const identity = { sourceId: 'sourceA', mangaId: 'manga1' };
    const update = { ...identity, mangaTitle: 'Saved title', detectedAt };
    const markAsSeenById = vi.fn();
    useLibraryStore.setState({ items: {
      [savedTitleId]: { ...identity, id: savedTitleId, title: 'Saved title', status: 'ONGOING', addedAt: detectedAt, updatedAt: detectedAt },
    } });
    vi.mocked(useUpdateStore, { partial: true }).mockReturnValue({
      items: {
        ...(hasStaleLegacyRecord ? { [legacyKey]: { ...update, latestChapterId: 'stale-chapter' } } : {}),
        [recordKey]: { ...update, latestChapterId: 'current-chapter', error: 'Network Error' },
      },
      markAllAsSeen: mockMarkAllAsSeen,
      markAsSeenById,
    });

    render(<UpdatesList initialDay="all" />);

    expect(screen.getByRole('link', { name: 'Mulai baca Saved title' }).getAttribute('href')).toContain('/read/current-chapter?');
    expect(screen.getByText('1 komik gagal dimuat')).toBeTruthy();
    fireEvent.click(screen.getByRole('link', { name: 'Lihat detail Saved title' }));
    expect(markAsSeenById).toHaveBeenCalledWith(recordKey);
  });

  it('disables refresh during an empty scan and restores the empty state when it settles', () => {
    vi.mocked(useUpdateStore).mockReturnValue({ items: {}, markAllAsSeen: mockMarkAllAsSeen });
    const checker = {
      isScanning: true,
      triggerScan: mockTriggerScan,
      unreadCount: 0,
      lastScanResult: null,
    };
    vi.mocked(useUpdateChecker).mockReturnValue(checker);

    const { rerender } = render(<UpdatesList hideHeader />);
    const scanning = screen.getByRole('button', { name: 'Memperbarui…' });
    expect(scanning).toHaveProperty('disabled', true);
    fireEvent.click(scanning);
    expect(mockTriggerScan).not.toHaveBeenCalled();
    expect(screen.queryByRole('heading', { name: /Belum ada jadwal/i })).toBeNull();

    vi.mocked(useUpdateChecker).mockReturnValue({ ...checker, isScanning: false });
    rerender(<UpdatesList hideHeader />);
    expect(screen.getByRole('button', { name: 'Perbarui' })).toHaveProperty('disabled', false);
    expect(screen.getByRole('heading', { name: /Belum ada jadwal/i })).toBeTruthy();
  });

  it('opens the detected alternate chapter under its confirmed source and manga', () => {
    const identity = { sourceId: 'broken-src', mangaId: 'manga-2' };
    const title = 'Omniscient Reader';
    const detectedAt = '2026-11-23T12:00:00.000Z';
    useLibraryStore.setState({ items: {
      'title-2': {
        ...identity,
        id: 'title-2',
        title,
        status: 'ONGOING',
        addedAt: detectedAt,
        updatedAt: detectedAt,
        linkedSources: [{ sourceId: 'healthy-alt', mangaId: 'alt-manga-2', matchConfidence: 'CONFIRMED', addedAt: 1 }],
      },
    } });
    vi.mocked(useUpdateStore, { partial: true }).mockReturnValue({ items: {
      'title-2': {
        ...identity,
        savedTitleId: 'title-2',
        mangaTitle: title,
        latestChapterId: 'alt-ch-55',
        latestChapterNumber: 55,
        detectedSourceId: 'healthy-alt',
        isAlternateSource: true,
        detectedAt,
      },
    } });

    render(<UpdatesList initialDay="all" />);

    expect(screen.getByRole('link', { name: 'Mulai baca Omniscient Reader' }).getAttribute('href'))
      .toBe('/manga/healthy-alt/alt-manga-2/read/alt-ch-55?returnTo=%2Fupdates');
  });

  it.each([
    { scan: 'failed', error: 'Network Error', showError: true },
    { scan: 'empty', error: undefined, showError: false },
  ])('keeps the legacy chapter after a $scan first canonical scan', ({ error, showError }) => {
    const identity = { sourceId: 'sourceA', mangaId: 'manga1' };
    const detectedAt = '2026-11-23T12:00:00.000Z';
    useLibraryStore.setState({ items: {
      'saved-title': { ...identity, id: 'saved-title', title: 'Saved title', status: 'ONGOING', addedAt: detectedAt, updatedAt: detectedAt },
    } });
    const legacy = {
      ...identity,
      mangaTitle: 'Legacy title',
      latestChapterId: 'last-known-chapter',
      latestChapterNumber: 12,
      latestChapterTitle: 'Chapter Twelve',
      detectedAt,
      error: showError ? undefined : 'Stale legacy error',
    };
    const markAsSeenById = vi.fn();
    vi.mocked(useUpdateStore, { partial: true }).mockReturnValue({
      items: { 'sourceA::manga1': legacy },
    });
    const { rerender } = render(<UpdatesList initialDay="all" />);
    expect(screen.getByText('Chapter Twelve')).toBeTruthy();
    expect(Boolean(screen.queryByText('1 komik gagal dimuat'))).toBe(!showError);

    vi.mocked(useUpdateStore, { partial: true }).mockReturnValue({
      items: {
        'sourceA::manga1': legacy,
        'saved-title': { ...identity, savedTitleId: 'saved-title', mangaTitle: 'Saved title', lastCheckedAt: detectedAt, error },
      },
      markAsSeenById,
    });
    rerender(<UpdatesList initialDay="all" />);

    expect(screen.getByRole('link', { name: 'Mulai baca Saved title' }).getAttribute('href'))
      .toBe('/manga/sourceA/manga1/read/last-known-chapter?returnTo=%2Fupdates');
    expect(screen.getByText('Chapter Twelve')).toBeTruthy();
    expect(Boolean(screen.queryByText('1 komik gagal dimuat'))).toBe(showError);
    fireEvent.click(screen.getByRole('link', { name: 'Lihat detail Saved title' }));
    expect(markAsSeenById).toHaveBeenCalledWith('saved-title');
    expect(markAsSeenById).toHaveBeenCalledWith('sourceA::manga1');
  });

  it.each([true, false])('prefers the canonical fallback row with legacy inserted first=%s', (legacyFirst) => {
    const identity = { sourceId: 'sourceA', mangaId: 'manga1' };
    const legacy = ['sourceA::manga1', { ...identity, mangaTitle: 'Legacy title', latestChapterId: 'old-chapter' }] as const;
    const canonical = ['saved-title', { ...identity, savedTitleId: 'saved-title', mangaTitle: 'Saved title', latestChapterId: 'new-chapter' }] as const;
    vi.mocked(useUpdateStore, { partial: true }).mockReturnValue({
      items: Object.fromEntries(legacyFirst ? [legacy, canonical] : [canonical, legacy]),
    });

    render(<UpdatesList initialDay="all" />);

    expect(screen.getAllByRole('article')).toHaveLength(1);
    expect(screen.getByRole('link', { name: 'Mulai baca Saved title' }).getAttribute('href'))
      .toBe('/manga/sourceA/manga1/read/new-chapter?returnTo=%2Fupdates');
  });

  it.each([false, true])('clears the visible work from the unread counter with a second canonical work present=%s', async (hasOtherWork) => {
    const { useUpdateStore: actualStore } = await vi.importActual<typeof import('@/shared/store/update-store')>('@/shared/store/update-store');
    const previousItems = actualStore.getState().items;
    const update = {
      sourceId: 'sourceA',
      mangaId: 'manga1',
      mangaTitle: 'Saved title',
      latestChapterId: 'new-chapter',
      detectedAt: new Date().toISOString(),
    };
    actualStore.setState({ items: {
      'sourceA::manga1': { ...update, latestChapterId: 'old-chapter' },
      'saved-title': { ...update, savedTitleId: 'saved-title' },
      ...(hasOtherWork ? { 'other-title': { ...update, savedTitleId: 'other-title' } } : {}),
    } });

    try {
      const { getUnreadCount } = actualStore.getState();
      vi.mocked(useUpdateStore).mockReturnValue(actualStore.getState());
      render(<UpdatesList initialDay="all" />);

      expect(getUnreadCount()).toBe(hasOtherWork ? 3 : 2);
      fireEvent.click(screen.getByRole('link', { name: 'Lihat detail Saved title' }));
      expect(getUnreadCount()).toBe(hasOtherWork ? 1 : 0);
      expect(actualStore.getState().items['other-title']?.seenAt).toBeUndefined();
    } finally {
      actualStore.setState({ items: previousItems });
    }
  });

  it('links title to manga detail with returnTo, and CTA button to reader with adaptive label', () => {
    (useUpdateStore as any).mockReturnValue({
      items: {
        'sourceA::manga1': { sourceId: 'sourceA', mangaId: 'manga1', mangaTitle: 'Title 1', detectedAt: new Date(Date.now() + 1000).toISOString(), latestChapterId: 'chap1' },
        'sourceB::manga2': { sourceId: 'sourceB', mangaId: 'manga2', mangaTitle: 'Title 2', detectedAt: new Date(Date.now() - 1000).toISOString() }, // No chapter ID
      },
      markAllAsSeen: mockMarkAllAsSeen,
    });

    render(<UpdatesList />);
    
    // Title link must point to detail with returnTo=/updates
    const titleLink = screen.getByText('Title 1').closest('a');
    expect(titleLink?.getAttribute('href')).toMatch(/\/manga\/sourceA\/manga1\?returnTo=%2Fupdates/);
    
    // Adaptive CTA button must point to reader with returnTo
    const readButtons = screen.getAllByRole('link', { name: /mulai baca|lanjut baca/i });
    expect(readButtons.length).toBeGreaterThan(0);
    expect(readButtons[0].getAttribute('href')).toMatch(/\/read\/chap1\?returnTo=%2Fupdates/);
  });

  it('renders update rows as articles with 44px schedule and read actions', () => {
    (useUpdateStore as any).mockReturnValue({
      items: {
        'sourceA::manga1': {
          sourceId: 'sourceA',
          mangaId: 'manga1',
          mangaTitle: 'Title 1',
          detectedAt: new Date().toISOString(),
          latestChapterId: 'chap1',
        },
      },
      markAllAsSeen: mockMarkAllAsSeen,
    });

    const { container } = render(<UpdatesList initialDay="all" />);
    const scheduleButton = screen.getByRole('button', { name: /jadwal rilis untuk title 1/i });
    const readLink = screen.getByRole('link', { name: /mulai baca title 1/i });

    expect(container.querySelector('article')).not.toBeNull();
    expect(scheduleButton.className).toContain('min-h-11');
    expect(scheduleButton.className).not.toContain('min-h-0');
    expect(readLink.className).toContain('min-h-11');
    expect(readLink.className).toContain('bg-accent');
  });
});
