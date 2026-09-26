import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ReadingTab } from "../reading-tab";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
  usePathname: () => "/bookmark",
  useSearchParams: () => new URLSearchParams(),
}));

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
      name: /lanjut baca nano machine/i,
    });
    expect(continueLink.querySelector("button")).toBeNull();
    expect(container.querySelector("a button, button a, a a")).toBeNull();
  });

  it("provides accessible options menu and continue actions", () => {
    render(
      <ReadingTab
        groupedHistory={groupedHistory}
        pendingDeletions={new Set()}
        onRemoveHistory={vi.fn()}
      />
    );

    const optionsButton = screen.getByRole("button", {
      name: "Opsi untuk Nano Machine",
    });
    const continueLink = screen.getByRole("link", {
      name: /lanjut baca nano machine/i,
    });

    expect(optionsButton).toBeTruthy();
    expect(continueLink).toBeTruthy();
  });
});
