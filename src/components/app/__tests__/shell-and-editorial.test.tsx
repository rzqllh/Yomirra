import { render, screen, fireEvent } from '@testing-library/react';
import { DesktopRail } from '../desktop-rail';
import { TopNav } from '../top-nav';
import { HomeView } from '../home-view';
import { vi, describe, it, expect, beforeEach } from 'vitest';

let currentPathname = '/';

vi.mock('next/navigation', () => ({
  usePathname: () => currentPathname,
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

let mockUser: any = null;

vi.mock('@/shared/hooks/use-auth', () => ({
  useAuth: () => ({
    user: mockUser,
    loginWithGoogle: vi.fn(),
    logout: vi.fn(),
  }),
}));

vi.mock('@/shared/hooks/use-mounted', () => ({
  useMounted: () => true,
}));

vi.mock('@/shared/store/update-store', () => ({
  useUpdateStore: () => ({
    getUnreadCount: () => 0,
    items: {},
  }),
}));

describe('App Shell & Navigation Deduplication Pass', () => {
  beforeEach(() => {
    currentPathname = '/';
    mockUser = null;
  });

  describe('DesktopRail (Sidebar IA)', () => {
    it('renders primary navigation links including Populer', () => {
      render(<DesktopRail />);

      const brandLink = screen.getByRole('link', { name: /beranda yomirra/i });
      expect(brandLink).toBeTruthy();
      expect(brandLink.getAttribute('href')).toBe('/');

      const berandaLink = screen.getByRole('link', { name: 'Beranda' });
      expect(berandaLink).toBeTruthy();
      expect(berandaLink.getAttribute('aria-current')).toBe('page');

      const libraryLink = screen.getByRole('link', { name: 'Library' });
      expect(libraryLink.getAttribute('href')).toBe('/library');

      const bookmarkLink = screen.getByRole('link', { name: 'Rak Buku' });
      expect(bookmarkLink.getAttribute('href')).toBe('/bookmark');

      const cariLink = screen.getByRole('link', { name: 'Cari' });
      expect(cariLink.getAttribute('href')).toBe('/search');

      // Populer MUST exist in Sidebar (Phase 5)
      const populerLink = screen.getByRole('link', { name: 'Populer' });
      expect(populerLink).toBeTruthy();
      expect(populerLink.getAttribute('href')).toBe('/popular');
    });

    it('does NOT render Pembaruan in Sidebar (Header UpdatesBell is canonical)', () => {
      render(<DesktopRail />);

      const pembaruanLink = screen.queryByRole('link', { name: 'Pembaruan' });
      expect(pembaruanLink).toBeNull();
    });

    it('sets aria-current correctly when on non-home route', () => {
      currentPathname = '/popular';
      render(<DesktopRail />);

      const populerLink = screen.getByRole('link', { name: 'Populer' });
      expect(populerLink.getAttribute('aria-current')).toBe('page');

      const berandaLink = screen.getByRole('link', { name: 'Beranda' });
      expect(berandaLink.getAttribute('aria-current')).toBeNull();
    });
  });

  describe('TopNav (Global Breadcrumb & Profile Deduplication)', () => {
    it('renders global breadcrumb on Beranda (Phase 3)', () => {
      currentPathname = '/';
      render(<TopNav />);

      const breadcrumb = screen.getByRole('navigation', { name: 'Breadcrumb' });
      expect(breadcrumb).toBeTruthy();
      expect(screen.getByText('Beranda')).toBeTruthy();
      expect(screen.getByText('Cari komik…')).toBeTruthy();
    });

    it('renders localized breadcrumb on non-home pages like /settings and /popular', () => {
      currentPathname = '/settings';
      const { rerender } = render(<TopNav />);
      expect(screen.getByText('Pengaturan')).toBeTruthy();

      currentPathname = '/popular';
      rerender(<TopNav />);
      expect(screen.getByText('Populer')).toBeTruthy();

      currentPathname = '/downloads';
      rerender(<TopNav />);
      expect(screen.getByText('Unduhan')).toBeTruthy();
    });

    it('deduplicates profile dropdown: removes Pengaturan, keeps account & logout', () => {
      mockUser = {
        displayName: 'Test Reader',
        email: 'reader@example.com',
        photoURL: null,
      };

      render(<TopNav />);

      const profileBtn = screen.getByRole('button', { name: 'Profil Pengguna' });
      fireEvent.click(profileBtn);

      // Akun & Sinkronisasi is present
      expect(screen.getByRole('link', { name: /akun & sinkronisasi/i })).toBeTruthy();
      // Keluar button is present
      expect(screen.getByRole('button', { name: /keluar/i })).toBeTruthy();

      // Pengaturan is REMOVED from profile dropdown (Sidebar owns it!)
      expect(screen.queryByRole('link', { name: /pengaturan/i })).toBeNull();
    });
  });

  describe('HomeView (Simplified Shell)', () => {
    it('renders children directly without redundant mode tabs or greeting copy', () => {
      render(
        <HomeView>
          <div data-testid="direct-feed-content">Sorotan & peringkat content</div>
        </HomeView>
      );

      // Children render directly
      expect(screen.getByTestId('direct-feed-content')).toBeTruthy();

      // Redundant greeting is absent
      expect(screen.queryByText('BACAANMU DIMULAI DI SINI')).toBeNull();
      expect(screen.queryByText('Mau baca apa hari ini?')).toBeNull();

      // Redundant mode tabs are absent
      expect(screen.queryByRole('navigation', { name: 'Navigasi Beranda' })).toBeNull();
      expect(screen.queryByRole('link', { name: /untukmu/i })).toBeNull();
    });
  });
});
