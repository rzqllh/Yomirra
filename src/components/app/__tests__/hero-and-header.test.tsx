import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HomeHero } from '../home-hero';
import { HeaderActions } from '../header-actions';
import { PageHeader } from '../header';

const pushMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('next-themes', () => ({
  useTheme: () => ({
    theme: 'dark',
    resolvedTheme: 'dark',
    setTheme: vi.fn(),
  }),
}));

vi.mock('@/shared/hooks/use-auth', () => ({
  useAuth: () => ({
    user: null,
    loginWithGoogle: vi.fn(),
    logout: vi.fn(),
  }),
}));

vi.mock('@/shared/hooks/use-mounted', () => ({
  useMounted: () => true,
}));

vi.mock('@/components/app/updates-bell', () => ({
  UpdatesBell: ({ className }: { className?: string }) => (
    <button type="button" aria-label="Pembaruan" className={className}>Bell</button>
  ),
}));

vi.mock('@/shared/store/history-store', () => ({
  useHistoryStore: (selector: any) => selector({ items: {} }),
}));

describe('Header & Hero System (Squircle & Reusable)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('HomeHero', () => {
    it('renders greeting, title, and search input', () => {
      render(<HomeHero />);
      expect(screen.getByText(/Cari komik/i)).toBeTruthy();
      expect(screen.getByText(/Yomirra/i)).toBeTruthy();

      const input = screen.getByPlaceholderText(/Cari judul, kreator, genre, atau #tag/i);
      expect(input).toBeTruthy();
    });

    it('hands Home search to the shared global search surface', () => {
      const listener = vi.fn();
      window.addEventListener('open-command-menu', listener);

      render(<HomeHero />);
      const input = screen.getByPlaceholderText(/Cari judul, kreator, genre, atau #tag/i);
      fireEvent.change(input, { target: { value: 'solo leveling' } });

      expect(listener).toHaveBeenCalled();
      const lastEvent = listener.mock.calls.at(-1)?.[0] as CustomEvent;
      expect(lastEvent.detail).toEqual({ query: 'solo leveling' });

      window.removeEventListener('open-command-menu', listener);
    });

    it('renders skeleton pulse and does not fallback to AI image when candidates are empty', () => {
      render(<HomeHero candidates={[]} />);
      const imgs = document.querySelectorAll('img');
      // No AI hero-banner.jpg rendered
      const aiImg = Array.from(imgs).find(img => img.getAttribute('src') === '/hero-banner.jpg');
      expect(aiImg).toBeUndefined();
    });

    it('picks a candidate and saves to sessionStorage', () => {
      const candidates = [
        { coverUrl: 'https://example.com/cover1.jpg', title: 'Manga 1' },
      ];
      render(<HomeHero candidates={candidates} />);
      const cached = sessionStorage.getItem('yomirra_hero_manga_cover');
      expect(cached).toContain('https://example.com/cover1.jpg');
    });
  });

  describe('HeaderActions & Dropdown Popover', () => {
    it('uses squircle rounded-2xl geometry for bell and settings trigger', () => {
      render(<HeaderActions />);
      const bellButton = screen.getByRole('button', { name: /pembaruan/i });
      expect(bellButton.className).toContain('rounded-2xl');

      const settingsBtn = screen.getByRole('button', { name: /pengaturan dan profil/i });
      expect(settingsBtn.className).toContain('rounded-2xl');
    });

    it('opens dropdown menu on settings button click with all required options in squircle geometry', () => {
      render(<HeaderActions />);
      const settingsBtn = screen.getByRole('button', { name: /pengaturan dan profil/i });

      // Initially closed
      expect(screen.queryByText(/Pengaturan aplikasi/i)).toBeNull();

      // Click to open
      fireEvent.click(settingsBtn);

      // Verify all items are rendered
      expect(screen.getByText(/Pengaturan aplikasi/i)).toBeTruthy();
      expect(screen.getByRole('link', { name: 'Sumber' }).getAttribute('href')).toBe('/sources');
      expect(screen.getByText(/Tema tampilan/i)).toBeTruthy();
      expect(screen.getByText(/Bahasa/i)).toBeTruthy();
      expect(screen.getByText(/Pusat bantuan/i)).toBeTruthy();
      expect(screen.getByText(/Masuk akun/i)).toBeTruthy();
    });
  });

  describe('PageHeader (Responsive Header Architecture)', () => {
    it('renders mobile header actions but does NOT leak HeaderActions to desktop banner', () => {
      const { container } = render(
        <PageHeader
          title="Populer"
          subtitle="Manga, Manhwa, dan Manhua paling populer saat ini."
        />
      );

      // Mobile header element contains HeaderActions
      const mobileHeader = container.querySelector('header.md\\:hidden');
      expect(mobileHeader).toBeTruthy();
      expect(mobileHeader?.querySelector('button[aria-label="Pembaruan"]')).toBeTruthy();

      // Desktop banner element should NOT contain mobile HeaderActions
      const desktopBanner = container.querySelector('div.hidden.md\\:block');
      expect(desktopBanner).toBeTruthy();
      expect(desktopBanner?.querySelector('a[href="/updates"]')).toBeNull();
      expect(desktopBanner?.textContent).toContain('Populer');
      expect(desktopBanner?.textContent).toContain('Manga, Manhwa, dan Manhua paling populer saat ini.');
    });

    it('renders custom desktopActions on desktop banner when provided', () => {
      const { container } = render(
        <PageHeader
          title="Unduhan"
          desktopActions={<button data-testid="desktop-delete-all">Hapus Semua</button>}
        />
      );

      const desktopBanner = container.querySelector('div.hidden.md\\:block');
      expect(desktopBanner?.querySelector('[data-testid="desktop-delete-all"]')).toBeTruthy();
    });
  });
});
