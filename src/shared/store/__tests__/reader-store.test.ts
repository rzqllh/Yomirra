import { describe, it, expect, beforeEach } from "vitest";
import { useReaderStore } from "../reader-store";

describe("useReaderStore - Q8 & Q87 Title Preferences & Q98 In-App Controls", () => {
  beforeEach(() => {
    // Reset state before each test
    useReaderStore.setState({
      preferences: {
        imageFit: "width",
        pageGap: "none",
        background: "black",
        toolbarBehavior: "auto-hide",
        preloadIntensity: "balanced",
        showPageProgress: true,
        readingDirection: "ltr",
        readingMode: "vertical",
        keepScreenAwake: true,
      },
      perTitlePreferences: {},
      isOverlayVisible: true,
      isDesktopPanelOpen: true,
      pagedProgress: 0,
    });
  });

  it("provides sensible default reading preferences", () => {
    const prefs = useReaderStore.getState().preferences;
    expect(prefs.readingMode).toBe("vertical");
    expect(prefs.imageFit).toBe("width");
    expect(prefs.background).toBe("black");
    expect(prefs.readingDirection).toBe("ltr");
    expect(prefs.keepScreenAwake).toBe(true);
  });

  it("updates global preferences cleanly via updatePreferences", () => {
    useReaderStore.getState().updatePreferences({
      readingMode: "paged",
      imageFit: "contained",
      background: "deepLagoon",
    });

    const prefs = useReaderStore.getState().preferences;
    expect(prefs.readingMode).toBe("paged");
    expect(prefs.imageFit).toBe("contained");
    expect(prefs.background).toBe("deepLagoon");
    // Other preferences preserved
    expect(prefs.readingDirection).toBe("ltr");
  });

  it("Q8 & Q87: returns global preferences when title has no custom override", () => {
    const titlePrefs = useReaderStore.getState().getTitlePreferences("asurascans", "solo-leveling");
    expect(titlePrefs.readingMode).toBe("vertical");
    expect(titlePrefs.imageFit).toBe("width");
    expect(titlePrefs.readingDirection).toBe("ltr");
  });

  it("Q8 & Q87: allows title-specific preferences that override global defaults", () => {
    // Global remains vertical
    expect(useReaderStore.getState().preferences.readingMode).toBe("vertical");

    // Set title-specific preference for Solo Leveling
    useReaderStore.getState().updateTitlePreferences("asurascans", "solo-leveling", {
      readingMode: "paged",
      readingDirection: "rtl",
      imageFit: "contained",
    });

    // Check title preferences
    const titlePrefs = useReaderStore.getState().getTitlePreferences("asurascans", "solo-leveling");
    expect(titlePrefs.readingMode).toBe("paged");
    expect(titlePrefs.readingDirection).toBe("rtl");
    expect(titlePrefs.imageFit).toBe("contained");
    // Unset title preference inherits global default
    expect(titlePrefs.background).toBe("black");

    // Other titles still inherit global defaults
    const otherTitlePrefs = useReaderStore.getState().getTitlePreferences("mangadex", "one-piece");
    expect(otherTitlePrefs.readingMode).toBe("vertical");
    expect(otherTitlePrefs.readingDirection).toBe("ltr");
  });

  it("Q8: resets title preferences back to global defaults cleanly", () => {
    useReaderStore.getState().updateTitlePreferences("asurascans", "solo-leveling", {
      readingMode: "paged",
    });

    expect(useReaderStore.getState().getTitlePreferences("asurascans", "solo-leveling").readingMode).toBe("paged");

    // Reset title
    useReaderStore.getState().resetTitlePreferences("asurascans", "solo-leveling");

    expect(useReaderStore.getState().getTitlePreferences("asurascans", "solo-leveling").readingMode).toBe("vertical");
    expect(useReaderStore.getState().perTitlePreferences["asurascans::solo-leveling"]).toBeUndefined();
  });

  it("Q98: controls overlay visibility and desktop panel toggle state", () => {
    const { toggleOverlay, setOverlayVisible, toggleDesktopPanel } = useReaderStore.getState();

    toggleOverlay();
    expect(useReaderStore.getState().isOverlayVisible).toBe(false);

    setOverlayVisible(true);
    expect(useReaderStore.getState().isOverlayVisible).toBe(true);

    toggleDesktopPanel();
    expect(useReaderStore.getState().isDesktopPanelOpen).toBe(false);
  });

  it("clamps paged progress between 0 and 1", () => {
    const { setPagedProgress } = useReaderStore.getState();

    setPagedProgress(0.75);
    expect(useReaderStore.getState().pagedProgress).toBe(0.75);

    setPagedProgress(-0.5);
    expect(useReaderStore.getState().pagedProgress).toBe(0);

    setPagedProgress(1.5);
    expect(useReaderStore.getState().pagedProgress).toBe(1);
  });
});
