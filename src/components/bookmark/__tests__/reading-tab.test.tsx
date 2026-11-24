import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ReadingTab } from "../reading-tab";
import { useSourcePreferencesStore } from "@/shared/store/source-preferences-store";
import { useSettingsStore } from "@/shared/store/settings-store";

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
  beforeEach(() => {
    useSourcePreferencesStore.setState({ disabledSources: [] });
    useSettingsStore.setState({ perTitleSourcePreferences: {} });
  });

  it("does not resume a disabled provider even with a legacy cursor", () => {
    useSourcePreferencesStore.setState({ disabledSources: ["komiku"] });
    render(<ReadingTab groupedHistory={groupedHistory} pendingDeletions={new Set()} onRemoveHistory={vi.fn()} />);
    expect(screen.getByRole("link", { name: /lanjut (?:baca|membaca) nano machine/i }).getAttribute("href")).toBe("/catalog/saved/komiku%3A%3Anano-machine");
  });
  it("renders the continue navigation without nested interactive elements", () => {
    const { container } = render(
      <ReadingTab
        groupedHistory={groupedHistory}
        pendingDeletions={new Set()}
        onRemoveHistory={vi.fn()}
      />
    );

    const continueLink = screen.getByRole("link", {
      name: /lanjut (?:baca|membaca) nano machine/i,
    });
    expect(continueLink.getAttribute("href")).toBe("/manga/komiku/nano-machine/read/chapter-12?returnTo=%2Flibrary");
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
      name: /lanjut (?:baca|membaca) nano machine/i,
    });

    expect(optionsButton).toBeTruthy();
    expect(continueLink).toBeTruthy();
  });
});
