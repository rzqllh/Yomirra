import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import SettingsPage from "../page";
import { useSettingsStore } from "@/shared/store/settings-store";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/settings",
  useSearchParams: () => new URLSearchParams(),
}));

// Mock hooks
vi.mock("@/shared/hooks/use-auth", () => ({
  useAuth: () => ({ user: null, loginWithGoogle: vi.fn(), logout: vi.fn() }),
}));

vi.mock("@/shared/hooks/use-sync", () => ({
  useSync: () => ({ runFullSync: vi.fn(), isSyncing: false }),
}));

// Mock next-themes
vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: "light", setTheme: vi.fn() }),
}));

// We need to bypass directional transition which might cause issues
vi.mock("@/components/ui/directional-transition", () => ({
  DirectionalTransition: ({ children }: any) => <div>{children}</div>,
}));

describe("SettingsPage - Update Checker UI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSettingsStore.setState({
      checkOnAppStart: true,
      minimumCheckIntervalMinutes: 15,
    });
  });

  const renderWithMount = async () => {
    let view: any;
    await act(async () => {
      view = render(<SettingsPage />);
      // wait for microtask to flush (for queueMicrotask in the component)
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    return view;
  };

  it("renders current values correctly", async () => {
    await renderWithMount();

    // Check toggle
    const toggle = screen.getByRole("checkbox", { name: /Cek Otomatis Saat Dibuka/i });
    expect((toggle as HTMLInputElement).checked).toBe(true);

    // Check select button
    const selectButton = screen.getByRole("button", { name: /15 Menit/i });
    expect(selectButton).not.toBeNull();
  });

  it("toggling checkOnAppStart calls setter", async () => {
    await renderWithMount();
    
    const toggle = screen.getByRole("checkbox", { name: /Cek Otomatis Saat Dibuka/i });
    
    await act(async () => {
      fireEvent.click(toggle);
    });

    expect(useSettingsStore.getState().checkOnAppStart).toBe(false);
  });

  it("choosing an interval calls setter with correct minutes", async () => {
    await renderWithMount();
    
    const selectButton = screen.getByRole("button", { name: /15 Menit/i });
    
    // Open select
    await act(async () => {
      fireEvent.click(selectButton);
    });

    // Find and click 1 Jam option
    const oneHourOption = screen.getByText("1 Jam");
    
    await act(async () => {
      fireEvent.click(oneHourOption);
    });

    expect(useSettingsStore.getState().minimumCheckIntervalMinutes).toBe(60);
  });

  it("disables interval select visually when checkOnAppStart is false, but keeps value", async () => {
    useSettingsStore.setState({ checkOnAppStart: false, minimumCheckIntervalMinutes: 30 });
    const { container } = await renderWithMount();
    
    const selectButton = screen.getByRole("button", { name: /30 Menit/i });
    expect(selectButton).not.toBeNull();
    
    // CustomSelect wrapper should have opacity-50 and pointer-events-none
    const wrapper = selectButton.closest(".opacity-50.pointer-events-none");
    expect(wrapper).not.toBeNull();
    
    expect(useSettingsStore.getState().minimumCheckIntervalMinutes).toBe(30);
  });
});
