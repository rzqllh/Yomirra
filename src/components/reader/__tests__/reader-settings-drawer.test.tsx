import { describe, expect, it, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { useReaderStore } from "@/shared/store/reader-store";
import { ReaderSettingsDrawer } from "../reader-settings-drawer";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/"),
  useRouter: vi.fn(() => ({ back: vi.fn(), push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() })),
}));

describe("ReaderSettingsDrawer & Per-Title Scope (P0 Q8/Q86)", () => {
  const defaultPrefs = {
    imageFit: "width" as const,
    pageGap: "none" as const,
    background: "black" as const,
    toolbarBehavior: "auto-hide" as const,
    preloadIntensity: "balanced" as const,
    showPageProgress: true,
    readingDirection: "ltr" as const,
    readingMode: "vertical" as const,
    keepScreenAwake: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useReaderStore.setState({
      preferences: { ...defaultPrefs },
      perTitlePreferences: {},
      isDesktopPanelOpen: true,
      isOverlayVisible: true,
    });
  });

  it("disables double-tap per title without changing the global or another title", () => {
    render(<ReaderSettingsDrawer isOpen onClose={vi.fn()} sourceId="mangadex" mangaId="frieren" />);
    fireEvent.click(screen.getByRole("checkbox", { name: "Nonaktifkan double-tap zoom" }));
    expect(useReaderStore.getState().perTitlePreferences["mangadex::frieren"].disableDoubleTapZoom).toBe(true);
    expect(useReaderStore.getState().preferences.disableDoubleTapZoom ?? false).toBe(false);
    expect(useReaderStore.getState().perTitlePreferences["other::title"]).toBeUndefined();
  });

  it("renders drawer and does NOT recurse or crash when updating global preferences", () => {
    const onClose = vi.fn();
    render(<ReaderSettingsDrawer isOpen={true} onClose={onClose} />);

    // Click on a background color option (e.g. Hijau Gelap)
    const deepLagoonBtn = screen.getByRole("button", { name: /Hijau Gelap/i });
    expect(deepLagoonBtn).toBeDefined();

    // Trigger setting update: must NOT throw RangeError: Maximum call stack size exceeded
    expect(() => {
      fireEvent.click(deepLagoonBtn);
    }).not.toThrow();

    // Verify global preference was updated
    expect(useReaderStore.getState().preferences.background).toBe("deepLagoon");
    // Verify perTitlePreferences remained empty since no title context was provided
    expect(Object.keys(useReaderStore.getState().perTitlePreferences)).toHaveLength(0);
  });

  it("updates per-title preferences when scope is 'Khusus judul ini' without altering global preferences", () => {
    const onClose = vi.fn();
    render(
      <ReaderSettingsDrawer
        isOpen={true}
        onClose={onClose}
        sourceId="shinigami"
        mangaId="solo-leveling"
      />
    );

    // Verify Scope Selector is visible
    expect(screen.getByText("Cakupan Pengaturan")).toBeDefined();
    const titleScopeBtn = screen.getByRole("button", { name: /Khusus judul ini/i });
    const globalScopeBtn = screen.getByRole("button", { name: /Semua komik/i });
    expect(titleScopeBtn).toBeDefined();
    expect(globalScopeBtn).toBeDefined();

    // Click on 'Proporsional' image fit
    const containedBtn = screen.getByRole("button", { name: /Proporsional/i });
    fireEvent.click(containedBtn);

    const storeState = useReaderStore.getState();
    const titleKey = "shinigami::solo-leveling";

    // Title override should be stored
    expect(storeState.perTitlePreferences[titleKey]).toBeDefined();
    expect(storeState.perTitlePreferences[titleKey]?.imageFit).toBe("contained");

    // Global preference should remain "width"
    expect(storeState.preferences.imageFit).toBe("width");
  });

  it("updates global preferences when user switches scope to 'Semua komik'", () => {
    const onClose = vi.fn();
    render(
      <ReaderSettingsDrawer
        isOpen={true}
        onClose={onClose}
        sourceId="shinigami"
        mangaId="solo-leveling"
      />
    );

    // Switch scope to 'Semua komik'
    const globalScopeBtn = screen.getByRole("button", { name: /Semua komik/i });
    fireEvent.click(globalScopeBtn);

    // Click 'Jauh' for page gap
    const comfortableGapBtn = screen.getByRole("button", { name: /Jauh/i });
    fireEvent.click(comfortableGapBtn);

    const storeState = useReaderStore.getState();

    // Global preferences should now be updated to 'comfortable'
    expect(storeState.preferences.pageGap).toBe("comfortable");
  });

  it("resets per-title preferences back to global fallback when 'Reset ke default' is clicked", () => {
    // Seed initial per-title preference
    useReaderStore.setState({
      preferences: { ...defaultPrefs, background: "black" },
      perTitlePreferences: {
        "shinigami::solo-leveling": { background: "mist" },
      },
    });

    const onClose = vi.fn();
    render(
      <ReaderSettingsDrawer
        isOpen={true}
        onClose={onClose}
        sourceId="shinigami"
        mangaId="solo-leveling"
      />
    );

    // 'Reset ke default' button should be displayed because an override exists
    const resetBtn = screen.getByRole("button", { name: /Reset ke default/i });
    expect(resetBtn).toBeDefined();

    fireEvent.click(resetBtn);

    const storeState = useReaderStore.getState();
    expect(storeState.perTitlePreferences["shinigami::solo-leveling"]).toBeUndefined();

    // Effective preferences via getTitlePreferences now returns global background
    const effective = storeState.getTitlePreferences("shinigami", "solo-leveling");
    expect(effective.background).toBe("black");
  });

  it("does not mutate preferences merely by switching scopes", () => {
    const onClose = vi.fn();
    render(
      <ReaderSettingsDrawer
        isOpen={true}
        onClose={onClose}
        sourceId="mangadex"
        mangaId="frieren"
      />
    );

    const initialGlobal = { ...useReaderStore.getState().preferences };
    const globalScopeBtn = screen.getByRole("button", { name: /Semua komik/i });
    const titleScopeBtn = screen.getByRole("button", { name: /Khusus judul ini/i });

    // Toggle scope back and forth
    fireEvent.click(globalScopeBtn);
    fireEvent.click(titleScopeBtn);

    // Preferences should remain unchanged
    expect(useReaderStore.getState().preferences).toEqual(initialGlobal);
    expect(useReaderStore.getState().perTitlePreferences["mangadex::frieren"]).toBeUndefined();
  });
});
