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

  it('contains Beranda, Jelajah, Rak Buku, Cari, and Pengaturan links', () => {
    render(<BottomDock />);
    expect(screen.getByRole('link', { name: /beranda/i })).toBeTruthy();
    expect(screen.getByRole('link', { name: /jelajah/i })).toBeTruthy();
    expect(screen.getByRole('link', { name: /rak buku/i })).toBeTruthy();
    expect(screen.getByRole('link', { name: /cari/i })).toBeTruthy();
    expect(screen.getByRole('link', { name: /pengaturan/i })).toBeTruthy();
  });

  it('contains a Rak Buku bookmark link', () => {
    render(<BottomDock />);
    const bookmarkLink = screen.getByRole('link', { name: /rak buku/i });
    expect(bookmarkLink).toBeTruthy();
  });
});
