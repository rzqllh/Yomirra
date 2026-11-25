import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { EmptyState } from "../empty-state"

describe("EmptyState Component", () => {
  it("renders title, description and action correctly", () => {
    render(
      <EmptyState
        icon={<span data-testid="test-icon">icon</span>}
        title="Belum ada riwayat"
        description="Mulai membaca komik untuk mengisi riwayat."
        action={<button type="button">Jelajahi</button>}
      />
    )

    expect(screen.getByRole("heading", { name: "Belum ada riwayat", level: 2 })).toBeDefined()
    expect(screen.getByText("Mulai membaca komik untuk mengisi riwayat.")).toBeDefined()
    expect(screen.getByRole("button", { name: "Jelajahi" })).toBeDefined()
    expect(screen.getByTestId("test-icon")).toBeDefined()
  })

  it("handles fullHeight styling prop correctly", () => {
    const { container, rerender } = render(
      <EmptyState title="Kosong" fullHeight={false} />
    )
    expect((container.firstChild as HTMLElement).className).toContain("w-full")

    rerender(<EmptyState title="Kosong" fullHeight />)
    expect((container.firstChild as HTMLElement).className).toContain("min-h-100")
    expect((container.firstChild as HTMLElement).className).toContain("flex-1")
  })
})
