import { render, screen } from '@testing-library/react';
import { BottomDock } from '@/components/chrome/bottom-dock';
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

  it('contains Beranda, Library, Rak Buku, Cari, and Populer links per design.md §28', () => {
    render(<BottomDock />);
    expect(screen.getByRole('link', { name: /beranda/i })).toBeTruthy();
    expect(screen.getByRole('link', { name: /library/i })).toBeTruthy();
    expect(screen.getByRole('link', { name: /rak buku/i })).toBeTruthy();
    expect(screen.getByRole('link', { name: /cari/i })).toBeTruthy();
    expect(screen.getByRole('link', { name: /populer/i })).toBeTruthy();
  });

  it('moves the active state to a pending destination before pathname commits', () => {
    render(<BottomDock pendingHref="/library" />);

    const berandaLink = screen.getByRole('link', { name: /beranda/i });
    const libraryLink = screen.getByRole('link', { name: /library/i });

    expect(berandaLink.textContent).toBe('');
    expect(libraryLink.textContent).toContain('Library');
    expect(libraryLink.getAttribute('aria-current')).toBe('page');
  });

  it('keeps inactive destinations on a square 44px visual footprint', () => {
    render(<BottomDock />);

    const libraryLink = screen.getByRole('link', { name: /library/i });
    expect(libraryLink.className).toContain('size-11');
    expect(libraryLink.className).toContain('shrink-0');
  });

  it('does NOT contain link to /settings in bottom dock', () => {
    render(<BottomDock />);
    const settingsLink = screen.queryByRole('link', { name: /pengaturan|settings/i });
    expect(settingsLink).toBeNull();
  });

  it('contains a Rak Buku link pointing to /bookmark', () => {
    render(<BottomDock />);
    const bookmarkLink = screen.getByRole('link', { name: /rak buku/i });
    expect(bookmarkLink).toBeTruthy();
    expect(bookmarkLink.getAttribute('href')).toBe('/bookmark');
  });

  it('only renders text label for the active tab, hiding text labels for inactive tabs', () => {
    render(<BottomDock />);
    
    // Active tab (Beranda on '/') has visible text label
    const berandaLink = screen.getByRole('link', { name: /beranda/i });
    expect(berandaLink.textContent).toContain('Beranda');

    // Inactive tabs (Library, Rak Buku, Cari, Populer) have NO text label content
    const libraryLink = screen.getByRole('link', { name: /library/i });
    expect(libraryLink.textContent).toBe('');

    const bookmarkLink = screen.getByRole('link', { name: /rak buku/i });
    expect(bookmarkLink.textContent).toBe('');

    const cariLink = screen.getByRole('link', { name: /cari/i });
    expect(cariLink.textContent).toBe('');

    const populerLink = screen.getByRole('link', { name: /populer/i });
    expect(populerLink.textContent).toBe('');
  });

  it('preserves four primary destinations and a detached glass search action', () => {
    render(<BottomDock />);

    const nav = screen.getByRole('navigation', { name: 'Navigasi utama' });
    const mainDock = nav.querySelector('.yomirra-chrome');
    const glassSurfaces = nav.querySelectorAll('.yomirra-chrome');

    expect(glassSurfaces).toHaveLength(2);
    expect(mainDock?.querySelectorAll('a')).toHaveLength(4);
    expect(glassSurfaces[1].querySelector('a')).toBeNull();
    expect(screen.getByRole('link', { name: 'Cari' }).className).toContain('yomirra-chrome');
  });

  it('uses a restrained primary-text label and accent icon for the selected destination', () => {
    render(<BottomDock />);

    const activeLink = screen.getByRole('link', { name: 'Beranda' });
    expect(activeLink.getAttribute('aria-current')).toBe('page');
    expect(screen.getByText('Beranda').className).toContain('text-text-primary');
    expect(activeLink.querySelector('svg')?.getAttribute('class')).toContain('text-accent');
  });

  it('moves the pending selected state to the detached search action', () => {
    render(<BottomDock pendingHref="/search" />);

    const searchLink = screen.getByRole('link', { name: 'Cari' });
    expect(searchLink.getAttribute('aria-current')).toBe('page');
    expect(screen.getByRole('link', { name: 'Beranda' }).getAttribute('aria-current')).toBeNull();
    expect(searchLink.querySelector('span[aria-hidden="true"]')).toBeTruthy();
  });

  it('provides a compact layout for narrow screens without shrinking standard touch targets', () => {
    render(<BottomDock />);

    const inactiveLink = screen.getByRole('link', { name: 'Library' });
    const searchLink = screen.getByRole('link', { name: 'Cari' });

    expect(inactiveLink.className).toContain('size-11');
    expect(inactiveLink.className).toContain('max-[359px]:size-10');
    expect(searchLink.className).toContain('size-14');
    expect(searchLink.className).toContain('max-[359px]:size-12');
  });

});
