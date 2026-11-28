import { Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import type {} from "vitest/jsdom";
import { apiClient } from "@/shared/api-client";
import { sourceReadScope } from "@/shared/sources/content-policy";
import { DEFAULT_CAPABILITIES } from "@/shared/sources/source-capabilities";
import type { MangaItem, MangaPageResult, SourceMetadata } from "@/shared/sources/source-types";
import { useSettingsStore } from "@/shared/store/settings-store";
import WebError from "../../../error";
import Loading from "../loading";
import SourceBrowsePage from "../page";

const { back, replace, getUser, getSearchParams } = vi.hoisted(() => {
  vi.stubGlobal("localStorage", jsdom.window.localStorage);
  return { back: vi.fn(), replace: vi.fn(), getUser: vi.fn(), getSearchParams: vi.fn() };
});
afterAll(() => vi.unstubAllGlobals());

vi.mock("next/navigation", () => ({
  usePathname: () => "/sources/source-a",
  useRouter: () => ({ back, replace }),
  useSearchParams: getSearchParams,
}));
vi.mock("@/components/chrome/header-actions", () => ({ HeaderActions: () => null }));
vi.mock("@/components/komik/card", () => ({
  ShelfCard: ({ manga }: { manga: MangaItem }) => <p>{manga.title}</p>,
}));
vi.mock("@/shared/hooks/use-auth", () => ({ useAuth: () => ({ user: getUser() }) }));
vi.mock("@/shared/api-client", () => ({
  apiClient: { getSources: vi.fn(), getLatest: vi.fn(), getPopular: vi.fn() },
}));

function makeQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function catalogKey(sourceId: string, hideNsfw: boolean, manifestUrl: string | null = null) {
  const { preferredLanguages, dataSaver } = useSettingsStore.getState();
  return [
    "sourceBrowse", sourceId, manifestUrl ? "browser" : "server", manifestUrl, "latest",
    sourceReadScope({ hideNsfw, preferredLanguages, dataSaver }), 1,
  ];
}

async function renderSource(sourceId: string, client = makeQueryClient()) {
  const params = Promise.resolve({ sourceId });
  const sourcePage = () => (
    <QueryClientProvider client={client}>
      <Suspense fallback={<Loading />}>
        <SourceBrowsePage params={params} />
      </Suspense>
    </QueryClientProvider>
  );
  return act(async () => {
    const view = render(sourcePage());
    return () => view.rerender(sourcePage());
  });
}

const storageKey = "yomirra_dynamic_sources";
const localManifestUrl = "https://provider.example/manifest.json";

function installLocalProvider(id: string) {
  const previousSources = localStorage.getItem(storageKey);
  localStorage.setItem(storageKey, JSON.stringify({
    [id]: {
      id,
      name: "Local Provider",
      baseUrl: "https://provider.example",
      manifestUrl: localManifestUrl,
      lang: "en",
      version: "1",
      capabilities: ["latest"],
    },
  }));
  return () => {
    if (previousSources === null) localStorage.removeItem(storageKey);
    else localStorage.setItem(storageKey, previousSources);
  };
}

function mockVerifiedAccount() {
  getUser.mockReturnValue({
    uid: "verified-user",
    getIdTokenResult: vi.fn().mockResolvedValue({ claims: { age_verified: true } }),
  });
}

function expectSourceHeader(title: string) {
  expect(screen.getAllByRole("heading")).toEqual([
    screen.getByRole("heading", { level: 1, name: title }),
  ]);
  expect(screen.getByRole("link", { name: "Kembali ke Sumber" }).getAttribute("href")).toBe("/sources");
  const historyLength = vi.spyOn(window.history, "length", "get").mockReturnValue(2);
  try {
    fireEvent.click(screen.getByRole("button", { name: "Kembali" }));
    expect(replace).toHaveBeenCalledWith("/sources");
    expect(back).not.toHaveBeenCalled();
  } finally {
    historyLength.mockRestore();
  }
}

describe("source detail route", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getUser.mockReturnValue(null);
    getSearchParams.mockReturnValue(new URLSearchParams());
  });

  it("keeps one primary heading and an explicit parent during route loading", () => {
    render(<Loading />);
    expectSourceHeader("Sumber");
  });

  it("uses the resolved source name and keeps its home preference and catalog", async () => {
    vi.mocked(apiClient.getSources).mockResolvedValue([{
      id: "source-a",
      name: "Source A",
      isEnabled: true,
      isInstalled: true,
      isNsfw: false,
      isDynamic: false,
      capabilities: DEFAULT_CAPABILITIES,
    }]);
    vi.mocked(apiClient.getLatest).mockResolvedValue({ mangas: [], hasNextPage: false });
    await renderSource("source-a");

    await screen.findByText("Belum ada komik yang ditemukan.");
    expectSourceHeader("Source A");
    expect(screen.getByRole("checkbox", { name: "Tampilkan di Beranda" })).toBeTruthy();
    expect(apiClient.getLatest).toHaveBeenCalledWith("source-a", 1, { manifestUrl: null });
  });

  it("shows a missing-source state without requesting a catalog or offering a home toggle", async () => {
    vi.mocked(apiClient.getSources).mockResolvedValue([]);
    await renderSource("missing");

    await screen.findByText("Sumber tidak ditemukan.");
    expectSourceHeader("Sumber");
    expect(screen.queryByRole("checkbox")).toBeNull();
    expect(apiClient.getLatest).not.toHaveBeenCalled();
    expect(apiClient.getPopular).not.toHaveBeenCalled();
  });

  it.each(["empty", "failed"])("opens a browser-installed provider when the server lookup is %s", async (lookup) => {
    if (lookup === "failed") {
      vi.mocked(apiClient.getSources).mockRejectedValue(new Error("Source registry unavailable"));
    } else {
      vi.mocked(apiClient.getSources).mockResolvedValue([]);
    }
    vi.mocked(apiClient.getLatest).mockResolvedValue({ mangas: [], hasNextPage: false });
    const restoreSources = installLocalProvider("local-provider");
    try {
      await renderSource("local-provider");

      await screen.findByText("Belum ada komik yang ditemukan.");
      expectSourceHeader("Local Provider");
      expect(screen.queryByText("Sumber tidak ditemukan.")).toBeNull();
      expect(screen.queryByRole("alert")).toBeNull();
      expect(screen.getByRole("checkbox", { name: "Tampilkan di Beranda" })).toBeTruthy();
      expect(apiClient.getLatest).toHaveBeenCalledWith("local-provider", 1, { manifestUrl: localManifestUrl });
    } finally {
      restoreSources();
    }
  });

  it.each([
    ["opt-out", "filtered"],
    ["sign-out", "filtered"],
    ["opt-out", "failed"],
  ])("hides a warm restricted catalog after %s and a %s registry refresh", async (change, refreshResult) => {
    const previousHideNsfw = useSettingsStore.getState().hideNsfw;
    const source: SourceMetadata = {
      id: "source-a",
      name: "Restricted Server Provider",
      isEnabled: true,
      isInstalled: true,
      isNsfw: true,
      isDynamic: false,
      capabilities: DEFAULT_CAPABILITIES,
    };
    const catalog = {
      mangas: [{ id: "restricted-comic", title: "Cached Restricted Comic", coverUrl: "/cover.jpg" }],
      hasNextPage: true,
    };
    const client = makeQueryClient();
    const optInKey = catalogKey(source.id, false);
    const restoreSources = installLocalProvider(source.id);
    client.setQueryData(["sources"], [source]);
    client.setQueryData(optInKey, catalog);
    vi.mocked(apiClient.getSources).mockResolvedValue([source]);
    vi.mocked(apiClient.getLatest).mockResolvedValue(catalog);
    mockVerifiedAccount();
    useSettingsStore.setState({ hideNsfw: false });

    try {
      const refresh = await renderSource(source.id, client);
      await screen.findByText("Cached Restricted Comic");
      expect(screen.getByRole("heading", { name: source.name })).toBeTruthy();
      expect(screen.queryByRole("heading", { name: "Local Provider" })).toBeNull();

      if (change === "opt-out") {
        act(() => useSettingsStore.setState({ hideNsfw: true }));
      } else {
        getUser.mockReturnValue(null);
        refresh();
      }

      expect(screen.getByText("Sumber tidak ditemukan.")).toBeTruthy();
      expect(screen.queryByText("Cached Restricted Comic")).toBeNull();
      expect(screen.queryByRole("heading", { name: source.name })).toBeNull();
      expect(screen.queryByRole("heading", { name: "Local Provider" })).toBeNull();
      expect(screen.queryByRole("checkbox")).toBeNull();
      expect(screen.queryByRole("link", { name: "Selanjutnya" })).toBeNull();
      expect(client.getQueryData(optInKey)).toEqual(catalog);

      vi.mocked(apiClient.getLatest).mockClear();
      if (refreshResult === "filtered") {
        vi.mocked(apiClient.getSources).mockResolvedValue([]);
      } else {
        vi.mocked(apiClient.getSources).mockRejectedValue(new Error("Source registry unavailable"));
      }
      await act(async () => {
        await client.invalidateQueries({ queryKey: ["sources"] });
        await new Promise((resolve) => setTimeout(resolve, 0));
      });
      expect(client.getQueryState(["sources"])?.status).toBe(refreshResult === "filtered" ? "success" : "error");
      if (refreshResult === "filtered") expect(client.getQueryData(["sources"])).toEqual([]);
      expect(screen.getByText("Sumber tidak ditemukan.")).toBeTruthy();
      expect(screen.queryByRole("heading", { name: "Local Provider" })).toBeNull();
      expect(screen.queryByText("Cached Restricted Comic")).toBeNull();
      expect(apiClient.getLatest).not.toHaveBeenCalled();
    } finally {
      restoreSources();
      act(() => useSettingsStore.setState({ hideNsfw: previousHideNsfw }));
    }
  });

  it.each(["opt-out", "sign-out"])("clears opt-in pagination placeholders from a mixed source after %s", async (change) => {
    const previousHideNsfw = useSettingsStore.getState().hideNsfw;
    const sourceId = "mixed";
    const client = makeQueryClient();
    const optInCatalog = {
      mangas: [{
        id: "restricted-comic",
        title: "Opt-In Comic",
        coverUrl: "/cover.jpg",
        isNsfw: true,
      }],
      hasNextPage: true,
    };
    const optInKey = catalogKey(sourceId, false);
    client.setQueryData(optInKey, optInCatalog);
    const safePage = Promise.withResolvers<MangaPageResult>();
    vi.mocked(apiClient.getSources).mockResolvedValue([{
      id: sourceId,
      name: "Mixed Source",
      isEnabled: true,
      isInstalled: true,
      isNsfw: false,
      isDynamic: false,
      capabilities: DEFAULT_CAPABILITIES,
    }]);
    vi.mocked(apiClient.getLatest).mockImplementation((_id, page) => {
      if (page === 1) return safePage.promise;
      return new Promise(() => {});
    });
    mockVerifiedAccount();
    useSettingsStore.setState({ hideNsfw: false });

    try {
      const refresh = await renderSource(sourceId, client);
      await screen.findByText("Opt-In Comic");

      getSearchParams.mockReturnValue(new URLSearchParams("page=2"));
      refresh();
      await waitFor(() => expect(apiClient.getLatest).toHaveBeenCalledWith(sourceId, 2, { manifestUrl: null }));
      expect(screen.getByText("Opt-In Comic")).toBeTruthy();

      if (change === "opt-out") {
        act(() => useSettingsStore.setState({ hideNsfw: true }));
      } else {
        getUser.mockReturnValue(null);
        refresh();
      }

      expect(screen.getByRole("heading", { name: "Mixed Source" })).toBeTruthy();
      expect(screen.queryByText("Opt-In Comic")).toBeNull();
      expect(client.getQueryData(optInKey)).toEqual(optInCatalog);

      getSearchParams.mockReturnValue(new URLSearchParams("page=1"));
      refresh();
      expect(screen.queryByText("Opt-In Comic")).toBeNull();

      safePage.resolve({
        mangas: [
          { id: "safe-comic", title: "Safe Comic", coverUrl: "/cover.jpg" },
          ...optInCatalog.mangas,
        ],
        hasNextPage: false,
      });
      await screen.findByText("Safe Comic");
      expect(screen.queryByText("Opt-In Comic")).toBeNull();
    } finally {
      act(() => useSettingsStore.setState({ hideNsfw: previousHideNsfw }));
    }
  });

  it("isolates a warm local catalog when a same-ID server provider takes precedence", async () => {
    const sourceId = "provider";
    const client = makeQueryClient();
    const localCatalog = {
      mangas: [{ id: "local-comic", title: "Local Comic", coverUrl: "/cover.jpg" }],
      hasNextPage: true,
    };
    const serverCatalog = Promise.withResolvers<MangaPageResult>();
    const restoreSources = installLocalProvider(sourceId);
    vi.mocked(apiClient.getSources).mockResolvedValue([]);
    vi.mocked(apiClient.getLatest).mockImplementation((_id, _page, options) =>
      options?.manifestUrl === localManifestUrl ? Promise.resolve(localCatalog) : serverCatalog.promise);

    try {
      const refresh = await renderSource(sourceId, client);
      await screen.findByText("Local Comic");
      vi.mocked(apiClient.getSources).mockResolvedValue([{
        id: sourceId,
        name: "Server Provider",
        isEnabled: true,
        isInstalled: true,
        isNsfw: false,
        isDynamic: false,
        capabilities: DEFAULT_CAPABILITIES,
      }]);
      await act(async () => client.invalidateQueries({ queryKey: ["sources"] }));
      await screen.findByRole("heading", { name: "Server Provider" });
      expect(screen.queryByText("Local Comic")).toBeNull();
      expect(apiClient.getLatest).toHaveBeenCalledWith(sourceId, 1, { manifestUrl: null });

      getSearchParams.mockReturnValue(new URLSearchParams("page=2"));
      refresh();
      expect(screen.queryByText("Local Comic")).toBeNull();
      expect(client.getQueryData(catalogKey(sourceId, true, localManifestUrl)))
        .toEqual(localCatalog);
      serverCatalog.resolve({ mangas: [], hasNextPage: false });
      await screen.findByText("Belum ada komik yang ditemukan.");
    } finally {
      restoreSources();
    }
  });

  it.each([
    ["disabled", { isEnabled: false }],
    ["under maintenance", { maintenance: { reason: "Repair", since: "2026-11-27" } }],
  ] satisfies [string, Partial<SourceMetadata>][])("hides a warm catalog when its server provider becomes %s", async (_label, update) => {
    const source: SourceMetadata = {
      id: "provider",
      name: "Server Provider",
      isEnabled: true,
      isInstalled: true,
      isNsfw: false,
      isDynamic: false,
      capabilities: DEFAULT_CAPABILITIES,
    };
    const client = makeQueryClient();
    const safeKey = catalogKey(source.id, true);
    const catalog = {
      mangas: [{ id: "cached-comic", title: "Cached Comic", coverUrl: "/cover.jpg" }],
      hasNextPage: true,
    };
    vi.mocked(apiClient.getSources).mockResolvedValue([source]);
    vi.mocked(apiClient.getLatest).mockResolvedValue(catalog);
    await renderSource(source.id, client);
    await screen.findByText("Cached Comic");
    expect(client.getQueryData(safeKey)).toEqual(catalog);

    vi.mocked(apiClient.getLatest).mockClear();
    vi.mocked(apiClient.getSources).mockResolvedValue([{ ...source, ...update }]);
    await act(async () => client.invalidateQueries({ queryKey: ["sources"] }));
    await screen.findByText("Sumber tidak ditemukan.");
    expect(screen.queryByText("Cached Comic")).toBeNull();
    expect(screen.queryByRole("checkbox")).toBeNull();
    expect(screen.queryByRole("link", { name: "Selanjutnya" })).toBeNull();
    expect(client.getQueryData(safeKey)).toEqual(catalog);
    expect(apiClient.getLatest).not.toHaveBeenCalled();
  });

  it("reports a failed source lookup separately from a missing source", async () => {
    vi.mocked(apiClient.getSources).mockRejectedValue(new Error("Source registry unavailable"));
    await renderSource("source-a");

    expect((await screen.findByRole("alert")).textContent).toContain("Gagal memuat daftar sumber");
    expect(screen.queryByRole("checkbox")).toBeNull();
    expect(apiClient.getLatest).not.toHaveBeenCalled();
  });
});

it("gives the web error fallback one primary heading and a retry action", () => {
  const log = vi.spyOn(console, "error").mockImplementation(() => {});
  const reset = vi.fn();
  try {
    render(<WebError error={new Error("Test fallback")} reset={reset} />);
    expect(screen.getAllByRole("heading")).toEqual([
      screen.getByRole("heading", { level: 1, name: "Yomirra mengalami kendala" }),
    ]);
    fireEvent.click(screen.getByRole("button", { name: "Coba lagi" }));
    expect(reset).toHaveBeenCalledOnce();
  } finally {
    log.mockRestore();
  }
});
