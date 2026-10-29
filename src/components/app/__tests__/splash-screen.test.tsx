import { render, act } from '@testing-library/react';
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

  it('fails open after two seconds when Firebase auth or onboarding hydration stays unresolved', () => {
    mockUseAuth.mockReturnValue({ loading: true });
    mockUseOnboardingStore.mockReturnValue({ _hasHydrated: false });
    const onComplete = vi.fn();

    render(<SplashScreen onComplete={onComplete} />);
    act(() => {
      vi.advanceTimersByTime(1999);
    });
    expect(onComplete).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(onComplete).toHaveBeenCalledTimes(1);

    // Delayed callbacks must not re-enter onboarding or fire onComplete again.
    act(() => {
      vi.advanceTimersByTime(10000);
    });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
