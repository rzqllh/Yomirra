import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ContinueReadingList } from "../continue-reading-list";
import type { HistoryItem } from "@/shared/store/history-store";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn() },
}));

const item: HistoryItem = {
  sourceId: "komiku",
  mangaId: "nano-machine",
  chapterId: "chapter-12",
  mangaTitle: "Nano Machine",
  chapterTitle: "Chapter 12",
  progressPercent: 42,
  readAt: 1_700_000_000_000,
};

describe("ContinueReadingList", () => {
  beforeEach(() => {
    push.mockClear();
  });

  it("keeps the primary reader link separate from the context menu", () => {
    const { container } = render(<ContinueReadingList items={[item]} />);

    const readerLink = screen.getByRole("link", {
      name: "Lanjut baca Nano Machine, Chapter 12",
    });
    const menuButton = screen.getByRole("button", {
      name: "Opsi untuk Nano Machine",
    });

    expect(readerLink.contains(menuButton)).toBe(false);
    expect(container.querySelector("a button, button a, a a")).toBeNull();
  });

  it("uses an actual 44px context-menu hit target with keyboard focus styling", () => {
    render(<ContinueReadingList items={[item]} />);

    const menuButton = screen.getByRole("button", {
      name: "Opsi untuk Nano Machine",
    });

    expect(menuButton.className).toContain("size-11");
    expect(menuButton.className).toContain("focus-visible:ring-2");
  });
});
