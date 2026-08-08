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

  it('contains Beranda, Library, Bookmark, Cari, and Pengaturan links', () => {
    render(<BottomDock />);
    expect(screen.getByRole('link', { name: /beranda/i })).toBeTruthy();
    expect(screen.getByRole('link', { name: /library/i })).toBeTruthy();
    expect(screen.getByRole('link', { name: /bookmark/i })).toBeTruthy();
    expect(screen.getByRole('link', { name: /cari/i })).toBeTruthy();
    expect(screen.getByRole('link', { name: /pengaturan/i })).toBeTruthy();
  });
});
