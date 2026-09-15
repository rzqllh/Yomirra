import { vi, describe, it, expect, beforeEach } from 'vitest';
import { redirect } from 'next/navigation';

// next/navigation redirect is a server-side throw in Next.js App Router.
// We test that the page calls redirect() with the correct destination.
vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
  useRouter: vi.fn(() => ({ back: vi.fn(), push: vi.fn() })),
  usePathname: vi.fn(() => '/bookmark'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

describe('/bookmark route — compatibility redirect contract', () => {
  beforeEach(() => {
    vi.mocked(redirect).mockClear();
  });

  it('redirects to /library?tab=riwayat', async () => {
    const { default: BookmarkPage } = await import('../page');

    expect(() => BookmarkPage()).toThrow('NEXT_REDIRECT:/library?tab=riwayat');
    expect(redirect).toHaveBeenCalledWith('/library?tab=riwayat');
    expect(redirect).toHaveBeenCalledTimes(1);
  });

  it('does NOT redirect to /bookmark itself', async () => {
    const { default: BookmarkPage } = await import('../page');

    try {
      BookmarkPage();
    } catch {
      // expected throw from redirect()
    }

    const destination = vi.mocked(redirect).mock.calls[0]?.[0];
    expect(destination).not.toBe('/bookmark');
  });

  it('does NOT redirect to /library without the tab parameter', async () => {
    const { default: BookmarkPage } = await import('../page');

    try {
      BookmarkPage();
    } catch {
      // expected throw from redirect()
    }

    const destination = vi.mocked(redirect).mock.calls[0]?.[0];
    expect(destination).not.toBe('/library');
    expect(destination).toContain('tab=riwayat');
  });
});
