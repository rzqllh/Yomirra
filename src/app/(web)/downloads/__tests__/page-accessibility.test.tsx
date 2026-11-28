import { fireEvent, render, screen, within } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import DownloadsPage from "../page"
import { useDownloadStore, type DownloadChapter } from "@/shared/store/download-store"

vi.mock("next/navigation", () => ({
  usePathname: () => "/downloads",
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}))

const baseDownload: DownloadChapter = {
  id: "source-a::manga-a::chapter-12",
  sourceId: "source-a",
  mangaId: "manga-a",
  mangaTitle: "Manga A",
  chapterId: "chapter-12",
  chapterTitle: "Chapter 12",
  status: "downloaded",
  progress: 100,
  totalPages: 12,
  downloadedPages: 12,
  pages: [],
  createdAt: 1,
  updatedAt: 1,
}

describe("Downloads task-row accessibility", () => {
  beforeEach(() => {
    useDownloadStore.setState({ downloads: {}, queue: [], activeDownloads: [] })
    Object.defineProperty(navigator, "storage", {
      configurable: true,
      value: undefined,
    })
  })

  it("keeps the completed task link and remove action as sibling controls", () => {
    useDownloadStore.setState({ downloads: { [baseDownload.id]: baseDownload } })
    render(<DownloadsPage />)

    const readLink = screen.getByRole("link", { name: "Baca Manga A - Chapter 12" })
    const removeButton = screen.getByRole("button", {
      name: "Hapus unduhan Manga A - Chapter 12",
    })

    expect(readLink.contains(removeButton)).toBe(false)
    expect(readLink.parentElement).toBe(removeButton.parentElement)
  })

  it("keeps the clear action in the lane and confirms before deleting", () => {
    const clearDownloads = vi.spyOn(useDownloadStore.getState(), "clearDownloads").mockResolvedValue(undefined)
    const confirm = vi.spyOn(window, "confirm").mockReturnValueOnce(false).mockReturnValueOnce(true)
    try {
      useDownloadStore.setState({ downloads: { [baseDownload.id]: baseDownload } })
      const { container } = render(<DownloadsPage />)
      const lane = container.querySelector<HTMLElement>('[data-content-lane="focused"]')!
      const clear = within(lane).getByRole("button", { name: "Hapus Semua" })

      clear.focus()
      expect(document.activeElement).toBe(clear)
      fireEvent.click(clear)
      expect(clearDownloads).not.toHaveBeenCalled()
      fireEvent.click(clear)
      expect(clearDownloads).toHaveBeenCalledOnce()
    } finally {
      confirm.mockRestore()
      clearDownloads.mockRestore()
    }
  })

  it("gives queued task controls item-specific names", () => {
    const queued = { ...baseDownload, status: "queued" as const, progress: 25 }
    useDownloadStore.setState({ downloads: { [queued.id]: queued } })
    render(<DownloadsPage />)

    expect(screen.getByRole("tablist", { name: "Status unduhan" })).toBeTruthy()
    expect(screen.getByRole("tab", { name: "Antrean (1)", selected: true })).toBeTruthy()
    expect(screen.getByRole("button", { name: "Jeda unduhan Manga A - Chapter 12" })).toBeTruthy()
    expect(screen.getByRole("button", { name: "Batalkan unduhan Manga A - Chapter 12" })).toBeTruthy()
  })
})
