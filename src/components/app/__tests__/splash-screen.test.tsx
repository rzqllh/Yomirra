import { render, screen, act, waitFor } from '@testing-library/react';
import { SplashScreen } from '@/components/overlays/splash-screen';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

const mockUseAuth = vi.fn();
const mockUseOnboardingStore = vi.fn();

vi.mock('@/shared/hooks/use-auth', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('@/shared/store/onboarding-store', () => ({
  useOnboardingStore: () => mockUseOnboardingStore(),
}));

describe('SplashScreen', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    document.body.style.overflow = 'auto';
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('preserves and restores body overflow style upon unmount', () => {
    document.body.style.overflow = 'visible';
    mockUseAuth.mockReturnValue({ loading: true });
    mockUseOnboardingStore.mockReturnValue({ _hasHydrated: false });

    const { unmount } = render(<SplashScreen onComplete={vi.fn()} />);
    expect(document.body.style.overflow).toBe('hidden');

    unmount();
    expect(document.body.style.overflow).toBe('visible');
  });

  it('calls onComplete when boot is complete after minimum splash duration', () => {
    mockUseAuth.mockReturnValue({ loading: false });
    mockUseOnboardingStore.mockReturnValue({ _hasHydrated: true });
    const onComplete = vi.fn();

    render(<SplashScreen onComplete={onComplete} />);
    expect(onComplete).not.toHaveBeenCalled();

    // Fast-forward past MINIMUM_SPLASH_DURATION (450ms)
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('does NOT get stuck if loading takes > 10s: shows warning, and when boot completes at 11s, still calls onComplete', async () => {
    let authLoading = true;
    let hydrated = false;

    mockUseAuth.mockImplementation(() => ({ loading: authLoading }));
    mockUseOnboardingStore.mockImplementation(() => ({ _hasHydrated: hydrated }));
    const onComplete = vi.fn();

    const { rerender } = render(<SplashScreen onComplete={onComplete} />);

    // Fast-forward 10.5 seconds (past WATCHDOG_TIMEOUT of 10s)
    act(() => {
      vi.advanceTimersByTime(10500);
    });

    // AnimatePresence in motion/react requires real timers/RAF to complete exit transitions
    vi.useRealTimers();

    await waitFor(() => {
      expect(screen.getByText('Koneksi Lagi Pelan')).toBeTruthy();
      expect(screen.getByText(/Ini makan waktu lebih lama/)).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Coba Lagi' })).toBeTruthy();
    });

    expect(onComplete).not.toHaveBeenCalled();

    // Now switch back to fake timers to test resolving boot at second 11
    vi.useFakeTimers();
    authLoading = false;
    hydrated = true;
    rerender(<SplashScreen onComplete={onComplete} />);

    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Boot should complete and call onComplete! (Never locked out)
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
