import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import DockLabPage from "../page"
import { DockLabView } from "../dock-lab-view"
import { notFound } from "next/navigation"

vi.mock("next/navigation", () => ({
  notFound: vi.fn(),
  usePathname: () => "/lab/dock",
}))

describe("Dock Lab Showcase & Production Guard", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.unstubAllEnvs()
  })

  it("calls notFound() in production environment unconditionally", () => {
    vi.stubEnv("VERCEL_ENV", "production")

    render(<DockLabPage />)
    expect(notFound).toHaveBeenCalled()
  })

  it("calls notFound() in production even if NEXT_PUBLIC_ENABLE_LAB is set (zero bypass)", () => {
    vi.stubEnv("VERCEL_ENV", "production")
    vi.stubEnv("NEXT_PUBLIC_ENABLE_LAB", "true")

    render(<DockLabPage />)
    expect(notFound).toHaveBeenCalled()
  })

  it("renders DockLabView in Vercel preview environment even if NODE_ENV is production", () => {
    vi.stubEnv("NODE_ENV", "production")
    vi.stubEnv("VERCEL_ENV", "preview")

    render(<DockLabPage />)
    expect(notFound).not.toHaveBeenCalled()
    expect(screen.getByText("YOMIRRA DOCK LAB")).toBeDefined()
  })

  it("renders DockLabView in development/test environment by default", () => {
    vi.stubEnv("NODE_ENV", "development")

    render(<DockLabPage />)
    expect(notFound).not.toHaveBeenCalled()
    expect(screen.getByText(/10 Varian Navigasi Bawah Interaktif/i)).toBeDefined()
  })

  it("switches active tab when clicked in simulator dock", () => {
    render(<DockLabView />)

    // Click on 'Jelajah' tab in the live dock
    const jelajahButtons = screen.getAllByRole("button", { name: /jelajah/i })
    expect(jelajahButtons.length).toBeGreaterThan(0)
    fireEvent.click(jelajahButtons[0])

    // Should update aria-pressed
    expect(jelajahButtons[0].getAttribute("aria-pressed")).toBe("true")
  })

  it("allows switching between all 10 variants", () => {
    render(<DockLabView />)

    // Check variant 2 button (from top tabs or side switcher)
    const v2Buttons = screen.getAllByRole("button", { name: /unified pill/i })
    expect(v2Buttons.length).toBeGreaterThan(0)
    fireEvent.click(v2Buttons[0])

    expect(screen.getByText(/Varian 2: Unified Pill/i)).toBeDefined()
  })

  it("toggles 44px touch target visualizer overlay", () => {
    render(<DockLabView />)

    const overlayToggle = screen.getByRole("button", { name: /target 44px/i })
    fireEvent.click(overlayToggle)

    // Toggle pressed or styling active
    expect(overlayToggle.className).toContain("text-emerald-400")
  })
})
