import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SplashScreen } from "../splash-screen";

const boot = vi.hoisted(() => ({ loading: false, hydrated: true }));

vi.mock("@/shared/hooks/use-auth", () => ({
  useAuth: () => ({ loading: boot.loading }),
}));

vi.mock("@/shared/store/onboarding-store", () => ({
  useOnboardingStore: (select: (state: { _hasHydrated: boolean }) => boolean) =>
    select({ _hasHydrated: boot.hydrated }),
}));

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  boot.loading = false;
  boot.hydrated = true;
});

describe("SplashScreen readiness", () => {
  it("completes immediately when startup dependencies are ready", () => {
    const complete = vi.fn();
    render(<SplashScreen onComplete={complete} />);
    expect(complete).toHaveBeenCalledTimes(1);
  });

  it("waits for actual readiness and completes without a minimum timer", () => {
    boot.loading = true;
    boot.hydrated = false;
    const complete = vi.fn();
    const { rerender } = render(<SplashScreen onComplete={complete} />);
    expect(screen.getByRole("status")).toBeTruthy();
    expect(complete).not.toHaveBeenCalled();
    boot.loading = false;
    boot.hydrated = true;
    rerender(<SplashScreen onComplete={complete} />);
    expect(complete).toHaveBeenCalledTimes(1);
  });

  it("retains the bounded guest recovery path", () => {
    vi.useFakeTimers();
    boot.loading = true;
    const complete = vi.fn();
    render(<SplashScreen onComplete={complete} />);
    act(() => vi.advanceTimersByTime(1999));
    expect(complete).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(complete).toHaveBeenCalledTimes(1);
  });
});
