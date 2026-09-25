import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ReadingTab } from "../reading-tab";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

const groupedHistory = [
  {
    sourceId: "komiku",
    mangaId: "nano-machine",
    mangaTitle: "Nano Machine",
    latestReadAt: 1_700_000_000_000,
    chapters: [
      {
        chapterId: "chapter-12",
        chapterTitle: "Chapter 12",
        readAt: 1_700_000_000_000,
        progressPercent: 42,
      },
    ],
  },
];

describe("ReadingTab", () => {
  it("renders the continue navigation without nested interactive elements", () => {
    const { container } = render(
      <ReadingTab
        groupedHistory={groupedHistory}
        pendingDeletions={new Set()}
        onRemoveHistory={vi.fn()}
      />
    );

    const continueLink = screen.getByRole("link", {
      name: "Lanjutkan baca Nano Machine",
    });
    expect(continueLink.querySelector("button")).toBeNull();
    expect(container.querySelector("a button, button a, a a")).toBeNull();
  });

  it("provides 44px delete and continue actions with accessible names", () => {
    render(
      <ReadingTab
        groupedHistory={groupedHistory}
        pendingDeletions={new Set()}
        onRemoveHistory={vi.fn()}
      />
    );

    const deleteButton = screen.getByRole("button", {
      name: "Hapus Nano Machine dari riwayat",
    });
    const continueLink = screen.getByRole("link", {
      name: "Lanjutkan baca Nano Machine",
    });

    expect(deleteButton.className).toContain("size-11");
    expect(continueLink.className).toContain("min-h-11");
  });
});
