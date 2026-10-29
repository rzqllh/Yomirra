import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { usePlatformShortcut } from "../use-platform-shortcut";

describe("usePlatformShortcut", () => {
  const originalNavigator = globalThis.navigator;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(globalThis, "navigator", {
      value: originalNavigator,
      configurable: true,
      writable: true,
    });
  });

  it("returns ⌘ modifier and ⌘K on macOS platforms", () => {
    Object.defineProperty(globalThis, "navigator", {
      value: {
        platform: "MacIntel",
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      },
      configurable: true,
      writable: true,
    });

    const { result } = renderHook(() => usePlatformShortcut());
    expect(result.current.modifier).toBe("⌘");
    expect(result.current.searchShortcut).toBe("⌘K");
    expect(result.current.searchAriaLabel).toContain("⌘K");
  });

  it("returns Ctrl modifier and Ctrl+K on Windows/Linux platforms", () => {
    Object.defineProperty(globalThis, "navigator", {
      value: {
        platform: "Win32",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      },
      configurable: true,
      writable: true,
    });

    const { result } = renderHook(() => usePlatformShortcut());
    expect(result.current.modifier).toBe("Ctrl");
    expect(result.current.searchShortcut).toBe("Ctrl+K");
    expect(result.current.searchAriaLabel).toContain("Ctrl+K");
  });
});
