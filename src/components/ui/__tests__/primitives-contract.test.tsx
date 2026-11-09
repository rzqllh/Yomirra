import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { Button } from "../button"
import { IconButton } from "../icon-button"
import { Chip } from "../chip"
import { Select } from "../select"
import { Toggle } from "../toggle"
import { Badge } from "../badge"
import { SearchInput } from "../search-input"
import { Surface } from "../surface"

describe("YOM-02: UI Primitives Contract & Parity", () => {
  describe("Button Primitive", () => {
    it("renders default button with accessibility attributes", () => {
      render(<Button>Click me</Button>)
      const btn = screen.getByRole("button", { name: /click me/i })
      expect(btn).not.toBeNull()
      expect(btn.className).toContain("min-h-11")
    })

    it("applies loading state with aria-busy and disabled", () => {
      render(<Button loading>Loading action</Button>)
      const btn = screen.getByRole("button") as HTMLButtonElement
      expect(btn.disabled).toBe(true)
      expect(btn.getAttribute("aria-busy")).toBe("true")
      expect(btn.getAttribute("aria-disabled")).toBe("true")
    })

    it("renders semantic and matrix variants", () => {
      const { rerender } = render(<Button variant="primary">Primary</Button>)
      expect(screen.getByRole("button").className).toContain("bg-accent")

      rerender(<Button variant="secondary">Secondary</Button>)
      expect(screen.getByRole("button").className).toContain("bg-surface-raised")

      rerender(<Button variant="destructive">Delete</Button>)
      expect(screen.getByRole("button").className).toContain("text-status-error-fg")

      rerender(<Button variant="washi">Washi</Button>)
      expect(screen.getByRole("button").className).toContain("bg-surface-raised")
    })

    it("supports asChild delegation", () => {
      render(
        <Button asChild>
          <a href="/test">Link Button</a>
        </Button>
      )
      const link = screen.getByRole("link", { name: /link button/i })
      expect(link.getAttribute("href")).toBe("/test")
      expect(link.className).toContain("inline-flex")
    })
  })

  describe("IconButton Primitive", () => {
    it("enforces aria-label and touch target minimums", () => {
      render(<IconButton aria-label="Settings action" />)
      const btn = screen.getByRole("button", { name: /settings action/i })
      expect(btn.getAttribute("aria-label")).toBe("Settings action")
      expect(btn.className).toContain("min-h-11")
      expect(btn.className).toContain("min-w-11")
    })
  })

  describe("Chip Primitive", () => {
    it("renders chip with aria-pressed state", () => {
      const { rerender } = render(<Chip selected={true}>Manga</Chip>)
      expect(screen.getByRole("button", { name: /manga/i }).getAttribute("aria-pressed")).toBe("true")

      rerender(<Chip selected={false}>Manga</Chip>)
      expect(screen.getByRole("button", { name: /manga/i }).getAttribute("aria-pressed")).toBe("false")
    })

    it("handles onRemove action and keydown", () => {
      const onRemove = vi.fn()
      render(
        <Chip onRemove={onRemove} removeAriaLabel="Remove genre">
          Action
        </Chip>
      )
      const removeBtn = screen.getByRole("button", { name: /remove genre/i })
      fireEvent.click(removeBtn)
      expect(onRemove).toHaveBeenCalledTimes(1)

      fireEvent.keyDown(removeBtn, { key: "Enter" })
      expect(onRemove).toHaveBeenCalledTimes(2)
    })
  })

  describe("Select Primitive", () => {
    const options = [
      { value: "opt1", label: "Opsi 1" },
      { value: "opt2", label: "Opsi 2" },
    ]

    it("renders accessible native select mirror and trigger", () => {
      const onChange = vi.fn()
      const { container } = render(
        <Select
          value="opt1"
          onChange={onChange}
          options={options}
          label="Pilih kategori"
        />
      )

      // Hidden accessible native select
      const nativeSelect = container.querySelector("select")
      expect(nativeSelect).not.toBeNull()
      expect(nativeSelect?.value).toBe("opt1")

      // Trigger button
      const trigger = screen.getByRole("button")
      expect(trigger.textContent).toContain("Opsi 1")
    })
  })

  describe("Toggle Primitive", () => {
    it("renders checkbox toggle and calls onCheckedChange", () => {
      const onChange = vi.fn()
      render(<Toggle checked={false} onCheckedChange={onChange} label="Dark mode" />)
      const input = screen.getByRole("checkbox") as HTMLInputElement
      expect(input.checked).toBe(false)

      fireEvent.click(input)
      expect(onChange).toHaveBeenCalledWith(true)
    })
  })

  describe("Badge Primitive", () => {
    it("renders badge variants and shapes", () => {
      const { container, rerender } = render(<Badge variant="accent">New</Badge>)
      expect(container.textContent).toContain("New")
      expect((container.firstChild as HTMLElement).className).toContain("text-accent")

      rerender(<Badge variant="success" shape="pill">Active</Badge>)
      expect((container.firstChild as HTMLElement).className).toContain("rounded-role-chip")

      rerender(<Badge size="sm">Tiny</Badge>)
      expect((container.firstChild as HTMLElement).className).toContain("text-2xs")
    })
  })

  describe("SearchInput Primitive", () => {
    it("renders search input with clear trigger", () => {
      const onClear = vi.fn()
      const onChange = vi.fn()
      render(
        <SearchInput
          value="One Piece"
          onChange={onChange}
          onClear={onClear}
          placeholder="Cari manga..."
        />
      )

      const input = screen.getByPlaceholderText("Cari manga...") as HTMLInputElement
      expect(input.value).toBe("One Piece")
      const clearBtn = screen.getByRole("button", { name: /clear search/i })
      fireEvent.click(clearBtn)
      expect(onClear).toHaveBeenCalledTimes(1)
    })
  })

  describe("Surface Primitive", () => {
    it("renders standard surface and glass variants", () => {
      const { container, rerender } = render(<Surface variant="raised">Panel</Surface>)
      expect((container.firstChild as HTMLElement).className).toContain("bg-surface-raised")

      rerender(<Surface variant="glassChrome">Chrome Dock</Surface>)
      expect((container.firstChild as HTMLElement).className).toContain("yomirra-glass-foundation")
    })

    it("supports asChild delegation to semantic elements", () => {
      render(
        <Surface asChild variant="glassHeader">
          <header>Header Surface</header>
        </Surface>
      )
      const header = screen.getByRole("banner")
      expect(header).not.toBeNull()
      expect(header.className).toContain("backdrop-blur-[var(--glass-blur-header)]")
    })
  })
})
