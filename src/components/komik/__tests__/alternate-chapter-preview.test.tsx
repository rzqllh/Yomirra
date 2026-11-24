import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { apiClient } from "@/shared/api-client";
import { AlternateChapterPreview } from "../alternate-chapter-preview";

vi.mock("@/shared/api-client", () => ({ apiClient: { getChapters: vi.fn() } }));

describe("alternate chapter preview", () => {
  it("fetches only on explicit inspection and navigates only on confirmation", async () => {
    const get = vi.mocked(apiClient.getChapters);
    get.mockClear().mockResolvedValue([{ id: "ch-10", mangaId: "work", number: 10, title: "Chapter 10", date: "", isLocked: false }]);
    const open = vi.fn();
    render(<AlternateChapterPreview sourceId="komiku" mangaId="work" currentChapterTitle="Chapter 10" onOpenChapter={open} />);
    expect(get).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Periksa chapter di sumber ini" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Buka Chapter 10" })).toBeTruthy());
    expect(get).toHaveBeenCalledTimes(1);
    expect(open).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Buka Chapter 10" }));
    expect(open).toHaveBeenCalledWith("ch-10");
  });
  it("aborts a pending inspection on unmount", async () => {
    const get = vi.mocked(apiClient.getChapters);
    let resolve!: (value: Awaited<ReturnType<typeof apiClient.getChapters>>) => void;
    get.mockClear().mockReturnValue(new Promise(r => { resolve = r; }));
    const open = vi.fn();
    const view = render(<AlternateChapterPreview sourceId="komiku" mangaId="work" currentChapterTitle="Chapter 10" onOpenChapter={open} />);
    fireEvent.click(screen.getByRole("button", { name: "Periksa chapter di sumber ini" }));
    const signal = get.mock.calls[0][2]?.signal;
    view.unmount();
    expect(signal?.aborted).toBe(true);
    await act(async () => resolve([]));
    expect(open).not.toHaveBeenCalled();
  });
});
