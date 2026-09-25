import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { EditorialSpotlight } from "../editorial-spotlight"

const manga = {
  id: "manga-a",
  title: "Manga A",
  coverUrl: "/cover.jpg",
  description: "Description",
}

describe("EditorialSpotlight accessibility", () => {
  it("uses 44px carousel targets and reduced-motion-safe cover motion", () => {
    const { container } = render(
      <EditorialSpotlight manga={manga} sourceId="source-a" totalCount={3} />
    )

    expect(screen.getByRole("button", { name: "Komik sebelumnya" }).className).toContain("size-11")
    expect(screen.getByRole("button", { name: "Komik berikutnya" }).className).toContain("size-11")

    const coverImage = container.querySelector("img")
    expect(coverImage?.className).toContain("motion-safe:transition-transform")
    expect(coverImage?.className).toContain("motion-safe:group-hover:scale-105")
  })
})
