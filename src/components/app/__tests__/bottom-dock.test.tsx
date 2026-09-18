import { render, screen } from '@testing-library/react';
import { BottomDock } from '../bottom-dock';
import { usePathname } from 'next/navigation';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
  useRouter: vi.fn(() => ({ back: vi.fn(), push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() })),
}));

vi.mock('@/shared/store/search-filter-store', () => ({
  useSearchFilterStore: {
    getState: () => ({ resetFilters: vi.fn() })
  }
}));

describe('BottomDock Navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (usePathname as any).mockReturnValue('/');
  });

  it('does NOT contain link to /updates', () => {
    render(<BottomDock />);
    const updatesLink = screen.queryByRole('link', { name: /updates/i });
    expect(updatesLink).toBeNull();
  });

  it('contains Beranda, Library, Bookmark, and Cari links', () => {
    render(<BottomDock />);
    expect(screen.getByRole('link', { name: /beranda/i })).toBeTruthy();
    expect(screen.getByRole('link', { name: /library/i })).toBeTruthy();
    expect(screen.getByRole('link', { name: /bookmark/i })).toBeTruthy();
    expect(screen.getByRole('link', { name: /cari/i })).toBeTruthy();
  });

  it('does NOT contain link to /settings in bottom dock', () => {
    render(<BottomDock />);
    const settingsLink = screen.queryByRole('link', { name: /pengaturan|settings/i });
    expect(settingsLink).toBeNull();
  });

  it('contains a Bookmark link pointing to /bookmark', () => {
    render(<BottomDock />);
    const bookmarkLink = screen.getByRole('link', { name: /bookmark/i });
    expect(bookmarkLink).toBeTruthy();
    expect(bookmarkLink.getAttribute('href')).toBe('/bookmark');
  });

  it('only renders text label for the active tab, hiding text labels for inactive tabs', () => {
    render(<BottomDock />);
    
    // Active tab (Beranda on '/') has visible text label
    const berandaLink = screen.getByRole('link', { name: /beranda/i });
    expect(berandaLink.textContent).toContain('Beranda');

    // Inactive tabs (Library, Bookmark, Cari) have NO text label content
    const libraryLink = screen.getByRole('link', { name: /library/i });
    expect(libraryLink.textContent).toBe('');

    const bookmarkLink = screen.getByRole('link', { name: /bookmark/i });
    expect(bookmarkLink.textContent).toBe('');

    const cariLink = screen.getByRole('link', { name: /cari/i });
    expect(cariLink.textContent).toBe('');
  });
});
