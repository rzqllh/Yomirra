import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ComponentProps, ReactElement } from "react";
import type { ReaderView } from "@/components/reader/reader-view";
import ReaderPage from "./page";
import { loadSourceChapters, loadSourcePages } from "@/server/lib/sources/content-access";

vi.mock("@/server/lib/sources/content-access", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/server/lib/sources/content-access")>(),
  getServerReadOptions: async () => ({}),
  loadSourceDetail: async () => ({ title: "Manga" }),
  loadSourceChapters: vi.fn(),
  loadSourcePages: vi.fn(),
}));
vi.mock("@/server/lib/sources/source-manager", () => ({
  sourceManager: { getSource: async () => ({ baseUrl: "https://example.com" }) },
}));
vi.mock("@/server/lib/sources/server-manifest", () => ({
  getManifestUrlFromCookie: async () => undefined,
}));
vi.mock("@/server/lib/sign-proxy-url", () => ({
  signImageUrl: (url: string) => `signed:${url}`,
}));
vi.mock("@/components/reader/reader-view", () => ({ ReaderView: () => null }));
vi.mock("@/components/reader/reader-shell", () => ({ ReaderShell: () => null }));
vi.mock("@/components/komik/dead-source-recovery", () => ({ DeadSourceRecovery: () => null }));

type ReaderProps = ComponentProps<typeof ReaderView>;
const chapter = { id: "chapter", mangaId: "title", number: 1, title: "One", date: "" };
const rawPage = { index: 0, url: "https://example.com/comic.jpg" };
const renderReader = () => ReaderPage({
  params: Promise.resolve({ sourceId: "shinigami", mangaId: "title", chapterId: "chapter" }),
  searchParams: Promise.resolve({}),
}) as Promise<ReactElement<ReaderProps>>;

describe("Reader page prefetch", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.resetAllMocks();
  });

  afterEach(() => vi.useRealTimers());

  it("waits for verified chapter metadata and signs a copy", async () => {
    const pages = [rawPage];
    vi.mocked(loadSourceChapters).mockImplementation(() =>
      new Promise((resolve) => setTimeout(() => resolve([chapter]), 400))
    );
    vi.mocked(loadSourcePages).mockImplementation(() =>
      new Promise((resolve) => setTimeout(() => resolve({ chapterId: "chapter", pages }), 100))
    );
    const result = renderReader();
    await vi.advanceTimersByTimeAsync(399);
    expect(loadSourcePages).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(101);

    expect((await result).props.initialPages).toEqual([{ ...rawPage, url: `signed:${rawPage.url}` }]);
    expect(pages[0]).toBe(rawPage);
  });

  it("renders the locked state without requesting pages", async () => {
    vi.mocked(loadSourceChapters).mockResolvedValue([{ ...chapter, isLocked: true }]);
    expect((await renderReader()).props.initialPages).toBeNull();
    expect(loadSourcePages).not.toHaveBeenCalled();
  });

  it("renders with the existing client fallback when pages exceed the deadline", async () => {
    vi.mocked(loadSourceChapters).mockResolvedValue([chapter]);
    vi.mocked(loadSourcePages).mockImplementation(() =>
      new Promise((resolve) => setTimeout(() => resolve({ chapterId: "chapter", pages: [rawPage] }), 1000))
    );
    const result = renderReader();
    await vi.advanceTimersByTimeAsync(250);
    expect((await result).props.initialPages).toBeNull();
  });
});
