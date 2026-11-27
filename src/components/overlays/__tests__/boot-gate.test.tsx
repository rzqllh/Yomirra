import * as React from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const authState = vi.hoisted(() => ({ loading: false }));
const pathnameState = vi.hoisted(() => ({ value: "/" }));
const onboardingState = vi.hoisted(() => ({
  _hasHydrated: false,
  hasCompletedOnboarding: false,
}));
const capturedSplashProps = vi.hoisted(() => ({
  lastOnUpdate: undefined as unknown,
  renderCount: 0,
}));
const animatePresenceControl = vi.hoisted(() => ({
  stallExit: false,
  lastOnExitComplete: undefined as (() => void) | undefined,
}));
const runCanonicalMigrationMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  usePathname: () => pathnameState.value,
}));

vi.mock("@/shared/hooks/use-auth", () => ({
  useAuth: () => ({ loading: authState.loading }),
}));

vi.mock("@/shared/store/onboarding-store", () => {
  const useOnboardingStore = Object.assign(
    <T,>(selector?: (state: typeof onboardingState) => T) =>
      selector ? selector(onboardingState) : onboardingState,
    { getState: () => onboardingState }
  );
  return { useOnboardingStore };
});

vi.mock("@/shared/lib/canonical-migration", () => ({
  runCanonicalMigration: () => runCanonicalMigrationMock(),
}));

vi.mock("../onboarding-overlay", () => ({
  OnboardingOverlay: ({ onComplete }: { onComplete: () => void }) => (
    <div data-testid="onboarding-overlay">
      <button type="button" onClick={onComplete}>
        Selesai
      </button>
    </div>
  ),
}));

vi.mock("motion/react", async () => {
  const ReactMod = await vi.importActual<typeof import("react")>("react");
  const PresenceCtx = ReactMod.createContext<{ isPresent: boolean }>({ isPresent: true });

  function MockAnimatePresence({
    children,
    onExitComplete,
  }: {
    children?: React.ReactNode;
    onExitComplete?: () => void;
    mode?: string;
  }) {
    const exitingChildrenRef = ReactMod.useRef(new Map<string, React.ReactElement>());
    animatePresenceControl.lastOnExitComplete = onExitComplete;
    const childArray = ReactMod.Children.toArray(children).filter(
      ReactMod.isValidElement
    ) as React.ReactElement[];
    const presentKeys = new Set(childArray.map((child) => String(child.key ?? "")));

    if (animatePresenceControl.stallExit) {
      // Simulate a WebKit WAAPI onfinish stall by keeping exited children mounted inside this AnimatePresence instance until remounted.
      for (const [key, node] of exitingChildrenRef.current.entries()) {
        if (presentKeys.has(key)) {
          exitingChildrenRef.current.delete(key);
        } else {
          childArray.push(node);
        }
      }
    }

    return ReactMod.createElement(
      ReactMod.Fragment,
      null,
      childArray.map((child) => {
        const key = String(child.key ?? "");
        const isPresent = presentKeys.has(key);
        if (animatePresenceControl.stallExit && isPresent && !exitingChildrenRef.current.has(key)) {
          exitingChildrenRef.current.set(key, child);
        }
        return ReactMod.createElement(
          PresenceCtx.Provider,
          { key, value: { isPresent } },
          child
        );
      })
    );
  }

  const div = ({
    children,
    ...allProps
  }: React.HTMLAttributes<HTMLDivElement> & {
    children?: React.ReactNode;
    initial?: unknown;
    exit?: unknown;
    transition?: unknown;
    onUpdate?: unknown;
  }) => {
    const { onUpdate, ...rest } = allProps;
    const domProps = Object.fromEntries(
      Object.entries(rest).filter(([key]) => key !== "initial" && key !== "exit" && key !== "transition")
    ) as React.HTMLAttributes<HTMLDivElement>;
    if ((allProps as Record<string, unknown>)["data-testid"] === "splash-screen") {
      capturedSplashProps.lastOnUpdate = onUpdate;
      capturedSplashProps.renderCount += 1;
    }
    return ReactMod.createElement("div", domProps, children);
  };

  return {
    AnimatePresence: MockAnimatePresence,
    motion: { div },
    useIsPresent: () => ReactMod.useContext(PresenceCtx).isPresent,
    useReducedMotion: () => false,
  };
});

import { BootGate } from "../boot-gate";
import { SplashScreen } from "../splash-screen";

describe("BootGate and SplashScreen WebKit resilience", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    authState.loading = false;
    pathnameState.value = "/";
    onboardingState._hasHydrated = false;
    onboardingState.hasCompletedOnboarding = false;
    capturedSplashProps.lastOnUpdate = undefined;
    capturedSplashProps.renderCount = 0;
    animatePresenceControl.stallExit = false;
    animatePresenceControl.lastOnExitComplete = undefined;
    runCanonicalMigrationMock.mockClear();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("mounts SplashScreen during boot without bypassing it and isolates children via aria-hidden and inert only", () => {
    authState.loading = true;
    render(
      <BootGate>
        <main>Beranda</main>
      </BootGate>
    );

    expect(screen.getByTestId("splash-screen")).toBeTruthy();
    expect(typeof capturedSplashProps.lastOnUpdate).toBe("function");
    const appWrapper = screen.getByText("Beranda").closest("[aria-hidden]");
    expect(appWrapper?.getAttribute("aria-hidden")).toBe("true");
    expect(appWrapper?.hasAttribute("inert")).toBe(true);
    expect(appWrapper?.className).toContain("pointer-events-none");
    expect(appWrapper?.className).not.toContain("invisible");
    expect(appWrapper?.className).not.toContain("contents");
  });

  it("does not reset the 2s boot recovery timeout when SplashScreen receives a new onComplete callback", () => {
    authState.loading = true;
    onboardingState._hasHydrated = false;
    const onCompleteA = vi.fn();
    const onCompleteB = vi.fn();

    const { rerender } = render(<SplashScreen onComplete={onCompleteA} />);
    act(() => {
      vi.advanceTimersByTime(1500);
    });

    rerender(<SplashScreen onComplete={onCompleteB} />);
    act(() => {
      vi.advanceTimersByTime(499);
    });
    expect(onCompleteA).not.toHaveBeenCalled();
    expect(onCompleteB).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(onCompleteB).toHaveBeenCalledTimes(1);
  });

  it("detaches a stalled exiting SplashScreen within 600ms and reveals main app content without invisible or contents", async () => {
    authState.loading = false;
    onboardingState._hasHydrated = false;
    onboardingState.hasCompletedOnboarding = true;
    animatePresenceControl.stallExit = true;

    const { rerender } = render(
      <BootGate>
        <main>Beranda</main>
      </BootGate>
    );

    expect(screen.getByTestId("splash-screen")).toBeTruthy();

    onboardingState._hasHydrated = true;
    rerender(
      <BootGate>
        <main>Beranda</main>
      </BootGate>
    );

    await act(async () => {
      await Promise.resolve();
    });

    // Phase already flipped to app while AnimatePresence exit is stalled: exiting splash yields pointer events.
    const appWrapper = screen.getByText("Beranda").closest("[aria-hidden]");
    expect(appWrapper?.getAttribute("aria-hidden")).toBe("false");
    expect(appWrapper?.hasAttribute("inert")).toBe(false);
    expect(appWrapper?.className ?? "").not.toContain("pointer-events-none");
    expect(appWrapper?.className ?? "").not.toContain("invisible");
    expect(appWrapper?.className ?? "").not.toContain("contents");
    expect(screen.getByTestId("splash-screen").className).toContain("pointer-events-none");
    expect(runCanonicalMigrationMock).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(599);
    });
    expect(screen.getByTestId("splash-screen")).toBeTruthy();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.queryByTestId("splash-screen")).toBeNull();
  });

  it("reads latest hydrated hasCompletedOnboarding when splash finishes and recovers onboarding -> app transition", async () => {
    authState.loading = false;
    onboardingState._hasHydrated = false;
    onboardingState.hasCompletedOnboarding = false;
    animatePresenceControl.stallExit = true;

    render(
      <BootGate>
        <main>Beranda</main>
      </BootGate>
    );

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.getByTestId("onboarding-overlay")).toBeTruthy();
    expect(runCanonicalMigrationMock).not.toHaveBeenCalled();

    const appWrapper = screen.getByText("Beranda").closest("[aria-hidden]");
    expect(appWrapper?.getAttribute("aria-hidden")).toBe("true");
    expect(appWrapper?.hasAttribute("inert")).toBe(true);

    // Watchdog settles stalled exiting splash while preserving active onboarding.
    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(screen.queryByTestId("splash-screen")).toBeNull();
    expect(screen.getByTestId("onboarding-overlay")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Selesai" }));
    await act(async () => {
      await Promise.resolve();
    });

    expect(runCanonicalMigrationMock).toHaveBeenCalledTimes(1);
    expect(appWrapper?.getAttribute("aria-hidden")).toBe("false");
    expect(appWrapper?.hasAttribute("inert")).toBe(false);

    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(screen.queryByTestId("onboarding-overlay")).toBeNull();
  });

  it("renders admin routes directly without BootGate overlays or inert wrapper", () => {
    pathnameState.value = "/admin/reports";
    render(
      <BootGate>
        <main>Admin Panel</main>
      </BootGate>
    );

    expect(screen.getByText("Admin Panel")).toBeTruthy();
    expect(screen.queryByTestId("splash-screen")).toBeNull();
    expect(screen.getByText("Admin Panel").closest("[aria-hidden]")).toBeNull();
  });
});
