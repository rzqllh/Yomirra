import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { ChapterRow } from "../chapter-row"

vi.mock("@/components/manga/chapter-download-button", () => ({
  ChapterDownloadButton: ({ chapterTitle }: { chapterTitle: string }) => (
    <button type="button" aria-label={`Unduh ${chapterTitle}`}>
      Unduh
    </button>
  ),
}))

describe("ChapterRow accessibility", () => {
  it("keeps the chapter link and download action as sibling controls", () => {
    render(
      <ChapterRow
        sourceId="source-a"
        mangaId="manga-a"
        chapterId="chapter-12"
        chapterTitle="Chapter 12"
        mangaTitle="Manga A"
        date="2026-09-25"
      />
    )

    const chapterLink = screen.getByRole("link", { name: /baca chapter 12/i })
    const downloadButton = screen.getByRole("button", { name: "Unduh Chapter 12" })

    expect(downloadButton.closest("a")).toBeNull()
    expect(chapterLink.closest("article")).toBe(downloadButton.closest("article"))
  })
})
